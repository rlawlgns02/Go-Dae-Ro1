# GO대로

> 가이드대로, 완벽하게 - AR 기반 사진 촬영 가이드 앱

## 소개

GO대로는 누구나 전문가처럼 완벽한 사진을 찍을 수 있도록 도와주는 웹 기반 카메라 앱입니다. AR 가이드 오버레이와 AI 포즈 인식 기술을 활용하여 촬영자의 숙련도와 관계없이 의도한 구도의 사진을 얻을 수 있습니다.

## 주요 기능

### 카메라 기능
- 실시간 카메라 프리뷰 (WebRTC)
- 전면/후면 카메라 전환
- LED 플래시 제어
- 3초/5초/10초 타이머

### 비율 선택
- 1:1 (정사각형)
- 3:4 (인스타그램)
- 9:16 (스토리/릴스)
- Full (전체 화면)

### AR 가이드 시스템
- 인물 촬영 가이드
- 커플 촬영 가이드
- 단체 촬영 가이드
- 실시간 정렬 피드백

### AI 포즈 인식
- MediaPipe 기반 실시간 포즈 감지
- 자동 정렬 안내 메시지
- 수평/수직 위치 피드백

### 편의 기능
- 3분할 그리드 오버레이
- 수평계 (기기 기울기 감지)
- 로컬 갤러리 저장
- 사진 다운로드

## 기술 스택

- **프론트엔드**: HTML5, CSS3, JavaScript (ES6+)
- **카메라**: WebRTC (getUserMedia API)
- **AI/ML**: MediaPipe Pose
- **스타일**: 반응형 CSS, Inter 폰트
- **배포**: GitHub Pages 호환 (정적 파일)

## 프로젝트 구조

```
GO대로/
├── index.html          # 메인 HTML
├── styles.css          # 스타일시트
├── app.js              # 앱 로직
├── manifest.json       # PWA 매니페스트
├── .nojekyll           # GitHub Pages 설정
├── icons/
│   └── icon-192.svg    # 앱 아이콘
└── README.md           # 프로젝트 문서
```

## 설치 및 실행

### 로컬 실행

1. 저장소 클론
```bash
git clone https://github.com/[username]/godaero.git
cd godaero
```

2. 로컬 서버 실행 (카메라 접근을 위해 HTTPS 또는 localhost 필요)
```bash
# Python
python -m http.server 8000

# Node.js
npx serve

# VS Code Live Server 확장 사용
```

3. 브라우저에서 `http://localhost:8000` 접속

### GitHub Pages 배포

1. GitHub에 저장소 생성
2. 코드 push
3. Settings > Pages > Source를 `main` 브랜치로 설정
4. `https://[username].github.io/[repo-name]` 에서 접속

## 브라우저 지원

- Chrome (권장)
- Safari (iOS)
- Edge
- Firefox

> 카메라 및 플래시 기능은 HTTPS 환경에서만 작동합니다.

## 권한 요청

앱 실행 시 다음 권한을 요청합니다:
- 카메라 접근
- 기기 방향 센서 (수평계 기능)

## 라이선스

MIT License

## 기여

이슈 및 PR 환영합니다.
