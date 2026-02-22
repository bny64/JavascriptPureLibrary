# 프로젝트 분석: 업무 관리 시스템

이 문서는 `README.md` 및 프로젝트 코드 분석을 통해 얻은 최신 정보를 요약합니다. 시스템은 순수 Node.js와 JavaScript를 사용하여 개발되었으며, 백엔드와 프론트엔드 로직이 명확하게 분리된 모듈형 구조를 지향합니다.

## 1. 핵심 아키텍처

- **백엔드**: Node.js 기반. 역할에 따라 `models`, `routes` 디렉토리로 모듈화되어 있으며, `server.js`는 각 모듈을 통합하고 서버를 실행하는 진입점 역할을 합니다.
- **프론트엔드**: ES6 모듈 시스템을 사용하는 순수 JavaScript(Vanilla JS) 기반. `frontend/` 디렉토리 내에 기능별(`api`, `state`, `ui`, `modules`)로 코드가 분리되어 있습니다.
- **데이터 관리**: 모든 데이터는 백엔드의 `/backend/data/` 폴더 내 JSON 파일(`tasks.json`, `categories.json`, `logs.json`)에 저장됩니다. 프론트엔드는 RESTful API를 통해 데이터에 접근합니다.

## 2. 파일 구조 및 목적

### 최상위 디렉토리
-   `index.html`: 모든 UI의 기본 골격이 되는 메인 페이지.
-   `server.js`: 백엔드 서버의 메인 진입점.
-   `styles.css` / `themes.css`: 전역 및 테마 스타일.
-   `lib/`: 외부 라이브러리 (예: `frappe-gantt`).

### `backend/`
-   `/data/`: `tasks.json`, `categories.json`, `logs.json`, `holidays.json` 등 데이터 파일 저장소.
-   `/models/dataManager.js`: 파일 시스템(CRUD)을 직접 제어하는 유일한 모듈. 데이터의 일관성을 보장합니다.
-   `/routes/`: API 엔드포인트별 로직 분리.
    -   `taskRoutes.js`: 업무 관련 API.
    -   `categoryRoutes.js`: 분류 관련 API.
    -   `logRoutes.js`: 활동 로그 및 휴일 정보 API.
    -   `staticRoutes.js`: 정적 파일(HTML, CSS, JS 등) 제공.

### `frontend/`
-   `main.js`: 프론트엔드 애플리케이션의 메인 진입점. 모든 모듈을 `import`하고 초기화합니다.
-   `/api/api.js`: 백엔드 API와의 모든 통신을 담당하는 모듈.
-   `/state/app-state.js`: `AppState` 객체를 통해 모든 클라이언트 측 데이터를 중앙에서 관리.
-   `/ui/`: 데이터를 받아 순수한 DOM 요소를 생성하고 렌더링하는 모듈.
    -   `dashboard-ui.js`, `calendar-ui.js`, `kanban-ui.js` 등 기능별 UI 로직 분리.
-   `/modules/`: 특정 기능(모달, 알림 등)과 관련된 로직 및 이벤트 핸들러 분리.
-   `/utils/`: 날짜(`korean-time.js`), DOM(`dom.js`) 등 범용 유틸리티 함수.

## 3. 코드 작성 가이드 및 규칙

- **종속성 최소화**: 외부 라이브러리 사용을 지양하고, 필요 시 `lib/`에 로컬 파일로 포함.
- **모듈화**: ES6 `import/export` 문법을 사용하여 파일별 역할을 명확히 분리합니다.
- **상태 관리**: `AppState`를 데이터의 단일 진실 공급원(Single Source of Truth)으로 사용.
- **UI/로직 분리**: UI 모듈은 데이터 렌더링만, 기능 모듈은 사용자 인터랙션 및 상태 변경 담당.
- **API 추상화**: `API` 모듈을 통해서만 서버와 통신.
- **명명 규칙**:
    - 변수/함수: `camelCase`
    - 클래스/객체/모듈: `PascalCase`
    - CSS 클래스: `kebab-case`

## 4. 시스템 요구사항 및 실행

-   **요구사항**: Node.js (v14 이상 권장)
-   **실행 방법**:
    1.  프로젝트 루트에서 터미널 실행
    2.  `node server.js` 명령어 입력
    3.  웹 브라우저에서 `http://localhost:3000` 접속

## 5. 중요 고려사항
- 폐쇄망 환경을 고려하여 모든 리소스는 로컬에 포함되어 있습니다.
- 중요 데이터(`backend/data/` 폴더)는 정기적인 백업을 권장합니다.

## 6. 커밋 규칙
- 한국어로 작성한다.
- [Status] 내용 방식으로 작성한다.