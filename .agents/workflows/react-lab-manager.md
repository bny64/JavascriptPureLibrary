---
description: React 라이브러리 테스트 랩(react-project) 작업 전용 에이전트 가이드
---

# ⚛️ React Lab Manager Agent (라이브러리 테스트 랩 전문)

이 워크플로우는 `react-project` 디렉토리 내의 코드를 수정하거나 컴포넌트 샘플을 작성할 때 따르는 전용 규칙입니다.

## 🎯 주요 역할
- `react-project/` 내의 다양한 React 컴포넌트 및 라이브러리 샘플 제작 및 통합
- 라이브러리별 카테고리 트리 구조(Library Lab Dashboard) 유지 및 확장
- 번들러 없는 순수 브라우저 환경(HTM 기반 UMD React)의 코드 관리

## 🛠️ 작업 가이드라인

### 1. 프로젝트 범위 및 경로
- 모든 작업은 `d:\workspace\JavascriptPureLibrary\react-project` 디렉토리를 기준으로 수행합니다.
- 리소스는 성격별로 분류된 `frontend/` 하위 폴더에서 관리합니다.
    - 컴포넌트: `frontend/components/`
    - 실습 샘플: `frontend/samples/`
    - 스타일: `frontend/styles/`
    - 라이브러리: `frontend/lib/`
- 로컬 테스트 서버는 `node server.js`를 사용하여 실행합니다. (3002 포트 사용)

### 2. 컴포넌트 및 코드 작성 규칙
- **No JSX / HTM 사용**: 빌드 도구가 없으므로 JSX 대신 `htm` 모듈을 통한 Tagged Template Literals 패턴을 사용합니다.
    - 파일 최상단에서 `import html from '../lib/htmEngine.js';`를 반드시 호출합니다.
    - 리액트 훅 등은 `const { useState, useEffect } = window.React;` 형태로 가져와 사용합니다.
- **클래스명 속성**: HTML/JSX 형태의 문자열 내에서 CSS 클래스를 지정할 때는 DOM 속성 오류 방지를 위해 `class=` 대신 반드시 `className=`을 사용합니다.
- **모듈 내보내기**: 모든 컴포넌트는 `export default function 컴포넌트명() { ... }` 형태의 ES Module로 작성합니다.

### 3. 기술 스택 및 디자인
- **Core**: React 18 (UMD), ReactDOM (UMD), HTM
- **Styling**: `dashboard-layout.css` 및 `style.css`를 적극 활용하며 프리미엄 다크 테마 톤을 유지합니다.

### 4. Git 및 작업 승인 (필수)
- 커밋 메시지는 반드시 **한국어**로 작성합니다 (예: `feat(react-lab): ...`).
- **절대 임의로 즉시 커밋하지 않습니다.** 작업 완료 후 예상 커밋 메시지를 사용자에게 먼저 제안하고, **승인(컨펌) 후** 커밋을 진행합니다.
