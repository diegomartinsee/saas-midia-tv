// Preload: Control Panel
// Exposes safe APIs to control panel renderer

const { contextBridge, ipcRenderer } = require('electron');

// Expose APIs to renderer
contextBridge.exposeInMainWorld('api', {
    // Config
    getConfig: () => ipcRenderer.invoke('config:get'),
    updateConfig: (config) => ipcRenderer.invoke('config:update', config),

    // Ads
    getAds: () => ipcRenderer.invoke('ads:get'),
    addAd: (filePath) => ipcRenderer.invoke('ads:add', filePath),
    removeAd: (adId) => ipcRenderer.invoke('ads:remove', adId),
    pickFile: () => ipcRenderer.invoke('ads:pick-file'),

    // State
    getState: () => ipcRenderer.invoke('state:get'),

    // System
    startSystem: () => ipcRenderer.invoke('system:start'),
    pauseSystem: () => ipcRenderer.invoke('system:pause'),

    // Events
    onStateChanged: (callback) => {
        ipcRenderer.on('state:changed', (event, data) => callback(data));
    }
});
