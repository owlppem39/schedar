# Schedar (macOS · Windows 앱)

장기 프로젝트 · 투두 · 캘린더 · 저널을 담은 스케줄 관리 앱의 Electron 버전입니다.
웹 아티팩트에서 쓰던 화면(index.html)을 그대로 재사용하고, 저장 방식만
Claude 아티팩트 전용 저장소 대신 **로컬 파일**에 저장하도록 바꿨습니다. macOS와 Windows 둘 다 빌드할 수 있습니다.

## 폴더 구성
```
schedar-electron/
├── index.html      # 앱 화면 (기존 아티팩트와 동일한 UI/기능)
├── widget.html      # 뽀모도로 항상-위 미니 위젯 창 화면
├── main.js         # Electron 메인 프로세스 + 로컬 저장소(JSON 파일) 구현
├── preload.js      # index.html이 쓰는 window.storage API를 안전하게 연결
├── icon.png        # 앱 로고 (1024×1024)
├── icon.iconset/   # macOS용 여러 해상도 아이콘 (icns 변환용)
├── icon.ico        # Windows용 아이콘
├── .github/workflows/build-windows.yml  # GitHub Actions로 Windows 빌드 (Wine 불필요)
└── package.json    # 실행/빌드 설정
```

데이터는 앱을 실행하면 아래 위치에 JSON 파일로 저장됩니다 (앱 삭제 전까지 유지):
- macOS: `~/Library/Application Support/Schedar/schedar-data.json`
- Windows: `%APPDATA%\Schedar\schedar-data.json`

