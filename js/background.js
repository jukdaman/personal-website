// background.js

// 차후 JS 기반 애니메이션이 깔릴 캔버스 영역입니다.
// 현재는 뼈대만 잡아둡니다.

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('background-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let rafId;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // 예시: 아주 가벼운 베이스 렌더링(흰색 스크린 배경)을 하지만, 일단 아무것도 그리지 않음.
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 여기에 애니메이션 로직 추가 예정
        /* 
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        */

        rafId = requestAnimationFrame(render);
    }

    window.addEventListener('resize', resizeCanvas);
    
    // 초기 세팅
    resizeCanvas();
    render();
});
