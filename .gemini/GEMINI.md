# 🤖 Antigravity Coding Assistant 로그

이 파일은 프로젝트 리팩토링 현황과 AI 에이전트의 작업 규칙을 기록합니다.

## 🏗️ 프로젝트 구조

프로젝트는 성격에 따라 두 개의 독립적인 디렉토리로 분리되어 관리됩니다.

### 1. [task-management](file:///d:/workspace/JavascriptPureLibrary/task-management)
*   **용도**: 업무 관리 시스템 (일정, 간트차트, 칸반보드 등)
*   **기술 스택**: Node.js (Backend), Vanilla JS (Frontend)
*   **주요 아키텍처**: 
    - **Service/UI 분리**: `frontend/services/` (데이터 처리)와 `frontend/ui/` (렌더링) 계층 분리
    - **Event-Driven**: `EventBus`를 이용한 모듈 간 통신 및 상태 동기화
*   **실행**: `task-management` 폴더 내에서 `node server.js` (Port: 3000)

### 2. [vue-project](file:///d:/workspace/JavascriptPureLibrary/vue-project)
*   **용도**: Vue.js 라이브러리 테스트 랩 (Vee-Validate, Chart.js 등)
*   **기술 스택**: Vue 3 (ES Module), Vee-Validate, Chart.js
*   **주요 구조**: 
    - **ES Module 기반**: 모든 컴포넌트와 샘플은 `export default` 형식을 사용
    - **모듈화된 샘플**: `frontend/samples/`에서 실습 코드를 독립적으로 관리
*   **실행**: `vue-project` 폴더 내에서 `node server.js` (Port: 3001)

---

## 📜 AI 에이전트 작업 규칙

사용자님과의 원활한 협업을 위해 아래 규칙을 준수합니다.

### 1. Git 커밋 규칙
*   **언어**: 모든 커밋 메시지는 **한국어**로 작성합니다.
*   **형식**: `type(scope): 메시지` (Conventional Commits 패턴)를 기본으로 하되, 명확한 상태 전달을 우선합니다.
*   **확인 절차**: **절대 임의로 커밋하지 않습니다.** 작업을 마친 후 제안된 커밋 메시지를 사용자에게 먼저 알리고, 승인을 받은 후 커밋을 진행합니다.

### 2. 프로젝트 관리
*   **독립성**: 두 프로젝트(`task-management`, `vue-project`)의 자원과 서버를 독립적으로 분리하여 관리합니다.
*   **폐쇄망 대응**: 외부 CDN 호출 없이 `frontend/lib/`에 포함된 로컬 라이브러리만을 사용합니다.
*   **에이전트 가이드**: `.agents/workflows/` 내의 `task-manager.md`와 `vue-lab-manager.md` 가이드를 준수합니다.

---

## 🚀 최근 리팩토링 이력
*   **2026-03-13**: 전체 프로젝트 구조 리팩토링 (루트 파일들을 `task-management/`로 이동)
*   **2026-03-13**: `vue-project`를 ESM 및 카테고리 기반 대시보드 구조로 개편
*   **2026-03-13**: 작업 효율화를 위한 전역 에이전트 가이드 구축
