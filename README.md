# 🤖 JIT Context Router (For AI Agents)

> [!CAUTION]
> **AI AGENT MUST READ THIS FIRST:**
> 이 프로젝트는 극단적인 렌더링 최적화(Vanilla 60fps)와 복잡한 Window 생명주기를 가진 OS 형태의 포트폴리오입니다.
> 코드를 임의로 수정하기 전, 아래 목차를 참고하여 **현재 작업에 해당하는 문서를 먼저 읽고(View File)** 컨텍스트를 파악하십시오.

- 🛠 **기술 스택, 아키텍처 및 렌더링 최적화 방침을 파악할 때:**
  👉 `.agents/memory-bank/techContext.md` 읽기
- 🎨 **창(Window) 패턴, 모바일 대응, 상호작용 규칙(UI/UX)을 수정할 때:**
  👉 `.agents/memory-bank/systemPatterns.md` 읽기
- 📝 **현재 진행 중인 작업 내역과 앞으로 해야 할 일(당면 과제)을 파악할 때:**
  👉 `.agents/memory-bank/activeContext.md` 읽기
- 🗄 **과거 리팩토링 및 튜닝 내역을 참고할 때:**
  👉 `.agents/memory-bank/optimizationLog.md` 읽기

---

# JUK's Window-based Portfolio (For Humans)

바닐라(Vanilla) HTML/CSS/JS로 구현된 'OS 창(Window)' 기반의 웹사이트 포트폴리오입니다.

## 🛠 Tech Stack
- **HTML5 / CSS3** : 프레임워크 없는 순수 바닐라 환경. 600x800px 규격의 창 UI 및 425px 이하 풀스크린 모바일 대응.
- **JavaScript (Vanilla)** : WindowManager 객체 기반의 싱글턴 OS 환경 및 60fps 하드웨어 가속 최적화 적용.

## 🚀 로컬 실행 방법
이 프로젝트는 순수 HTML/CSS/JS로 구성되어 있으므로 별도의 빌드 과정 없이 `index.html`을 브라우저에서 직접 열거나, VSCode의 **Live Server** 확장 프로그램을 사용하여 테스트할 수 있습니다.
