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
  - 타이틀바 더블클릭 및 상단 버튼을 통한 전체 화면 최대화/복원(Maximize/Restore) 토글 기능 구현.
  - 최대화 상태에서는 사이즈(width/height)를 JS 픽셀이 아닌 CSS `100vw`/`100vh`로 전환하여 브라우저 리사이징에 완벽 대응.
  - 최대화 상태에서 타이틀바를 드래그(1px 이상 이동 감지)하면, 즉시 최대화가 해제되며 마우스 커서 위치 기준으로 자연스럽게 복원(Breakout)되는 UX 적용.
  - 최대화 상태에서 상단 가장자리 리사이즈 핸들을 잡고 드래그하면, 즉시 화면 크기만한 일반 상태(isMaximized 해제)로 강제 복귀한 후 부드럽게 창 크기 축소 연동.
  - 1:1 비율의 인라인 SVG를 활용한 창 제어 아이콘 및 Windows 스타일의 타이틀 텍스트 영역 더블클릭 닫기 구현.
  - 하단 Nav 메뉴 연동: 클릭 시 상태에 따라 새 창 생성 / 호치 / 최소화(visibility 기반 상태 보존) 기능 추가.
  - 창 상태(Status) 직관성 개선: 열린 창 Nav 반투명 표시, 최상단 활성 창 Nav 호버 시 Layout Shift 없는 CSS 가상 요소(`::after`) 즉각 반응 `✕` 닫기 표시.
  - 완전 종료(X버튼) 시 메모리/위치 데이터 초기화 vs. 최소화 시 정보 보존의 이원화 생명주기(Lifecycle) 로직 구축.
- **Mobile Responsive**: 767px 이하 레이아웃 시 데스크탑 창들을 화면에 꽉 차는 모바일 뷰 패널로 전환.
- **Loading UI**: 초기 접속 시 오버레이 스피너 렌더링.

## ✅ Completed (창 콘텐츠 시스템 & WORK 갤러리 확장)
- **Content Loading System**: `fetch` 기반 HTML 프래그먼트 지연 로딩 및 캐싱 로직 (`ContentLoader.js`) 도입.
- **창 독립적 반응형 (Container Queries)**: 뷰포트가 아닌 각각의 창 너비에 개별적으로 반응하여 레이아웃이 변환되는 CSS 아키텍처.
- **WORK 갤러리 구현**: Pinterest 형태의 Masonry 그리드를 순수 CSS(`column-count`)로 구현 (1열~최대 6열 자동 팽창).
  - 이미지 로딩 전후 높이 붕괴(Layout Shift)를 막기 위해 CSS `aspect-ratio` 및 `onload` 트리거를 결합한 스켈레톤 디자인.
  - Canvas를 통해 이미지 평균 색상을 추출하여 동적 앰비언트 그림자(Ambient Shadow)로 적용 (0.3s 부드러운 스폰, 0s 즉각 해제 등 트랜지션 최적화 완료).
- **고도화된 Window UX 및 Z-Index 통합 제어**:
  - `1차 창`과 `2차 창`의 계층 서열을 통합하고, 클릭한 대상(부모-자식 연동)이 최상위(Focus)로 끌어올려지도록 구조 재설계.
  - 하단 Nav의 창 조작 오작동 방지: 0.7초 Hover 시에만 닫기 권한 및 'X' 딤(Dim) 애니메이션 부여. 
  - 단, 화면 상에서 완전히 독립된(겹치지 않은) 창을 조작할 때는 딜레이 없이 100% 즉시 동작(Fast-Forward)하도록 유예 우회 로직 적용.
- **Smart Window Placement**: 창 새롭게 등장 시 화면을 40px 단위로 스캔하여 기존 창과 가장 적게 겹치고 중앙에 가까운 빈 공간(AABB)을 스스로 찾아 스폰하는 스마트 배치 알고리즘 추가.
- **State Synchronization**: 2차 창 단독 종료 시 연동된 갤러리 썸네일의 'is-active(활성 딤)' 상태가 즉각 해제되도록 `windowClosed` 커스텀 이벤트 파이프라인 연결.

## 🔜 Next Steps (다음 세션에서 해야 할 일)
- [ ] **배경 애니메이션 적용**: `js/background.js`에 캔버스를 활용한 인터랙티브 백그라운드 적용 (사용자 제공 시안 기반).
- [ ] **나머지 1차 창 디자인 마무리**: ABOUT, CAREERS, CONTACT 내부 텍스트 밀도와 디자인 다듬기.
- [ ] **2차 창 상세 컴포넌트 채우기**: WORK 썸네일 클릭 시 나타나는 2차 상세 창의 레이아웃/데이터 연동 작업 마무리.
- [ ] **인트로 시퀀스(Optional)**: 디자인 확정 시 초기 로딩 후 나타나는 커스텀 인트로 연출 작업.

## 📌 Note for AI
AI 에이전트는 다음 세션 시작 시 이 `TODO.md` 파일과 `.agents/workflows/context.md` 문서를 우선적으로 읽고 컨텍스트를 파악한 뒤 작업을 이어가야 합니다.
