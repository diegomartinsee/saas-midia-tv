// System Tray: Manages tray icon and menu
// Based on saas_midia_tv_pill_design.md

const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');

class SystemTray {
    constructor(app) {
        this.app = app;
        this.tray = null;
    }

    create() {
        // Create tray icon (using a simple colored square for now)
        // In production, use proper icon files
        const icon = nativeImage.createEmpty();
        this.tray = new Tray(icon);
        this.tray.setToolTip('SaaS Mídia TV');

        this.updateMenu();
    }

    updateMenu() {
        const { state } = this.app;
        const isActive = state.systemState.isActive;

        const menu = Menu.buildFromTemplate([
            {
                label: isActive ? '● ATIVO' : '○ PAUSADO',
                enabled: false
            },
            {
                label: this.getNextAdText(),
                enabled: false
            },
            { type: 'separator' },
            {
                label: '📊 Abrir Painel',
                click: () => {
                    this.app.controlPanelWindow.show();
                }
            },
            {
                label: isActive ? '⏸  Pausar Sistema' : '▶  Retomar Sistema',
                click: () => {
                    if (isActive) {
                        this.app.pauseSystem();
                    } else {
                        this.app.startSystem();
                    }
                }
            },
            { type: 'separator' },
            {
                label: '❌ Sair',
                click: () => {
                    this.app.quit();
                }
            }
        ]);

        this.tray.setContextMenu(menu);
    }

    getNextAdText() {
        const { state, scheduler } = this.app;

        if (!state.systemState.isActive) {
            return 'Sistema pausado';
        }

        const ms = scheduler.getTimeToNextSlot();
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `Próxima propaganda: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

module.exports = { SystemTray };
