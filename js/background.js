// background.js

const FL = 350;
const SPHERE_R = 80;
const FADE_START = SPHERE_R + 50;
const ROT_Y = 0.4;
const ROT_X = 0.3;
const BASE_LINE_W = 0.48;
const BASE_DOT_SIZE = 0.7;
const CONNECT_DIST_3D = 50;
const LINE_ALPHA_MUL = 1.2;
const FADE_IN_T = 0.02; // 페이드인 속도를 늦춰서 파티클이 천천히 부드럽게 나타나게 함 (약 1.6초)
const ORIGIN_STROKE_RATIO = 0.01;
const ORIGIN_DOT_MUL = 1.2;
const PARTICLE_SPEED = 0.0002;

const ORIGINS = [
  {"ox":284.8,"oy":-395.6,"oz":70.5,"originR":17.6,"cpDistRatio":0.51,"cpJitterT":0.271,"cpJitterP":0.163,"spread":31.7,"baseAlpha":0.333,"densityMul":2,"ptsCount":40},
  {"ox":-193.8,"oy":247.3,"oz":-160.1,"originR":25.5,"cpDistRatio":0.351,"cpJitterT":0.045,"cpJitterP":0.241,"spread":41.4,"baseAlpha":0.371,"densityMul":2,"ptsCount":40},
  {"ox":148.6,"oy":-144.4,"oz":-190.2,"originR":17.2,"cpDistRatio":0.597,"cpJitterT":-0.174,"cpJitterP":-0.186,"spread":42.3,"baseAlpha":0.271,"densityMul":2,"ptsCount":40},
  {"ox":-400,"oy":219.6,"oz":-361.7,"originR":17.3,"cpDistRatio":0.338,"cpJitterT":0.201,"cpJitterP":0.29,"spread":31.6,"baseAlpha":0.308,"densityMul":2,"ptsCount":40},
  {"ox":-217,"oy":-96.4,"oz":122,"originR":15.1,"cpDistRatio":0.383,"cpJitterT":0.159,"cpJitterP":-0.014,"spread":40.4,"baseAlpha":0.232,"densityMul":2,"ptsCount":40},
  {"ox":241.6,"oy":268.6,"oz":144.1,"originR":16.6,"cpDistRatio":0.489,"cpJitterT":0.295,"cpJitterP":-0.268,"spread":47,"baseAlpha":0.388,"densityMul":2,"ptsCount":40},
  {"ox":95.9,"oy":425.1,"oz":65.9,"originR":15.8,"cpDistRatio":0.462,"cpJitterT":0.029,"cpJitterP":0.287,"spread":19.4,"baseAlpha":0.263,"densityMul":2,"ptsCount":40},
  {"ox":-265.9,"oy":-179.5,"oz":-125.4,"originR":25.2,"cpDistRatio":0.51,"cpJitterT":0.195,"cpJitterP":0.062,"spread":25.9,"baseAlpha":0.31,"densityMul":2,"ptsCount":40},
  {"ox":-220.9,"oy":-469.2,"oz":-432,"originR":19.2,"cpDistRatio":0.314,"cpJitterT":-0.072,"cpJitterP":0.058,"spread":34.7,"baseAlpha":0.387,"densityMul":2,"ptsCount":40},
  {"ox":-372.4,"oy":-240.7,"oz":-179.6,"originR":17,"cpDistRatio":0.333,"cpJitterT":-0.216,"cpJitterP":0.016,"spread":30.1,"baseAlpha":0.371,"densityMul":2,"ptsCount":40},
  {"ox":358.6,"oy":-335.3,"oz":207.9,"originR":14.7,"cpDistRatio":0.417,"cpJitterT":-0.124,"cpJitterP":-0.158,"spread":41.3,"baseAlpha":0.203,"densityMul":2,"ptsCount":40},
  {"ox":52.5,"oy":-491,"oz":-425.3,"originR":13.3,"cpDistRatio":0.302,"cpJitterT":-0.031,"cpJitterP":0.253,"spread":37.7,"baseAlpha":0.337,"densityMul":2,"ptsCount":40},
  {"ox":267.1,"oy":94.1,"oz":301.9,"originR":16.7,"cpDistRatio":0.334,"cpJitterT":0.192,"cpJitterP":-0.044,"spread":25.7,"baseAlpha":0.231,"densityMul":2,"ptsCount":40},
  {"ox":306.9,"oy":369.9,"oz":-86.4,"originR":22.4,"cpDistRatio":0.431,"cpJitterT":-0.122,"cpJitterP":0.257,"spread":28,"baseAlpha":0.371,"densityMul":2,"ptsCount":40},
  {"ox":-314.2,"oy":-457.5,"oz":251.4,"originR":14.7,"cpDistRatio":0.436,"cpJitterT":-0.27,"cpJitterP":0.078,"spread":24.1,"baseAlpha":0.278,"densityMul":2,"ptsCount":40},
  {"ox":-324.5,"oy":-43.8,"oz":-245.1,"originR":21.7,"cpDistRatio":0.306,"cpJitterT":0.126,"cpJitterP":0.28,"spread":21.4,"baseAlpha":0.298,"densityMul":2,"ptsCount":40},
  {"ox":132.1,"oy":-274.7,"oz":-215.4,"originR":12.1,"cpDistRatio":0.305,"cpJitterT":0.186,"cpJitterP":0.177,"spread":41.2,"baseAlpha":0.223,"densityMul":2,"ptsCount":40},
  {"ox":122.1,"oy":-470.7,"oz":-162.8,"originR":16.1,"cpDistRatio":0.557,"cpJitterT":-0.024,"cpJitterP":0.23,"spread":29.6,"baseAlpha":0.339,"densityMul":2,"ptsCount":40},
  {"ox":-122.3,"oy":-481.6,"oz":-298.4,"originR":22.8,"cpDistRatio":0.386,"cpJitterT":0.087,"cpJitterP":0.268,"spread":20.4,"baseAlpha":0.26,"densityMul":2,"ptsCount":40},
  {"ox":117.8,"oy":-496.2,"oz":65.9,"originR":18.7,"cpDistRatio":0.313,"cpJitterT":0.008,"cpJitterP":0.289,"spread":42.5,"baseAlpha":0.386,"densityMul":2,"ptsCount":40},
  {"ox":221.1,"oy":-24.1,"oz":-376.4,"originR":19.3,"cpDistRatio":0.427,"cpJitterT":0.299,"cpJitterP":0.011,"spread":40,"baseAlpha":0.313,"densityMul":2,"ptsCount":40},
  {"ox":-363.4,"oy":-398,"oz":69,"originR":25,"cpDistRatio":0.44,"cpJitterT":0.303,"cpJitterP":0.289,"spread":39.5,"baseAlpha":0.364,"densityMul":2,"ptsCount":40},
  {"ox":398.7,"oy":-446.2,"oz":199.8,"originR":14.6,"cpDistRatio":0.561,"cpJitterT":0.185,"cpJitterP":-0.236,"spread":32.4,"baseAlpha":0.247,"densityMul":2,"ptsCount":40},
  {"ox":218.3,"oy":148,"oz":-220.6,"originR":20.4,"cpDistRatio":0.561,"cpJitterT":0.356,"cpJitterP":0.178,"spread":30.7,"baseAlpha":0.383,"densityMul":2,"ptsCount":40},
  {"ox":38.1,"oy":396.8,"oz":144.8,"originR":20.5,"cpDistRatio":0.481,"cpJitterT":0.298,"cpJitterP":-0.133,"spread":37.2,"baseAlpha":0.306,"densityMul":2,"ptsCount":40},
  {"ox":21.6,"oy":287,"oz":331.2,"originR":21.3,"cpDistRatio":0.506,"cpJitterT":-0.315,"cpJitterP":0.134,"spread":21.3,"baseAlpha":0.378,"densityMul":2,"ptsCount":40},
  {"ox":-342.1,"oy":-319.1,"oz":-346.7,"originR":18.1,"cpDistRatio":0.49,"cpJitterT":0.367,"cpJitterP":0.249,"spread":45.5,"baseAlpha":0.317,"densityMul":2,"ptsCount":40},
  {"ox":-384.9,"oy":-70.3,"oz":108.1,"originR":16.6,"cpDistRatio":0.43,"cpJitterT":-0.204,"cpJitterP":-0.035,"spread":40.1,"baseAlpha":0.237,"densityMul":2,"ptsCount":40},
  {"ox":321.5,"oy":-110.2,"oz":-382.8,"originR":16.5,"cpDistRatio":0.558,"cpJitterT":0.39,"cpJitterP":0.13,"spread":44.2,"baseAlpha":0.357,"densityMul":2,"ptsCount":40},
  {"ox":-284,"oy":244.7,"oz":306.5,"originR":24.2,"cpDistRatio":0.353,"cpJitterT":0.161,"cpJitterP":0.21,"spread":17.5,"baseAlpha":0.225,"densityMul":2,"ptsCount":40},
  {"ox":193.7,"oy":120,"oz":-375.8,"originR":24.6,"cpDistRatio":0.534,"cpJitterT":-0.392,"cpJitterP":0.068,"spread":39.3,"baseAlpha":0.342,"densityMul":2,"ptsCount":40},
  {"ox":255,"oy":-422.2,"oz":-379.3,"originR":18.5,"cpDistRatio":0.357,"cpJitterT":-0.2,"cpJitterP":0.055,"spread":35.5,"baseAlpha":0.358,"densityMul":2,"ptsCount":40},
  {"ox":397.3,"oy":223.9,"oz":-293.9,"originR":16,"cpDistRatio":0.499,"cpJitterT":-0.118,"cpJitterP":-0.045,"spread":27.8,"baseAlpha":0.211,"densityMul":2,"ptsCount":40},
  {"ox":371,"oy":-131.5,"oz":-383.5,"originR":21.8,"cpDistRatio":0.504,"cpJitterT":0.228,"cpJitterP":-0.11,"spread":21.7,"baseAlpha":0.34,"densityMul":2,"ptsCount":40},
  {"ox":116.4,"oy":40.7,"oz":-333.7,"originR":18.4,"cpDistRatio":0.315,"cpJitterT":0.106,"cpJitterP":-0.106,"spread":44.8,"baseAlpha":0.243,"densityMul":2,"ptsCount":40},
  {"ox":338.8,"oy":-226.7,"oz":-379.1,"originR":15.4,"cpDistRatio":0.431,"cpJitterT":0.304,"cpJitterP":-0.231,"spread":18.4,"baseAlpha":0.389,"densityMul":2,"ptsCount":40}
];

class SynapseBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        this.W = 0;
        this.H = 0;
        this.dpr = 1;
        this.viewScale = 1;
        this.seed = 777;
        
        this.bundles = this.buildBundles();
        
        this.rafId = null;
        this.isVisible = !document.hidden;

        // Resize
        window.addEventListener('resize', () => this.resize());
        this.resize();
        
        // Visibility API for optimization
        document.addEventListener('visibilitychange', () => {
            this.isVisible = !document.hidden;
            if (this.isVisible) {
                this.animate();
            } else {
                if (this.rafId) cancelAnimationFrame(this.rafId);
            }
        });

        // Start animation
        this.animate();
    }

    resize() {
        this.dpr = window.devicePixelRatio || 1;
        this.W = window.innerWidth;
        this.H = window.innerHeight;
        this.viewScale = Math.min(2.0, 1 + (this.W - 300) / 1620);
        this.canvas.width = this.W * this.dpr;
        this.canvas.height = this.H * this.dpr;
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    sRand() { 
        this.seed = (this.seed * 16807) % 2147483647; 
        return (this.seed - 1) / 2147483646; 
    }
    
    sRandRange(a, b) { 
        return a + this.sRand() * (b - a); 
    }

    project(x, y, z) {
        const cr = Math.cos(ROT_Y), sr = Math.sin(ROT_Y);
        const cx = Math.cos(ROT_X), sx = Math.sin(ROT_X);
        let x1 = x * cr - z * sr;
        let z1 = x * sr + z * cr;
        let y1 = y * cx - z1 * sx;
        let z2 = y * sx + z1 * cx;
        const d = FL + z2;
        if (d < 50) return null;
        const scale = FL / d * this.viewScale;
        
        // 카메라 바로 뒤(d < 50)에서 렌더링 영역(d >= 50)으로 넘어올 때 
        // 뚝 나타나는 현상을 막기 위해 z거리 기반 페이드인 적용
        const camFade = d < 150 ? (d - 50) / 100 : 1;
        
        return { sx: this.W / 2 + x1 * scale, sy: this.H / 2 + y1 * scale, scale, z: z2, camFade };
    }

    buildBundles() {
        this.seed = 777;
        return ORIGINS.map(o => {
            // 은하수(Galaxy) 소용돌이 형태로 중앙(0,0,0)을 향해 아름답게 곡선을 그리도록 제어점 계산
            const vLen = Math.sqrt(o.ox * o.ox + o.oz * o.oz) || 1;
            const tx = -o.oz / vLen; // Y축 기준 회전 접선 벡터 (탄젠트)
            const tz = o.ox / vLen;
            
            // cp1: 시작점에서는 뭉텅이를 유지하기 위해 원점에서 접선 방향으로 살짝만 휘어지게 함
            const cp1x = o.ox + tx * 80;
            const cp1y = o.oy;
            const cp1z = o.oz + tz * 80;
            
            // cp2: 블랙홀 정중앙(0,0,0)으로 완벽히 수렴하되, 거대한 소용돌이를 그리며 빨려들어가게 함
            const cp2x = o.ox * 0.2 + tx * 350;
            const cp2y = o.oy * 0.2;
            const cp2z = o.oz * 0.2 + tz * 350;
            
            const particles = [];
            for (let i = 0; i < o.ptsCount; i++) {
                particles.push({
                    t: i / o.ptsCount,
                    offX: this.sRandRange(-o.spread, o.spread),
                    offY: this.sRandRange(-o.spread, o.spread),
                    offZ: this.sRandRange(-o.spread, o.spread),
                    size: this.sRandRange(0.6, 1),
                    alpha: this.sRandRange(0.35, 0.8)
                });
            }
            return { ox: o.ox, oy: o.oy, oz: o.oz, cp1x, cp1y, cp1z, cp2x, cp2y, cp2z, particles, originR: o.originR, baseAlpha: o.baseAlpha, densityMul: o.densityMul };
        });
    }

    cubicBezier3D(o, cp1, cp2, dest, t) {
        const u = 1 - t;
        const t2 = t * t;
        const u2 = u * u;
        const u3 = u2 * u;
        const t3 = t2 * t;
        return {
            x: u3 * o.x + 3 * u2 * t * cp1.x + 3 * u * t2 * cp2.x + t3 * dest.x,
            y: u3 * o.y + 3 * u2 * t * cp1.y + 3 * u * t2 * cp2.y + t3 * dest.y,
            z: u3 * o.z + 3 * u2 * t * cp1.z + 3 * u * t2 * cp2.z + t3 * dest.z
        };
    }

    animate() {
        if (!this.isVisible) return;
        
        this.ctx.clearRect(0, 0, this.W, this.H);
        const allItems = [];

        this.bundles.forEach(b => {
            const bundlePts = [];
            const originProj = this.project(b.ox, b.oy, b.oz);
            if (originProj) {
                allItems.push({ type: 'origin', x: originProj.sx, y: originProj.sy, r: b.originR * originProj.scale, z: originProj.z, scale: originProj.scale, densityMul: b.densityMul, camFade: originProj.camFade });
            }
            
            b.particles.forEach(p => {
                p.t += PARTICLE_SPEED;
                if (p.t > 1) p.t -= 1;
                const t = p.t;
                // 시작점(원)에서 모여서 출발하도록 초기 확산 범위(squeeze)를 서서히 증가시킵니다.
                const squeeze = (1 - t * t) * Math.min(1, t * 15);
                const pos = this.cubicBezier3D(
                    { x: b.ox + p.offX * squeeze, y: b.oy + p.offY * squeeze, z: b.oz + p.offZ * squeeze },
                    { x: b.cp1x + p.offX * squeeze * 0.4, y: b.cp1y + p.offY * squeeze * 0.4, z: b.cp1z + p.offZ * squeeze * 0.4 },
                    { x: b.cp2x + p.offX * squeeze * 0.1, y: b.cp2y + p.offY * squeeze * 0.1, z: b.cp2z + p.offZ * squeeze * 0.1 },
                    { x: 0, y: 0, z: 0 },
                    t
                );
                
                const distFromCenter = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
                if (distFromCenter < SPHERE_R) return;
                
                const proj = this.project(pos.x, pos.y, pos.z);
                if (!proj) return;
                
                const fadeIn = t < FADE_IN_T ? t / FADE_IN_T : 1;
                const sphereFade = distFromCenter < FADE_START ? (distFromCenter - SPHERE_R) / (FADE_START - SPHERE_R) : 1;
                const fade = fadeIn * sphereFade * proj.camFade;
                
                bundlePts.push({
                    x: proj.sx, y: proj.sy, scale: proj.scale, z: proj.z,
                    wx: pos.x, wy: pos.y, wz: pos.z,
                    size: p.size * BASE_DOT_SIZE * proj.scale,
                    alpha: p.alpha * fade * b.densityMul
                });
            });

            for (let i = 0; i < bundlePts.length; i++) {
                for (let j = i + 1; j < bundlePts.length; j++) {
                    const a = bundlePts[i], c = bundlePts[j];
                    const dx = a.wx - c.wx, dy = a.wy - c.wy, dz = a.wz - c.wz;
                    const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    if (dist3D < CONNECT_DIST_3D * 1.2) {
                        const avgScale = (a.scale + c.scale) / 2;
                        const lineAlpha = (1 - dist3D / (CONNECT_DIST_3D * 1.2)) * Math.min(a.alpha, c.alpha) * b.baseAlpha * LINE_ALPHA_MUL;
                        const thickness = BASE_LINE_W * avgScale;
                        allItems.push({ type: 'line', x1: a.x, y1: a.y, x2: c.x, y2: c.y, alpha: lineAlpha, z: (a.z + c.z) / 2, thickness });
                    }
                }
            }
            bundlePts.forEach(p => allItems.push({ type: 'dot', ...p }));
        });

        const sphereProj = this.project(0, 0, 0);
        if (sphereProj) allItems.push({ type: 'sphere', z: 0, proj: sphereProj });

        allItems.sort((a, b) => b.z - a.z);

        allItems.forEach(item => {
            if (item.type === 'line') {
                this.ctx.beginPath();
                this.ctx.moveTo(item.x1, item.y1);
                this.ctx.lineTo(item.x2, item.y2);
                this.ctx.strokeStyle = `rgba(0,0,0,${Math.min(item.alpha, 1)})`;
                this.ctx.lineWidth = item.thickness;
                this.ctx.stroke();
            } else if (item.type === 'dot') {
                this.ctx.beginPath();
                this.ctx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(0,0,0,${Math.min(item.alpha, 1)})`;
                this.ctx.fill();
            } else if (item.type === 'origin') {
                const strokeW = item.r * ORIGIN_STROKE_RATIO;
                this.ctx.beginPath();
                this.ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
                this.ctx.strokeStyle = item.densityMul === 2 ? '#000' : 'rgba(0,0,0,0.5)';
                this.ctx.lineWidth = Math.max(0.15, strokeW);
                this.ctx.stroke();
                
                const dotR = BASE_DOT_SIZE * item.scale * ORIGIN_DOT_MUL;
                this.ctx.beginPath();
                this.ctx.arc(item.x, item.y, dotR, 0, Math.PI * 2);
                this.ctx.fillStyle = item.densityMul === 2 ? '#000' : 'rgba(0,0,0,0.5)';
                this.ctx.fill();
            } else if (item.type === 'sphere') {
                const s = item.proj;
                const r = SPHERE_R * s.scale;
                this.ctx.beginPath();
                this.ctx.arc(s.sx, s.sy, r, 0, Math.PI * 2);
                this.ctx.fillStyle = '#000';
                this.ctx.fill();
            }
        });

        this.rafId = requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SynapseBackground('background-canvas');
});
