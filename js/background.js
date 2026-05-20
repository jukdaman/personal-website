const FL = 350; // 카메라 초점 거리 (원근감/시야각 결정, 작을수록 왜곡이 심해짐)
const SPHERE_R = 80; // 중앙 블랙홀(도착점)의 반지름 (픽셀 단위)
const SPHERE_R_SQ = SPHERE_R * SPHERE_R; // 최적화를 위한 반지름의 제곱값
const FADE_START = SPHERE_R + 50; // 파티클이 블랙홀 표면에 닿기 50px 전부터 서서히 투명해지도록 설정
const ROT_Y = 0.4; // 전체 씬(카메라)의 Y축 고정 회전 각도 (라디안)
const ROT_X = 0.3; // 전체 씬(카메라)의 X축 고정 회전 각도 (라디안)
const BASE_LINE_W = 0.2; // 파티클 사이를 연결하는 신경망(선)의 기본 굵기
const BASE_DOT_SIZE = 0.4; // 파티클(점)의 기본 픽셀 크기
const CONNECT_DIST_3D = 50; // 점과 점을 선으로 연결할 최대 3D 공간 상의 거리
const CONNECT_THRESH = CONNECT_DIST_3D * 1.2; // 여유분을 둔 실제 선 연결 판단 거리
const CONNECT_THRESH_SQ = CONNECT_THRESH * CONNECT_THRESH; // 최적화를 위한 판단 거리의 제곱값
const LINE_ALPHA_MUL = 1.2; // 선의 투명도를 점보다 1.2배 진하게 보정하여 거미줄이 뚜렷하게 보이게 함
const FADE_IN_T = 0.02; // 페이드인 속도를 늦춰서 파티클이 천천히 부드럽게 나타나게 함 (전체 수명의 2% 구간)
const ORIGIN_STROKE_RATIO = 0.01; // 시작점(발원지) 둥근 테두리의 굵기 비율
const ORIGIN_DOT_MUL = 1.0; // 시작점(발원지) 중앙에 찍히는 붉은 점을 기본 점보다 1.2배 크게 그림
const PARTICLE_SPEED = 0.0002; // 파티클이 궤적을 따라 블랙홀로 이동하는 애니메이션 속도
const MIN_ALPHA_FOR_LINE = 0.05; // 렌더링 최적화 컷오프 (투명도가 0.05 이하면 거미줄 연결 연산 자체를 무시)
const TWO_PI = Math.PI * 2; // 원을 그릴 때 사용하는 360도(2파이) 상수
const SQUEEZE_POWER = 5; // 블랙홀로 수렴할 때 다발이 하나로 뭉치는 강도 (1=일정하게 좁아짐, 2=끝에서 급격히 뭉침, 3 이상=도착 직전까지 넓게 퍼져있음)

// 삼각함수 사전 계산 (매 프레임 ~3000번 호출 → 0번)
const COS_RY = Math.cos(ROT_Y), SIN_RY = Math.sin(ROT_Y);
const COS_RX = Math.cos(ROT_X), SIN_RX = Math.sin(ROT_X);

