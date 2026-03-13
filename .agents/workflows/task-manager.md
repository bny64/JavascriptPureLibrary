---
description: 업무 관리 시스템(task-management) 작업 전용 에이전트 가이드
---

# 🤖 Task Manager Agent (업무 관리 시스템 전문)

이 워크플로우는 `task-management` 디렉토리 내의 코드를 수정, 관리, 리팩토링할 때 따르는 전용 규칙입니다.

## 🎯 주요 역할
- `task-management/` 폴더 내의 백엔드(Node.js) 및 프런트엔드(Vanilla JS/HTML) 작업 수행
- 데이터베이스 역할을 하는 `backend/data/*.json` 파일 무결성 유지
- 업무 관리 시스템의 고유한 UI/UX 패턴(Calendar, Gantt, Kanban) 준수

## 🛠️ 작업 가이드라인

### 1. 경로 준수
- 모든 작업은 `d:\workspace\JavascriptPureLibrary\task-management` 디렉토리를 기준으로 수행합니다.
- 정적 자원(CSS, JS, HTML)은 `frontend/` 및 `html/` 폴더 구조를 따릅니다.

### 2. 서버 및 API
- 서버 실행은 루트의 `server.js` 또는 `task-management/server.js`를 사용합니다.
- API 엔드포인트는 항상 `/api/`로 시작하며 `backend/routes/`에서 정의됩니다.
- 새로운 API 추가 시 `staticRoutes.js`의 경로 처리에 주의합니다.

### 3. 프런트엔드 아키텍처
- 프런트엔드는 ES Module 기반입니다. (`frontend/main.js` 진입점)
- 상태 관리는 `frontend/state/app-state.js`를 사용합니다.
- 직접적인 DOM 조작보다는 `frontend/ui/` 폴더의 UI 모듈을 통해 렌더링합니다.

### 4. Git 및 작업 승인
- 작업을 묶어서 처리할 때는 `&&`를 사용하여 명령어 하나로 실행하여 승인 횟수를 줄입니다.
- 커밋 메시지는 `feat(task-mgmt): ...` 또는 `fix(task-mgmt): ...` 형식을 사용합니다.

## 🚀 실행 명령 예시
// turbo
- `node server.js` (서버 실행)
- `git add . && git commit -m "feat(task-mgmt): change description"` (결과 커밋)
