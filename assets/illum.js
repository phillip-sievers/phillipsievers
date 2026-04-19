/* Mouse-illuminated dot grid.
   Finer (12px spacing) and much more subtle alpha. The grid sits just
   above background noise; the cursor creates a soft bloom. */
(function () {
    const canvas = document.getElementById("illum");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });

    const SPACING = 12;
    const DOT_R = 0.75;
    const MOUSE_RADIUS = 130;
    const AMBIENT_MIN = 0.01;
    const AMBIENT_MAX = 0.022;
    const HL_MAX = 0.55;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0,
        H = 0;
    let mx = -9999,
        my = -9999;
    let tmx = mx,
        tmy = my;
    let t0 = performance.now();

    function dotColor() {
        return document.documentElement.classList.contains("theme-light")
            ? "168, 150, 128"
            : "160, 160, 160";
    }

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.floor(W * dpr);
        canvas.height = Math.floor(H * dpr);
        canvas.style.width = W + "px";
        canvas.style.height = H + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener("resize", resize, { passive: true });
    resize();

    window.addEventListener(
        "mousemove",
        (e) => {
            tmx = e.clientX;
            tmy = e.clientY;
        },
        { passive: true },
    );
    window.addEventListener("mouseleave", () => {
        tmx = -9999;
        tmy = -9999;
    });
    window.addEventListener(
        "touchmove",
        (e) => {
            if (!e.touches.length) return;
            tmx = e.touches[0].clientX;
            tmy = e.touches[0].clientY;
        },
        { passive: true },
    );

    function frame(now) {
        mx += (tmx - mx) * 0.18;
        my += (tmy - my) * 0.18;
        const t = (now - t0) / 1000;

        ctx.clearRect(0, 0, W, H);

        const waveX = W * 0.5 + Math.cos(t * 0.12) * W * 0.4;
        const waveY = H * 0.5 + Math.sin(t * 0.16) * H * 0.35;
        const waveR = Math.max(W, H) * 0.65;
        const waveR2 = waveR * waveR;

        const cursorActive = mx > -1000;
        const mR2 = MOUSE_RADIUS * MOUSE_RADIUS;
        const color = dotColor();

        const offX = (W % SPACING) / 2;
        const offY = (H % SPACING) / 2;

        for (let x = offX; x < W; x += SPACING) {
            for (let y = offY; y < H; y += SPACING) {
                const dwx = x - waveX,
                    dwy = y - waveY;
                const wd2 = dwx * dwx + dwy * dwy;
                let ambient = AMBIENT_MIN;
                if (wd2 < waveR2) {
                    const k = 1 - wd2 / waveR2;
                    ambient = AMBIENT_MIN + (AMBIENT_MAX - AMBIENT_MIN) * k * k;
                }

                let hl = 0;
                if (cursorActive) {
                    const dx = x - mx,
                        dy = y - my;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < mR2) {
                        const k = 1 - d2 / mR2;
                        hl = HL_MAX * k * k;
                    }
                }

                const a = Math.min(1, ambient + hl);
                const r = DOT_R + (hl > 0.25 ? hl * 0.5 : 0);

                ctx.fillStyle = `rgba(${color},${a})`;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        requestAnimationFrame(frame);
    }

    if (
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
        function staticDraw() {
            ctx.clearRect(0, 0, W, H);
            const color = dotColor();
            const offX = (W % SPACING) / 2,
                offY = (H % SPACING) / 2;
            for (let x = offX; x < W; x += SPACING) {
                for (let y = offY; y < H; y += SPACING) {
                    ctx.fillStyle = `rgba(${color},${AMBIENT_MIN})`;
                    ctx.beginPath();
                    ctx.arc(x, y, DOT_R, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        staticDraw();
        window.addEventListener("resize", () => {
            resize();
            staticDraw();
        });
    } else {
        requestAnimationFrame(frame);
    }
})();
