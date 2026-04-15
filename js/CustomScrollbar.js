class CustomScrollbar {
  constructor(container) {
    this.container = container;
    this.wrapper = container.parentElement;
    
    this.container.classList.add('no-native-scrollbar');
    
    // Y Axis Setup
    this.trackY = document.createElement('div');
    this.trackY.className = 'custom-scrollbar-track track-y';
    this.thumbY = document.createElement('div');
    this.thumbY.className = 'custom-scrollbar-thumb thumb-y';
    this.trackY.appendChild(this.thumbY);
    this.wrapper.appendChild(this.trackY);
    
    // X Axis Setup
    this.trackX = document.createElement('div');
    this.trackX.className = 'custom-scrollbar-track track-x';
    this.thumbX = document.createElement('div');
    this.thumbX.className = 'custom-scrollbar-thumb thumb-x';
    this.trackX.appendChild(this.thumbX);
    this.wrapper.appendChild(this.trackX);
    
    // State
    this.isDraggingY = false;
    this.isDraggingX = false;
    this.startY = 0;
    this.startX = 0;
    this.startScrollTop = 0;
    this.startScrollLeft = 0;
    this.thumbHeight = 0;
    this.thumbWidth = 0;
    this.ticking = false;
    
    // Method Binding
    this.onScroll = this.onScroll.bind(this);
    this.onDragStartY = this.onDragStartY.bind(this);
    this.onDragStartX = this.onDragStartX.bind(this);
    this.onDragMove = this.onDragMove.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.update = this.update.bind(this);
    
    // Resize Obs
    this.observer = new ResizeObserver(() => this.update());
    this.observer.observe(this.container);
    if (this.container.firstElementChild) {
       this.observer.observe(this.container.firstElementChild);
    }
    
    // Events
    this.container.addEventListener('scroll', this.onScroll, { passive: true });
    this.thumbY.addEventListener('mousedown', this.onDragStartY);
    this.thumbX.addEventListener('mousedown', this.onDragStartX);
    
    // 휠 이벤트 포워딩: 트랙/썸은 스크롤 컨테이너의 형제(sibling)이므로
    // 휠 이벤트가 DOM 버블링으로 컨테이너에 도달하지 못함.
    // 트랙 위에서 발생한 휠을 수동으로 컨테이너의 scrollTop/Left에 반영해줘야 함.
    this.onTrackWheel = (e) => {
      e.preventDefault();
      this.container.scrollTop += e.deltaY;
      this.container.scrollLeft += e.deltaX;
    };
    this.trackY.addEventListener('wheel', this.onTrackWheel, { passive: false });
    this.trackX.addEventListener('wheel', this.onTrackWheel, { passive: false });
    
    setTimeout(() => this.update(), 0);
  }
  
  update() {
    if (this.container.offsetTop !== undefined) {
      this.trackY.style.top = `${this.container.offsetTop}px`;
      // X track left is bounded by content area width implicitly if we don't offset
      this.trackX.style.left = '0px';
    }
    
    const { clientHeight, scrollHeight, clientWidth, scrollWidth } = this.container;
    
    const showY = scrollHeight > clientHeight && clientHeight > 0;
    const showX = scrollWidth > clientWidth && clientWidth > 0;
    
    // Prevent overlap in the corner if both are showing
    this.trackY.style.bottom = (showY && showX) ? '12px' : '0px';
    this.trackX.style.right = (showY && showX) ? '12px' : '0px';
    
    // Y Update
    if (!showY) {
      this.trackY.style.opacity = '0';
      this.trackY.style.pointerEvents = 'none';
      this.thumbHeight = 0;
    } else {
      this.trackY.style.opacity = '1';
      this.trackY.style.pointerEvents = 'auto';
      const ratioY = clientHeight / scrollHeight;
      this.thumbHeight = Math.max(30, clientHeight * ratioY);
      this.thumbY.style.height = `${this.thumbHeight}px`;
    }
    
    // X Update
    if (!showX) {
      this.trackX.style.opacity = '0';
      this.trackX.style.pointerEvents = 'none';
      this.thumbWidth = 0;
    } else {
      this.trackX.style.opacity = '1';
      this.trackX.style.pointerEvents = 'auto';
      const ratioX = clientWidth / scrollWidth;
      this.thumbWidth = Math.max(30, clientWidth * ratioX);
      this.thumbX.style.width = `${this.thumbWidth}px`;
    }
    
    this.syncThumbPosition();
  }
  
  syncThumbPosition() {
    const { clientHeight, scrollHeight, scrollTop, clientWidth, scrollWidth, scrollLeft } = this.container;
    
    if (this.thumbHeight > 0) {
      const trackScrollableY = clientHeight - this.thumbHeight;
      const containerScrollableY = scrollHeight - clientHeight;
      let thumbTop = 0;
      if (containerScrollableY > 0) thumbTop = (scrollTop / containerScrollableY) * trackScrollableY;
      // Mac 트랙패드 오버스크롤(Rubber-band) 시 썸이 궤도를 이탈하지 않도록 시각적 범위 강제 클램핑
      thumbTop = Math.max(0, Math.min(trackScrollableY, thumbTop));
      this.thumbY.style.transform = `translateY(${thumbTop}px)`;
    }
    
    if (this.thumbWidth > 0) {
      const trackScrollableX = clientWidth - this.thumbWidth;
      const containerScrollableX = scrollWidth - clientWidth;
      let thumbLeft = 0;
      if (containerScrollableX > 0) thumbLeft = (scrollLeft / containerScrollableX) * trackScrollableX;
      // Mac 트랙패드 오버스크롤(Rubber-band) 시 썸이 궤도를 이탈하지 않도록 시각적 범위 강제 클램핑
      thumbLeft = Math.max(0, Math.min(trackScrollableX, thumbLeft));
      this.thumbX.style.transform = `translateX(${thumbLeft}px)`;
    }
  }
  
  onScroll() {
    if (!this.ticking) {
      requestAnimationFrame(() => {
        this.syncThumbPosition();
        this.ticking = false;
      });
      this.ticking = true;
    }
  }
  
  onDragStartY(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    this.isDraggingY = true;
    this.startY = e.clientY;
    this.startScrollTop = this.container.scrollTop;
    document.body.style.userSelect = 'none'; 
    this.thumbY.classList.add('is-dragging');
    
    document.addEventListener('mousemove', this.onDragMove);
    document.addEventListener('mouseup', this.onDragEnd);
  }
  
  onDragStartX(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    this.isDraggingX = true;
    this.startX = e.clientX;
    this.startScrollLeft = this.container.scrollLeft;
    document.body.style.userSelect = 'none'; 
    this.thumbX.classList.add('is-dragging');
    
    document.addEventListener('mousemove', this.onDragMove);
    document.addEventListener('mouseup', this.onDragEnd);
  }
  
  onDragMove(e) {
    if (this.isDraggingY) {
      const deltaY = e.clientY - this.startY;
      const { clientHeight, scrollHeight } = this.container;
      const trackScrollable = clientHeight - this.thumbHeight;
      const containerScrollable = scrollHeight - clientHeight;
      
      if (trackScrollable > 0) {
        let targetScrollTop = this.startScrollTop + (deltaY / trackScrollable) * containerScrollable;
        
        // 오버슈트(데드존) 빚짐 현상 방지: 끝에 도달하면 시작 앵커를 즉시 커서 위치로 갱신하여 반대 방향 이동 시 즉각 반응하도록 보정
        if (targetScrollTop < 0) {
          targetScrollTop = 0;
          this.startScrollTop = 0;
          this.startY = e.clientY;
        } else if (targetScrollTop > containerScrollable) {
          targetScrollTop = containerScrollable;
          this.startScrollTop = containerScrollable;
          this.startY = e.clientY;
        }
        
        this.container.scrollTop = targetScrollTop;
      }
    } else if (this.isDraggingX) {
      const deltaX = e.clientX - this.startX;
      const { clientWidth, scrollWidth } = this.container;
      const trackScrollable = clientWidth - this.thumbWidth;
      const containerScrollable = scrollWidth - clientWidth;
      
      if (trackScrollable > 0) {
        let targetScrollLeft = this.startScrollLeft + (deltaX / trackScrollable) * containerScrollable;
        
        // 오버슈트(데드존) 빚짐 현상 방지
        if (targetScrollLeft < 0) {
          targetScrollLeft = 0;
          this.startScrollLeft = 0;
          this.startX = e.clientX;
        } else if (targetScrollLeft > containerScrollable) {
          targetScrollLeft = containerScrollable;
          this.startScrollLeft = containerScrollable;
          this.startX = e.clientX;
        }
        
        this.container.scrollLeft = targetScrollLeft;
      }
    }
  }
  
  onDragEnd() {
    this.isDraggingY = false;
    this.isDraggingX = false;
    document.body.style.userSelect = '';
    this.thumbY.classList.remove('is-dragging');
    this.thumbX.classList.remove('is-dragging');
    
    document.removeEventListener('mousemove', this.onDragMove);
    document.removeEventListener('mouseup', this.onDragEnd);
  }
  
  destroy() {
    if (this.observer) this.observer.disconnect();
    if (this.container) this.container.removeEventListener('scroll', this.onScroll);
    if (this.thumbY) this.thumbY.removeEventListener('mousedown', this.onDragStartY);
    if (this.thumbX) this.thumbX.removeEventListener('mousedown', this.onDragStartX);
    if (this.trackY) {
      this.trackY.removeEventListener('wheel', this.onTrackWheel);
      if (this.trackY.parentNode) this.trackY.parentNode.removeChild(this.trackY);
    }
    if (this.trackX) {
      this.trackX.removeEventListener('wheel', this.onTrackWheel);
      if (this.trackX.parentNode) this.trackX.parentNode.removeChild(this.trackX);
    }
  }
}

window.CustomScrollbar = CustomScrollbar;
