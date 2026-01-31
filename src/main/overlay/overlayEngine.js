// Overlay Engine: Manages overlay window state machine
// Based on saas_midia_tv_overlay_engine.md

const { powerSaveBlocker, globalShortcut } = require('electron');

const STATES = {
    HIDDEN: 'HIDDEN',
    PREPARING: 'PREPARING',
    DISPLAYING: 'DISPLAYING',
    FINISHING: 'FINISHING'
};

class OverlayEngine {
    constructor(window) {
        this.window = window;
        this.state = STATES.HIDDEN;
        this.currentAdId = null;
        this.focusPollingInterval = null;
        this.powerBlockerId = null;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle focus lost during display
        this.window.on('blur', () => {
            if (this.state === STATES.DISPLAYING) {
                // Force focus back immediately if we are still supposed to be showing
                this.window.focus();
                this.window.moveTop();
            }
        });
    }

    show(ad) {
        if (this.state !== STATES.HIDDEN) {
            console.log('Overlay already active, skipping');
            return;
        }

        this.currentAdId = ad.id;
        this.transitionTo(STATES.PREPARING);

        // Refresh bounds for current display
        const { screen } = require('electron');
        const primaryDisplay = screen.getPrimaryDisplay();
        this.window.setBounds(primaryDisplay.bounds);

        // Ensure window is in standard state before showing
        if (this.window.isMinimized()) {
            this.window.restore();
        }

        // Send command to renderer to load media
        this.window.webContents.send('overlay:load', {
            filePath: ad.filePath,
            type: ad.type,
            duration: ad.duration
        });
    }

    /**
     * Called when media is ready to play
     */
    onMediaReady() {
        if (this.state !== STATES.PREPARING) {
            return;
        }

        this.transitionTo(STATES.DISPLAYING);

        // Make visible and steal focus
        this.window.setIgnoreMouseEvents(false);
        this.window.setOpacity(1);

        if (this.window.isMinimized()) {
            this.window.restore();
        }

        this.window.setFullScreen(true);
        this.window.show();
        this.window.setAlwaysOnTop(true, 'screen-saver');
        this.window.focus();
        this.window.moveTop();

        // Block screensaver
        this.powerBlockerId = powerSaveBlocker.start('prevent-display-sleep');

        // Start focus polling
        this.startFocusPolling();

        // Block Alt+Tab
        try {
            globalShortcut.register('Alt+Tab', () => {
                // Do nothing (block)
            });
        } catch (err) {
            console.error('Failed to register Alt+Tab shortcut:', err);
        }

        // Tell renderer to play
        this.window.webContents.send('overlay:play');
    }

    /**
     * Called when media finished playing
     */
    onMediaFinished() {
        if (this.state !== STATES.DISPLAYING) {
            return;
        }

        this.transitionTo(STATES.FINISHING);

        // 1. CLEAR FOCUS & INPUT PRIORITY IMMEDIATELY
        this.window.setIgnoreMouseEvents(true);
        this.window.setAlwaysOnTop(false);
        this.stopFocusPolling();

        // 2. Unregister global hooks
        try {
            globalShortcut.unregister('Alt+Tab');
        } catch (err) {
            // Ignore
        }

        // 3. Stop sleep blocker
        if (this.powerBlockerId !== null) {
            powerSaveBlocker.stop(this.powerBlockerId);
            this.powerBlockerId = null;
        }

        // 4. HIDE INSTANTLY
        this.hide();
    }

    /**
     * Hide overlay
     */
    hide() {
        this.transitionTo(STATES.HIDDEN);

        // 1. Drop FullScreen first to help OS re-render
        this.window.setFullScreen(false);

        // 2. MINIMIZE window to force focus return (The "Alt-Tab" trick)
        this.window.setIgnoreMouseEvents(true);
        this.window.minimize();

        // 3. Hide from OS entirely after a tiny delay
        setTimeout(() => {
            this.window.hide();
            this.window.setOpacity(0);

            // Clear renderer content
            this.window.webContents.send('overlay:clear');
        }, 50);

        // Emit finished event
        if (this.onFinished) {
            this.onFinished(this.currentAdId);
        }
    }

    /**
     * Start focus polling (every 100ms)
     */
    startFocusPolling() {
        this.focusPollingInterval = setInterval(() => {
            if (!this.window.isFocused()) {
                this.window.focus();
                this.window.moveTop();
            }
        }, 100);
    }

    /**
     * Stop focus polling
     */
    stopFocusPolling() {
        if (this.focusPollingInterval) {
            clearInterval(this.focusPollingInterval);
            this.focusPollingInterval = null;
        }
    }

    /**
     * Transition to new state
     * @param {string} newState - New state
     */
    transitionTo(newState) {
        console.log(`Overlay: ${this.state} → ${newState}`);
        this.state = newState;
    }

    /**
     * Get current state
     * @returns {string} Current state
     */
    getState() {
        return this.state;
    }
}

module.exports = { OverlayEngine, STATES };
