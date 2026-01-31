// Storage: Ads persistence
// Handles reading/writing ads.json

const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');

function getConfigDir() {
    return path.join(app.getPath('userData'));
}

function getAdsFile() {
    return path.join(getConfigDir(), 'ads.json');
}

const DEFAULT_ADS = {
    version: '1.0.0',
    ads: []
};

/**
 * Load ads list
 * @returns {Promise<Object>} Ads object
 */
async function loadAds() {
    try {
        const data = await fs.readFile(getAdsFile(), 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            return { ...DEFAULT_ADS };
        }
        console.error('Failed to load ads:', err);
        return { ...DEFAULT_ADS };
    }
}

/**
 * Save ads list (atomic write)
 * @param {Object} adsData - Ads data to save
 * @returns {Promise<boolean>} Success status
 */
async function saveAds(adsData) {
    try {
        const adsFile = getAdsFile();
        // Backup
        try {
            await fs.copyFile(adsFile, `${adsFile}.bak`);
        } catch (err) {
            // Ignore
        }

        // Atomic write
        const tempFile = `${adsFile}.tmp`;
        await fs.writeFile(tempFile, JSON.stringify(adsData, null, 2), 'utf-8');
        await fs.rename(tempFile, adsFile);

        return true;
    } catch (err) {
        console.error('Failed to save ads:', err);
        return false;
    }
}

module.exports = {
    loadAds,
    saveAds
};
