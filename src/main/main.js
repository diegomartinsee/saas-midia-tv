// Main Process Entry Point
// Orchestrates all components

const { app, BrowserWindow } = require('electron');
const path = require('path');

// Import modules
const { Scheduler } = require('./scheduler/scheduler');
const { OverlayEngine } = require('./overlay/overlayEngine');
const { createOverlayWindow } = require('./windows/overlay');
const { createControlPanelWindow } = require('./windows/controlPanel');
const { SystemTray } = require('./tray/systemTray');
const { setupIpcHandlers } = require('./ipc/handlers');
const { loadConfig, saveConfig } = require('./storage/config');
const { loadAds, saveAds } = require('./storage/ads');
const { loadState, saveState } = require('./storage/state');

// Global state
let appState = {
    config: null,
    ads: null,
    state: null,
    scheduler: null,
    overlayEngine: null,
    overlayWindow: null,
    controlPanelWindow: null,
    systemTray: null,
    checkInterval: null
};

// Ensure only one instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (appState.controlPanelWindow) {
            if (appState.controlPanelWindow.isMinimized()) {
                appState.controlPanelWindow.restore();
            }
            appState.controlPanelWindow.focus();
        }
    });
}

app.whenReady().then(async () => {
    await initialize();
});

app.on('window-all-closed', () => {
    // Don't quit on window close (we have tray)
});

app.on('before-quit', () => {
    // Mark that we're quitting
    if (appState.controlPanelWindow) {
        appState.controlPanelWindow.isQuitting = true;
    }
});

async function initialize() {
    // Load persistent data
    appState.config = await loadConfig();
    appState.ads = await loadAds();
    appState.state = await loadState();

    // Initialize scheduler
    appState.scheduler = new Scheduler(appState.config.displayConfig);
    if (appState.state.systemState.lastSlotId) {
        appState.scheduler.lastPlayedSlotId = appState.state.systemState.lastSlotId;
    }

    // Create windows
    appState.overlayWindow = createOverlayWindow();
    appState.controlPanelWindow = createControlPanelWindow();

    // Initialize overlay engine
    appState.overlayEngine = new OverlayEngine(appState.overlayWindow);
    appState.overlayEngine.onFinished = (adId) => {
        handleAdFinished(adId);
    };

    // Setup IPC
    setupIpcHandlers({
        config: appState.config,
        ads: appState.ads,
        state: appState.state,
        scheduler: appState.scheduler,
        overlayEngine: appState.overlayEngine,
        startScheduler: () => startSchedulerCheck(),
        stopScheduler: () => stopSchedulerCheck()
    });

    // Create system tray
    appState.systemTray = new SystemTray({
        state: appState.state,
        scheduler: appState.scheduler,
        controlPanelWindow: appState.controlPanelWindow,
        pauseSystem: () => pauseSystem(),
        startSystem: () => startSystem(),
        quit: () => quitApp()
    });
    appState.systemTray.create();

    // Start scheduler if system was active
    if (appState.state.systemState.isActive) {
        startSchedulerCheck();
    }

    // Update tray every second
    setInterval(() => {
        if (appState.systemTray) {
            appState.systemTray.updateMenu();
        }

        // Send updates to control panel if open
        if (appState.controlPanelWindow && !appState.controlPanelWindow.isDestroyed()) {
            const timeToNext = appState.scheduler.getTimeToNextSlot();
            appState.controlPanelWindow.webContents.send('state:changed', {
                isActive: appState.state.systemState.isActive,
                timeToNext
            });
        }
    }, 1000);
}

function startSchedulerCheck() {
    if (appState.checkInterval) {
        return; // Already running
    }

    console.log('Starting scheduler');
    appState.checkInterval = setInterval(() => {
        checkScheduler();
    }, 1000); // Check every second
}

function stopSchedulerCheck() {
    if (appState.checkInterval) {
        console.log('Stopping scheduler');
        clearInterval(appState.checkInterval);
        appState.checkInterval = null;
    }
}

function checkScheduler() {
    // Check if we have ads
    if (!appState.ads.ads || appState.ads.ads.length === 0) {
        return;
    }

    // Check if it's time to display
    const result = appState.scheduler.check();

    if (result.shouldPlay) {
        // Get next ad
        const ad = getNextAd();
        if (ad) {
            displayAd(ad, result.slotId);
        }
    }
}

function getNextAd() {
    const validAds = appState.ads.ads.filter(ad => ad.status === 'valid');
    if (validAds.length === 0) {
        return null;
    }

    // Round-robin selection
    const index = appState.state.systemState.currentAdIndex % validAds.length;
    const ad = validAds[index];

    // Update index for next time
    appState.state.systemState.currentAdIndex = (index + 1) % validAds.length;

    return ad;
}

function displayAd(ad, slotId) {
    console.log(`Displaying ad: ${ad.fileName} for slot ${slotId}`);

    // Mark slot as played immediately to prevent duplicate display
    appState.scheduler.markPlayed(slotId);
    appState.state.systemState.lastSlotId = slotId;
    saveState(appState.state);

    // Show overlay
    // Override duration for images with current global config
    const adToShow = { ...ad };
    if (adToShow.type === 'image') {
        adToShow.duration = appState.config.displayConfig.defaultImageDuration;
    }

    appState.overlayEngine.show(adToShow);
}

function handleAdFinished(adId) {
    console.log(`Ad finished: ${adId}`);

    // Update stats
    appState.state.systemState.totalDisplaysToday++;
    appState.state.systemState.lastDisplayAt = new Date().toISOString();
    saveState(appState.state);
}

function startSystem() {
    appState.state.systemState.isActive = true;
    saveState(appState.state);
    startSchedulerCheck();
    appState.systemTray.updateMenu();
}

function pauseSystem() {
    appState.state.systemState.isActive = false;
    saveState(appState.state);
    stopSchedulerCheck();
    appState.systemTray.updateMenu();
}

function quitApp() {
    appState.controlPanelWindow.isQuitting = true;
    app.quit();
}

// Handle overlay IPC events
const { ipcMain } = require('electron');

ipcMain.on('overlay:media-ready', () => {
    appState.overlayEngine.onMediaReady();
});

ipcMain.on('overlay:media-finished', (event, data) => {
    appState.overlayEngine.onMediaFinished();
});

ipcMain.on('overlay:media-error', (event, data) => {
    console.error('Media error:', data);
    // Mark ad as corrupted
    const ad = appState.ads.ads.find(a => a.id === data.adId);
    if (ad) {
        ad.status = 'corrupted';
        saveAds(appState.ads);
    }
    // Hide overlay
    appState.overlayEngine.hide();
});