// ORIGINS 배열은 js/synapse_data.js 파일에서 불러옵니다.

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

        // 재사용 오브젝트 풀 (GC 압력 제거)
        this._pos = { x: 0, y: 0, z: 0 };
        this._proj = { sx: 0, sy: 0, scale: 0, z: 0, camFade: 0, depthFade: 0, valid: false };
        this._o = { x: 0, y: 0, z: 0 };
        this._c1 = { x: 0, y: 0, z: 0 };
        this._c2 = { x: 0, y: 0, z: 0 };

        this.bundles = this.buildBundles();

        this.rafId = null;
        this.isVisible = !document.hidden;
        this._boundAnimate = () => this.animate(); // rAF 콜백 재사용

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

    // project: 결과를 this._proj에 기록 (새 오브젝트 생성 없음)
    projectTo(x, y, z) {
        let x1 = x * COS_RY - z * SIN_RY;
        let z1 = x * SIN_RY + z * COS_RY;
        let y1 = y * COS_RX - z1 * SIN_RX;
        let z2 = y * SIN_RX + z1 * COS_RX;
        const d = FL + z2;
        if (d < 50) { this._proj.valid = false; return; }
        const scale = FL / d * this.viewScale;
        const p = this._proj;
        p.sx = this.W / 2 + x1 * scale;
        p.sy = this.H / 2 + y1 * scale;
        p.scale = scale;
        p.z = z2;
        // 카메라 바로 뒤(d < 50)에서 렌더링 영역(d >= 50)으로 넘어올 때 
        // 뚝 나타나는 현상을 막기 위해 z거리 기반 페이드인 적용
        p.camFade = d < 150 ? (d - 50) / 100 : 1;
        // 공기원근 (Aerial Perspective): 거리가 멀수록(d 값이 큼) 점점 흐릿해지도록 깊이 페이드 적용
        p.depthFade = d < 400 ? 1 : d > 800 ? 0 : 1 - (d - 400) / 400;
        p.valid = true;
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

            const phaseOffset = this.sRand(); // 다발별 랜덤 위상 오프셋으로 파티클 생성 주기 분산
            const particles = [];
            for (let i = 0; i < o.ptsCount; i++) {
                particles.push({
                    t: (i / o.ptsCount + phaseOffset) % 1,
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

    // cubicBezier3D: 결과를 this._pos에 기록 (새 오브젝트 생성 없음)
    bezierTo(ox, oy, oz, c1x, c1y, c1z, c2x, c2y, c2z, t) {
        const u = 1 - t;
        const t2 = t * t;
        const u2 = u * u;
        const u3 = u2 * u;
        const t3 = t2 * t;
        const ut3 = 3 * u2 * t;
        const ut32 = 3 * u * t2;
        this._pos.x = u3 * ox + ut3 * c1x + ut32 * c2x;
        this._pos.y = u3 * oy + ut3 * c1y + ut32 * c2y;
        this._pos.z = u3 * oz + ut3 * c1z + ut32 * c2z;
        // dest는 항상 (0,0,0)이므로 t3 * dest 항 생략
    }

    animate() {
        if (!this.isVisible) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.W, this.H);

        // 모든 색상이 검정이므로 한 번만 설정하고 globalAlpha로 투명도 제어
        ctx.fillStyle = '#000';
        ctx.strokeStyle = '#000';

        const allItems = [];

        for (let bi = 0; bi < this.bundles.length; bi++) {
            const b = this.bundles[bi];
            const bundlePts = [];
            const linePts = [];

            this.projectTo(b.ox, b.oy, b.oz);
            if (this._proj.valid) {
                const p = this._proj;
                allItems.push({ t: 1, x: p.sx, y: p.sy, r: b.originR * p.scale, z: p.z, s: p.scale, dm: b.densityMul, cf: p.camFade, df: p.depthFade });
            }

            const particles = b.particles;
            for (let pi = 0; pi < particles.length; pi++) {
                const pa = particles[pi];
                pa.t += PARTICLE_SPEED;
                if (pa.t > 1) pa.t -= 1;
                const t = pa.t;
                // 시작점(원)에서 모여서 출발하도록 초기 확산 범위(squeeze)를 서서히 증가시킵니다.
                // SQUEEZE_POWER 값을 조절하면 블랙홀 도착 직전에 퍼져있던 선들이 한 줄기로 뭉치는 느낌을 변경할 수 있습니다.
                const squeeze = (1 - Math.pow(t, SQUEEZE_POWER)) * Math.min(1, t * 15);

                const sox = pa.offX * squeeze, soy = pa.offY * squeeze, soz = pa.offZ * squeeze;
                this.bezierTo(
                    b.ox + sox, b.oy + soy, b.oz + soz,
                    b.cp1x + sox * 0.4, b.cp1y + soy * 0.4, b.cp1z + soz * 0.4,
                    b.cp2x + sox * 0.1, b.cp2y + soy * 0.1, b.cp2z + soz * 0.1,
                    t
                );

                const px = this._pos.x, py = this._pos.y, pz = this._pos.z;
                const distSq = px * px + py * py + pz * pz;
                if (distSq < SPHERE_R_SQ) continue;

                this.projectTo(px, py, pz);
                if (!this._proj.valid) continue;

                const distFromCenter = Math.sqrt(distSq);
                const proj = this._proj;
                const fadeIn = t < FADE_IN_T ? t / FADE_IN_T : 1;
                const sphereFade = distFromCenter < FADE_START ? (distFromCenter - SPHERE_R) / (FADE_START - SPHERE_R) : 1;
                const finalAlpha = pa.alpha * fadeIn * sphereFade * proj.camFade * proj.depthFade * b.densityMul;

                const pt = {
                    t: 2, // type: dot
                    x: proj.sx, y: proj.sy, z: proj.z,
                    wx: px, wy: py, wz: pz,
                    sz: pa.size * BASE_DOT_SIZE * proj.scale,
                    a: finalAlpha, s: proj.scale
                };
                bundlePts.push(pt);
                if (finalAlpha > MIN_ALPHA_FOR_LINE) linePts.push(pt);
            }

            // 선 연결: 같은 다발 내, 충분히 불투명한 파티클만 대상
            for (let i = 0; i < linePts.length; i++) {
                const a = linePts[i];
                for (let j = i + 1; j < linePts.length; j++) {
                    const c = linePts[j];
                    const dx = a.wx - c.wx, dy = a.wy - c.wy, dz = a.wz - c.wz;
                    const dSq = dx * dx + dy * dy + dz * dz;
                    if (dSq < CONNECT_THRESH_SQ) {
                        const dist3D = Math.sqrt(dSq);
                        allItems.push({
                            t: 3, // type: line
                            x1: a.x, y1: a.y, x2: c.x, y2: c.y,
                            a: (1 - dist3D / CONNECT_THRESH) * Math.min(a.a, c.a) * b.baseAlpha * LINE_ALPHA_MUL,
                            z: (a.z + c.z) * 0.5,
                            w: BASE_LINE_W * (a.s + c.s) * 0.5
                        });
                    }
                }
            }
            for (let i = 0; i < bundlePts.length; i++) {
                allItems.push(bundlePts[i]);
            }
        }

        this.projectTo(0, 0, 0);
        if (this._proj.valid) allItems.push({ t: 4, z: 0, sx: this._proj.sx, sy: this._proj.sy, s: this._proj.scale });

        allItems.sort((a, b) => b.z - a.z);

        for (let i = 0; i < allItems.length; i++) {
            const item = allItems[i];
            if (item.t === 3) { // line
                ctx.globalAlpha = Math.min(item.a, 1);
                ctx.lineWidth = item.w;
                ctx.beginPath();
                ctx.moveTo(item.x1, item.y1);
                ctx.lineTo(item.x2, item.y2);
                ctx.stroke();
            } else if (item.t === 2) { // dot
                ctx.globalAlpha = Math.min(item.a, 1);
                ctx.beginPath();
                ctx.arc(item.x, item.y, item.sz, 0, TWO_PI);
                ctx.fill();
            } else if (item.t === 1) { // origin
                const baseA = item.dm === 2 ? 1 : 0.5;
                const fA = Math.min(baseA * item.cf * item.df, 1);
                ctx.globalAlpha = fA;

                ctx.lineWidth = Math.max(0.15, item.r * ORIGIN_STROKE_RATIO);
                ctx.beginPath();
                ctx.arc(item.x, item.y, item.r, 0, TWO_PI);
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(item.x, item.y, BASE_DOT_SIZE * item.s * ORIGIN_DOT_MUL, 0, TWO_PI);
                ctx.fill();
            } else if (item.t === 4) { // sphere
                ctx.globalAlpha = 1;
                ctx.beginPath();
                ctx.arc(item.sx, item.sy, SPHERE_R * item.s, 0, TWO_PI);
                ctx.fill();
            }
        }

        ctx.globalAlpha = 1; // 복원

        this.rafId = requestAnimationFrame(this._boundAnimate);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SynapseBackground('background-canvas');
});
