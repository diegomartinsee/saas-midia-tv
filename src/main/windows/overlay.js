// Window Manager: Overlay Window
// Creates and manages fullscreen overlay window

const { BrowserWindow, screen } = require('electron');
const path = require('path');

function createOverlayWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.bounds;

    const window = new BrowserWindow({
        x: primaryDisplay.bounds.x,
        y: primaryDisplay.bounds.y,
        width,
        height,
        fullscreen: true,
        frame: false,
        resizable: false,
        movable: false,
        maximizable: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        hasShadow: false,
        focusable: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, '../../preload/overlay.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    // Initial state: invisible and click-through
    window.setIgnoreMouseEvents(true);
    window.setOpacity(0);

    // Load overlay HTML
    window.loadFile(path.join(__dirname, '../../renderer/overlay/index.html'));

    // Prevent closing
    window.on('close', (event) => {
        event.preventDefault();
        // Don't actually close, just hide
    });

    return window;
}

module.exports = { createOverlayWindow };
