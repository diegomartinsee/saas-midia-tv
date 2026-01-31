// Scheduler: Deterministic ad slot calculation
// Based on saas_midia_tv_scheduler_design.md

class Scheduler {
    constructor(config) {
        this.adsPerHour = config.adsPerHour || 6;
        this.slotIntervalMin = 60 / this.adsPerHour;
        this.lastPlayedSlotId = null;
    }

    /**
     * Check if current time matches an ad slot
     * @returns {Object} { shouldPlay: boolean, slotId?: string, reason?: string }
     */
    check() {
        const now = new Date();
        const currentMinute = now.getMinutes();

        // Calculate current slot start
        const anchorMinute = Math.floor(currentMinute / this.slotIntervalMin) * this.slotIntervalMin;
        const slotDate = new Date(now);
        slotDate.setMinutes(anchorMinute, 0, 0);

        const slotId = slotDate.toISOString();

        // Check if slot is within tolerance window (half interval)
        const diffMs = now - slotDate;
        const toleranceMs = (this.slotIntervalMin * 60 * 1000) / 2;

        if (diffMs > toleranceMs) {
            return { shouldPlay: false, reason: 'outside_window' };
        }

        // Check if already played
        if (this.lastPlayedSlotId === slotId) {
            return { shouldPlay: false, reason: 'already_played' };
        }

        return { shouldPlay: true, slotId };
    }

    /**
     * Mark a slot as played
     * @param {string} slotId - ISO timestamp of slot
     */
    markPlayed(slotId) {
        this.lastPlayedSlotId = slotId;
    }

    /**
     * Get time in milliseconds until next slot
     * @returns {number} Milliseconds until next slot
     */
    getTimeToNextSlot() {
        const now = new Date();
        const currentMinute = now.getMinutes();
        const intervalMs = this.slotIntervalMin * 60 * 1000;

        // Current logical slot start
        const anchorMinute = Math.floor(currentMinute / this.slotIntervalMin) * this.slotIntervalMin;
        const currentSlotDate = new Date(now);
        currentSlotDate.setMinutes(anchorMinute, 0, 0);

        // Check if current slot is still valid and unplayed
        const toleranceMs = intervalMs / 2;
        const diffMs = now - currentSlotDate;
        const currentSlotId = currentSlotDate.toISOString();

        if (diffMs <= toleranceMs && this.lastPlayedSlotId !== currentSlotId) {
            return 0; // Should play now
        }

        // Calculate next slot
        const nextSlotDate = new Date(currentSlotDate.getTime() + intervalMs);
        return Math.max(0, nextSlotDate - now);
    }

    /**
     * Update configuration
     * @param {Object} config - New configuration
     */
    updateConfig(config) {
        this.adsPerHour = config.adsPerHour || this.adsPerHour;
        this.slotIntervalMin = 60 / this.adsPerHour;
    }
}

module.exports = { Scheduler };
