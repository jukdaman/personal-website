// main.js

document.addEventListener('DOMContentLoaded', () => {
  // --- 1. 로딩 오버레이 제어 ---
  const spinnerContainer = document.getElementById('loading-overlay');
  
  // 모든 에셋 로드 후 또는 일정 시간 경과 후 스피너 제거
  window.addEventListener('load', () => {
    hideSpinner();
  });

  // 보험용 1.5초 후 강제 종료
  setTimeout(() => {
    hideSpinner();
  }, 1500);

  function hideSpinner() {
    if (spinnerContainer && !spinnerContainer.classList.contains('fade-out')) {
      spinnerContainer.classList.add('fade-out');
      // 트랜지션 완료 후 display: none (포인터 이벤트 차단은 CSS에서 이미 됨)
      setTimeout(() => {
        spinnerContainer.style.display = 'none';
      }, 500);
    }
  }

  // --- 2. 하단 네비게이션 제어 ---
  const navBtns = document.querySelectorAll('.nav-btn');
  
  // will-close 표시 갱신: hover 중이고 is-active이며 맨 앞 창인 경우에만 ✕ 표시
  function updateNavCloseIndicator(btn) {
    if (!btn.matches(':hover') || !btn.classList.contains('is-active')) {
      btn.classList.remove('will-close');
      return;
    }
    const pageId = btn.getAttribute('data-target');
    const winId = `window-primary-${pageId}`;
    const win = window.windowManager.windows.get(winId);
    if (win && !win.isMinimized && window.windowManager.isTopWindow(win)) {
      btn.classList.add('will-close');
    } else {
      btn.classList.remove('will-close');
    }
  }

  navBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      const pageId = btn.getAttribute('data-target');
      openPrimaryWindow(pageId, index, navBtns.length);
      // 클릭 후 상태가 바뀌었으므로 즉시 재평가
      updateNavCloseIndicator(btn);
    });

    btn.addEventListener('mouseenter', () => updateNavCloseIndicator(btn));
    btn.addEventListener('mouseleave', () => btn.classList.remove('will-close'));
  });

  async function openPrimaryWindow(pageId, index, totalBtnCount) {
    const title = pageId.toUpperCase();
    
    // 뷰포트에 비례한 초기 너비/높이 계산
    const initWidth = Math.max(320, Math.min(600, window.innerWidth * 0.35)); // 화면의 35%, 최소 320, 최대 600
    const initHeight = Math.max(400, Math.min(800, window.innerHeight * 0.75)); // 화면의 75%, 최소 400, 최대 800
    
    const winId = `window-primary-${pageId}`;
    const isNew = !window.windowManager.windows.has(winId);

    // WindowManager 싱글턴 인스턴스 활용
    const win = window.windowManager.openWindow({
      id: winId,
      title: title,
      contentHTML: '<div class="loader-placeholder">Loading...</div>', // 초기 로딩용 스켈레톤
      alignIndex: index,
      alignTotal: totalBtnCount,
      width: initWidth,
      height: initHeight
    });

    // 창이 새로 생성된 것이라면 서버에서 HTML을 비동기로 불러와 주입
    if (win && isNew) {
      const contentHTML = await window.contentLoader.load(pageId);
      const doc = win.element.querySelector('.window-document');
      if (doc) {
        doc.innerHTML = contentHTML;
      }
    }
  }

  // 글로벌 접근 가능하도록 헬퍼 등록 (HTML 내 인라인 이벤트용)
  window.openSecondaryWindow = function(id, title, contentHTML) {
    const initWidth = Math.max(300, Math.min(450, window.innerWidth * 0.25));
    const initHeight = Math.max(300, Math.min(500, window.innerHeight * 0.5));

    window.windowManager.openWindow({
      id: `window-secondary-${id}`,
      title: title,
      contentHTML: contentHTML,
      width: initWidth,
      height: initHeight
    });
  };

  // 갤러리 아이템 클릭 시 토글 (종료/열기) 및 active 상태 관리
  window.toggleWorkProject = function(btnElement, id, title, contentHTML) {
    const winId = `window-secondary-${id}`;
    
    // 만약 이미 열려 있다면 완전히 종료되게 설정
    if (window.windowManager.windows.has(winId)) {
      window.windowManager.closeWindow(winId);
      // is-active 해제는 아래 windowClosed 이벤트 리스너가 수행함
    } else {
      // 없다면 열기
      window.openSecondaryWindow(id, title, contentHTML);
      btnElement.classList.add('is-active');
      btnElement.setAttribute('data-win-id', winId); // 이벤트 리스너에서 쉽게 찾기 위해 ID 보관
    }
  };

  // 다른 경로(타이틀바 X 버튼, 제목 영역 더블클릭 등)로 2차 창이 독립적으로 닫혔을 때 
  // 포트폴리오 아이템의 is-active 시각적 상태도 함께 해제되도록 동기화
  window.addEventListener('windowClosed', (e) => {
    const closedId = e.detail.id;
    // DOM 내에서 해당 창 ID를 가지고 있는 masonry-item 탐색하여 활성 상태 해제
    const activeItems = document.querySelectorAll(`.masonry-item[data-win-id="${closedId}"]`);
    activeItems.forEach(item => item.classList.remove('is-active'));
  });
});
