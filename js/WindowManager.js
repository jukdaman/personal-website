// WindowManager.js

class WindowManager {
  constructor() {
    this.windows = new Map(); // id -> WindowInstance
    this.windowStates = new Map(); // id -> {x, y, width, height} 저장용
    this.desktopArea = document.getElementById('desktop-area');
    this.template = document.getElementById('window-template');
    this.baseZIndex = 100;
    this.activeZIndex = this.baseZIndex;
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
    this.activeZIndex++;
    winInstance.element.style.zIndex = this.activeZIndex;
  }

  // 창 생성 또는 기존 창 포커스
  openWindow(config) {
    const id = config.id || `win_${Date.now()}`;
    
    // 이미 있는 창이면 닫기 (최소화 토글 역할)
    if (this.windows.has(id)) {
      this.closeWindow(id);
      return null;
    }

    // 새 창 생성
    const win = new WindowInstance(id, config, this);
    this.windows.set(id, win);
    this.desktopArea.appendChild(win.element);
    this.bringToFront(win);
    return win;
  }

  closeWindow(id) {
    if (this.windows.has(id)) {
      const win = this.windows.get(id);
      
      // 닫기 직전의 창 상태 기억
      this.windowStates.set(id, {
        x: win.x,
        y: win.y,
        width: win.width,
        height: win.height
      });

      win.destroy();
      this.windows.delete(id);
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
        // 메뉴 버튼에 연결되지 않은 2차 창 등은 여전히 중앙 기반에 오프셋
        const offset = (this.manager.windows.size * 20) % 100;
        this.x = Math.max(0, (cw - this.width) / 2 + offset);
        this.y += offset; 
      }
    }

    // Interaction State
    this.isDragging = false;
    this.isResizing = false;
    this.resizeDir = '';
    
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    
    this.rafId = null; // requestAnimationFrame ID

    this.createElement();
    this.bindEvents();
    this.updateTransform();
    
    // 초기 렌더링 직후 현재 화면 대비 중앙 X좌표 비율값 기억 (100% 밀림 없는 리사이징 위함)
    this.centerRatioX = (this.x + this.width / 2) / window.innerWidth;
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
    } else {
      this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
      this.element.style.width = `${this.width}px`;
      this.element.style.height = `${this.height}px`;
    }
  }



  bindEvents() {
    const titleBar = this.element.querySelector('.window-titlebar');
    const closeBtn = this.element.querySelector('.close-btn');
    const minimizeBtn = this.element.querySelector('.minimize-btn');

    // 창 포커스 처리
    this.element.addEventListener('mousedown', () => this.manager.bringToFront(this));
    this.element.addEventListener('touchstart', () => this.manager.bringToFront(this), {passive: true});

    // 버튼 동작
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.manager.closeWindow(this.id);
    });
    
    // 현재 최소화 버튼은 아무런 동작도 하지 않거나 닫기로 매핑
    minimizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // 최소화 로직은 추후 필요시 Taskbar와 연동
    });

    const contentArea = this.element.querySelector('.window-content-area');

    // 드래그 (Titlebar 및 빈 화면)
    const startDrag = (e) => {
      // 모바일 모드면 드래그/리사이즈 불허
      if (this.manager.isMobile) return;
      
      const targetTag = e.target.tagName?.toLowerCase();
      // 인터랙티브 요소는 드래그 불허
      if (['button', 'a', 'input', 'textarea', 'select'].includes(targetTag)) return;
      
      // 모바일 기기이거나 터치 이벤트일 경우 빈 영역 드래그로 인해 스크롤이 죽는 현상 방지
      if (e.type === 'touchstart' && e.currentTarget === contentArea) return; 

      if (e.currentTarget === titleBar) {
        e.preventDefault();
      }
      
      this.isDragging = true;
      this.manager.bringToFront(this);
      this.element.classList.add('is-moving'); // iframe/text 이벤트 차단

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      this.lastMouseX = clientX;
      this.lastMouseY = clientY;

      document.addEventListener('mousemove', this.onMouseMoveObj);
      document.addEventListener('mouseup', this.onMouseUpObj);
      document.addEventListener('touchmove', this.onMouseMoveObj, {passive: false});
      document.addEventListener('touchend', this.onMouseUpObj);
    };

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

    // 바인딩을 위한 화살표 함수 참조 보관 (이벤트 해제를 위함)
    this.onMouseMoveObj = this.onMouseMove.bind(this);
    this.onMouseUpObj = this.onMouseUp.bind(this);
    this.dragResizeLoopObj = this.dragResizeLoop.bind(this);
  }

  onMouseMove(e) {
    if (!this.isDragging && !this.isResizing) return;
    // 터치 스크롤 방지
    if(e.cancelable) e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - this.lastMouseX;
    const dy = clientY - this.lastMouseY;

    if (this.isDragging) {
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
    this.rafId = null; // 다음 프레임을 위한 클리어
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
