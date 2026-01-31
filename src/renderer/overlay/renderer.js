// Overlay Renderer Logic
// Handles loading and playing media

let currentMedia = null;
let currentAdData = null;

// Listen for load command
window.api.onLoad((data) => {
    loadMedia(data);
});

// Listen for play command
window.api.onPlay(() => {
    playMedia();
});

// Listen for clear command
window.api.onClear(() => {
    clearMedia();
});

function loadMedia(data) {
    console.log('Loading media:', data);
    currentAdData = data;
    const container = document.getElementById('media-container');

    // Clear previous media
    container.innerHTML = '';

    if (data.type === 'video') {
        loadVideo(data, container);
    } else if (data.type === 'image') {
        loadImage(data, container);
    }
}

function loadVideo(data, container) {
    const video = document.createElement('video');

    // Use file:// protocol for local files
    video.src = `file:///${data.filePath.replace(/\\/g, '/')}`;

    video.addEventListener('canplay', () => {
        console.log('Video ready');
        currentMedia = video;
        window.api.mediaReady();
    });

    video.addEventListener('ended', () => {
        console.log('Video ended');
        window.api.mediaFinished({
            adId: currentAdData.id,
            duration: video.duration
        });
    });

    video.addEventListener('error', (e) => {
        console.error('Video error:', e);
        window.api.mediaError({
            adId: currentAdData.id,
            error: 'Failed to load video'
        });
    });

    container.appendChild(video);
}

function loadImage(data, container) {
    const img = document.createElement('img');

    // Use file:// protocol for local files
    img.src = `file:///${data.filePath.replace(/\\/g, '/')}`;

    img.addEventListener('load', () => {
        console.log('Image ready');
        currentMedia = img;
        window.api.mediaReady();

        // Auto-finish after duration
        setTimeout(() => {
            console.log('Image duration finished');
            window.api.mediaFinished({
                adId: currentAdData.id,
                duration: data.duration
            });
        }, data.duration * 1000);
    });

    img.addEventListener('error', (e) => {
        console.error('Image error:', e);
        window.api.mediaError({
            adId: currentAdData.id,
            error: 'Failed to load image'
        });
    });

    container.appendChild(img);
}

function playMedia() {
    if (currentMedia && currentMedia.tagName === 'VIDEO') {
        currentMedia.play().catch(err => {
            console.error('Play failed:', err);
            window.api.mediaError({
                adId: currentAdData.id,
                error: 'Failed to play video'
            });
        });
    }
}

function clearMedia() {
    const container = document.getElementById('media-container');
    container.innerHTML = '';
    currentMedia = null;
    currentAdData = null;
}
