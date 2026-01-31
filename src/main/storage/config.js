// Storage: Config persistence
// Handles reading/writing config.json with atomic operations

const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');

// Lazy-load paths to avoid calling app.getPath() before ready
function getConfigDir() {
    return path.join(app.getPath('userData'));
}

function getConfigFile() {
    return path.join(getConfigDir(), 'config.json');
}

const DEFAULT_CONFIG = {
    version: '1.0.0',
    displayConfig: {
        adsPerHour: 6,
        slotIntervalMinutes: 10,
        defaultImageDuration: 15,
        autoStart: false,
        enableSound: true
    },
    ui: {
        pillPosition: null,
        windowPosition: { x: 100, y: 100 }
    },
    system: {
        firstRunCompleted: false,
        installDate: new Date().toISOString()
    }
};

/**
 * Ensure config directory exists
 */
async function ensureConfigDir() {
    try {
        await fs.mkdir(getConfigDir(), { recursive: true });
    } catch (err) {
        console.error('Failed to create config directory:', err);
    }
}

/**
 * Load configuration
 * @returns {Promise<Object>} Configuration object
 */
async function loadConfig() {
    await ensureConfigDir();

    try {
        const data = await fs.readFile(getConfigFile(), 'utf-8');
        const config = JSON.parse(data);

        // Merge with defaults for missing fields
        return {
            ...DEFAULT_CONFIG,
            ...config,
            displayConfig: { ...DEFAULT_CONFIG.displayConfig, ...config.displayConfig },
            ui: { ...DEFAULT_CONFIG.ui, ...config.ui },
            system: { ...DEFAULT_CONFIG.system, ...config.system }
        };
    } catch (err) {
        if (err.code === 'ENOENT') {
            // File doesn't exist, return default
            return { ...DEFAULT_CONFIG };
        }
        console.error('Failed to load config:', err);
        return { ...DEFAULT_CONFIG };
    }
}

/**
 * Save configuration (atomic write)
 * @param {Object} config - Configuration to save
 * @returns {Promise<boolean>} Success status
 */
async function saveConfig(config) {
    await ensureConfigDir();

    try {
        // Backup existing file
        try {
            const configFile = getConfigFile();
            await fs.copyFile(configFile, `${configFile}.bak`);
        } catch (err) {
            // Ignore if file doesn't exist yet
        }

        // Write to temp file first
        const configFile = getConfigFile();
        const tempFile = `${configFile}.tmp`;
        await fs.writeFile(tempFile, JSON.stringify(config, null, 2), 'utf-8');

        // Atomic rename
        await fs.rename(tempFile, configFile);

        return true;
    } catch (err) {
        console.error('Failed to save config:', err);
        return false;
    }
}

module.exports = {
    loadConfig,
    saveConfig,
    DEFAULT_CONFIG
};
