const GraphApp = {
    functions: [],
    viewport: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
    defaultViewport: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
    colors: ['#f472b6', '#a78bfa', '#5eead4', '#fbbf24', '#60a5fa', '#fb7185'],
    SAMPLE_POINTS: 600,
    stateHistory: [],
    stateIndex: -1,
    MAX_UNDO: 50,

    canvas: null,
    ctx: null,
    wrap: null,
    tooltip: null,

    isDragging: false,
    dragStart: null,
    dragViewportStart: null,

    /* ---- INIT ---- */
    init() {
        this.canvas = document.getElementById('graphCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.wrap = document.getElementById('graphCanvasWrap');
        this.tooltip = document.getElementById('graphTooltip');

        this.saveState();
        this.resize();
        this.bindEvents();
        this.bindKeyboard();
        this.bindSidebar();
        this.render();
    },

    resize() {
        const rect = this.wrap.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.render();
    },

    /* ---- STATE UNDO/REDO ---- */
    saveState() {
        const snap = JSON.stringify(
            this.functions.map(f => ({ expr: f.expr, color: f.color, visible: f.visible }))
        );
        this.stateHistory = this.stateHistory.slice(0, this.stateIndex + 1);
        this.stateHistory.push(snap);
        if (this.stateHistory.length > this.MAX_UNDO) this.stateHistory.shift();
        this.stateIndex = this.stateHistory.length - 1;
    },

    restoreState(snap) {
        const data = JSON.parse(snap);
        this.functions = data.map(f => ({
            expr: f.expr,
            color: f.color,
            visible: f.visible,
            compiled: this.compileSafe(f.expr)
        }));
        this.renderSidebar();
        this.render();
    },

    undo() {
        if (this.stateIndex <= 0) return;
        this.stateIndex--;
        this.restoreState(this.stateHistory[this.stateIndex]);
    },

    redo() {
        if (this.stateIndex >= this.stateHistory.length - 1) return;
        this.stateIndex++;
        this.restoreState(this.stateHistory[this.stateIndex]);
    },

    /* ---- FONCTIONS ---- */
    compileSafe(expr) {
        try { return math.compile(expr); }
        catch { return null; }
    },

    addFunction(expr) {
        expr = expr.trim();
        if (!expr) return;
        if (this.functions.find(f => f.expr === expr)) {
            this.showError('Cette fonction est déjà tracée.');
            return null;
        }
        const compiled = this.compileSafe(expr);
        if (!compiled) {
            try {
                math.compile(expr).evaluate({ x: 0 });
            } catch (err) {
                this.showError(`Erreur de syntaxe : ${err.message}`);
                return null;
            }
        }
        const color = this.colors[this.functions.length % this.colors.length];
        this.functions.push({ expr, color, visible: true, compiled });
        this.saveState();
        this.renderSidebar();
        this.render();
        this.focusLastInput();
        return compiled;
    },

    removeFunction(index) {
        this.functions.splice(index, 1);
        this.saveState();
        this.renderSidebar();
        this.render();
    },

    editFunction(index, expr) {
        expr = expr.trim();
        if (!expr) {
            this.removeFunction(index);
            return;
        }
        const compiled = this.compileSafe(expr);
        if (!compiled) return;
        this.functions[index].expr = expr;
        this.functions[index].compiled = compiled;
        this.saveState();
        this.renderSidebar();
        this.render();
    },

    toggleFunction(index) {
        this.functions[index].visible = !this.functions[index].visible;
        this.saveState();
        this.renderSidebar();
        this.render();
    },

    focusLastInput() {
        const inputs = document.querySelectorAll('.func-input');
        const last = inputs[inputs.length - 1];
        if (last) { last.focus(); }
    },

    /* ---- SIDEBAR ---- */
    renderSidebar() {
        const list = document.getElementById('graphSidebarList');
        if (!list) return;

        if (this.functions.length === 0) {
            list.innerHTML = '<div class="graph-sidebar-empty">Ajoutez une fonction</div>';
            return;
        }

        list.innerHTML = this.functions.map((f, i) => `
            <div class="func-item" data-idx="${i}">
                <span class="func-color" style="background:${f.color};${f.visible ? '' : 'opacity:0.3'}" data-toggle="${i}"></span>
                <input class="func-input" type="text" value="${this.esc(f.expr)}" data-idx="${i}" spellcheck="false" placeholder="f(${i + 1})(x)">
                <button class="func-del" data-del="${i}" title="Supprimer">×</button>
            </div>
        `).join('');

        list.querySelectorAll('.func-input').forEach(inp => {
            inp.addEventListener('focus', () => {
                inp.closest('.func-item').classList.add('active');
            });
            inp.addEventListener('blur', () => {
                inp.closest('.func-item').classList.remove('active');
                const idx = parseInt(inp.dataset.idx);
                if (inp.value.trim() !== this.functions[idx]?.expr) {
                    this.editFunction(idx, inp.value);
                }
            });
            inp.addEventListener('input', () => {
                const idx = parseInt(inp.dataset.idx);
                const fn = this.functions[idx];
                if (!fn) return;
                fn.expr = inp.value;
                fn.compiled = this.compileSafe(inp.value);
                this.render();
            });

            inp.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const idx = parseInt(inp.dataset.idx);
                    this.editFunction(idx, inp.value);
                    const next = document.querySelector(`.func-input[data-idx="${idx + 1}"]`);
                    if (next) next.focus();
                    else {
                        document.getElementById('graphAddBtn')?.focus();
                    }
                }
                if (e.key === 'Escape') {
                    inp.value = this.functions[parseInt(inp.dataset.idx)]?.expr || '';
                    inp.blur();
                }
            });
        });

        list.querySelectorAll('.func-color').forEach(el => {
            el.addEventListener('click', () => {
                this.toggleFunction(parseInt(el.dataset.toggle));
            });
        });

        list.querySelectorAll('.func-del').forEach(el => {
            el.addEventListener('click', () => {
                this.removeFunction(parseInt(el.dataset.del));
            });
        });
    },

    /* ---- RENDU CANVAS ---- */
    render() {
        const ctx = this.ctx;
        const dpr = window.devicePixelRatio || 1;
        const w = this.canvas.width / dpr;
        const h = this.canvas.height / dpr;

        ctx.clearRect(0, 0, w, h);
        this.drawBackground(ctx, w, h);
        this.drawGrid(ctx, w, h);
        this.drawAxes(ctx, w, h);

        this.functions.forEach(f => {
            if (f.visible && f.compiled) this.drawCurve(ctx, w, h, f);
        });
    },

    drawBackground(ctx, w, h) {
        ctx.fillStyle = '#0f0a1a';
        ctx.fillRect(0, 0, w, h);
    },

    drawGrid(ctx, w, h) {
        const vp = this.viewport;
        const xStep = this.niceStep(vp.xMax - vp.xMin);
        const yStep = this.niceStep(vp.yMax - vp.yMin);

        ctx.strokeStyle = 'rgba(167,139,250,0.08)';
        ctx.lineWidth = 1;

        const xStart = Math.floor(vp.xMin / xStep) * xStep;
        for (let x = xStart; x <= vp.xMax; x += xStep) {
            if (Math.abs(x) < xStep * 0.01) continue;
            const px = this.xToPixel(x, w);
            ctx.beginPath();
            ctx.moveTo(px, 0);
            ctx.lineTo(px, h);
            ctx.stroke();
        }

        const yStart = Math.floor(vp.yMin / yStep) * yStep;
        for (let y = yStart; y <= vp.yMax; y += yStep) {
            if (Math.abs(y) < yStep * 0.01) continue;
            const py = this.yToPixel(y, h);
            ctx.beginPath();
            ctx.moveTo(0, py);
            ctx.lineTo(w, py);
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(167,139,250,0.4)';
        ctx.font = '10px DM Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (let x = xStart; x <= vp.xMax; x += xStep) {
            if (Math.abs(x) < xStep * 0.01) continue;
            const px = this.xToPixel(x, w);
            ctx.fillText(this.formatNum(x), px, 0);
        }
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let y = yStart; y <= vp.yMax; y += yStep) {
            if (Math.abs(y) < yStep * 0.01) continue;
            const py = this.yToPixel(y, h);
            ctx.fillText(this.formatNum(y), w - 4, py);
        }
    },

    drawAxes(ctx, w, h) {
        ctx.strokeStyle = 'rgba(167,139,250,0.35)';
        ctx.lineWidth = 1.5;
        const vp = this.viewport;
        if (vp.yMin <= 0 && vp.yMax >= 0) {
            const py = this.yToPixel(0, h);
            ctx.beginPath();
            ctx.moveTo(0, py);
            ctx.lineTo(w, py);
            ctx.stroke();
        }
        if (vp.xMin <= 0 && vp.xMax >= 0) {
            const px = this.xToPixel(0, w);
            ctx.beginPath();
            ctx.moveTo(px, 0);
            ctx.lineTo(px, h);
            ctx.stroke();
        }
    },

    drawCurve(ctx, w, h, func) {
        const vp = this.viewport;
        const compiled = func.compiled;
        if (!compiled) return;
        const step = (vp.xMax - vp.xMin) / this.SAMPLE_POINTS;

        ctx.strokeStyle = func.color;
        ctx.lineWidth = 2.5;
        let started = false;

        for (let i = 0; i <= this.SAMPLE_POINTS; i++) {
            const x = vp.xMin + i * step;
            let y;
            try { y = compiled.evaluate({ x }); }
            catch {
                if (started) { ctx.stroke(); started = false; }
                continue;
            }
            if (!isFinite(y)) {
                if (started) { ctx.stroke(); started = false; }
                continue;
            }
            const px = this.xToPixel(x, w);
            const py = this.yToPixel(y, h);
            if (py < -500 || py > h + 500) {
                if (started) { ctx.stroke(); started = false; }
                continue;
            }
            if (!started) {
                ctx.beginPath();
                ctx.moveTo(px, py);
                started = true;
            } else {
                ctx.lineTo(px, py);
            }
        }
        if (started) ctx.stroke();
    },

    /* ---- ZOOM / PAN ---- */
    zoom(factor, cx, cy) {
        const rect = this.canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        const xRatio = cx / w;
        const yRatio = cy / h;
        const xCenter = this.viewport.xMin + xRatio * (this.viewport.xMax - this.viewport.xMin);
        const yCenter = this.viewport.yMin + (1 - yRatio) * (this.viewport.yMax - this.viewport.yMin);
        const xRange = (this.viewport.xMax - this.viewport.xMin) * factor;
        const yRange = (this.viewport.yMax - this.viewport.yMin) * factor;
        this.viewport.xMin = xCenter - xRange * xRatio;
        this.viewport.xMax = xCenter + xRange * (1 - xRatio);
        this.viewport.yMin = yCenter - yRange * (1 - yRatio);
        this.viewport.yMax = yCenter + yRange * yRatio;
        this.render();
    },

    zoomAtCenter(factor) {
        const rect = this.canvas.getBoundingClientRect();
        this.zoom(factor, rect.width / 2, rect.height / 2);
    },

    resetView() {
        this.viewport = { ...this.defaultViewport };
        this.render();
    },

    /* ---- TOOLTIP ---- */
    handleTooltip(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const vp = this.viewport;
        const w = rect.width;
        const h = rect.height;
        const xCoord = vp.xMin + (mx / w) * (vp.xMax - vp.xMin);

        const points = [];
        this.functions.forEach((f, idx) => {
            if (!f.visible || !f.compiled) return;
            try {
                const yVal = f.compiled.evaluate({ x: xCoord });
                if (isFinite(yVal)) {
                    const py = this.yToPixel(yVal, h);
                    if (Math.abs(py - my) < 40) {
                        points.push({ idx, y: yVal, color: f.color, dist: Math.abs(py - my) });
                    }
                }
            } catch { }
        });

        if (points.length === 0) {
            this.tooltip.style.display = 'none';
            return;
        }

        points.sort((a, b) => a.dist - b.dist);
        const nearest = points.slice(0, 3);

        let html = `<div class="graph-tt-x">x = ${this.formatNum(nearest[0].x !== undefined ? nearest[0].x : xCoord)}</div>`;
        nearest.forEach(p => {
            html += `<div class="graph-tt-row">
                <span class="graph-tt-color" style="background:${p.color}"></span>
                <span>f<sub>${p.idx + 1}</sub>(x) = ${this.formatNum(p.y)}</span>
            </div>`;
        });

        this.tooltip.innerHTML = html;
        this.tooltip.style.display = 'block';

        let tx = mx + 15;
        let ty = my - 10;
        const tw = this.tooltip.offsetWidth;
        const th = this.tooltip.offsetHeight;
        if (tx + tw > w - 10) tx = mx - tw - 15;
        if (ty + th > h - 10) ty = h - th - 10;
        if (ty < 10) ty = 10;
        this.tooltip.style.left = tx + 'px';
        this.tooltip.style.top = ty + 'px';
    },

    /* ---- BIND EVENTS (CANVAS) ---- */
    bindEvents() {
        window.addEventListener('resize', () => this.resize());

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            this.zoom(e.deltaY > 0 ? 1.15 : 0.85, mx, my);
        }, { passive: false });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.isDragging = true;
                this.dragStart = { x: e.clientX, y: e.clientY };
                this.dragViewportStart = { ...this.viewport };
                this.canvas.style.cursor = 'grabbing';
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const rect = this.canvas.getBoundingClientRect();
                const dx = e.clientX - this.dragStart.x;
                const dy = e.clientY - this.dragStart.y;
                const vp = this.dragViewportStart;
                const w = rect.width;
                const h = rect.height;
                this.viewport.xMin = vp.xMin - (dx / w) * (vp.xMax - vp.xMin);
                this.viewport.xMax = vp.xMax - (dx / w) * (vp.xMax - vp.xMin);
                this.viewport.yMin = vp.yMin + (dy / h) * (vp.yMax - vp.yMin);
                this.viewport.yMax = vp.yMax + (dy / h) * (vp.yMax - vp.yMin);
                this.render();
            } else {
                this.handleTooltip(e);
            }
        });

        window.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.canvas.style.cursor = '';
            }
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.tooltip.style.display = 'none';
        });

        document.getElementById('graphZoomIn')?.addEventListener('click', () => this.zoomAtCenter(0.82));
        document.getElementById('graphZoomOut')?.addEventListener('click', () => this.zoomAtCenter(1.22));

        document.getElementById('graphCollapse')?.addEventListener('click', () => {
            const sb = document.getElementById('graphSidebar');
            const collapsed = sb.classList.toggle('collapsed');
            document.getElementById('graphCollapse').textContent = collapsed ? '»' : '«';
        });

        document.getElementById('graphUndo')?.addEventListener('click', () => this.undo());
        document.getElementById('graphRedo')?.addEventListener('click', () => this.redo());
    },

    /* ---- BIND KEYBOARD ---- */
    bindKeyboard() {
        document.querySelectorAll('#graphKeyboard [data-insert]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.insertSymbol(btn.dataset.insert);
            });
        });

        document.getElementById('keyBackspace')?.addEventListener('click', () => {
            this.backspace();
        });

        document.getElementById('keyArrowLeft')?.addEventListener('click', () => {
            this.moveCursor(-1);
        });

        document.getElementById('keyArrowRight')?.addEventListener('click', () => {
            this.moveCursor(1);
        });

        document.getElementById('keyEnter')?.addEventListener('click', () => {
            const input = this.getActiveInput();
            if (input) {
                const idx = parseInt(input.dataset.idx);
                this.editFunction(idx, input.value);
                const next = document.querySelector(`.func-input[data-idx="${idx + 1}"]`);
                if (next) next.focus();
            }
        });

        // Dropdown fonctions
        const toggle = document.getElementById('keyFuncsToggle');
        const menu = document.getElementById('keyFuncsMenu');
        toggle?.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('open');
        });

        menu?.querySelectorAll('.key-dd-item').forEach(item => {
            item.addEventListener('click', () => {
                this.insertSymbol(item.dataset.insert);
                menu.classList.remove('open');
            });
        });

        document.addEventListener('click', () => {
            menu?.classList.remove('open');
        });

        // ABC / Audio — placeholder
        document.getElementById('keyAbc')?.addEventListener('click', () => {
            this.showError('Clavier alphabétique (à venir)');
        });
        document.getElementById('keyAudio')?.addEventListener('click', () => {
            this.showError('Lecture audio (à venir)');
        });
    },

    /* ---- SIDEBAR ADD ---- */
    bindSidebar() {
        document.getElementById('graphAddBtn')?.addEventListener('click', () => {
            // Create a new empty entry
            const emptyIdx = this.functions.length;
            const color = this.colors[emptyIdx % this.colors.length];
            this.functions.push({ expr: '', color, visible: true, compiled: null });
            this.renderSidebar();
            this.render();
            const newInput = document.querySelector(`.func-input[data-idx="${emptyIdx}"]`);
            if (newInput) { newInput.focus(); }
        });
    },

    /* ---- INPUT HELPERS ---- */
    getActiveInput() {
        const active = document.activeElement;
        if (active && active.classList.contains('func-input')) return active;
        const first = document.querySelector('.func-input');
        if (first) return first;
        return null;
    },

    insertSymbol(text) {
        const input = this.getActiveInput();
        if (!input) return;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const before = input.value.substring(0, start);
        const after = input.value.substring(end);
        input.value = before + text + after;
        const newPos = start + text.length;
        input.setSelectionRange(newPos, newPos);
        input.focus();

        const idx = parseInt(input.dataset.idx);
        const fn = this.functions[idx];
        if (fn) {
            fn.expr = input.value;
            const c = this.compileSafe(input.value);
            fn.compiled = c;
            if (c) { this.render(); }
        }
    },

    backspace() {
        const input = this.getActiveInput();
        if (!input) return;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        if (start > 0 && start === end) {
            input.value = input.value.substring(0, start - 1) + input.value.substring(end);
            input.setSelectionRange(start - 1, start - 1);
        } else {
            input.value = input.value.substring(0, start) + input.value.substring(end);
            input.setSelectionRange(start, start);
        }
        input.focus();

        const idx = parseInt(input.dataset.idx);
        const fn = this.functions[idx];
        if (fn) {
            fn.expr = input.value;
            const c = this.compileSafe(input.value);
            fn.compiled = c;
            if (c) { this.render(); }
        }
    },

    moveCursor(dir) {
        const input = this.getActiveInput();
        if (!input) return;
        const pos = input.selectionStart + dir;
        if (pos >= 0 && pos <= input.value.length) {
            input.setSelectionRange(pos, pos);
        }
        input.focus();
    },

    showError(msg) {
        let el = document.getElementById('graphError');
        if (!el) {
            el = document.createElement('div');
            el.id = 'graphError';
            el.style.cssText = 'display:block;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--bg-card);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:12px 20px;color:#f87171;font-size:13px;z-index:50;font-family:DM Sans,sans-serif;text-align:center;';
            this.canvas.parentElement.appendChild(el);
        }
        el.textContent = msg;
        el.style.display = 'block';
        clearTimeout(this._errorTimer);
        this._errorTimer = setTimeout(() => { if (el) el.style.display = 'none'; }, 3000);
    },

    /* ---- HELPERS ---- */
    xToPixel(x, w) {
        const vp = this.viewport;
        return ((x - vp.xMin) / (vp.xMax - vp.xMin)) * w;
    },

    yToPixel(y, h) {
        const vp = this.viewport;
        return (1 - (y - vp.yMin) / (vp.yMax - vp.yMin)) * h;
    },

    niceStep(range) {
        const rough = range / 6;
        const mag = Math.pow(10, Math.floor(Math.log10(rough)));
        const norm = rough / mag;
        let step;
        if (norm < 1.5) step = 1;
        else if (norm < 3.5) step = 2;
        else if (norm < 7.5) step = 5;
        else step = 10;
        return step * mag;
    },

    formatNum(n) {
        if (Math.abs(n) < 1e-10) return '0';
        if (Math.abs(n) >= 10000 || (Math.abs(n) < 0.001 && n !== 0)) {
            return n.toExponential(2);
        }
        return parseFloat(n.toPrecision(6)).toString();
    },

    esc(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
};

document.addEventListener('DOMContentLoaded', () => GraphApp.init());
