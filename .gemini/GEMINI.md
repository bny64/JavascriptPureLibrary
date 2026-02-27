# 프로젝트 분석: 업무 관리 시스템

이 문서는 `README.md` 및 프로젝트 코드 분석을 통해 얻은 최신 정보를 요약합니다. 시스템은 순수 Node.js와 JavaScript를 사용하여 개발되었으며, 백엔드와 프론트엔드 로직이 명확하게 분리된 모듈형 구조를 지향합니다.

## 1. 핵심 아키텍처

- **백엔드**: Node.js 기반. 역할에 따라 `models`, `routes` 디렉토리로 모듈화되어 있으며, `server.js`는 각 모듈을 통합하고 서버를 실행하는 진입점 역할을 합니다.
- **프론트엔드**: ES6 모듈 시스템을 사용하는 순수 JavaScript(Vanilla JS) 기반. `frontend/` 디렉토리 내에 기능별(`api`, `state`, `ui`, `modules`)로 코드가 분리되어 있습니다.
- **데이터 관리**: 모든 데이터는 백엔드의 `/backend/data/` 폴더 내 JSON 파일(`tasks.json`, `categories.json`, `logs.json`, `holidays.json`)에 저장됩니다. 프론트엔드는 RESTful API를 통해 데이터에 접근합니다.

## 2. 파일 구조 및 목적

### 최상위 디렉토리
-   `index.html`: 모든 UI의 기본 골격이 되는 메인 페이지.
-   `server.js`: 백엔드 서버의 메인 진입점. Express 등을 사용하지 않은 순수 Node.js 서버.
-   `styles.css` / `themes.css`: 전역 디자인 및 동적 테마(색상) 스타일.
-   `lib/`: 외부 라이브러리 로컬 보관 (frappe-gantt, quill, chart.js 등).

### `backend/`
-   `/data/`: 데이터 저장소 (JSON 파일들).
-   `/models/dataManager.js`: 파일 시스템(CRUD)을 제어하는 단일 통로. 데이터 일관성 및 백업 담당.
-   `/routes/`: 기능별 API 서버 로직 (Task, Category, Log, Static 파일 제공).

### `frontend/`
-   `main.js`: 애플리케이션 진입점. 모듈 초기화, 전역 이벤트 바인딩 및 브라우저 호환성 패치 담당.
-   `/api/api.js`: fetch API를 래핑하여 백엔드와 통신하는 추상화 계층.
-   `/state/app-state.js`: `AppState` 객체를 통한 중앙 집중식 상태 관리 (필터, 정렬, 그룹화 설정 등).
-   `/ui/`: DOM 생성 및 데이터 바인딩 담당.
    -   `dashboard-ui.js`: 현황 통계 및 트렌드 시각화.
    -   `calendar-ui.js`: 월간 달력, 공휴일 표시 및 **드래그 앤 드롭 일정 조정**.
    -   `kanban-ui.js`: **상태별/우선순위별 그룹화 전환** 기능 및 실시간 컬럼 검색.
    -   `search-ui.js`: 페이지네이션 및 다중 필터를 지원하는 상세 업무 검색.
    -   `task-ui.js`: 업무 카드 렌더링 및 요약 정보 표시.
    -   `memo-ui.js`, `activity-log-ui.js`, `category-ui.js`: 각 기능별 특화 UI.
-   `/modules/`: 비즈니스 로직 및 컨트롤러.
    -   `view-controller.js`: 싱글 페이지 애플리케이션(SPA) 스타일의 화면 전환 관리.
    -   `calendar-controller.js`: 달력 조작 및 날짜별 업무 필터링 로직.
    -   `gantt.js`: Frappe Gantt 라이브러리 연동 및 차트 제어.
    -   `task-modal.js`, `category-modal.js`, `all-tasks-modal.js`: 각 모달 내 복잡한 인터랙션 처리.
-   `/utils/`: 범용 유틸리티.
    -   `dom.js`: DOM 조작 보조 및 로컬 스토리지 제어.
    -   `korean-time.js`: 한국 표준시 기준 날짜 처리 및 포맷팅.

## 3. 핵심 기능 특이사항

- **칸반 보드 고도화**: 상태(Status) 기준 외에 우선순위(Priority) 기준으로 업무를 모아볼 수 있는 전환 탭 지원. 각 컬럼별 독립적 검색 및 드래그를 통한 상태/우선순위 직접 변경 가능.
- **일정 관리 인터랙션**: 달력 날짜 칸에 업무 카드를 드래그하여 떨어뜨리면 시작/종료일이 즉시 변경됨. 날짜별 업무 수 카운트 표시.
- **상세 검색 시스템**: 제목, 내용, 카테고리, 상태, 우선순위, 기간 등 다중 조건 검색 및 5개 단위 페이지네이션 지원.
- **실시간 반응형 UI**: 모든 검색 및 필터링 시 화면 전체를 새로고침하지 않고 필요한 영역만 부분 렌더링하여 포커스 유지 및 성능 최적화.

## 4. 코드 작성 가이드 및 규칙

- **Vanilla JS 지향**: 외부 의존성을 최소화하고 순수 JavaScript와 DOM API를 사용.
- **Single Source of Truth**: 모든 UI 데이터는 `AppState`를 참조하여 일관성 유지.
- **비구조화 취급**: API 호출 등 비동기 작업은 `async/await` 패턴 사용.
- **CSS 테마 확장성**: `themes.css`의 변수를 사용하여 사용자 선택에 따른 전체 테마 색상 즉시 변경.

## 5. 커밋 규칙
- 한국어로 작성한다.
- `[Status] 내용` 방식으로 작성한다. (예: `[Add]`, `[Fix]`, `[Update]`)
- **커밋 전 반드시 사용자에게 확인을 요청한다.**