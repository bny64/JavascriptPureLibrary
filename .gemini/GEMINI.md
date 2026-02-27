# 프로젝트 분석: 업무 관리 시스템

이 문서는 프로젝트의 최신 아키텍처 및 리팩토링된 구조를 요약합니다. 시스템은 순수 Node.js와 JavaScript를 사용하며, 백엔드와 프론트엔드가 명확히 분리된 **서비스 기반 모듈형 구조**를 지향합니다.

## 1. 핵심 아키텍처

- **백엔드**: Node.js 기반. 역할에 따라 `models`, `routes` 디렉토리로 모듈화되어 있으며, `server.js`는 각 모듈을 통합하고 서버를 실행하는 진입점 역할을 합니다.
- **프론트엔드 (Service-Oriented)**:
    - **서비스 계층 (Service Layer)**: 데이터 처리 및 외부 API 통신을 전담합니다 (`frontend/services/`).
    - **상태 관리 및 이벤트 버스 (Pub/Sub)**: `AppState`로 상태를 유지하고, `EventBus`를 통해 데이터 변경 사항을 각 UI 모듈에 전파하여 결합도를 낮췄습니다.
    - **Vanilla JS & 모듈화**: 인라인 이벤트 핸들러를 제거하고 `addEventListener`와 동적 `import()`를 사용하여 초기 로딩 속도와 유지보수성을 극대화했습니다.
- **데이터 관리**: 모든 데이터는 백엔드의 `/backend/data/` 폴더 내 JSON 파일에 저장되며, 프론트엔드는 전용 서비스를 통해 RESTful API로 접근합니다.

## 2. 파일 구조 및 목적

### 최상위 디렉토리
-   `index.html`: 모든 UI의 기본 골격이 되는 메인 페이지.
-   `server.js`: 백엔드 서버의 메인 진입점. 순수 Node.js 기반.
-   `styles/` / `themes.css`: 기능별 CSS 분리 및 동적 테마(색상) 스타일.
-   `lib/`: 외부 라이브러리 로컬 보관 (frappe-gantt, quill, chart.js 등).

### `backend/`
-   `/data/`: 데이터 저장소 (JSON 파일들).
-   `/models/dataManager.js`: 파일 시스템 제어 및 데이터 일관성/백업 담당.
-   `/routes/`: 기능별 API 서버 로직 (Task, Category, Log 등).

### `frontend/`
-   `main.js`: 애플리케이션 진입점. 모듈 초기화, `EventBus` 구독 관리 및 전역 리스너 바인딩 담당.
-   **/services/**: 데이터 처리 엔진.
    -   `task-service.js`: 업무 관련 CRUD 및 비즈니스 로직 최상위 API 호출.
    -   `category-service.js`: 카테고리 관리 로직.
-   **/utils/**:
    -   `event-bus.js`: 모듈 간 통신을 위한 Pub/Sub 유틸리티.
    -   `dom.js`, `korean-time.js`: DOM 조작 및 시간 처리 유틸리티.
-   `/state/app-state.js`: `AppState` 객체를 통한 중앙 집중식 상태 관리.
-   **/ui/**: 화면 렌더링 및 데이터 바인딩.
    -   `dashboard-ui.js`, `calendar-ui.js`, `kanban-ui.js`, `search-ui.js` 등 기능별 UI 전담.
-   **/modules/**: UI 로직 및 데이터 교류 컨트롤러.
    -   `view-controller.js`: SPA 스타일 화면 전환 및 뷰 이벤트 바인딩.
    -   `task-modal.js`, `category-modal.js` 등 모달 내 인터랙션 및 서비스 연동.

## 3. 핵심 리팩토링 특이사항

- **전역 오염 제거**: `window` 객체를 통한 전역 함수 노출을 최소화하고 명시적인 `import/export`를 사용합니다.
- **반응형 UI 업데이트**: 데이터 변경 시 `EventBus`를 통해 구독된 모든 UIComponent가 자동으로 재렌더링됩니다.
- **이벤트 위임 및 동적 로딩**: HTML 내 `onclick` 등 인라인 속성을 제거하고, 필요 시점에만 모듈을 로드하여 성능을 최적화했습니다.

## 4. 코드 작성 가이드 및 규칙

- **Service First**: 데이터 변경이 필요한 경우 반드시 관련 `Service`를 통해 진행하며, 직접 API를 호출하지 않습니다.
- **Event-Driven**: UI 갱신은 `EventBus` 구독 결과를 통해 수행하는 것을 지향합니다.
- **Vanilla JS 지향**: 외부 프레임워크 없이 순수 DOM API를 활용합니다.
- **Single Source of Truth**: 모든 UI 데이터는 `AppState`를 참조하여 일관성을 유지합니다.

## 5. 커밋 규칙
- 한국어로 작성한다.
- `[Status] 내용` 방식으로 작성한다. (예: `[Add]`, `[Fix]`, `[Update]`)
- **커밋 전 반드시 사용자에게 확인을 요청한다.**
