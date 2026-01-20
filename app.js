// GO대로 - AR Photo Guide App
// Perfect Frame Implementation

class MomentieApp {
    constructor() {
        // DOM Elements
        this.screens = {
            splash: document.getElementById('splash-screen'),
            camera: document.getElementById('camera-screen'),
            preview: document.getElementById('preview-screen'),
            gallery: document.getElementById('gallery-screen')
        };

        this.elements = {
            video: document.getElementById('camera-feed'),
            overlayCanvas: document.getElementById('overlay-canvas'),
            poseCanvas: document.getElementById('pose-canvas'),
            guideFrame: document.getElementById('guide-frame'),
            alignmentFeedback: document.getElementById('alignment-feedback'),
            feedbackText: document.querySelector('.feedback-text'),
            timerCountdown: document.getElementById('timer-countdown'),
            countdownNumber: document.querySelector('.countdown-number'),
            previewImage: document.getElementById('preview-image'),
            galleryGrid: document.getElementById('gallery-grid'),
            galleryEmpty: document.getElementById('gallery-empty'),
            galleryPreview: document.querySelector('.gallery-preview'),
            settingsPanel: document.getElementById('settings-panel'),
            gridOverlay: document.getElementById('grid-overlay'),
            levelIndicator: document.getElementById('level-indicator'),
            levelBubble: document.querySelector('.level-bubble'),
            ratioPanel: document.getElementById('ratio-panel'),
            ratioMask: document.getElementById('ratio-mask'),
            ratioLabel: document.querySelector('.ratio-label'),
            flashBtn: document.getElementById('flash-btn'),
            flashIconOff: document.querySelector('.flash-icon-off'),
            flashIconOn: document.querySelector('.flash-icon-on')
        };

        // State
        this.state = {
            currentScreen: 'splash',
            cameraFacing: 'environment',
            currentGuide: 'none',
            currentRatio: '3:4',
            timerDuration: 0,
            isCapturing: false,
            flashEnabled: false,
            flashSupported: false,
            poseDetectionEnabled: true,
            gridEnabled: false,
            levelEnabled: false,
            soundEnabled: true,
            photos: [],
            stream: null,
            videoTrack: null,
            pose: null,
            deviceOrientation: { alpha: 0, beta: 0, gamma: 0 },
            ratioPanelOpen: false
        };

        // Ratio definitions
        this.ratios = {
            '1:1': { width: 1, height: 1 },
            '3:4': { width: 3, height: 4 },
            '9:16': { width: 9, height: 16 },
            'full': { width: 0, height: 0 }
        };

        // Contexts
        this.overlayCtx = this.elements.overlayCanvas.getContext('2d');
        this.poseCtx = this.elements.poseCanvas.getContext('2d');

        // Initialize
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadPhotosFromStorage();
        this.updateGalleryPreview();
        this.setRatio('3:4');
    }

