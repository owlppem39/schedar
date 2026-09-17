# Schedar (macOS · Windows 앱 + 아이폰용 웹앱)

장기 프로젝트 · 투두 · 캘린더 · 저널 · 뽀모도로 · 메모를 담은 스케줄 관리 앱입니다.
데스크톱은 Electron으로, 모바일(아이폰 등)은 같은 화면을 그대로 쓰는 웹앱(PWA)으로 씁니다.
데스크톱은 로컬 파일에 저장하고, 모바일은 브라우저 저장소 + GitHub 저장소를 통한 동기화를 씁니다.

## 폴더 구성
```
schedar-electron/
├── index.html      # 앱 화면 (데스크톱 Electron 앱용)
├── widget.html      # 뽀모도로 항상-위 미니 위젯 창 화면
├── main.js         # Electron 메인 프로세스 + 로컬 저장소(JSON 파일) 구현
├── preload.js      # index.html이 쓰는 window.storage API를 안전하게 연결
├── docs/           # GitHub Pages로 올릴 모바일용 웹앱 (index.html은 위와 동일한 파일)
│   ├── index.html
│   ├── manifest.json
│   ├── icon-192.png
│   └── icon-512.png
├── icon.png        # 앱 로고 (1024×1024)
├── icon.iconset/   # macOS용 여러 해상도 아이콘 (icns 변환용)
├── icon.ico        # Windows용 아이콘
├── .github/workflows/build-windows.yml  # GitHub Actions로 Windows 빌드 (Wine 불필요)
└── package.json    # 실행/빌드 설정
```

데이터는 앱을 실행하면 아래 위치에 JSON 파일로 저장됩니다 (앱 삭제 전까지 유지):
- macOS: `~/Library/Application Support/Schedar/schedar-data.json`
- Windows: `%APPDATA%\Schedar\schedar-data.json`
- 모바일(PWA): 브라우저 저장소(localStorage) + 설정한 경우 GitHub 저장소에도 백업/동기화

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

## 아이폰(모바일)에서도 쓰기 — GitHub 동기화

Mac 앱은 로컬 파일에 저장하고, 아이폰은 그런 파일 접근이 안 되기 때문에 대신 **GitHub 저장소의
파일 하나**를 두 기기가 공유하는 중간 저장소로 씁니다.

> ⚠️ **중요 — 저장소를 반드시 두 개로 나눠주세요**
> GitHub Pages는 무료 플랜에서는 **퍼블릭 저장소**에서만 켤 수 있어요. 그런데 저장소가 퍼블릭이면
> 그 안의 파일은 **토큰 없이도 브라우저로 누구나** 그냥 열어볼 수 있어요 (토큰은 우리 앱이 API로
> 인증할 때만 쓰는 거지, 저장소 자체를 비공개로 만들어주는 장치가 아니에요). 그래서 앱 코드가
> 들어있는 지금 이 저장소(퍼블릭이어도 괜찮음, 개인정보 없음)와, 실제 일기·사진·할일이 들어가는
> **동기화 데이터 파일은 반드시 별도의 프라이빗 저장소**에 나눠서 저장해야 해요.

### 1단계. GitHub Pages로 모바일용 웹앱 올리기 (지금 이 저장소, 퍼블릭 유지)
이 저장소에는 이미 `docs/` 폴더(모바일 웹앱 + 아이콘)가 들어있어요. GitHub 저장소 페이지에서:
1. **Settings → Pages**
2. **Build and deployment** → Source: **Deploy from a branch**
3. Branch: **main**, 폴더: **/docs** 선택 → **Save**
4. 1분 정도 뒤 페이지 새로고침하면 `https://<내아이디>.github.io/<저장소이름>/` 주소가 나와요 —
   이게 아이폰에서 열 주소예요.

### 2단계. 데이터 전용 프라이빗 저장소 새로 만들기
1. GitHub에서 **New repository** 클릭
2. 이름: `schedar-data` (원하는 이름으로 바꿔도 됨)
3. **Private** 선택 (꼭 확인하세요!) → **Create repository**
4. 이 저장소에는 아무 파일도 안 올려도 돼요 — 앱이 API로 알아서 파일을 만듭니다.

### 3단계. GitHub Personal Access Token 만들기
1. https://github.com/settings/tokens → **Generate new token (classic)**
2. Note: `schedar-sync` 등 아무 이름, 만료 기간 원하는 대로
3. 권한(scope)은 **repo** 전체 체크 → **Generate token**
4. `ghp_`로 시작하는 토큰 문자열을 복사해두기 (이 화면을 벗어나면 다시 못 봐요)

