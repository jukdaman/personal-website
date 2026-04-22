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

  // 닫기 상태 초기화 헬퍼
  function resetNavCloseState(btn, win) {
    if (btn) btn.classList.remove('will-close', 'will-restore');
    if (win && win.element) win.element.classList.remove('is-closing-preview', 'is-restoring-preview');
  }

  navBtns.forEach((btn, index) => {
    let isPointerDown = false;
    let isClosePrepared = false;

    // 강제 초기화
    resetNavCloseState(btn, null);

    btn.addEventListener('pointerdown', (e) => {
      // 마우스 왼쪽 버튼이나 터치만 허용
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      isPointerDown = true;

      const pageId = btn.getAttribute('data-target');
      const winId = `window-primary-${pageId}`;
      const win = window.windowManager.windows.get(winId);
      
      // 대상 창이 이미 열려있는 상태라면 (배경에 있든 맨 앞에 있든 상관없이)
      if (win && !win.isMinimized) {
        // 대상이 다른 최대화된 창 뒤에 가려져 있는지 확인
        let isCoveredByMaximized = false;
        const winZ = parseInt(win.element.style.zIndex) || 0;
        
        window.windowManager.windows.forEach(otherWin => {
          if (!otherWin.isMinimized && otherWin.isMaximized && otherWin.id !== win.id) {
            const otherZ = parseInt(otherWin.element.style.zIndex) || 0;
            if (otherZ > winZ) {
              isCoveredByMaximized = true; // 나보다 Z인덱스가 높은 웅장한 최대화 창이 존재함
            }
          }
        });

        // 나를 가리는 다른 최대화 창이 없더라도, 내가 최대화상태인데 다른 작은 창 밑에 깔려 있다면 구출이 먼저 진행되어야 함.
        const wasTopWindow = window.windowManager.isTopWindow(win);

        // 일단 무조건 맨 위로 끌어올림
        window.windowManager.bringToFront(win);
        
        if (isCoveredByMaximized) {
          // 어떤 상태의 창이든 다른 웅장한 최대화 창에 가려져 있었다면, 이번 클릭은 '구출(꺼내기)' 목적이므로 닫힘/복원 트리거를 무시
          isClosePrepared = false;
        } else if (win.isMaximized && !wasTopWindow) {
          // 최대화 창이지만 내 위에 다른 일반 창이 포개져 있었다면, 화면 맨 앞으로 끌고 오는 것 자체가 목적이므로 복원을 무시함
          isClosePrepared = false;
        } else if (win.isMaximized) {
          // 창 자신이 최대화 상태이며 아무에게도 가려지지 않은 진짜 최상단이라면 '복원(Restore)' 미리보기 표시
          btn.classList.add('will-restore');
          win.element.classList.add('is-restoring-preview');
          isClosePrepared = 'restore';
        } else {
          // 아무에게도 안 가려진 일반 창이라면 닫기(Close) 대기 상태로 전환
          btn.classList.add('will-close');
          win.element.classList.add('is-closing-preview');
          isClosePrepared = 'close';
        }
      } else {
        // 창이 최소화(닫혀있는) 상태이거나 아직 생성되지 않은 상태라면 동작 예비 방어
        isClosePrepared = false;
      }
    });

    btn.addEventListener('pointerup', (e) => {
      if (!isPointerDown) return;
      isPointerDown = false;

      const pageId = btn.getAttribute('data-target');
      const winId = `window-primary-${pageId}`;
      const win = window.windowManager.windows.get(winId);

      if (isClosePrepared === 'close') {
        // 버튼 위에서 마우스를 뗐을 때 비로소 창이 닫힘(최소화)
        resetNavCloseState(btn, win);
        if (win && !win.isMinimized) window.windowManager.minimizeWindow(winId);
        isClosePrepared = false;
      } else if (isClosePrepared === 'restore') {
        // 버튼 위에서 마우스를 뗐을 때 창 복원
        resetNavCloseState(btn, win);
        if (win && !win.isMinimized && win.isMaximized) win.toggleMaximize();
        isClosePrepared = false;
      } else {
        // 이미 켜져있는 창이 다른 최대화 창 등에 의해 구출된 경우(isClosePrepared === false) 
        // openPrimaryWindow(오픈/토글 내장함수)를 실행하면 다시 꺼져버리는(토글) 문제가 발생하므로,
        // 진짜 닫혀있는 상태일 때만 openPrimaryWindow를 실행하도록 방어막 추가!
        if (!win || win.isMinimized) {
          openPrimaryWindow(pageId, index, navBtns.length);
        }
        resetNavCloseState(btn, win);
      }
    });

    btn.addEventListener('pointerleave', () => {
      if (!isPointerDown) return;
      isPointerDown = false;

      const pageId = btn.getAttribute('data-target');
      const winId = `window-primary-${pageId}`;
      const win = window.windowManager.windows.get(winId);
      
      // 드래그해서 버튼 밖으로 벗어난 경우 닫기 대기 상태 취소 (X 아이콘 사라짐)
      if (isClosePrepared) {
        resetNavCloseState(btn, win);
        isClosePrepared = false;
      }
    });
  });

  // --- CLOSE ALL 버튼 제어 ---
  const closeAllBtn = document.getElementById('close-all-btn');

  // 열려 있는(최소화되지 않은) 창이 1개 이상이면 버튼 표시
  function updateCloseAllVisibility() {
    let hasVisible = false;
    window.windowManager.windows.forEach(win => {
      if (!win.isMinimized) hasVisible = true;
    });
    closeAllBtn.classList.toggle('is-visible', hasVisible);
  }

  closeAllBtn.addEventListener('click', () => {
    // 순간적으로 전환 효과 없이 즉시 숨기기 위한 클래스 부여
    closeAllBtn.classList.add('clicked-hide');
    setTimeout(() => closeAllBtn.classList.remove('clicked-hide'), 50);

    // 1차 창은 최소화(minimize), 2차 창은 완전히 닫기(close)
    const primaryToMinimize = [];
    const secondaryToClose = [];

    window.windowManager.windows.forEach((win, id) => {
      if (!win.isMinimized) {
        if (id.startsWith('window-primary-')) {
          primaryToMinimize.push(id);
        } else {
          secondaryToClose.push(id);
        }
      }
    });

    primaryToMinimize.forEach(id => window.windowManager.minimizeWindow(id));
    secondaryToClose.forEach(id => window.windowManager.closeWindow(id));

    // Nav 버튼의 닫기 상태도 모두 리셋
    navBtns.forEach(btn => {
      const pageId = btn.getAttribute('data-target');
      const winId = `window-primary-${pageId}`;
      const win = window.windowManager.windows.get(winId);
      resetNavCloseState(btn, win);
    });
    updateCloseAllVisibility();
  });

  closeAllBtn.addEventListener('mouseenter', () => {
    // CLOSE ALL에 마우스를 올리면 열려있는 모든 창(1차, 2차)에 X 아이콘 미리보기 표시
    window.windowManager.windows.forEach((win, id) => {
      if (!win.isMinimized) {
        win.element.classList.add('is-closing-preview');
        // 1차 창인 경우 Nav 버튼에도 X 미리보기 적용
        if (id.startsWith('window-primary-')) {
          const match = id.match(/^window-primary-(.+)$/);
          if (match) {
            const navBtn = document.querySelector(`.nav-btn[data-target="${match[1]}"]`);
            if (navBtn) navBtn.classList.add('will-close');
          }
        }
      }
    });
  });

  closeAllBtn.addEventListener('mouseleave', () => {
    // 마우스를 떼면 모든 창의 미리보기 상태 취소
    window.windowManager.windows.forEach((win, id) => {
      win.element.classList.remove('is-closing-preview');
      if (id.startsWith('window-primary-')) {
        const match = id.match(/^window-primary-(.+)$/);
        if (match) {
          const navBtn = document.querySelector(`.nav-btn[data-target="${match[1]}"]`);
          if (navBtn) navBtn.classList.remove('will-close');
        }
      }
    });
  });

  // 전역에서 접근 가능하도록 등록 (WindowManager가 openWindow/minimizeWindow 후 호출)
  window.updateCloseAllVisibility = updateCloseAllVisibility;

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
      
      // 커스텀 스크롤바 연결 (내부 컨텐츠 주입 후 실행)
      if (!win.customScrollbar) {
        win.customScrollbar = new CustomScrollbar(win.element.querySelector('.window-content-area'));
      }
    } else if (win && !win.customScrollbar) {
      // 이미 열려있지만 스크롤바가 없는 경우 대비
      win.customScrollbar = new CustomScrollbar(win.element.querySelector('.window-content-area'));
    }
  }

  // 글로벌 접근 가능하도록 헬퍼 등록 (HTML 내 인라인 이벤트용)
  window.openSecondaryWindow = function(id, title, contentHTML, parentId, isViewer = false) {
    const initWidth = Math.max(300, Math.min(450, window.innerWidth * 0.25));
    const initHeight = Math.max(300, Math.min(500, window.innerHeight * 0.5));

    const win = window.windowManager.openWindow({
      id: `window-secondary-${id}`,
      title: title,
      contentHTML: contentHTML,
      width: initWidth,
      height: initHeight,
      parentId: parentId
    });

    if (isViewer && win) {
      const contentArea = win.element.querySelector('.window-content-area');
      if (contentArea) {
        contentArea.style.padding = '0';
        contentArea.style.overflow = 'hidden'; // 부모의 불필요한 스크롤 차단
        contentArea.style.backgroundColor = '#111';
        contentArea.style.display = 'flex';
        contentArea.classList.add('image-viewer'); // Hover 트리거 및 식별자용
        
        // 다단 구조 단순화: window-document를 제거하고 직접 인젝트
        contentArea.innerHTML = contentHTML;
        
        const viewport = contentArea.querySelector('.image-viewer-viewport');
        if (viewport && !win.customScrollbar) {
          win.customScrollbar = new CustomScrollbar(viewport);
        }
      }
    } else if (win && !win.customScrollbar) {
      win.customScrollbar = new CustomScrollbar(win.element.querySelector('.window-content-area'));
    }
  };

  // 이미지 로드 시 캔버스(Canvas) 기반 평균 색상 추출 및 그림자 색상 적용 (is-loaded 제어 병행)
  window.applyAmbientShadow = function(imgElement) {
    const parent = imgElement.parentElement;
    if (!parent) return;
    
    // 1. 로드 완료 상태로 변경 (1/1 스켈레톤 비율 해제)
    parent.classList.add('is-loaded');

    // 2. 이미 추출 연산을 진행했다면 스킵
    if (parent.dataset.colorExtracted) return;
    parent.dataset.colorExtracted = "true";

    // 3. HTML5 Canvas를 이용한 1x1 초고속 픽셀 평균 색상 추출 기법
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      // 이미지를 1x1 픽셀로 극단적으로 압축 렌더링하면 브라우저가 자동으로 전체 이미지의 평균색을 혼합해 완성함
      ctx.drawImage(imgElement, 0, 0, 1, 1);
      const pixelData = ctx.getImageData(0, 0, 1, 1).data;
      const [r, g, b] = pixelData;

      // 부모 컨테이너 CSS 커스텀 변수(--shadow-color)에 투명도 0.5가 가미된 추출 RGB 주입
      parent.style.setProperty('--shadow-color', `rgba(${r}, ${g}, ${b}, 0.5)`);
    } catch (error) {
      console.warn("Canvas color extraction failed. Falling back to default shadow.", error);
    }
  };

  // 갤러리 아이템 클릭 시 토글 (종료/열기) 및 active 상태 관리
  window.toggleWorkProject = function(btnElement, id, title, imgSrc, caption) {
    const winId = `window-secondary-${id}`;
    
    // 만약 이미 열려 있다면 완전히 종료되게 설정
    if (window.windowManager.windows.has(winId)) {
      window.windowManager.closeWindow(winId);
      // is-active 해제는 아래 windowClosed 이벤트 리스너가 수행함
    } else {
      // 불필요한 .image-viewer 래퍼 삭제 및 다단 구조 단순화
      const contentHTML = `
        <div class="image-viewer-viewport">
          <img src="${imgSrc}" class="image-viewer-img mode-contain" data-scale="1" />
        </div>
        <div class="image-viewer-controls">
          <button class="iv-btn" onclick="window.ivZoom('${winId}', 0.2)" title="Zoom In"><svg width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M11 19c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm1 5h2v2h-2v2h-2v-2H8v-2h2V8h2v2zM21 21l-4.35-4.35"/></svg></button>
          <button class="iv-btn" onclick="window.ivZoom('${winId}', -0.2)" title="Zoom Out"><svg width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M11 19c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm3 7H8v-2h6v2zM21 21l-4.35-4.35"/></svg></button>
          <button class="iv-btn" onclick="window.ivSetZoom('${winId}', 1)" title="100%">1:1</button>
          <button class="iv-btn is-active iv-fill-btn" onclick="window.ivFill('${winId}')" title="Fit to Window"><svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M20 4H4v16h16V4zm-2 14H6V6h12v12z"/></svg></button>
        </div>
        <div class="image-viewer-footer">
          <div class="img-desc-content">
            <h4 class="desc-title">${title}</h4>
            <p class="desc-caption">${caption}</p>
          </div>
        </div>
      `;
      // 없다면 열기 (WORK 창에서 열리는 것이므로 부모 명시, 뷰어 모드 true)
      window.openSecondaryWindow(id, title, contentHTML, 'window-primary-work', true);
      btnElement.classList.add('is-active');
      btnElement.setAttribute('data-win-id', winId); // 이벤트 리스너에서 쉽게 찾기 위해 ID 보관
    }
  };

  // --- 3. 이미지 뷰어(2차 창) 줌 제어 로직 ---
  window.ivZoom = function(winId, delta) {
    const win = window.windowManager.windows.get(winId);
    if (!win) return;
    const img = win.element.querySelector('.image-viewer-img');
    const fillBtn = win.element.querySelector('.iv-fill-btn');
    if (!img) return;

    img.classList.remove('mode-contain');
    if (fillBtn) fillBtn.classList.remove('is-active');

    let currentScale = parseFloat(img.dataset.scale) || 1;
    currentScale = Math.max(0.1, currentScale + delta);
    img.dataset.scale = currentScale;

    if (!img.dataset.natW) {
      img.dataset.natW = img.naturalWidth || img.clientWidth;
      img.dataset.natH = img.naturalHeight || img.clientHeight;
    }

    img.style.width = (img.dataset.natW * currentScale) + 'px';
    img.style.height = (img.dataset.natH * currentScale) + 'px';
  };

  window.ivSetZoom = function(winId, scale) {
    const win = window.windowManager.windows.get(winId);
    if (!win) return;
    const img = win.element.querySelector('.image-viewer-img');
    const fillBtn = win.element.querySelector('.iv-fill-btn');
    if (!img) return;

    img.classList.remove('mode-contain');
    if (fillBtn) fillBtn.classList.remove('is-active');

    img.dataset.scale = scale;
    if (!img.dataset.natW) {
      img.dataset.natW = img.naturalWidth || img.clientWidth;
      img.dataset.natH = img.naturalHeight || img.clientHeight;
    }

    img.style.width = (img.dataset.natW * scale) + 'px';
    img.style.height = (img.dataset.natH * scale) + 'px';
  };

  window.ivFill = function(winId) {
    const win = window.windowManager.windows.get(winId);
    if (!win) return;
    const img = win.element.querySelector('.image-viewer-img');
    const fillBtn = win.element.querySelector('.iv-fill-btn');
    if (!img) return;

    img.classList.add('mode-contain');
    if (fillBtn) fillBtn.classList.add('is-active');
    
    img.style.width = '';
    img.style.height = '';
    img.dataset.scale = 1;
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
