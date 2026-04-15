// WindowManager.js

class WindowManager {
  constructor() {
    this.windows = new Map(); // id -> WindowInstance
    this.windowStates = new Map(); // id -> {x, y, width, height} 저장용
    this.desktopArea = document.getElementById('desktop-area');
    this.template = document.getElementById('window-template');
    
    // Z-index 통합: 모든 창이 동일한 계층을 공유 (클릭 시 최상단으로 올라오게 됨)
    this.activeZIndex = 100;
    
    this.isMobile = window.innerWidth <= 767;

    this.bindGlobalEvents();
  }

  bindGlobalEvents() {
    let resizeRaf = null;
    window.addEventListener('resize', () => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        this.isMobile = window.innerWidth <= 767;
        this.handleResize();
        resizeRaf = null;
      });
    });
  }

  // 화면 리사이즈 시 데스크탑 모드일 때 창들이 뷰포트 밖으로 나가지 않도록 조정 (범위 이탈 방지)
  handleResize() {
    const cw = window.innerWidth;
    const ch = window.innerHeight;

    if (this.isMobile) return;
    
    this.windows.forEach((win) => {
      if (!win.element) return;
      const rect = win.element.getBoundingClientRect();
      const w = rect.width;
      const h = Math.min(rect.height, ch); // 창이 화면보다 클 경우 안전 장치
      
      // 뷰포트 너비 대비 창이 차지하던 중앙 X축 비율(centerRatioX)을 기준으로 스퀴즈 재배치
      if (win.centerRatioX !== undefined && !win.isDragging && !win.isResizing) {
        win.x = (cw * win.centerRatioX) - (w / 2);
      }
      
      let newX = win.x;
      let newY = win.y;

      // 타이틀바(최소 32px)는 클릭 가능하도록 화면 내에 남아야 함
      const minVisibleSize = 50;

      // X축 경계 확인
      if (newX + w < minVisibleSize) {
        newX = -w + minVisibleSize;
      } else if (newX > cw - minVisibleSize) {
        newX = cw - minVisibleSize;
      }

      // Y축 경계 확인 (타이틀바가 화면 위로 넘어가지 못하게 방지)
      if (newY < 0) {
        newY = 0;
      } else if (newY > ch - 32) {
        newY = ch - 32;
      }

      win.x = newX;
      win.y = newY;
      
      // 만약 이탈 방지로 인해 화면 모서리에 강제 구출되었다면 바뀐 그 위치의 비율값을 새롭게 기억
      if (!win.isDragging && !win.isResizing) {
        win.centerRatioX = (win.x + w / 2) / cw;
      }
      
      // 화면 너비 보정값(delta)이 반영되었거나 이탈 방지 로직이 개입했으므로 무조건 시각 렌더링 업데이트
      win.updateTransform();
    });
  }

  bringToFront(winInstance) {
    // 1. 클릭된 대상을 전체 창 중 제일 위쪽으로 가져옴
    this.activeZIndex++;
    winInstance.element.style.zIndex = this.activeZIndex;

    // 2. 만약 방금 맨 위로 올린 대상이 1차 창이라면?
    // 자신이 낳은 2차 창(자식들)이 자신보다 밑에 깔리면 안 되므로 즉시 바로 위로 함께 끌어올림
    // 단, 2차 창이 최대화(isMaximized) 상태라면 배경 캔버스로 취급하여 위로 올리지 않음
    if (winInstance.id.startsWith('window-primary-')) {
      this.windows.forEach(childWin => {
        if (!childWin.isMinimized && childWin.config.parentId === winInstance.id && !childWin.isMaximized) {
          this.activeZIndex++;
          childWin.element.style.zIndex = this.activeZIndex;
        }
      });
    }

    this.updateDimStates();
  }

  // 현재 전체 계층에서 시각적으로 가려짐이 없는 창(온전히 보이는 창)인지 판별
  isTopWindow(winInstance) {
    if (winInstance.isMinimized || !winInstance.element) return false;

    const targetZ = parseInt(winInstance.element.style.zIndex) || 0;
    const targetRect = winInstance.element.getBoundingClientRect();

    let isObscured = false;

    this.windows.forEach((w) => {
      // 본인이거나 최소화된 창은 비교 제외
      if (w === winInstance || w.isMinimized || !w.element) return;

      const wZ = parseInt(w.element.style.zIndex) || 0;

      // 대상 창보다 z-index가 높은 창(1차, 2차 무관)이 있는 경우에만 겹침 확인
      if (wZ > targetZ) {
        // 부모 창이 "최대화(Maximized) 상태"일 때 한정하여, 자식 창(2차 창)이 부모를 가리는 것을 무시함
        // (작은 부모 창일 때는 자식 팝업이 뜨면 부모가 정상적으로 Dim 처리되어야 하지만 전체 화면일 땐 예외처리하기 위함)
        if (w.config.parentId === winInstance.id && winInstance.isMaximized) {
          return;
        }

        const wRect = w.element.getBoundingClientRect();

        // 가로/세로가 각각 얼마나 겹쳤는지 실제 px 면적을 계산
        const overlapX = Math.max(0, Math.min(targetRect.right, wRect.right) - Math.max(targetRect.left, wRect.left));
        const overlapY = Math.max(0, Math.min(targetRect.bottom, wRect.bottom) - Math.max(targetRect.top, wRect.top));

        // 가로 세로 모두 40px을 초과해서 겹쳐야만 비로소 '가려졌다(Obscured)'고 판정 (여유폭 40px 허용)
        if (overlapX > 40 && overlapY > 40) {
          isObscured = true;
        }
      }
    });

    // 나를 가리는(위에서 겹쳐있는) 창이 하나도 없다면 Top으로 간주
    return !isObscured;
  }

  // 대상 창 위에 다른 창이 단 1px이라도 겹쳐 있는지 확인 (완벽한 독립 상태)
  isFullyUnobscured(winInstance) {
    if (winInstance.isMinimized || !winInstance.element) return false;
    
    const targetRect = winInstance.element.getBoundingClientRect();
    const targetZ = parseInt(winInstance.element.style.zIndex || 0, 10);
    
    let fullyClear = true;
    
    this.windows.forEach(w => {
      if (!fullyClear || w === winInstance || w.isMinimized || !w.element) return;
      
      const wZ = parseInt(w.element.style.zIndex || 0, 10);
      
      if (wZ > targetZ) {
        // 부모 창이 최대화 상태일 때 자식창은 가림 판정에서 제외
        if (w.config.parentId === winInstance.id && winInstance.isMaximized) {
          return;
        }

        const wRect = w.element.getBoundingClientRect();
        
        const overlapX = Math.max(0, Math.min(targetRect.right, wRect.right) - Math.max(targetRect.left, wRect.left));
        const overlapY = Math.max(0, Math.min(targetRect.bottom, wRect.bottom) - Math.max(targetRect.top, wRect.top));
        
        // 1px이라도 겹치면 가려진 것으로 취급
        if (overlapX > 0 && overlapY > 0) {
          fullyClear = false;
        }
      }
    });
    
    return fullyClear;
  }

  // 모든 창을 순회하며 Top이 아닌 창에 is-dimmed 클래스를 부여
  updateDimStates() {
    this.windows.forEach(win => {
      if (win.isMinimized || !win.element) return;
      if (this.isTopWindow(win)) {
        win.element.classList.remove('is-dimmed');
      } else {
        win.element.classList.add('is-dimmed');
      }
    });
  }

  // --- 스마트 배치 로직 (AABB 기반 최적 빈공간 탐색) ---
  calculateOverlapArea(rect1, rectList) {
    let totalOverlap = 0;
    for (const rect2 of rectList) {
      const overlapX = Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
      const overlapY = Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));
      if (overlapX > 0 && overlapY > 0) {
        totalOverlap += (overlapX * overlapY);
      }
    }
    return totalOverlap;
  }

  findSmartPosition(winInstance) {
    const newW = winInstance.width;
    const newH = winInstance.height;

    const cw = window.innerWidth;
    const ch = window.innerHeight;

    // 화면 밖으로 나가지 않는 유효한 시작/종료 좌표 범위
    const maxX = Math.max(0, cw - newW);
    const maxY = Math.max(0, ch - newH - 32); // 타이틀바 높이 등 고려

    // 중앙 스폰 기준점 (중앙을 최우선으로 하기 위함)
    const cx = maxX / 2;
    const cy = Math.max(0, (ch - newH) / 2);

    // 현재 화면에 배치된 창들의 Rect 수집
    const existingRects = [];
    this.windows.forEach(win => {
      if (win.isMinimized || !win.element || !win.element.isConnected) return;
      if (win.id === winInstance.id) return; // 본인 제외

      const isPrimary = win.id.startsWith('window-primary-');

      // 사용자 요구사항: 부모가 아닌 1차 창 컴포넌트의 위치는 의식 안 했으면 좋겠어
      if (isPrimary && win.id !== winInstance.config.parentId) {
        return;
      }

      existingRects.push(win.element.getBoundingClientRect());
    });

    if (existingRects.length === 0) {
      return { x: cx, y: cy };
    }

    const step = 40; // 40px 단위 그리드 탐색 
    let bestPos = { x: cx, y: cy };
    let bestScore = Infinity;

    for (let y = 0; y <= maxY; y += step) {
      for (let x = 0; x <= maxX; x += step) {
        const testRect = {
          left: x,
          top: y,
          right: x + newW,
          bottom: y + newH
        };

        const penalty = this.calculateOverlapArea(testRect, existingRects);

        // 중앙과의 거리 보정 (중앙을 최우선으로 배치하기 위함)
        const dx = x - cx;
        const dy = y - cy;
        const distToCenter = Math.sqrt(dx * dx + dy * dy);

        // 점수: 겹침이 적은 것이 압도적으로 중요(x10000), 그다음 중앙에 가까운 것이 중요
        const score = penalty * 10000 + distToCenter;

        if (score < bestScore) {
          bestScore = score;
          bestPos = { x, y };
        }
      }
    }

    return bestPos;
  }

  // 창 생성 또는 토글 (Nav 버튼용)
  openWindow(config) {
    const id = config.id || `win_${Date.now()}`;
    
    if (this.windows.has(id)) {
      const win = this.windows.get(id);
      
      // 최소화 상태 → 복원
      if (win.isMinimized) {
        this.restoreWindow(id);
        return win;
      }
      
      // 이미 맨 앞에 있는 창 → 최소화
      if (this.isTopWindow(win)) {
        this.minimizeWindow(id);
        return null;
      }
      
      // 뒤에 있는 창 → 앞으로 가져오기
      this.bringToFront(win);
      return win;
    }

    // 새 창 생성
    const win = new WindowInstance(id, config, this);
    this.windows.set(id, win);
    this.desktopArea.appendChild(win.element);
    this.bringToFront(win);
    this.updateNavState(id, true);
    return win;
  }

  // 최소화: DOM 유지, visibility로 숨김 (모든 상태 보존하지만 사용자 옵션 1을 위해 상태 삭제)
  minimizeWindow(id) {
    if (this.windows.has(id)) {
      const win = this.windows.get(id);
      
      // 사용자 UX 최적화: Nav 버튼이 '종료'처럼 작동하길 원하므로 
      // 이전 위치를 기억하는 상태 백업을 파기(건너뜀)하여 항상 초기 상태로 리셋되게 함.
      this.windowStates.delete(id);
      
      win.isMinimized = true;
      win.element.style.visibility = 'hidden';
      win.element.style.pointerEvents = 'none';
      this.updateNavState(id, false);
      this.updateDimStates();
    }
  }

  // 복원: 최소화 해제 (isMaximized 등 기존 상태 그대로 유지하되 위치는 초기화 - 사용자 옵션 1)
  restoreWindow(id) {
    if (this.windows.has(id)) {
      const win = this.windows.get(id);
      win.isMinimized = false;
      win.element.style.visibility = '';
      win.element.style.pointerEvents = '';
      
      // UI상 Nav 버튼이 '종료'처럼 보이므로(✕ 아이콘), 다시 열었을 때 새 창처럼 위치/크기 초기화
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      
      if (win.isMaximized) {
        win.toggleMaximize(); // 최대화 상태였다면 해제
      }
      
      win.width = win.config.width;
      win.height = win.config.height;

      // y는 중앙 우선
      win.y = Math.max(0, (ch - win.height) / 2);

      // x는 Primary 창 여부에 따라 나란히 분할
      if (win.config.alignTotal && win.config.alignTotal > 1) {
        const horizontalMargin = cw * 0.05;
        const maxScrollX = cw - (horizontalMargin * 2) - win.width;
        const ratio = win.config.alignIndex / (win.config.alignTotal - 1);
        
        win.x = Math.max(0, horizontalMargin + maxScrollX * ratio);
        
        const midIndex = (win.config.alignTotal - 1) / 2;
        win.y += (win.config.alignIndex - midIndex) * 20;
      } else {
        const pos = this.findSmartPosition(win);
        win.x = pos.x;
        win.y = pos.y;
      }
      
      win.centerRatioX = (win.x + win.width / 2) / cw;
      win.updateTransform();

      this.bringToFront(win);
      this.updateNavState(id, true);
      this.updateDimStates();
    }
  }

  // 진짜 닫기 (X 버튼 / 타이틀 더블클릭): DOM 파괴, 저장 상태 초기화
  closeWindow(id) {
    if (this.windows.has(id)) {
      const win = this.windows.get(id);
      
      // 저장된 상태 삭제 → 다시 열리면 기본 스폰 위치/크기로 초기화
      this.windowStates.delete(id);

      win.destroy();
      this.windows.delete(id);
      this.updateNavState(id, false);
      this.updateDimStates();

      // 창이 완전히 종료되었음을 알리는 커스텀 이벤트 발생 (아이템 active 해제용)
      window.dispatchEvent(new CustomEvent('windowClosed', { detail: { id } }));
    }
  }

  // Nav 버튼의 활성 상태를 창 열림/닫힘에 동기화
  // id 규칙: "window-primary-about" → data-target="about"
  updateNavState(id, isVisible) {
    const match = id.match(/^window-primary-(.+)$/);
    if (!match) return; // 2차 창 등은 nav 버튼이 없으므로 무시
    const navBtn = document.querySelector(`.nav-btn[data-target="${match[1]}"]`);
    if (navBtn) {
      navBtn.classList.toggle('is-active', isVisible);
    }
  }
}

