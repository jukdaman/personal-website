# JUK's Window-based Portfolio

바닐라(Vanilla) HTML/CSS/JS로 구현된 'OS 창(Window)' 기반의 웹사이트 포트폴리오입니다.

## 🛠 Tech Stack & Architecture
- **HTML5 / CSS3** : 프레임워크 없는 순수 바닐라 환경. 600x800px 규격의 창 UI 및 425px 이하 풀스크린 모바일 대응.
- **JavaScript (Vanilla)** :
  - `WindowManager`: 1차/2차 창을 독립적으로 생성하고 생명주기를 관리하는 팩토리 클래스. 싱글턴 패턴 적용.
  - **고성능 렌더링 최적화**: `requestAnimationFrame`, `transform: translate3d(x, y, 0)`, `pointer-events` 제어를 통한 부드러운 60fps 드래그 & 리사이즈 상호작용.

## 🚀 로컬 실행 방법
이 프로젝트는 순수 HTML/CSS/JS로 구성되어 있으므로 별도의 빌드 과정 없이 `index.html`을 브라우저에서 직접 열거나, VSCode의 **Live Server** 확장 프로그램을 사용하여 테스트할 수 있습니다.

## 🤖 AI Context & State Session
이 프로젝트는 AI 에이전트와 함께 구축 중입니다. 세션이 끊기더라도 컨텍스트를 이어가기 위해 아래 파일들에 상태가 지속적으로 기록됩니다:
- `TODO.md`: 현재 작업 진행도 및 다음 번 작업 목표.
- `.agents/workflows/context.md`: 디자인 시스템 시안 및 프로젝트 코딩 규칙.
AI는 작업 전 위 두 문서를 반드시 참고하여 현재 맥락을 파악합니다.