    bindEvents() {
        // Start button
        document.getElementById('start-btn').addEventListener('click', () => {
            this.showScreen('camera');
            this.startCamera();
        });

        // Close buttons
        document.getElementById('close-btn').addEventListener('click', () => {
            this.stopCamera();
            this.showScreen('splash');
        });

        document.getElementById('preview-close-btn').addEventListener('click', () => {
            this.showScreen('camera');
        });

        document.getElementById('gallery-close-btn').addEventListener('click', () => {
            this.showScreen('camera');
        });

        // Camera controls
        document.getElementById('capture-btn').addEventListener('click', () => {
            this.capturePhoto();
        });

        document.getElementById('switch-camera-btn').addEventListener('click', () => {
            this.switchCamera();
        });

        document.getElementById('flash-btn').addEventListener('click', () => {
            this.toggleFlash();
        });

        // Ratio button
        document.getElementById('ratio-btn').addEventListener('click', () => {
            this.toggleRatioPanel();
        });

        // Ratio selection
        document.querySelectorAll('.ratio-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ratio = e.currentTarget.dataset.ratio;
                this.setRatio(ratio);
                this.toggleRatioPanel(false);
            });
        });

        // Gallery
        document.getElementById('gallery-btn').addEventListener('click', () => {
            this.showScreen('gallery');
            this.renderGallery();
        });

        // Settings
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.toggleSettings(true);
        });

        document.getElementById('settings-close-btn').addEventListener('click', () => {
            this.toggleSettings(false);
        });

        // Settings toggles
        document.getElementById('pose-detection-toggle').addEventListener('change', (e) => {
            this.state.poseDetectionEnabled = e.target.checked;
            if (e.target.checked && this.state.stream) {
                this.initPoseDetection();
            }
        });

        document.getElementById('grid-toggle').addEventListener('change', (e) => {
            this.state.gridEnabled = e.target.checked;
            this.elements.gridOverlay.classList.toggle('hidden', !e.target.checked);
        });

        document.getElementById('level-toggle').addEventListener('change', (e) => {
            this.state.levelEnabled = e.target.checked;
            this.elements.levelIndicator.classList.toggle('hidden', !e.target.checked);
            if (e.target.checked) {
                this.startDeviceOrientation();
            }
        });

        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            this.state.soundEnabled = e.target.checked;
        });

        // Guide selection
        document.querySelectorAll('.guide-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const guide = e.currentTarget.dataset.guide;
                this.setGuide(guide);
            });
        });

        // Timer selection
        document.querySelectorAll('.timer-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const timer = parseInt(e.currentTarget.dataset.timer);
                this.setTimer(timer);
            });
        });

        // Preview actions
        document.getElementById('retake-btn').addEventListener('click', () => {
            this.showScreen('camera');
        });

        document.getElementById('save-btn').addEventListener('click', () => {
            this.savePhoto();
        });

        // Close panels on outside click
        document.addEventListener('click', (e) => {
            // Settings panel
            if (this.elements.settingsPanel.classList.contains('visible')) {
                if (!this.elements.settingsPanel.contains(e.target) &&
                    e.target.id !== 'settings-btn') {
                    this.toggleSettings(false);
                }
            }

            // Ratio panel
            if (this.state.ratioPanelOpen) {
                if (!this.elements.ratioPanel.contains(e.target) &&
                    e.target.id !== 'ratio-btn' &&
                    !e.target.closest('#ratio-btn')) {
                    this.toggleRatioPanel(false);
                }
            }
        });

        // Window resize for ratio mask
        window.addEventListener('resize', () => {
            if (this.state.currentScreen === 'camera') {
                this.updateRatioMask();
            }
        });
    }

    showScreen(screenName) {
        Object.keys(this.screens).forEach(key => {
            this.screens[key].classList.remove('active');
        });
        this.screens[screenName].classList.add('active');
        this.state.currentScreen = screenName;

        if (screenName === 'camera') {
            setTimeout(() => this.updateRatioMask(), 100);
        }
    }

    async startCamera() {
        try {
            // Request camera with torch capability check
            const constraints = {
                video: {
                    facingMode: this.state.cameraFacing,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            };

            this.state.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.elements.video.srcObject = this.state.stream;

            // Get video track for torch control
            this.state.videoTrack = this.state.stream.getVideoTracks()[0];

            // Check if torch is supported
            await this.checkTorchSupport();

            this.elements.video.onloadedmetadata = () => {
                this.resizeCanvases();
                this.updateRatioMask();
                if (this.state.poseDetectionEnabled) {
                    this.initPoseDetection();
                }
            };
        } catch (error) {
            console.error('Camera access error:', error);
            alert('카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
        }
    }

    async checkTorchSupport() {
        if (!this.state.videoTrack) return;

        try {
            const capabilities = this.state.videoTrack.getCapabilities();
            this.state.flashSupported = capabilities && capabilities.torch;

            // Update flash button appearance
            if (!this.state.flashSupported) {
                this.elements.flashBtn.style.opacity = '0.3';
            } else {
                this.elements.flashBtn.style.opacity = '1';
            }
        } catch (e) {
            console.warn('Could not check torch support:', e);
            this.state.flashSupported = false;
        }
    }

    stopCamera() {
        // Turn off torch before stopping
        if (this.state.flashEnabled) {
            this.setTorch(false);
        }

        if (this.state.stream) {
            this.state.stream.getTracks().forEach(track => track.stop());
            this.state.stream = null;
            this.state.videoTrack = null;
        }
    }

    async switchCamera() {
        // Turn off flash when switching
        if (this.state.flashEnabled) {
            this.state.flashEnabled = false;
            this.updateFlashUI();
        }

        this.state.cameraFacing = this.state.cameraFacing === 'environment' ? 'user' : 'environment';
        this.stopCamera();
        await this.startCamera();
    }

    resizeCanvases() {
        const video = this.elements.video;
        const width = video.videoWidth;
        const height = video.videoHeight;

        this.elements.overlayCanvas.width = width;
        this.elements.overlayCanvas.height = height;
        this.elements.poseCanvas.width = width;
        this.elements.poseCanvas.height = height;
    }

    // Ratio Functions
    setRatio(ratio) {
        this.state.currentRatio = ratio;

        // Update UI
        document.querySelectorAll('.ratio-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.ratio === ratio);
        });

        // Update label
        this.elements.ratioLabel.textContent = ratio === 'full' ? 'Full' : ratio;

        // Update mask
        this.updateRatioMask();
    }

    updateRatioMask() {
        const mask = this.elements.ratioMask;
        const container = document.querySelector('.camera-container');
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        const containerRatio = containerWidth / containerHeight;

        if (this.state.currentRatio === 'full') {
            mask.style.setProperty('--mask-top', '0px');
            mask.style.setProperty('--mask-bottom', '0px');
            mask.style.setProperty('--mask-side', '0px');
            mask.classList.remove('horizontal');
            return;
        }

        const ratioData = this.ratios[this.state.currentRatio];
        const targetRatio = ratioData.width / ratioData.height;

        if (targetRatio < containerRatio) {
            // Need horizontal bars (top/bottom)
            const targetHeight = containerHeight;
            const targetWidth = targetHeight * targetRatio;
            const sideMargin = (containerWidth - targetWidth) / 2;

            mask.classList.add('horizontal');
            mask.style.setProperty('--mask-side', `${sideMargin}px`);
            mask.style.setProperty('--mask-top', '0px');
            mask.style.setProperty('--mask-bottom', '0px');
        } else {
            // Need vertical bars (left/right)
            const targetWidth = containerWidth;
            const targetHeight = targetWidth / targetRatio;
            const verticalMargin = (containerHeight - targetHeight) / 2;

            mask.classList.remove('horizontal');
            mask.style.setProperty('--mask-top', `${verticalMargin}px`);
            mask.style.setProperty('--mask-bottom', `${verticalMargin}px`);
            mask.style.setProperty('--mask-side', '0px');
        }
    }

    toggleRatioPanel(show) {
        if (show === undefined) {
            show = !this.state.ratioPanelOpen;
        }

        this.state.ratioPanelOpen = show;
        this.elements.ratioPanel.classList.toggle('hidden', !show);
    }

    // Flash Functions
    async toggleFlash() {
        if (!this.state.flashSupported) {
            // Show feedback that flash is not supported
            this.showAlignmentFeedback('이 기기에서는 플래시를 지원하지 않습니다', false);
            setTimeout(() => this.hideAlignmentFeedback(), 2000);
            return;
        }

        this.state.flashEnabled = !this.state.flashEnabled;
        await this.setTorch(this.state.flashEnabled);
        this.updateFlashUI();
    }

    async setTorch(enabled) {
        if (!this.state.videoTrack || !this.state.flashSupported) return;

        try {
            await this.state.videoTrack.applyConstraints({
                advanced: [{ torch: enabled }]
            });
        } catch (e) {
            console.error('Failed to set torch:', e);
            this.state.flashEnabled = false;
            this.updateFlashUI();
        }
    }

    updateFlashUI() {
        const btn = this.elements.flashBtn;
        btn.dataset.flash = this.state.flashEnabled ? 'on' : 'off';

        this.elements.flashIconOff.classList.toggle('hidden', this.state.flashEnabled);
        this.elements.flashIconOn.classList.toggle('hidden', !this.state.flashEnabled);
    }

    initPoseDetection() {
        if (typeof Pose === 'undefined') {
            console.warn('MediaPipe Pose not loaded');
            return;
        }

        this.state.pose = new Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            }
        });

        this.state.pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.state.pose.onResults((results) => {
            this.onPoseResults(results);
        });

        this.startPoseDetection();
    }

    async startPoseDetection() {
        if (!this.state.pose || !this.state.stream) return;

        const detectFrame = async () => {
            if (this.state.currentScreen !== 'camera' || !this.state.poseDetectionEnabled) return;

            try {
                await this.state.pose.send({ image: this.elements.video });
            } catch (e) {
                console.warn('Pose detection error:', e);
            }

            requestAnimationFrame(detectFrame);
        };

        detectFrame();
    }

    onPoseResults(results) {
        this.poseCtx.clearRect(0, 0, this.elements.poseCanvas.width, this.elements.poseCanvas.height);

        if (results.poseLandmarks && this.state.currentGuide !== 'none') {
            this.drawPoseLandmarks(results.poseLandmarks);
            this.checkAlignment(results.poseLandmarks);
        }
    }

    drawPoseLandmarks(landmarks) {
        const canvas = this.elements.poseCanvas;
        const ctx = this.poseCtx;

        const connections = [
            [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
            [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]
        ];

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;

        connections.forEach(([i, j]) => {
            const p1 = landmarks[i];
            const p2 = landmarks[j];

            if (p1.visibility > 0.5 && p2.visibility > 0.5) {
                ctx.beginPath();
                ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
                ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
                ctx.stroke();
            }
        });

        const keyPoints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

        keyPoints.forEach(i => {
            const point = landmarks[i];
            if (point.visibility > 0.5) {
                ctx.beginPath();
                ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
    }

    checkAlignment(landmarks) {
        if (this.state.currentGuide === 'none') {
            this.hideAlignmentFeedback();
            return;
        }

        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];

        if (leftShoulder.visibility < 0.5 || rightShoulder.visibility < 0.5) {
            this.showAlignmentFeedback('사람을 프레임 안에 위치시켜주세요', false);
            return;
        }

        const centerX = (leftShoulder.x + rightShoulder.x) / 2;
        const centerY = (leftShoulder.y + rightShoulder.y) / 2;

        const isHorizontallyAligned = Math.abs(centerX - 0.5) < 0.1;
        const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
        const isLevel = shoulderDiff < 0.03;

        let isVerticallyAligned = this.state.currentGuide === 'portrait'
            ? (centerY > 0.3 && centerY < 0.6)
            : (centerY > 0.25 && centerY < 0.65);

        if (isHorizontallyAligned && isVerticallyAligned && isLevel) {
            this.showAlignmentFeedback('완벽해요!', true);
        } else if (!isLevel) {
            this.showAlignmentFeedback('카메라를 수평으로 맞춰주세요', false);
        } else if (!isHorizontallyAligned) {
            const direction = centerX < 0.5 ? '오른쪽' : '왼쪽';
            this.showAlignmentFeedback(`${direction}으로 조금 이동해주세요`, false);
        } else if (!isVerticallyAligned) {
            const direction = centerY < 0.4 ? '아래' : '위';
            this.showAlignmentFeedback(`${direction}로 이동해주세요`, false);
        }
    }

    showAlignmentFeedback(message, isAligned) {
        this.elements.feedbackText.textContent = message;
        this.elements.alignmentFeedback.classList.add('visible');
        this.elements.alignmentFeedback.classList.toggle('aligned', isAligned);
    }

    hideAlignmentFeedback() {
        this.elements.alignmentFeedback.classList.remove('visible', 'aligned');
    }

    setGuide(guide) {
        this.state.currentGuide = guide;

        document.querySelectorAll('.guide-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.guide === guide);
        });

        if (guide === 'none') {
            this.elements.guideFrame.classList.add('hidden');
            this.hideAlignmentFeedback();
        } else {
            this.elements.guideFrame.classList.remove('hidden');
            this.elements.guideFrame.dataset.guide = guide;
            this.updateGuideFrame(guide);
        }
    }

    updateGuideFrame(guide) {
        const silhouette = this.elements.guideFrame.querySelector('.guide-silhouette');

        silhouette.style.width = '';
        silhouette.style.height = '';
        silhouette.style.borderRadius = '';

        switch (guide) {
            case 'portrait':
                silhouette.style.width = '140px';
                silhouette.style.height = '280px';
                silhouette.style.borderRadius = '70px 70px 50px 50px';
                break;
            case 'couple':
                silhouette.style.width = '220px';
                silhouette.style.height = '280px';
                silhouette.style.borderRadius = '70px 70px 50px 50px';
                break;
            case 'group':
                silhouette.style.width = '300px';
                silhouette.style.height = '220px';
                silhouette.style.borderRadius = '20px';
                break;
        }
    }

    setTimer(duration) {
        this.state.timerDuration = duration;

        document.querySelectorAll('.timer-option').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.timer) === duration);
        });
    }

    toggleSettings(show) {
        if (show) {
            this.elements.settingsPanel.classList.remove('hidden');
            setTimeout(() => {
                this.elements.settingsPanel.classList.add('visible');
            }, 10);
        } else {
            this.elements.settingsPanel.classList.remove('visible');
            setTimeout(() => {
                this.elements.settingsPanel.classList.add('hidden');
            }, 300);
        }
    }

    async capturePhoto() {
        if (this.state.isCapturing) return;

        if (this.state.timerDuration > 0) {
            await this.startCountdown();
        }

        this.state.isCapturing = true;

        this.createFlashEffect();

        if (this.state.soundEnabled) {
            this.playShutterSound();
        }

        // Capture with ratio crop
        const video = this.elements.video;
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        let cropX = 0, cropY = 0, cropWidth = videoWidth, cropHeight = videoHeight;

        if (this.state.currentRatio !== 'full') {
            const ratioData = this.ratios[this.state.currentRatio];
            const targetRatio = ratioData.width / ratioData.height;
            const videoRatio = videoWidth / videoHeight;

            if (targetRatio < videoRatio) {
                cropHeight = videoHeight;
                cropWidth = cropHeight * targetRatio;
                cropX = (videoWidth - cropWidth) / 2;
            } else {
                cropWidth = videoWidth;
                cropHeight = cropWidth / targetRatio;
                cropY = (videoHeight - cropHeight) / 2;
            }
        }

        const canvas = document.createElement('canvas');
        canvas.width = cropWidth;
        canvas.height = cropHeight;

        const ctx = canvas.getContext('2d');

        if (this.state.cameraFacing === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        } else {
            ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        }

        const imageData = canvas.toDataURL('image/jpeg', 0.95);

        this.elements.previewImage.src = imageData;
        this.showScreen('preview');

        this.state.isCapturing = false;
    }

    async startCountdown() {
        return new Promise((resolve) => {
            let count = this.state.timerDuration;
            this.elements.timerCountdown.classList.remove('hidden');
            this.elements.countdownNumber.textContent = count;

            const interval = setInterval(() => {
                count--;
                if (count > 0) {
                    this.elements.countdownNumber.textContent = count;
                } else {
                    clearInterval(interval);
                    this.elements.timerCountdown.classList.add('hidden');
                    resolve();
                }
            }, 1000);
        });
    }

    createFlashEffect() {
        const flash = document.createElement('div');
        flash.className = 'flash-effect';
        document.body.appendChild(flash);

        setTimeout(() => {
            flash.remove();
        }, 150);
    }

    playShutterSound() {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1;

        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.stop(audioCtx.currentTime + 0.1);
    }

    savePhoto() {
        const imageData = this.elements.previewImage.src;

        const photo = {
            id: Date.now(),
            data: imageData,
            timestamp: new Date().toISOString()
        };

        this.state.photos.unshift(photo);
        this.savePhotosToStorage();
        this.updateGalleryPreview();

        const link = document.createElement('a');
        link.download = `godaero_${photo.id}.jpg`;
        link.href = imageData;
        link.click();

        this.showScreen('camera');
    }

    savePhotosToStorage() {
        try {
            const photosToSave = this.state.photos.slice(0, 20);
            localStorage.setItem('godaero_photos', JSON.stringify(photosToSave));
        } catch (e) {
            console.warn('Failed to save photos to storage:', e);
        }
    }

    loadPhotosFromStorage() {
        try {
            const saved = localStorage.getItem('godaero_photos');
            if (saved) {
                this.state.photos = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load photos from storage:', e);
        }
    }

    updateGalleryPreview() {
        if (this.state.photos.length > 0) {
            this.elements.galleryPreview.style.backgroundImage = `url(${this.state.photos[0].data})`;
        }
    }

    renderGallery() {
        const grid = this.elements.galleryGrid;
        grid.innerHTML = '';

        if (this.state.photos.length === 0) {
            this.elements.galleryEmpty.classList.remove('hidden');
            return;
        }

        this.elements.galleryEmpty.classList.add('hidden');

        this.state.photos.forEach(photo => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.style.backgroundImage = `url(${photo.data})`;
            item.addEventListener('click', () => {
                this.viewPhoto(photo);
            });
            grid.appendChild(item);
        });
    }

    viewPhoto(photo) {
        this.elements.previewImage.src = photo.data;
        this.showScreen('preview');

        const saveBtn = document.getElementById('save-btn');
        saveBtn.textContent = '다운로드';
        saveBtn.onclick = () => {
            const link = document.createElement('a');
            link.download = `godaero_${photo.id}.jpg`;
            link.href = photo.data;
            link.click();
        };

        document.getElementById('retake-btn').onclick = () => {
            saveBtn.textContent = '저장';
            saveBtn.onclick = () => this.savePhoto();
            this.showScreen('gallery');
        };
    }

    startDeviceOrientation() {
        if (typeof DeviceOrientationEvent !== 'undefined') {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission()
                    .then(response => {
                        if (response === 'granted') {
                            window.addEventListener('deviceorientation', (e) => this.handleOrientation(e));
                        }
                    })
                    .catch(console.error);
            } else {
                window.addEventListener('deviceorientation', (e) => this.handleOrientation(e));
            }
        }
    }

    handleOrientation(event) {
        if (!this.state.levelEnabled) return;

        const gamma = event.gamma || 0;
        const beta = event.beta || 0;

        const normalizedGamma = Math.max(-45, Math.min(45, gamma));
        const bubblePosition = 50 + (normalizedGamma / 45) * 40;

        this.elements.levelBubble.style.left = `${bubblePosition}%`;

        const isLevel = Math.abs(gamma) < 3 && Math.abs(beta - 90) < 10;
        this.elements.levelIndicator.classList.toggle('level', isLevel);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MomentieApp();
});