class WindowInstance {
  constructor(id, config, manager) {
    this.id = id;
    this.manager = manager;
    this.config = Object.assign({
      title: 'Untitled',
      width: 600,
      height: 800,
      contentHTML: '',
    }, config);

    // Initial positioning
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    
    // Check saved state
    const savedState = manager.windowStates.get(id);
    const isSavedValid = savedState 
                      && savedState.width > 310 
                      && savedState.height > 210
                      && savedState.x + savedState.width >= 50  // 화면 밖 좌측 이탈 여부
                      && savedState.x <= cw - 50                // 화면 밖 우측 이탈 여부
                      && savedState.y >= 0                      // 화면 밖 상단 이탈 여부
                      && savedState.y <= ch - 32;               // 화면 밖 하단 이탈 여부

    if (isSavedValid) {
      this.x = savedState.x;
      this.y = savedState.y;
      this.width = savedState.width;
      this.height = savedState.height;
      if (savedState.centerRatioX !== undefined) this.centerRatioX = savedState.centerRatioX;
    } else {
      this.width = this.config.width;
      this.height = this.config.height;

      this.y = Math.max(0, (ch - this.height) / 2);
      
      // X축은 alignTotal에 따라 나란히 분할하여 배치 및 여백 추가
      if (this.config.alignTotal && this.config.alignTotal > 1) {
        const horizontalMargin = cw * 0.05; // 뷰포트 너비의 5% 여백
        const maxScrollX = cw - this.width - (horizontalMargin * 2);
        const ratio = this.config.alignIndex / (this.config.alignTotal - 1);
        
        this.x = Math.max(0, horizontalMargin + maxScrollX * ratio);
        
        // 오른쪽으로 갈수록(인덱스가 클수록) 아래로 조금씩 대각선으로 내려가도록 Y축 조정
        const midIndex = (this.config.alignTotal - 1) / 2;
        this.y += (this.config.alignIndex - midIndex) * 20; 
      } else {
        // 스마트 배치를 이용해 빈 공간 탐색 및 스폰 (2차 창 등)
        const pos = this.manager.findSmartPosition(this);
        this.x = pos.x;
        this.y = pos.y;
      }
    }

    // Interaction State
    this.isDragging = false;
    this.isResizing = false;
    this.isMinimized = false;
    this.resizeDir = '';
    
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    
    this.rafId = null; // requestAnimationFrame ID

    this.createElement();
    this.bindEvents();
    this.updateTransform();
    
    // 초기 렌더링 직후 현재 화면 대비 중앙 X좌표 비율값 기억 (100% 밀림 없는 리사이징 위함)
    if (this.centerRatioX === undefined) {
      this.centerRatioX = (this.x + this.width / 2) / window.innerWidth;
    }
  }