> 이 토큰은 GitHub API에 직접 요청을 보낼 때만 쓰이고, 각 기기의 브라우저(localStorage)에만
> 저장돼요. 저희 서버나 다른 어디로도 전송되지 않습니다. `repo` 권한을 준 토큰은 위에서 만든
> **프라이빗 저장소도 정상적으로 읽고 쓸 수 있어요** — 프라이빗이어도 API 접근에는 문제없습니다.
> 다만 이 토큰이 유출되면 내 저장소 전체(퍼블릭·프라이빗 모두)에 접근할 수 있는 키이므로,
> 다른 사람과 공유하지 말고 필요 없어지면 위 설정 화면에서 삭제(revoke)하세요.

### 4단계. Mac 앱에서 동기화 켜기
1. Mac 앱에서 사이드바 아래 **테마 · 스티커** 클릭
2. 맨 아래 **☁️ 모바일 동기화 (GitHub)** 섹션에서:
   - Personal Access Token: 방금 만든 토큰
   - 저장소: `내아이디/schedar-data` (2단계에서 만든 **프라이빗** 저장소! 앱 코드 저장소 아님)
   - 파일 경로: 기본값(`mobile-sync/schedar-state.json`) 그대로 둬도 되고, 더 단순하게
     `schedar-state.json`으로 바꿔도 됩니다
   - 브랜치: `main`
3. **저장** → **지금 업로드 ↑** 클릭 (Mac에 있는 현재 데이터를 GitHub에 처음 올리는 과정)

### 5단계. 아이폰에서 설정하기
1. 아이폰 **Safari**에서 1단계의 GitHub Pages 주소로 접속
2. 공유 버튼(⬆️) → **홈 화면에 추가** → 이름 확인 후 추가 (이제 앱처럼 아이콘이 생겨요)
3. 홈 화면의 Schedar 아이콘으로 실행
4. 사이드바 아래쪽(모바일에서는 하단 탭바) 맨 끝 **테마 · 스티커** 열기
5. **☁️ 모바일 동기화** 섹션에 Mac과 **똑같은** 토큰/저장소(`schedar-data`)/경로/브랜치 입력 → **저장**
6. **지금 내려받기 ↓** 클릭 (또는 앱을 완전히 종료 후 다시 열면 자동으로 받아와요)

이후로는 **Mac과 아이폰 둘 다 자동으로 동작해요**:
- 앱을 열거나, 다른 화면 갔다가 돌아오거나, 최소 1분 간격으로 GitHub에서 최신 내용을 자동으로 받아와요.
- 뭔가 편집하면 약 2초 뒤 자동으로 GitHub에 올라가요 ("편집할 때마다 자동으로 업로드"가 켜져있을 때).
- 지금 타이핑 중인 게 있으면 자동으로 받아오는 걸 그 순간엔 건너뛰어서, 입력 중인 내용이 갑자기 사라지는 일은 없어요.
- 그래도 "지금 바로 확인하고 싶다" 싶을 땐 **지금 업로드 ↑** / **지금 내려받기 ↓** 버튼으로 즉시 실행할 수 있어요.

> **알아두면 좋은 점**
> - 두 기기를 정말 동시에(같은 순간에) 편집하는 경우까지 처리하는 정교한 방식은 아니에요 — 나중에
>   저장된 쪽이 이겨요. 완전히 동시에 편집하는 게 아니라면 실제로 부딪힐 일은 거의 없을 거예요.
> - 앱을 닫는 순간에도 마지막으로 한 번 더 업로드를 시도하긴 하지만, 브라우저/OS 특성상 100%
>   보장되진 않아요. 뭔가 바꾼 직후 몇 초 이내에 바로 앱을 완전히 종료하는 경우 아주 드물게
>   그 마지막 수정이 못 올라갈 수 있습니다.
> - 사진을 아주 많이 넣어두면 동기화 파일이 커져서 업로드/다운로드가 느려질 수 있어요.
> - 아이폰 PWA는 브라우저 탭이 실제로 열려있을 때만 동작해요 — 뽀모도로 타이머나 알람이 홈 화면에
>   내려간 상태(백그라운드)에서는 정확하지 않을 수 있습니다. 타이머는 Mac 앱에서 쓰는 걸 추천해요.
> - **앱 코드 저장소(`schedar`)와 데이터 저장소(`schedar-data`)를 절대 헷갈려서 같은 걸로
>   설정하지 마세요** — 데이터 저장소가 실수로 퍼블릭이 되면 개인 기록이 그대로 공개됩니다.

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
