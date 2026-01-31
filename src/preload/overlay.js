// Preload: Overlay
// Exposes safe APIs to overlay renderer

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Receive commands from Main
    onLoad: (callback) => {
        ipcRenderer.on('overlay:load', (event, data) => callback(data));
    },

    onPlay: (callback) => {
        ipcRenderer.on('overlay:play', (event) => callback());
    },

    onClear: (callback) => {
        ipcRenderer.on('overlay:clear', (event) => callback());
    },

    // Send events to Main
    mediaReady: () => {
        ipcRenderer.send('overlay:media-ready');
    },

    mediaFinished: (data) => {
        ipcRenderer.send('overlay:media-finished', data);
    },

    mediaError: (data) => {
        ipcRenderer.send('overlay:media-error', data);
    }
});
