// Control Panel Renderer Logic

let config = null;
let ads = null;
let state = null;

// DOM elements
const dom = {
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    nextAdTime: document.getElementById('nextAdTime'),
    dropZone: document.getElementById('dropZone'),
    errorMessage: document.getElementById('errorMessage'),
    adsList: document.getElementById('adsList'),
    adsCount: document.getElementById('adsCount'),
    frequencySlider: document.getElementById('frequencySlider'),
    frequencyPreview: document.getElementById('frequencyPreview'),
    durationSlider: document.getElementById('durationSlider'),
    durationPreview: document.getElementById('durationPreview'),
    startHour: document.getElementById('startHour'),
    endHour: document.getElementById('endHour'),
    hours24: document.getElementById('24hours'),
    scheduleError: document.getElementById('scheduleError'),
    mainButton: document.getElementById('mainButton')
};

// Initialize
async function init() {
    await loadData();
    populateHourSelects();
    setupEventListeners();
    renderUI();
}

async function loadData() {
    config = await window.api.getConfig();
    ads = await window.api.getAds();
    state = await window.api.getState();
}

function populateHourSelects() {
    for (let i = 0; i < 24; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${String(i).padStart(2, '0')}:00`;
        dom.startHour.appendChild(option.cloneNode(true));
        dom.endHour.appendChild(option.cloneNode(true));
    }

    // Add 24:00 option for end hour
    const option24 = document.createElement('option');
    option24.value = 24;
    option24.textContent = '24:00';
    dom.endHour.appendChild(option24);
}

function setupEventListeners() {
    // Drop zone
    dom.dropZone.addEventListener('click', async () => {
        const result = await window.api.pickFile();
        if (result.success) {
            for (const filePath of result.filePaths) {
                await addAd(filePath);
            }
        }
    });

    // Drag and drop
    dom.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dom.dropZone.classList.add('drag-over');
    });

    dom.dropZone.addEventListener('dragleave', () => {
        dom.dropZone.classList.remove('drag-over');
    });

    dom.dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dom.dropZone.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files);
        for (const file of files) {
            await addAd(file.path);
        }
    });

    // Frequency slider
    dom.frequencySlider.addEventListener('input', () => {
        updateFrequencyPreview();
    });

    dom.frequencySlider.addEventListener('change', async () => {
        config.displayConfig.adsPerHour = parseInt(dom.frequencySlider.value);
        config.displayConfig.slotIntervalMinutes = 60 / config.displayConfig.adsPerHour;
        await window.api.updateConfig(config);
    });

    // Duration slider
    dom.durationSlider.addEventListener('input', () => {
        updateDurationPreview();
    });

    dom.durationSlider.addEventListener('change', async () => {
        config.displayConfig.defaultImageDuration = parseInt(dom.durationSlider.value);
        await window.api.updateConfig(config);
    });

    // Schedule
    dom.startHour.addEventListener('change', updateSchedule);
    dom.endHour.addEventListener('change', updateSchedule);
    dom.hours24.addEventListener('change', () => {
        const is24 = dom.hours24.checked;
        dom.startHour.disabled = is24;
        dom.endHour.disabled = is24;
        updateSchedule();
    });

    // Main button
    dom.mainButton.addEventListener('click', async () => {
        if (state.systemState.isActive) {
            await window.api.pauseSystem();
        } else {
            await window.api.startSystem();
        }
        await loadData();
        renderUI();
    });

    // Listen for state changes
    window.api.onStateChanged((data) => {
        if (data.timeToNext !== undefined) {
            updateNextAdTime(data.timeToNext);
        }
        if (data.isActive !== undefined) {
            state.systemState.isActive = data.isActive;
            updateStatusBar();
            updateMainButton();
        }
    });
}

async function addAd(filePath) {
    dom.errorMessage.style.display = 'none';

    const result = await window.api.addAd(filePath);

    if (result.success) {
        await loadData();
        renderAds();
        updateMainButton();
    } else {
        showError(result.error);
    }
}

async function removeAd(adId) {
    await window.api.removeAd(adId);
    await loadData();
    renderAds();
    updateMainButton();
}

function renderUI() {
    renderAds();
    updateFrequencySlider();
    updateFrequencyPreview();
    updateDurationSlider();
    updateDurationPreview();
    updateScheduleInputs();
    updateStatusBar();
    updateMainButton();
}

function renderAds() {
    dom.adsList.innerHTML = '';
    dom.adsCount.textContent = ads.ads.length;

    for (const ad of ads.ads) {
        const item = document.createElement('div');
        item.className = 'ad-item';

        const info = document.createElement('div');
        info.className = 'ad-info';

        const check = document.createElement('span');
        check.className = 'check';
        check.textContent = '✓';

        const name = document.createElement('span');
        name.textContent = ad.fileName;

        const duration = document.createElement('span');
        duration.className = 'ad-duration';
        duration.textContent = `(${ad.duration}s)`;

        info.appendChild(check);
        info.appendChild(name);
        info.appendChild(duration);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '🗑';
        removeBtn.onclick = () => removeAd(ad.id);

        item.appendChild(info);
        item.appendChild(removeBtn);

        dom.adsList.appendChild(item);
    }
}

function updateFrequencySlider() {
    dom.frequencySlider.value = config.displayConfig.adsPerHour;
}

function updateFrequencyPreview() {
    const value = parseInt(dom.frequencySlider.value);
    const interval = 60 / value;
    dom.frequencyPreview.textContent = `📺 A cada ${interval} minutos`;
}

function updateDurationSlider() {
    dom.durationSlider.value = config.displayConfig.defaultImageDuration;
}

function updateDurationPreview() {
    const value = parseInt(dom.durationSlider.value);
    dom.durationPreview.textContent = `⏱️ ${value} segundos`;
}

function updateScheduleInputs() {
    if (config.displayConfig.activeHours) {
        const { enabled, start, end } = config.displayConfig.activeHours;
        dom.hours24.checked = !enabled;
        dom.startHour.value = start || 8;
        dom.endHour.value = end || 22;
        dom.startHour.disabled = !enabled;
        dom.endHour.disabled = !enabled;
    }
}

async function updateSchedule() {
    const is24 = dom.hours24.checked;
    const start = parseInt(dom.startHour.value);
    const end = parseInt(dom.endHour.value);

    dom.scheduleError.style.display = 'none';

    if (!is24 && end <= start) {
        dom.scheduleError.textContent = '⚠️ Horário final deve ser depois do inicial.';
        dom.scheduleError.style.display = 'block';
        return;
    }

    config.displayConfig.activeHours = {
        enabled: !is24,
        start: is24 ? 0 : start,
        end: is24 ? 24 : end
    };

    await window.api.updateConfig(config);
}

function updateStatusBar() {
    if (state.systemState.isActive) {
        dom.statusDot.textContent = '●';
        dom.statusDot.className = 'status-dot active';
        dom.statusText.textContent = 'ATIVO';
    } else {
        dom.statusDot.textContent = '○';
        dom.statusDot.className = 'status-dot paused';
        dom.statusText.textContent = 'PAUSADO';
    }
}

function updateNextAdTime(ms) {
    if (!state.systemState.isActive) {
        dom.nextAdTime.textContent = '--:--';
        return;
    }

    if (ads.ads.length === 0) {
        dom.nextAdTime.textContent = 'Sem anúncios';
        return;
    }

    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    dom.nextAdTime.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateMainButton() {
    const hasAds = ads.ads.length > 0;
    dom.mainButton.disabled = !hasAds;

    if (state.systemState.isActive) {
        dom.mainButton.textContent = '⏸ PAUSAR SISTEMA';
        dom.mainButton.classList.add('pause');
    } else {
        dom.mainButton.textContent = '▶ INICIAR SISTEMA';
        dom.mainButton.classList.remove('pause');
    }
}

function showError(message) {
    dom.errorMessage.textContent = `⚠️ ${message}`;
    dom.errorMessage.style.display = 'block';
}

// Start
init();
