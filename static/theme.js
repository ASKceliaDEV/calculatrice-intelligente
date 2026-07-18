const ThemeManager = {
    KEY: 'appTheme',

    init() {
        const saved = localStorage.getItem(this.KEY);
        if (saved === 'light') {
            document.body.classList.add('light-mode');
        }
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.addEventListener('click', () => this.toggle());
        }
    },

    toggle() {
        const isLight = document.body.classList.toggle('light-mode');
        localStorage.setItem(this.KEY, isLight ? 'light' : 'dark');
    }
};

document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
