// Storage: State persistence
// Handles reading/writing state.json (volatile runtime state)

const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');

function getConfigDir() {
    return path.join(app.getPath('userData'));
}

function getStateFile() {
    return path.join(getConfigDir(), 'state.json');
}

const DEFAULT_STATE = {
    version: '1.0.0',
    systemState: {
        isActive: false,
        lastSlotId: null,
        currentAdIndex: 0,
        totalDisplaysToday: 0,
        lastDisplayAt: null
    },
    scheduler: {
        nextSlotTime: null,
        lastCheckTime: null
    }
};

/**
 * Load state
 * @returns {Promise<Object>} State object
 */
async function loadState() {
    try {
        const data = await fs.readFile(getStateFile(), 'utf-8');
        const state = JSON.parse(data);

        // Validate lastSlotId (discard if too old)
        if (state.systemState && state.systemState.lastSlotId) {
            const slotTime = new Date(state.systemState.lastSlotId);
            const now = new Date();
            const hoursSince = (now - slotTime) / (1000 * 60 * 60);

            if (hoursSince > 1) {
                // Slot too old, reset
                state.systemState.lastSlotId = null;
            }
        }

        return {
            ...DEFAULT_STATE,
            ...state,
            systemState: { ...DEFAULT_STATE.systemState, ...state.systemState },
            scheduler: { ...DEFAULT_STATE.scheduler, ...state.scheduler }
        };
    } catch (err) {
        if (err.code === 'ENOENT') {
            return { ...DEFAULT_STATE };
        }
        console.error('Failed to load state:', err);
        return { ...DEFAULT_STATE };
    }
}

/**
 * Save state (atomic write)
 * @param {Object} state - State to save
 * @returns {Promise<boolean>} Success status
 */
async function saveState(state) {
    try {
        const stateFile = getStateFile();
        // Backup
        try {
            await fs.copyFile(stateFile, `${stateFile}.bak`);
        } catch (err) {
            // Ignore
        }

        // Atomic write
        const tempFile = `${stateFile}.tmp`;
        await fs.writeFile(tempFile, JSON.stringify(state, null, 2), 'utf-8');
        await fs.rename(tempFile, stateFile);

        return true;
    } catch (err) {
        console.error('Failed to save state:', err);
        return false;
    }
}

module.exports = {
    loadState,
    saveState
};
