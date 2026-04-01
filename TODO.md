# JUK Portfolio OS - TODO & State

이 파일은 AI와의 세션이 종료된 후에도 작업 현황을 보존하여 다음 세션에서 끊김 없이 작업을 이어가기 위해 작성되었습니다.

## ✅ Completed (현재까지 완료된 사항)
- **Architecture**: 순수 HTML/CSS/JS (Vanilla) 기반 프로젝트 셋업.
- **Window System**: WindowManager 객체를 통한 OS 창(Window) UI 뼈대 구현.
  - 드래그 및 8방향 리사이징.
  - `requestAnimationFrame`, `translate3d`, `will-change`를 활용한 60fps 최적화 및 리사이즈 병목 완화.
  - 뷰포트 절대 비율(`centerRatioX`) 기반의 브라우저 리사이징 연동 (Drifting/밀림 버그 완벽 수정).
  - 뷰포트 크기에 비례하는 동적 초기 창 크기 할당 (최대 최소 bounds 적용).
  - 내부 콘텐츠 높이에 맞춰 유동적으로 늘어나는(`padding-bottom: 40px` hug) 문서 레이아웃 최적화.
  - 텍스트 드래그(선택) 영역과 빈 배경 드래그(창 이동) 영역의 분리 처리.
  - 열려 있는 창 간의 z-index 포커싱 제어 및 오버랩(화면 밖 이탈) 방지 방어 코드.
  - X축 메뉴 위치 기반 다중 오픈 정렬 및 Y축 대각선 등장 로직.
  - 창 닫기 시 크기/위치 상태 기억 및 복원 (지나치게 작아진 경우 초기화 예외 처리 방어 포함).
- **Mobile Responsive**: 767px 이하 레이아웃 시 데스크탑 창들을 화면에 꽉 차는 모바일 뷰 패널로 전환.
- **Loading UI**: 초기 접속 시 오버레이 스피너 렌더링.

## 🔜 Next Steps (다음 세션에서 해야 할 일)
- [ ] **배경 애니메이션 적용**: `js/background.js`에 캔버스를 활용한 인터랙티브 백그라운드 적용 (사용자 제공 시안 기반).
- [ ] **1차 창 콘텐츠 채우기**: ABOUT, WORK, CAREERS, CONTACT 메뉴의 실제 콘텐츠 HTML 및 CSS 디자인 적용.
- [ ] **2차 창 연결 및 데이터 바인딩**: WORK 내 포트폴리오 아이템 클릭 시 나타나는 2차 팝업 창 연동.
- [ ] **인트로 시퀀스(Optional)**: 디자인 확정 시 초기 로딩 후 나타나는 커스텀 인트로 연출 작업.

## 📌 Note for AI
AI 에이전트는 다음 세션 시작 시 이 `TODO.md` 파일과 `.agents/workflows/context.md` 문서를 우선적으로 읽고 컨텍스트를 파악한 뒤 작업을 이어가야 합니다.