## 1. 준비물
- Mac
- [Node.js](https://nodejs.org) 18 이상 (LTS 버전 추천)
  - 설치 확인: 터미널에서 `node -v`

## 2. 실행해보기 (개발 모드)
터미널에서 이 폴더로 이동한 뒤:
```bash
npm install
npm start
```
Schedar 창이 뜨면 정상입니다. 이 상태로도 실제 앱처럼 다 쓸 수 있어요 (Dock에 고정 가능).

## 3. 아이콘 준비 (한 번만 하면 됨)
심플한 체크마크 로고(`icon.png`, `icon.iconset/`)를 이미 만들어 넣어뒀어요. macOS 앱에는 `.icns` 형식이 필요한데,
변환 도구(`iconutil`)가 macOS에 기본 내장되어 있어서 터미널에서 한 줄만 실행하면 됩니다:
```bash
iconutil -c icns icon.iconset -o icon.icns
```
다른 로고로 바꾸고 싶다면 1024×1024 PNG를 `icon.png`로 교체한 뒤 같은 명령을 다시 실행하거나,
[cloudconvert.com](https://cloudconvert.com/png-to-icns) 같은 도구로 바로 `.icns`를 만들어도 됩니다.

## 4. 진짜 .app 파일로 빌드하기 (서명·개발자 인증 불필요)
```bash
npm run package:mac
```
`electron-packager`를 사용해서 dmg 변환이나 Apple 개발자 인증서 없이 바로 `.app` 번들을 만듭니다.
방금 만든 `icon.icns`가 자동으로 적용됩니다. 빌드가 끝나면 `dist/` 폴더 안에 다음 두 개가 생깁니다
(둘 다 만들어지며, 내 Mac 칩에 맞는 것만 쓰면 됩니다):
```
dist/Schedar-darwin-arm64/Schedar.app   ← Apple Silicon (M1~M4)
dist/Schedar-darwin-x64/Schedar.app     ← Intel Mac
```
내 Mac이 어떤 칩인지 모르겠다면 좌측 상단 사과 메뉴 → "이 Mac에 관하여"에서 확인할 수 있습니다.
해당 `Schedar.app`을 Applications 폴더로 끌어다 놓으면 다른 Mac 앱들처럼 Launchpad·Spotlight에서 실행할 수 있습니다.

> **처음 실행 시 주의**: 서명 없는(unsigned) 앱이라 macOS Gatekeeper가
> "확인되지 않은 개발자" 경고를 띄웁니다. 앱 아이콘을 **우클릭 → 열기**로 한 번 실행하면
> 그다음부터는 정상적으로 더블클릭 실행됩니다. 개발자 계정이나 인증서는 전혀 필요하지 않아요 —
> 이 경고는 배포용 서명이 없는 모든 개인 앱에 공통으로 뜨는 것이며, 내가 직접 빌드했다는 걸
> macOS에 한 번 알려주는 절차일 뿐입니다.

## 5. 다른 사람과 공유하기 (zip 만들기)
`.app`은 실제로는 폴더라서, 메일이나 메신저·클라우드로 보낼 때는 zip으로 압축하는 게 안전합니다.
일반 `zip` 대신 macOS 표준 도구인 `ditto`를 쓰면 앱 번들 정보가 깨지지 않습니다:
```bash
npm run zip:mac
```
빌드된 아키텍처별로 압축 파일이 만들어집니다:
```
dist/Schedar-darwin-arm64.zip   ← Apple Silicon용
dist/Schedar-darwin-x64.zip     ← Intel Mac용
```
받는 사람의 Mac 종류에 맞는 zip 파일 하나만 보내면 됩니다 (모르면 arm64용을 먼저 시도해보고,
안 열리면 x64용을 보내주면 됩니다 — 최근 5년 내 나온 Mac은 대부분 Apple Silicon입니다).
받는 사람은 압축을 풀고 Applications 폴더로 옮긴 뒤, 위와 동일하게 **우클릭 → 열기**로 처음 한 번만
열어주면 정상적으로 실행됩니다.

## Windows용으로 빌드하기

### 방법 A. GitHub Actions로 빌드 (추천 — Wine 불필요, 아이콘도 정상 포함)
Mac에서 Windows용 아이콘/버전 정보를 심으려면 원래 Wine이 필요한데, 설치가 까다로울 수 있어요.
대신 이 폴더에 이미 넣어둔 `.github/workflows/build-windows.yml`을 쓰면 GitHub이 제공하는
**진짜 Windows 컴퓨터**에서 빌드해줘서 이 문제 자체가 없어요. 무료입니다.

1. 이 `schedar-electron` 폴더를 GitHub 저장소로 올립니다 (개인용 private 저장소로 만들어도 됩니다).
   ```bash
   git init
   git add .
   git commit -m "schedar"
   # GitHub에서 새 저장소를 만든 뒤 안내되는 명령으로 push
   ```
2. GitHub 저장소 페이지 → **Actions** 탭 → **Build Windows app** 워크플로 선택 →
   **Run workflow** 버튼 클릭.
3. 1~2분 정도 기다리면 실행이 끝나고, 같은 화면 아래 **Artifacts**에
   `Schedar-win32-x64`가 생깁니다. 클릭해서 다운로드하면 바로 공유 가능한 zip이에요.

### 방법 B. Mac에서 직접 빌드 (아이콘 없이, 지금 바로 가능)
```bash
npm run package:win
npm run zip:win
```
`dist/Schedar-win32-x64.zip`이 바로 만들어집니다. 다만 `.exe` 파일 자체의 아이콘은
Electron 기본 아이콘으로 나옵니다 (앱을 실행하면 안에서는 우리 로고가 정상적으로 다 보이고
기능도 100% 동일해요 — 파일 아이콘만 기본값입니다). Windows 버전 정보(회사명, 버전 번호 등)를
`.exe`에 심는 과정 자체가 Mac에서는 Wine을 필요로 해서, 이 방법으로는 아이콘을 넣을 수 없어요.
아이콘까지 필요하면 방법 A를 이용해주세요.

> **Windows에서 처음 실행 시 주의**: 서명 없는 앱이라 "Windows에서 PC를 보호했습니다"라는
> SmartScreen 경고가 뜰 수 있습니다. **추가 정보 → 실행**을 누르면 정상적으로 열립니다.
> macOS 쪽 경고와 마찬가지로, 개발자 인증서가 없는 개인 빌드 앱에 공통적으로 뜨는 안내일 뿐입니다.

Windows에서는 창 상단에 우리가 만든 커스텀 타이틀바 대신 Windows 기본 제목표시줄(최소화·최대화·닫기
버튼 포함)이 그대로 쓰이도록 되어 있어서, 굳이 신경 쓸 부분 없이 자연스럽게 동작합니다.

## 6. 자주 묻는 것들
- **인터넷 연결이 꼭 필요한가요?** 아니요. 다만 프리텐다드 폰트를 CDN에서 불러오기 때문에,
  처음 실행 시 인터넷이 없으면 기본 시스템 폰트로 보입니다. 기능에는 영향 없습니다.
- **데이터 백업/이전은요?** `~/Library/Application Support/Schedar/schedar-data.json`
  파일 하나만 복사해두면 됩니다. 새 Mac에서도 같은 경로에 넣으면 그대로 이어집니다.
- **가상머신에서 창이 켜지자마자 꺼져요.** GPU 가속이 제대로 안 되는 환경(가상머신 등)에서
  흔히 생기는 문제인데, 자동으로 감지해서 다음 실행부터 소프트웨어 렌더링으로 전환하도록
  만들어뒀어요 (평소 실제 기기에서는 GPU 가속을 그대로 써서 성능 손해가 없습니다). 혹시 나중에
  다시 GPU 가속으로 되돌리고 싶으면, 데이터 폴더 안의 `.force-sw-render` 파일을 지우면 됩니다.
- **왜 dmg가 아니라 .app만 만드나요?** dmg 제작 도구(electron-builder)는 macOS에서
  기본적으로 코드 서명을 시도하면서 개발자 인증서를 찾습니다. 배포할 계획이 없다면
  `electron-packager`로 바로 `.app`을 만드는 지금 방식이 훨씬 간단하고, 인증서도 전혀 필요 없습니다.
- **App Store에 올리고 싶어요.** Apple Developer 계정(연 $99)과 코드 서명, 샌드박스
  entitlements 설정이 추가로 필요합니다. 원하시면 다음 단계로 도와드릴게요.

## 7. 화면 기능 요약
- 요약(홈) / 캘린더(드래그 앤 드롭) / 투두·장기 프로젝트(진행도 바) / 저널(기분·식사·약·사진)
- 사이드바의 "테마·스티커"에서 포인트 컬러와 스티커 꾸미기 가능