  createElement() {
    const template = this.manager.template.content.cloneNode(true);
    this.element = template.querySelector('.os-window');
    
    // 데이터 채우기
    this.element.querySelector('.window-title').textContent = this.config.title;
    this.element.querySelector('.window-document').innerHTML = this.config.contentHTML;
    
    // 크기 지정
    this.element.style.width = this.width + 'px';
    this.element.style.height = this.height + 'px';
  }

  updateTransform() {
    // translate3d 를 사용하여 H/W 가속 적용, 리플로우 차단
    if (this.manager.isMobile) {
      this.element.style.transform = '';
      this.element.style.width = '100%';
      this.element.style.height = '100%';
    } else if (this.isMaximized) {
      this.element.style.transform = `translate3d(0px, 0px, 0)`;
      this.element.style.width = `100vw`;
      this.element.style.height = `100vh`;
    } else {
      this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
      this.element.style.width = `${this.width}px`;
      this.element.style.height = `${this.height}px`;
    }
  }



  bindEvents() {
    const titleBar = this.element.querySelector('.window-titlebar');
    const closeBtn = this.element.querySelector('.close-btn');
    const maximizeBtn = this.element.querySelector('.maximize-btn');

    // 창 포커스 처리
    this.element.addEventListener('mousedown', () => this.manager.bringToFront(this));
    this.element.addEventListener('touchstart', () => this.manager.bringToFront(this), {passive: true});

    // 버튼 동작
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.manager.closeWindow(this.id);
    });
    
    // 최대화 버튼 동작
    if(maximizeBtn) {
      maximizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMaximize();
      });
    }

    const contentArea = this.element.querySelector('.window-content-area');

    // 바인딩을 위한 화살표 함수 참조 보관 (이벤트 해제를 위함)
    // startDrag 이전에 선언하여 addEventListener 시점에 참조가 유효하도록 보장
    this.onMouseMoveObj = this.onMouseMove.bind(this);
    this.onMouseUpObj = this.onMouseUp.bind(this);
    this.dragResizeLoopObj = this.dragResizeLoop.bind(this);

    // 드래그 (Titlebar 및 빈 화면)
    const startDrag = (e) => {
      // 모바일 모드면 드래그/리사이즈 불허
      if (this.manager.isMobile) return;
      
      const targetTag = e.target.tagName?.toLowerCase();
      // 인터랙티브 요소는 드래그 불허
      if (['button', 'a', 'input', 'textarea', 'select'].includes(targetTag)) return;
      
      // 모바일 기기이거나 터치 이벤트일 경우 빈 영역 드래그로 인해 스크롤이 죽는 현상 방지
      if (e.type === 'touchstart' && e.currentTarget === contentArea) return; 

      // 타이틀바 mousedown 시 즉시 preventDefault()를 하지 않음
      // → 네이티브 dblclick 이벤트가 정상 발화되도록 허용
      // → 실제 드래그(mousemove)가 감지되면 그때 preventDefault 처리
      
      this.isDragging = true;
      this.hasMovedDragging = false; // 드래그가 실제로 일어났는지 추적
      this._dragSourceIsTitleBar = (e.currentTarget === titleBar);
      // is-moving 클래스는 실제 움직임이 감지된 이후에 추가 (onMouseMove에서 처리)
      this.manager.bringToFront(this);

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      this.lastMouseX = clientX;
      this.lastMouseY = clientY;

      document.addEventListener('mousemove', this.onMouseMoveObj);
      document.addEventListener('mouseup', this.onMouseUpObj);
      document.addEventListener('touchmove', this.onMouseMoveObj, {passive: false});
      document.addEventListener('touchend', this.onMouseUpObj);
    };

    // 타이틀 텍스트(좌측) 더블클릭 → 창 닫기 (Windows 스타일)
    const titleText = this.element.querySelector('.window-title');
    titleText.addEventListener('dblclick', (e) => {
      e.stopPropagation(); // 타이틀바의 maximize 토글로 전파 차단
      this.manager.closeWindow(this.id);
    });

    // 타이틀바 나머지 영역 더블클릭 → 최대화/복원 토글
    titleBar.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.toggleMaximize();
    });

    titleBar.addEventListener('mousedown', startDrag);
    titleBar.addEventListener('touchstart', startDrag, {passive: false});

    // 빈 화면(contentArea 패딩)을 잡고 드래그하는 기능 허용
    contentArea.addEventListener('mousedown', (e) => {
      // 오직 투명한 바깥쪽 여백 영역의 클릭일 경우만 드래그. 
      // 문서 내부의 텍스트 선택(드래그) 방해를 막기 위함.
      if (e.target !== contentArea) return;
      
      // 스크롤바 영역을 클릭한 경우 드래그로 인식되지 않도록 방어
      // (contentArea의 실제 그리기 영역(clientWidth) 바깥은 스크롤바임)
      if (e.offsetX > contentArea.clientWidth) return;

      startDrag(e);
    });

    // 리사이즈
    const handles = this.element.querySelectorAll('.resize-handle');
    const startResize = (e) => {
      if (this.manager.isMobile) return; 

      if (this.isMaximized) {
        // 최대화 상태에서 리사이즈 시도 시: 100vw/100vh 시각적 수치를 절대 픽셀로 변환하여 기본 상태(isMaximized 해제)로 복귀
        this.x = 0;
        this.y = 0;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.isMaximized = false;
        this.element.classList.remove('is-maximized');
        const maxBtn = this.element.querySelector('.maximize-btn');
        if (maxBtn) maxBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1"/></svg>'; 
        
        this.updateTransform();
      }
      e.preventDefault();
      this.isResizing = true;
      this.resizeDir = e.target.className.replace('resize-handle ', '');
      this.manager.bringToFront(this);
      this.element.classList.add('is-moving');

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      this.lastMouseX = clientX;
      this.lastMouseY = clientY;

      document.addEventListener('mousemove', this.onMouseMoveObj);
      document.addEventListener('mouseup', this.onMouseUpObj);
      document.addEventListener('touchmove', this.onMouseMoveObj, {passive: false});
      document.addEventListener('touchend', this.onMouseUpObj);
    };

    handles.forEach(h => {
      h.addEventListener('mousedown', startResize);
      h.addEventListener('touchstart', startResize, {passive: false});
    });
  }

  onMouseMove(e) {
    if (!this.isDragging && !this.isResizing) return;
    // 터치 스크롤 방지
    if(e.cancelable) e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - this.lastMouseX;
    const dy = clientY - this.lastMouseY;

    // 이동량 없으면 무시 (단순 클릭 시 오차로 인한 강제 드래그 판정 방지)
    if (dx === 0 && dy === 0) return;

    if (this.isDragging) {
      // 최초로 실제 움직임이 감지된 순간: is-moving 클래스 부여 및 텍스트 선택 차단
      if (!this.hasMovedDragging) {
        this.element.classList.add('is-moving');
      }

      // 처음으로 1px이라도 드래그가 감지된 경우 (최대화 상태라면 복원시킴)
      if (this.isMaximized && !this.hasMovedDragging) {
        this.toggleMaximize(); // 원래 크기로 돌아옴
        
        // 마우스 커서 아래에 창이 오도록 x 위치 보정
        const halfW = this.width / 2;
        this.x = Math.max(0, Math.min(window.innerWidth - this.width, clientX - halfW));
        // y 좌표는 화면 최상단 유지
        this.y = 0;
        
        // 즉시 강제 렌더링 업데이트하여 시각적으로 튀기 전에 맞춤
        this.updateTransform();
      }
      this.hasMovedDragging = true;

      this.x += dx;
      this.y += dy;
    } else if (this.isResizing) {
      const minW = 300;
      const minH = 200;

      // 위치 이동과 크기 변경을 동시 반영해야 하는 경우(nw, n, w 등)
      if (this.resizeDir.includes('e')) {
        this.width = Math.max(minW, this.width + dx);
      }
      if (this.resizeDir.includes('s')) {
        this.height = Math.max(minH, this.height + dy);
      }
      if (this.resizeDir.includes('w')) {
        const newWidth = Math.max(minW, this.width - dx);
        if (newWidth > minW) {
          this.width = newWidth;
          this.x += dx;
        }
      }
      if (this.resizeDir.includes('n')) {
        const newHeight = Math.max(minH, this.height - dy);
        if (newHeight > minH) {
          this.height = newHeight;
          this.y += dy;
        }
      }
    }

    this.lastMouseX = clientX;
    this.lastMouseY = clientY;

    // requestAnimationFrame 을 활용한 렌더링 최적화
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(this.dragResizeLoopObj);
    }
  }

  onMouseUp() {
    this.isDragging = false;
    this.isResizing = false;
    this.element.classList.remove('is-moving');
    
    // 사용자가 마우스를 놓아 위치와 크기가 픽스되는 순간의 X축 중앙 비율값을 백업
    this.centerRatioX = (this.x + this.width / 2) / window.innerWidth;

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    document.removeEventListener('mousemove', this.onMouseMoveObj);
    document.removeEventListener('mouseup', this.onMouseUpObj);
    document.removeEventListener('touchmove', this.onMouseMoveObj);
    document.removeEventListener('touchend', this.onMouseUpObj);
  }

  dragResizeLoop() {
    this.updateTransform();
    this.manager.updateDimStates();
    this.rafId = null; // 다음 프레임을 위한 클리어
  }

  toggleMaximize() {
    if (this.manager.isMobile) return; 
    
    this.manager.bringToFront(this);
    const maxBtn = this.element.querySelector('.maximize-btn');
    
    if (!this.isMaximized) {
      // 현재 상태 백업
      this.preMaximizeState = {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        centerRatioX: this.centerRatioX
      };
      
      // 100vw, 100vh는 updateTransform 에서 전담하므로 x, y, width 데이터 건드리지 않음
      this.isMaximized = true;
      this.element.classList.add('is-maximized');
      if (maxBtn) maxBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10"><rect x="2.5" y="0.5" width="7" height="7" fill="none" stroke="currentColor" stroke-width="1"/><rect x="0.5" y="2.5" width="7" height="7" fill="none" stroke="currentColor" stroke-width="1"/></svg>'; // 복원(Restore) 아이콘으로 변경
    } else {
      // 원래 크기와 위치로 복구
      if (this.preMaximizeState) {
        this.x = this.preMaximizeState.x;
        this.y = this.preMaximizeState.y;
        this.width = this.preMaximizeState.width;
        this.height = this.preMaximizeState.height;
        this.centerRatioX = this.preMaximizeState.centerRatioX;
      }
      this.isMaximized = false;
      this.element.classList.remove('is-maximized');
      if (maxBtn) maxBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1"/></svg>'; // 최대화(Maximize) 아이콘으로 되돌림
    }
    this.updateTransform();
    this.manager.updateDimStates();
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }
}

// 전역 싱글턴 매니저 인스턴스
window.windowManager = new WindowManager();
