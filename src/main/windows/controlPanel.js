// Window Manager: Control Panel Window
// Creates and manages control panel UI

const { BrowserWindow } = require('electron');
const path = require('path');

function createControlPanelWindow() {
    const window = new BrowserWindow({
        width: 600,
        height: 700,
        resizable: false,
        frame: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, '../../preload/controlPanel.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    window.loadFile(path.join(__dirname, '../../renderer/controlPanel/index.html'));

    window.once('ready-to-show', () => {
        window.show();
    });

    // Minimize to tray instead of closing
    window.on('close', (event) => {
        if (!window.isQuitting) {
            event.preventDefault();
            window.hide();
        }
    });

    return window;
}

module.exports = { createControlPanelWindow };
