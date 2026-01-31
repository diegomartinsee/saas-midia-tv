// IPC Handlers: Communication between Main and Renderer
// Implements all IPC channels defined in architecture

const { ipcMain, dialog } = require('electron');
const fs = require('fs').promises;
const path = require('path');

function setupIpcHandlers(app) {
    const { config, ads, state, scheduler, overlayEngine } = app;

    // Config handlers
    ipcMain.handle('config:get', async () => {
        return config;
    });

    ipcMain.handle('config:update', async (event, newConfig) => {
        Object.assign(config, newConfig);
        const { saveConfig } = require('../storage/config');
        await saveConfig(config);
        scheduler.updateConfig(config.displayConfig);
        return { success: true };
    });

    // Ads handlers
    ipcMain.handle('ads:get', async () => {
        return ads;
    });

    ipcMain.handle('ads:add', async (event, filePath) => {
        try {
            // Validate file exists
            await fs.access(filePath);

            // Detect type and duration
            const ext = path.extname(filePath).toLowerCase();
            const validExtensions = ['.mp4', '.webm', '.jpg', '.jpeg', '.png'];

            if (!validExtensions.includes(ext)) {
                return { success: false, error: 'Formato não suportado. Use MP4, WEBM, JPG ou PNG.' };
            }

            const type = ['.mp4', '.webm'].includes(ext) ? 'video' : 'image';
            const duration = type === 'video' ? 30 : config.displayConfig.defaultImageDuration; // Default, will be detected later

            const ad = {
                id: `ad-${Date.now()}`,
                filePath,
                fileName: path.basename(filePath),
                type,
                duration,
                addedAt: new Date().toISOString(),
                status: 'valid'
            };

            ads.ads.push(ad);
            const { saveAds } = require('../storage/ads');
            await saveAds(ads);

            return { success: true, adId: ad.id };
        } catch (err) {
            return { success: false, error: 'Arquivo não encontrado.' };
        }
    });

    ipcMain.handle('ads:remove', async (event, adId) => {
        const index = ads.ads.findIndex(ad => ad.id === adId);
        if (index !== -1) {
            ads.ads.splice(index, 1);
            const { saveAds } = require('../storage/ads');
            await saveAds(ads);
            return { success: true };
        }
        return { success: false };
    });

    ipcMain.handle('ads:pick-file', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'Mídia', extensions: ['mp4', 'webm', 'jpg', 'jpeg', 'png'] },
                { name: 'Vídeos', extensions: ['mp4', 'webm'] },
                { name: 'Imagens', extensions: ['jpg', 'jpeg', 'png'] }
            ]
        });

        if (!result.canceled && result.filePaths.length > 0) {
            return { success: true, filePaths: result.filePaths };
        }
        return { success: false };
    });

    // State handlers
    ipcMain.handle('state:get', async () => {
        return state;
    });

    // System control handlers
    ipcMain.handle('system:start', async () => {
        state.systemState.isActive = true;
        const { saveState } = require('../storage/state');
        await saveState(state);
        app.startScheduler();
        return { success: true };
    });

    ipcMain.handle('system:pause', async () => {
        state.systemState.isActive = false;
        const { saveState } = require('../storage/state');
        await saveState(state);
        app.stopScheduler();
        return { success: true };
    });

    // Overlay finished
    ipcMain.on('overlay:finished', (event, data) => {
        if (app.onAdFinished) {
            app.onAdFinished(data.adId, data.duration);
        }
    });
}

module.exports = { setupIpcHandlers };
