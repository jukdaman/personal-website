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
  
  navBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      const pageId = btn.getAttribute('data-target');
      openPrimaryWindow(pageId, index, navBtns.length);
    });
  });

  // --- 3. 1차/2차 창 생성 로직 헬퍼 ---
  const pageContents = {
    'about': '<h1>About JUK</h1><p>Welcome to my portfolio OS.</p>',
    'work': `
        <h1>My Work</h1>
        <p>Click below to open a 2nd level window.</p>
        <button onclick="openSecondaryWindow('work-detail', 'Work Detail', '<p>This is a decoupled 2nd-level window!</p>')">Open Detail</button>
      `,
    'careers': '<h1>Careers</h1><p>My resume goes here.</p>',
    'contact': '<h1>Contact</h1><p>Get in touch!</p>',
  };

  function openPrimaryWindow(pageId, index, totalBtnCount) {
    const title = pageId.toUpperCase();
    const content = pageContents[pageId] || 'Not Found';
    
    // 뷰포트에 비례한 초기 너비/높이 계산
    const initWidth = Math.max(320, Math.min(600, window.innerWidth * 0.35)); // 화면의 35%, 최소 320, 최대 600
    const initHeight = Math.max(400, Math.min(800, window.innerHeight * 0.75)); // 화면의 75%, 최소 400, 최대 800
    
    // WindowManager 싱글턴 인스턴스 활용
    window.windowManager.openWindow({
      id: `window-primary-${pageId}`,
      title: title,
      contentHTML: content,
      alignIndex: index,
      alignTotal: totalBtnCount,
      width: initWidth,
      height: initHeight
    });
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
});
