const HistoryManager = {
    history: [],
    archive: [],
    MAX_HISTORY: 100,
    STORAGE_HISTORY: 'calcHistory',
    STORAGE_ARCHIVE: 'calcArchive',

    init() {
        this.load();
        this.renderHistory();
        this.renderArchive();
        this.bindEvents();
        this.syncTabVisibility();
    },

    load() {
        try {
            this.history = JSON.parse(localStorage.getItem(this.STORAGE_HISTORY)) || [];
            this.archive = JSON.parse(localStorage.getItem(this.STORAGE_ARCHIVE)) || [];
        } catch {
            this.history = [];
            this.archive = [];
        }
    },

    save() {
        localStorage.setItem(this.STORAGE_HISTORY, JSON.stringify(this.history));
        localStorage.setItem(this.STORAGE_ARCHIVE, JSON.stringify(this.archive));
    },

    addHistory(expression, result) {
        result = String(result);
        const entry = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
            expression: String(expression),
            result: result,
            timestamp: Date.now()
        };
        this.history.unshift(entry);
        if (this.history.length > this.MAX_HISTORY) {
            this.history = this.history.slice(0, this.MAX_HISTORY);
        }
        this.save();
        this.renderHistory();
    },

    archiveItem(id) {
        const idx = this.history.findIndex(e => e.id === id);
        if (idx === -1) return;
        const entry = this.history.splice(idx, 1)[0];
        this.archive.unshift(entry);
        this.save();
        this.renderHistory();
        this.renderArchive();
    },

    deleteHistoryItem(id) {
        this.history = this.history.filter(e => e.id !== id);
        this.save();
        this.renderHistory();
    },

    deleteArchiveItem(id) {
        this.archive = this.archive.filter(e => e.id !== id);
        this.save();
        this.renderArchive();
    },

    clearHistory() {
        if (!confirm('Vider tout l\'historique ?')) return;
        this.history = [];
        this.save();
        this.renderHistory();
    },

    clearArchive() {
        if (!confirm('Vider toutes les archives ?')) return;
        this.archive = [];
        this.save();
        this.renderArchive();
    },

    exportHistory() {
        const all = [...this.history, ...this.archive];
        if (all.length === 0) {
            alert('Aucun calcul à exporter.');
            return;
        }
        const lines = all.map(e => `${e.expression} = ${e.result}`);
        const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().slice(0, 10);
        a.download = `historique_calculs_${date}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    restoreItem(expression, result) {
        const display = document.getElementById('display');
        if (!display) return;
        display.value = result || expression;
        document.dispatchEvent(new CustomEvent('historyRestore', {
            detail: { expression, result }
        }));
        const event = new Event('input', { bubbles: true });
        display.dispatchEvent(event);
    },

    renderHistory() {
        const list = document.getElementById('historyList');
        if (!list) return;
        if (this.history.length === 0) {
            list.innerHTML = '<div class="history-empty">Aucun calcul pour l\'instant</div>';
            return;
        }
        list.innerHTML = this.history.map(e => `
            <div class="history-item" data-id="${this.esc(e.id)}">
                <div class="history-item-header">
                    <div class="history-expression" data-restore="${this.esc(e.id)}">
                        ${this.esc(e.expression)} =
                    </div>
                    <button class="history-archive-btn" data-archive="${this.esc(e.id)}" title="Archiver">📌</button>
                </div>
                <div class="history-result" data-restore="${this.esc(e.id)}">
                    ${this.esc(e.result)}
                </div>
            </div>
        `).join('');
        this.bindItemEvents();
    },

    renderArchive() {
        const list = document.getElementById('archiveList');
        if (!list) return;
        if (this.archive.length === 0) {
            list.innerHTML = '<div class="history-empty">Aucune archive</div>';
            return;
        }
        list.innerHTML = this.archive.map(e => `
            <div class="history-item" data-id="${this.esc(e.id)}">
                <div class="history-item-header">
                    <div class="history-expression" data-restore="${this.esc(e.id)}">
                        ${this.esc(e.expression)} =
                    </div>
                    <button class="history-archive-btn" data-unarchive="${this.esc(e.id)}" title="Supprimer">🗑️</button>
                </div>
                <div class="history-result" data-restore="${this.esc(e.id)}">
                    ${this.esc(e.result)}
                </div>
            </div>
        `).join('');
        this.bindItemEvents();
    },

    bindItemEvents() {
        document.querySelectorAll('[data-restore]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = el.dataset.restore;
                const entry = this.history.find(h => h.id === id) || this.archive.find(a => a.id === id);
                if (entry) this.restoreItem(entry.expression, entry.result);
            });
        });
        document.querySelectorAll('[data-archive]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                this.archiveItem(el.dataset.archive);
            });
        });
        document.querySelectorAll('[data-unarchive]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteArchiveItem(el.dataset.unarchive);
            });
        });
    },

    bindEvents() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                if (tab.classList.contains('tab-icon')) return;
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.syncTabVisibility();
            });
        });

        document.getElementById('exportHistory')?.addEventListener('click', () => this.exportHistory());
        document.getElementById('clearHistoryBtn')?.addEventListener('click', () => this.clearHistory());
        document.getElementById('printHistory')?.addEventListener('click', () => window.print());
    },

    syncTabVisibility() {
        const activeTab = document.querySelector('.tab.active');
        const isArchive = activeTab && activeTab.textContent.trim() === 'Archive';
        const hl = document.getElementById('historyList');
        const al = document.getElementById('archiveList');
        if (hl) hl.style.display = isArchive ? 'none' : '';
        if (al) al.style.display = isArchive ? '' : 'none';
    },

    esc(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
};

document.addEventListener('DOMContentLoaded', () => HistoryManager.init());
