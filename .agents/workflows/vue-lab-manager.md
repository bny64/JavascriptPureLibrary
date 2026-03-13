---
description: Vue 라이브러리 테스트 랩(vue-project) 작업 전용 에이전트 가이드
---

# 🧪 Vue Lab Manager Agent (라이브러리 테스트 랩 전문)

이 워크플로우는 `vue-project` 디렉토리 내의 라이브러리 테스트 샘플 및 대시보드를 관리할 때 따르는 전역 규칙입니다.

## 🎯 주요 역할
- `vue-project/` 내의 다양한 라이브러리(Vee-Validate, Chart.js 등) 샘플 제작 및 통합
- 라이브러리별 카테고리 트리 구조(Library Lab Dashboard) 유지 및 확장
- 폐쇄망 환경을 고려한 로컬 라이브러리(`lib/`) 관리

## 🛠️ 작업 가이드라인

### 1. 프로젝트 범위 및 경로
- 모든 작업은 `d:\workspace\JavascriptPureLibrary\vue-project` 디렉토리를 기준으로 수행합니다.
- 리소스는 성격별로 분류된 `frontend/` 하위 폴더에서 관리합니다.
    - 코어 자원: `frontend/core/` (components, utils, composables 등)
    - 도메인 모듈: `frontend/modules/` (기능 단위별 components, samples 관리)
    - 레이아웃: `frontend/layouts/`
    - 스타일: `frontend/styles/`
    - 라이브러리: `frontend/lib/`
- 신규 샘플 추가 시 관련 기능에 맞는 `modules/[도메인]/samples/` 경로에 배치하여 도메인 응집도를 높입니다.
- 로컬 테스트 서버는 `node server.js`를 사용하여 실행합니다. (3001 포트 사용)

### 2. 샘플 구성 규칙
- 각 실습 코드는 해당 도메인의 `samples/` 디렉토리에 독립적인 JS 파일로 생성하며, 반드시 `export default` 형식을 사용합니다.
- `index.html`의 `<script type="module">` 영역에서 `import` 문으로 컴포넌트를 가져와 등록합니다.
- 사이드바 카테고리 명칭은 실제 라이브러리 이름(예: Vee-Validate, Highcharts)을 사용합니다.

### 3. 기술 스택 및 디자인
- **Core**: Vue 3 (Global Build), Vee-Validate, Chart.js 등.
- **Styling**: `dashboard-layout.css`(레이아웃) 및 `style.css`(UI 요소)를 활용하십시오.
- **UI/UX**: 다크 테마 기반의 프리미엄 대시보드 디자인 톤을 유지합니다.

### 4. Git 및 작업 승인 (한국어 준수)
- 커밋 메시지는 반드시 **한국어**로 작성하며 `Conventional Commits` 타입을 접두어로 사용합니다.
    - 예: `feat(vue-lab): Highcharts 연동 샘플 추가`
- 작업을 묶어서 처리할 때는 `&&`를 사용하여 명령어 하나로 실행하여 승인 과정을 단축합니다.

## 🚀 실행 명령 예시
// turbo
- `git add . && git commit -m "feat(vue-lab): 새로운 검증 시나리오 추가"` (결과 커밋)
