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
  
  // Nav 버튼의 호버 및 CSS 애니메이션 지연시간 정의 (논리적 유예시간 계산용)
  const HOVER_DELAY = 700;
  const ANIM_DELAY = 300;

  // will-close 표시 갱신: 모든 상황에서 0.7초 호버 시 시각적 효과 표시, 애니메이션 완료 후 논리적 닫기 허용
  function updateNavCloseIndicator(btn) {
    if (!btn.matches(':hover') || !btn.classList.contains('is-active')) {
      resetNavCloseState(btn); // 창 인자는 나중에 구하므로 일단 btn만
      return;
    }
    
    const pageId = btn.getAttribute('data-target');
    const winId = `window-primary-${pageId}`;
    const win = window.windowManager.windows.get(winId);

    if (win && !win.isMinimized && window.windowManager.isTopWindow(win)) {
      if (btn.dataset.hovering === "true") return; // 이미 카운트다운 진행 중이면 무시
      btn.dataset.hovering = "true";

      btn.hoverTimeout = setTimeout(() => {
        if (!btn.matches(':hover')) return; // 호버가 풀렸다면 취소
        
        // 시각적 미리보기 등장
        btn.classList.add('will-close');
        win.element.classList.add('is-closing-preview');

        // CSS 등장 애니메이션이 완전히 끝난 시점에 논리적 닫기 권한 부여
        btn.animTimeout = setTimeout(() => {
          if (btn.matches(':hover')) {
            btn.dataset.canClose = "true";
          }
        }, ANIM_DELAY);

      }, HOVER_DELAY);

    } else {
      resetNavCloseState(btn, win);
    }
  }

  function resetNavCloseState(btn, win) {
    clearTimeout(btn.hoverTimeout);
    clearTimeout(btn.animTimeout);
    btn.dataset.hovering = "false";
    btn.dataset.canClose = "false";
    btn.classList.remove('will-close');
    if (win && win.element) win.element.classList.remove('is-closing-preview');
  }

  navBtns.forEach((btn, index) => {
    btn.dataset.canClose = "false";
    
    btn.addEventListener('click', () => {
      const pageId = btn.getAttribute('data-target');
      const winId = `window-primary-${pageId}`;
      const win = window.windowManager.windows.get(winId);
      
      // 대상이 맨 앞에 있는 창일 때, 아직 시각적 애니메이션이 완성되지 않았다면 클릭(최소화) 무시
      if (win && !win.isMinimized && window.windowManager.isTopWindow(win)) {
        if (btn.dataset.canClose !== "true") {
          // 현재 창 위에 1px이라도 겹치는 창이 있는지 확인 (완벽한 독립 단독 화면 상태인가?)
          const isUnobscured = window.windowManager.isFullyUnobscured(win);

          // 비록 닫지는 않지만, 선택(클릭)했으므로 z-index는 맨 위(최상단)로 확실하게 끌어올려줌
          window.windowManager.bringToFront(win);
          
          // 조금이라도 가려진 상태에서 조작(클릭)했다면, 이 클릭의 1차적인 의도는 "포커스(Z-index 갱신)"임.
          // 따라서 패스트포워드를 발동하지 않고, 포커스된 시점을 기준으로 유예시간(700ms)이 처음부터 다시 주어지도록 타이머를 리셋함.
          if (!isUnobscured) {
            resetNavCloseState(btn, win);
            updateNavCloseIndicator(btn);
            return;
          }

          // --- 패스트포워드(즉시 종료 대기 상태 전환) 로직 ---
          // 이미 완벽한 최상단(Focus) 상태인데 유예 시간을 기다리지 않고 또 클릭했다면 명확한 닫기 의도로 간주함
          // 타이머를 파기하고 즉시 '닫기 UI'와 '닫기 권한'을 강제 부여함
          clearTimeout(btn.hoverTimeout);
          clearTimeout(btn.animTimeout);
          btn.classList.add('will-close');
          win.element.classList.add('is-closing-preview');
          btn.dataset.canClose = "true";
          
          return;
        }
      }

      openPrimaryWindow(pageId, index, navBtns.length);
      // 클릭 후 상태가 바뀌었으므로 즉시 재평가
      resetNavCloseState(btn, win);
      updateNavCloseIndicator(btn);
    });

    btn.addEventListener('mouseenter', () => updateNavCloseIndicator(btn));
    
    btn.addEventListener('mouseleave', () => {
      const pageId = btn.getAttribute('data-target');
      const winId = `window-primary-${pageId}`;
      const win = window.windowManager.windows.get(winId);
      resetNavCloseState(btn, win);
    });
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
