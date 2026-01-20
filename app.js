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
            guideSilhouette: document.querySelector('.guide-silhouette'),
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
            flashIconOn: document.querySelector('.flash-icon-on'),
            editGuideBtn: document.getElementById('edit-guide-btn'),
            guideEditToolbar: document.getElementById('guide-edit-toolbar'),
            resizeHandles: document.querySelectorAll('.resize-handle'),
            shootIndicator: document.getElementById('shoot-indicator'),
            captureBtn: document.getElementById('capture-btn')
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
            ratioPanelOpen: false,
            // Guide edit state
            guideEditMode: false,
            guidePosition: { x: 50, y: 50 }, // percentage
            guideScale: 1,
            isDragging: false,
            isResizing: false,
            dragStart: { x: 0, y: 0 },
            // Saved guide positions per type
            savedGuidePositions: {
                portrait: { x: 50, y: 50, scale: 1 },
                couple: { x: 50, y: 50, scale: 1 },
                group: { x: 50, y: 50, scale: 1 }
            }
        };

        // Ratio definitions
        this.ratios = {
            '1:1': { width: 1, height: 1 },
            '3:4': { width: 3, height: 4 },
            '9:16': { width: 9, height: 16 },
            'full': { width: 0, height: 0 }
        };

        // Default guide sizes
        this.defaultGuideSizes = {
            portrait: { width: 140, height: 280 },
            couple: { width: 220, height: 280 },
            group: { width: 300, height: 220 }
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
        this.loadGuidePositions();
        this.updateGalleryPreview();
        this.setRatio('3:4');
        this.handleOrientationChange();
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
            if (!this.state.guideEditMode) {
                this.capturePhoto();
            }
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
            if (e.target.checked) {
                this.updateGridPosition();
            }
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

        // Guide edit mode
        this.elements.editGuideBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleGuideEditMode();
        });

        document.getElementById('reset-guide-btn').addEventListener('click', () => {
            this.resetGuidePosition();
        });

        document.getElementById('done-guide-btn').addEventListener('click', () => {
            this.toggleGuideEditMode(false);
        });

        // Guide drag events
        this.setupGuideDragEvents();

        // Close panels on outside click
        document.addEventListener('click', (e) => {
            if (this.elements.settingsPanel.classList.contains('visible')) {
                if (!this.elements.settingsPanel.contains(e.target) &&
                    e.target.id !== 'settings-btn') {
                    this.toggleSettings(false);
                }
            }

            if (this.state.ratioPanelOpen) {
                if (!this.elements.ratioPanel.contains(e.target) &&
                    e.target.id !== 'ratio-btn' &&
                    !e.target.closest('#ratio-btn')) {
                    this.toggleRatioPanel(false);
                }
            }
        });

        // Window resize
        window.addEventListener('resize', () => {
            if (this.state.currentScreen === 'camera') {
                this.updateRatioMask();
                this.updateGridPosition();
                this.updateGuidePosition();
            }
        });

        // Orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleOrientationChange(), 100);
        });

        screen.orientation?.addEventListener('change', () => {
            setTimeout(() => this.handleOrientationChange(), 100);
        });
    }

    handleOrientationChange() {
        const isLandscape = window.innerWidth > window.innerHeight;
        document.body.classList.toggle('landscape', isLandscape);

        if (this.state.currentScreen === 'camera') {
            this.updateRatioMask();
            this.updateGridPosition();
            this.updateGuidePosition();
        }
    }

    setupGuideDragEvents() {
        const guideFrame = this.elements.guideFrame;

        // Touch events
        guideFrame.addEventListener('touchstart', (e) => this.onDragStart(e), { passive: false });
        guideFrame.addEventListener('touchmove', (e) => this.onDragMove(e), { passive: false });
        guideFrame.addEventListener('touchend', (e) => this.onDragEnd(e));

        // Mouse events
        guideFrame.addEventListener('mousedown', (e) => this.onDragStart(e));
        document.addEventListener('mousemove', (e) => this.onDragMove(e));
        document.addEventListener('mouseup', (e) => this.onDragEnd(e));

        // Resize handles
        this.elements.resizeHandles.forEach(handle => {
            handle.addEventListener('touchstart', (e) => this.onResizeStart(e), { passive: false });
            handle.addEventListener('mousedown', (e) => this.onResizeStart(e));
        });
    }

    onDragStart(e) {
        if (!this.state.guideEditMode) return;
        if (e.target.classList.contains('resize-handle') || e.target.classList.contains('edit-guide-btn')) return;

        e.preventDefault();
        this.state.isDragging = true;

        const point = e.touches ? e.touches[0] : e;
        this.state.dragStart = {
            x: point.clientX,
            y: point.clientY,
            posX: this.state.guidePosition.x,
            posY: this.state.guidePosition.y
        };
    }

    onDragMove(e) {
        if (!this.state.isDragging && !this.state.isResizing) return;

        e.preventDefault();
        const point = e.touches ? e.touches[0] : e;
        const container = document.querySelector('.camera-container');
        const rect = container.getBoundingClientRect();

        if (this.state.isDragging) {
            const deltaX = ((point.clientX - this.state.dragStart.x) / rect.width) * 100;
            const deltaY = ((point.clientY - this.state.dragStart.y) / rect.height) * 100;

            this.state.guidePosition.x = Math.max(10, Math.min(90, this.state.dragStart.posX + deltaX));
            this.state.guidePosition.y = Math.max(10, Math.min(90, this.state.dragStart.posY + deltaY));

            this.updateGuidePosition();
        }

        if (this.state.isResizing) {
            const deltaX = point.clientX - this.state.dragStart.x;
            const scaleDelta = deltaX / 100;
            this.state.guideScale = Math.max(0.5, Math.min(2, this.state.dragStart.scale + scaleDelta));
            this.updateGuideSize();
        }
    }

    onDragEnd(e) {
        if (this.state.isDragging || this.state.isResizing) {
            this.saveCurrentGuidePosition();
        }
        this.state.isDragging = false;
        this.state.isResizing = false;
    }

    onResizeStart(e) {
        if (!this.state.guideEditMode) return;

        e.preventDefault();
        e.stopPropagation();
        this.state.isResizing = true;

        const point = e.touches ? e.touches[0] : e;
        this.state.dragStart = {
            x: point.clientX,
            y: point.clientY,
            scale: this.state.guideScale
        };
    }

    showScreen(screenName) {
        Object.keys(this.screens).forEach(key => {
            this.screens[key].classList.remove('active');
        });
        this.screens[screenName].classList.add('active');
        this.state.currentScreen = screenName;

        if (screenName === 'camera') {
            setTimeout(() => {
                this.updateRatioMask();
                this.updateGridPosition();
            }, 100);
        }
    }

    async startCamera() {
        try {
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

            this.state.videoTrack = this.state.stream.getVideoTracks()[0];
            await this.checkTorchSupport();

            this.elements.video.onloadedmetadata = () => {
                this.resizeCanvases();
                this.updateRatioMask();
                this.updateGridPosition();
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

        document.querySelectorAll('.ratio-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.ratio === ratio);
        });

        this.elements.ratioLabel.textContent = ratio === 'full' ? 'Full' : ratio;

        this.updateRatioMask();
        this.updateGridPosition();
    }

    updateRatioMask() {
        const mask = this.elements.ratioMask;
        const container = document.querySelector('.camera-container');
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;

        if (this.state.currentRatio === 'full') {
            mask.style.setProperty('--mask-top', '0px');
            mask.style.setProperty('--mask-bottom', '0px');
            mask.style.setProperty('--mask-side', '0px');
            mask.classList.remove('horizontal');
            return;
        }

        const ratioData = this.ratios[this.state.currentRatio];
        const targetRatio = ratioData.width / ratioData.height;
        const containerRatio = containerWidth / containerHeight;

        if (targetRatio < containerRatio) {
            const targetHeight = containerHeight;
            const targetWidth = targetHeight * targetRatio;
            const sideMargin = (containerWidth - targetWidth) / 2;

            mask.classList.add('horizontal');
            mask.style.setProperty('--mask-side', `${sideMargin}px`);
            mask.style.setProperty('--mask-top', '0px');
            mask.style.setProperty('--mask-bottom', '0px');
        } else {
            const targetWidth = containerWidth;
            const targetHeight = targetWidth / targetRatio;
            const verticalMargin = (containerHeight - targetHeight) / 2;

            mask.classList.remove('horizontal');
            mask.style.setProperty('--mask-top', `${verticalMargin}px`);
            mask.style.setProperty('--mask-bottom', `${verticalMargin}px`);
            mask.style.setProperty('--mask-side', '0px');
        }
    }

    updateGridPosition() {
        const grid = this.elements.gridOverlay;
        const container = document.querySelector('.camera-container');
        if (!container || !grid) return;

        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;

        if (this.state.currentRatio === 'full') {
            grid.style.setProperty('--grid-top', '0px');
            grid.style.setProperty('--grid-bottom', '0px');
            grid.style.setProperty('--grid-left', '0px');
            grid.style.setProperty('--grid-right', '0px');
            return;
        }

        const ratioData = this.ratios[this.state.currentRatio];
        const targetRatio = ratioData.width / ratioData.height;
        const containerRatio = containerWidth / containerHeight;

        if (targetRatio < containerRatio) {
            const targetHeight = containerHeight;
            const targetWidth = targetHeight * targetRatio;
            const sideMargin = (containerWidth - targetWidth) / 2;

            grid.style.setProperty('--grid-top', '0px');
            grid.style.setProperty('--grid-bottom', '0px');
            grid.style.setProperty('--grid-left', `${sideMargin}px`);
            grid.style.setProperty('--grid-right', `${sideMargin}px`);
        } else {
            const targetWidth = containerWidth;
            const targetHeight = targetWidth / targetRatio;
            const verticalMargin = (containerHeight - targetHeight) / 2;

            grid.style.setProperty('--grid-top', `${verticalMargin}px`);
            grid.style.setProperty('--grid-bottom', `${verticalMargin}px`);
            grid.style.setProperty('--grid-left', '0px');
            grid.style.setProperty('--grid-right', '0px');
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

    // Guide Edit Mode
    toggleGuideEditMode(enable) {
        if (enable === undefined) {
            enable = !this.state.guideEditMode;
        }

        this.state.guideEditMode = enable;
        this.elements.guideFrame.classList.toggle('editing', enable);
        this.elements.guideEditToolbar.classList.toggle('hidden', !enable);

        // Show/hide resize handles
        this.elements.resizeHandles.forEach(handle => {
            handle.classList.toggle('hidden', !enable);
        });

        // Hide other controls when editing
        document.querySelector('.bottom-controls').style.opacity = enable ? '0.3' : '1';
        document.querySelector('.bottom-controls').style.pointerEvents = enable ? 'none' : 'auto';
    }

    resetGuidePosition() {
        this.state.guidePosition = { x: 50, y: 50 };
        this.state.guideScale = 1;
        this.updateGuidePosition();
        this.updateGuideSize();
        this.saveCurrentGuidePosition();
    }

    updateGuidePosition() {
        const frame = this.elements.guideFrame;
        frame.style.left = `${this.state.guidePosition.x}%`;
        frame.style.top = `${this.state.guidePosition.y}%`;
    }

    updateGuideSize() {
        if (this.state.currentGuide === 'none') return;

        const defaultSize = this.defaultGuideSizes[this.state.currentGuide];
        const silhouette = this.elements.guideSilhouette;

        silhouette.style.width = `${defaultSize.width * this.state.guideScale}px`;
        silhouette.style.height = `${defaultSize.height * this.state.guideScale}px`;
    }

    saveCurrentGuidePosition() {
        if (this.state.currentGuide === 'none') return;

        this.state.savedGuidePositions[this.state.currentGuide] = {
            x: this.state.guidePosition.x,
            y: this.state.guidePosition.y,
            scale: this.state.guideScale
        };

        this.saveGuidePositions();
    }

    loadGuidePosition(guideType) {
        const saved = this.state.savedGuidePositions[guideType];
        if (saved) {
            this.state.guidePosition = { x: saved.x, y: saved.y };
            this.state.guideScale = saved.scale;
        } else {
            this.state.guidePosition = { x: 50, y: 50 };
            this.state.guideScale = 1;
        }
        this.updateGuidePosition();
        this.updateGuideSize();
    }

    saveGuidePositions() {
        try {
            localStorage.setItem('godaero_guide_positions', JSON.stringify(this.state.savedGuidePositions));
        } catch (e) {
            console.warn('Failed to save guide positions:', e);
        }
    }

    loadGuidePositions() {
        try {
            const saved = localStorage.getItem('godaero_guide_positions');
            if (saved) {
                this.state.savedGuidePositions = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load guide positions:', e);
        }
    }

    // Pose Detection
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
        if (this.state.currentGuide === 'none' || this.state.guideEditMode) {
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

        // Compare with guide position
        const guideX = this.state.guidePosition.x / 100;
        const guideY = this.state.guidePosition.y / 100;

        const isHorizontallyAligned = Math.abs(centerX - guideX) < 0.1;
        const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
        const isLevel = shoulderDiff < 0.03;

        const isVerticallyAligned = Math.abs(centerY - guideY) < 0.15;

        if (isHorizontallyAligned && isVerticallyAligned && isLevel) {
            this.showAlignmentFeedback('완벽해요!', true);
        } else if (!isLevel) {
            this.showAlignmentFeedback('카메라를 수평으로 맞춰주세요', false);
        } else if (!isHorizontallyAligned) {
            const direction = centerX < guideX ? '오른쪽' : '왼쪽';
            this.showAlignmentFeedback(`${direction}으로 조금 이동해주세요`, false);
        } else if (!isVerticallyAligned) {
            const direction = centerY < guideY ? '아래' : '위';
            this.showAlignmentFeedback(`${direction}로 이동해주세요`, false);
        }
    }

    showAlignmentFeedback(message, isAligned) {
        this.elements.feedbackText.textContent = message;
        this.elements.alignmentFeedback.classList.add('visible');
        this.elements.alignmentFeedback.classList.toggle('aligned', isAligned);

        // Show/hide perfect alignment indicators
        this.elements.guideFrame.classList.toggle('perfect', isAligned);
        this.elements.captureBtn.classList.toggle('ready', isAligned);
        this.elements.shootIndicator.classList.toggle('visible', isAligned);
    }

    hideAlignmentFeedback() {
        this.elements.alignmentFeedback.classList.remove('visible', 'aligned');
        this.elements.guideFrame.classList.remove('perfect');
        this.elements.captureBtn.classList.remove('ready');
        this.elements.shootIndicator.classList.remove('visible');
    }

    setGuide(guide) {
        // Exit edit mode if active
        if (this.state.guideEditMode) {
            this.toggleGuideEditMode(false);
        }

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
            this.loadGuidePosition(guide);
            this.updateGuideFrame(guide);
        }
    }

    updateGuideFrame(guide) {
        const silhouette = this.elements.guideSilhouette;
        const defaultSize = this.defaultGuideSizes[guide];

        silhouette.style.width = `${defaultSize.width * this.state.guideScale}px`;
        silhouette.style.height = `${defaultSize.height * this.state.guideScale}px`;

        switch (guide) {
            case 'portrait':
                silhouette.style.borderRadius = '70px 70px 50px 50px';
                break;
            case 'couple':
                silhouette.style.borderRadius = '70px 70px 50px 50px';
                break;
            case 'group':
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

        // Capture ONLY the video - no grid or overlays
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
        }

        // Draw ONLY the video frame - nothing else
        ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

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
        try {
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
        } catch (e) {
            console.warn('Could not play shutter sound:', e);
        }
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
