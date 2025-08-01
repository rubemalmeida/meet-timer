// Timer state
let timerState = {
    targetMinutes: 0,
    currentSeconds: 0,
    isRunning: false,
    startTime: null,
    pausedTime: 0,
    timerElement: null,
    intervalId: null,
    isBlinking: false,
    showOnMeet: true,
    showOnPresentation: true
};

// Detect if we're on Google Slides
function isGoogleSlides() {
    return window.location.hostname === 'docs.google.com' &&
        window.location.pathname.includes('/presentation/');
}

// Detect if we're in presentation mode (fullscreen or presenter view)
function isInPresentationMode() {
    if (!isGoogleSlides()) {
        return false;
    }

    // Check for various indicators of presentation mode
    return (
        // Check for fullscreen API
        (document.fullscreenElement !== null) ||
        // Check for specific presentation mode URLs
        window.location.href.includes('/present') ||
        window.location.href.includes('/embed?') ||
        window.location.search.includes('slide=') ||
        // Check for presentation mode DOM elements
        document.querySelector('[data-id="presentation-canvas"]') !== null ||
        document.querySelector('.punch-present-container') !== null ||
        document.querySelector('.slideshow-container') !== null ||
        // Check if edit container is hidden (indicates presentation mode)
        (document.querySelector('.slides-edit-container') &&
            window.getComputedStyle(document.querySelector('.slides-edit-container')).display === 'none') ||
        // Fallback: check if we're in a simplified view without edit tools
        (document.querySelector('.slides-edit-container') === null &&
            document.querySelector('.slide-container') !== null)
    );
}

// Helper function for safe storage operations
function safeStorageSet(data) {
    if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set(data);
    }
}

function safeStorageGet(keys, callback) {
    if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(keys, callback);
    } else {
        callback({});
    }
}

// Initialize timer when page loads
function initTimer() {
    if (timerState.timerElement) {
        return; // Timer already exists
    }

    // Always initialize on Meet
    const isMeet = window.location.hostname.includes('meet.google.com');

    // For Slides, only initialize if we're in presentation mode
    const isSlides = isGoogleSlides();
    const isPresentationActive = isSlides && isInPresentationMode();

    if (!isMeet && !isPresentationActive) {
        return;
    }

    // Create timer element
    const timerDiv = document.createElement('div');
    timerDiv.id = 'meet-timer-display';

    // Use different classes for different platforms
    if (isSlides) {
        timerDiv.className = 'meet-timer slides-timer';
    } else {
        timerDiv.className = 'meet-timer';
    }

    timerDiv.textContent = '00:00';

    // Add to page
    document.body.appendChild(timerDiv);
    timerState.timerElement = timerDiv;

    // Load saved state
    safeStorageGet(['targetMinutes', 'isRunning', 'currentSeconds', 'startTime', 'pausedTime', 'showOnMeet', 'showOnPresentation'], function (result) {
        timerState.targetMinutes = result.targetMinutes || 0;
        timerState.isRunning = result.isRunning || false;
        timerState.currentSeconds = result.currentSeconds || 0;
        timerState.startTime = result.startTime;
        timerState.pausedTime = result.pausedTime || 0;
        timerState.showOnMeet = result.showOnMeet !== undefined ? result.showOnMeet : true;
        timerState.showOnPresentation = result.showOnPresentation !== undefined ? result.showOnPresentation : true;

        updateTimerDisplay();

        if (timerState.isRunning && timerState.startTime) {
            // Resume timer from where it left off
            const now = Date.now();
            const elapsed = Math.floor((now - timerState.startTime + timerState.pausedTime) / 1000);
            timerState.currentSeconds = elapsed;
            startTimerInterval();
        }
    });
}

function updateTimerDisplay() {
    if (!timerState.timerElement) return;

    const minutes = Math.floor(timerState.currentSeconds / 60);
    const seconds = timerState.currentSeconds % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    timerState.timerElement.textContent = timeString;

    // Check if we should start blinking (past target time)
    const targetSeconds = timerState.targetMinutes * 60;
    const shouldBlink = timerState.targetMinutes > 0 && timerState.currentSeconds >= targetSeconds;

    if (shouldBlink && !timerState.isBlinking) {
        timerState.isBlinking = true;
        timerState.timerElement.classList.add('blinking');
    } else if (!shouldBlink && timerState.isBlinking) {
        timerState.isBlinking = false;
        timerState.timerElement.classList.remove('blinking');
    }

    // Send update to popup
    if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
            action: 'timeUpdate',
            currentSeconds: timerState.currentSeconds
        }).catch(() => { }); // Ignore errors if popup is closed
    }
}

function startTimerInterval() {
    if (timerState.intervalId) {
        clearInterval(timerState.intervalId);
    }

    timerState.intervalId = setInterval(() => {
        if (timerState.isRunning) {
            const now = Date.now();
            const elapsed = Math.floor((now - timerState.startTime + timerState.pausedTime) / 1000);
            timerState.currentSeconds = elapsed;

            // Save current state
            safeStorageSet({
                currentSeconds: timerState.currentSeconds
            });

            updateTimerDisplay();
        }
    }, 1000);
}

function stopTimerInterval() {
    if (timerState.intervalId) {
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
    }
}

// Remove timer from page
function removeTimer() {
    if (timerState.timerElement) {
        timerState.timerElement.remove();
        timerState.timerElement = null;
    }
    stopTimerInterval();
}

// Check if timer should be visible and update accordingly
function checkTimerVisibility() {
    const isMeet = window.location.hostname.includes('meet.google.com');
    const isSlides = isGoogleSlides();
    const isPresentationActive = isSlides && isInPresentationMode();

    // Check visibility settings from checkboxes
    const shouldShowOnMeet = isMeet && timerState.showOnMeet;
    const shouldShowOnPresentation = isPresentationActive && timerState.showOnPresentation;

    const shouldShowTimer = shouldShowOnMeet || shouldShowOnPresentation;
    const timerExists = timerState.timerElement !== null;

    if (shouldShowTimer && !timerExists) {
        // Should show timer but it doesn't exist - create it
        initTimer();
    } else if (!shouldShowTimer && timerExists) {
        // Shouldn't show timer but it exists - remove it
        removeTimer();
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request.action) {
        case 'updateTarget':
            timerState.targetMinutes = request.targetMinutes;
            updateTimerDisplay();
            break;

        case 'toggleTimer':
            timerState.isRunning = request.isRunning;

            if (timerState.isRunning) {
                // Starting timer
                if (timerState.startTime === null) {
                    // First start
                    timerState.startTime = Date.now();
                    timerState.pausedTime = 0;
                } else {
                    // Resuming - add paused duration to pausedTime
                    timerState.pausedTime += (Date.now() - (timerState.startTime + timerState.pausedTime + timerState.currentSeconds * 1000));
                    timerState.startTime = Date.now() - timerState.currentSeconds * 1000 - timerState.pausedTime;
                }

                safeStorageSet({
                    startTime: timerState.startTime,
                    pausedTime: timerState.pausedTime
                });

                startTimerInterval();
            } else {
                // Pausing timer
                stopTimerInterval();
            }
            break;

        case 'resetTimer':
            timerState.isRunning = false;
            timerState.currentSeconds = 0;
            timerState.startTime = null;
            timerState.pausedTime = 0;
            timerState.isBlinking = false;

            if (timerState.timerElement) {
                timerState.timerElement.classList.remove('blinking');
            }

            stopTimerInterval();
            updateTimerDisplay();

            safeStorageSet({
                startTime: null,
                pausedTime: 0
            });
            break;

        case 'updateVisibility':
            timerState.showOnMeet = request.showOnMeet;
            timerState.showOnPresentation = request.showOnPresentation;

            safeStorageSet({
                showOnMeet: timerState.showOnMeet,
                showOnPresentation: timerState.showOnPresentation
            });

            // Check if timer should be shown/hidden based on new settings
            checkTimerVisibility();
            break;
    }
});

// Initialize timer when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(checkTimerVisibility, 1000);
    });
} else {
    setTimeout(checkTimerVisibility, 1000);
}

// Re-initialize if navigating within Meet or Slides (SPA behavior)
let lastUrl = location.href;
let lastPresentationMode = isInPresentationMode();

// Observer for URL changes and DOM changes
new MutationObserver(() => {
    const url = location.href;
    const currentPresentationMode = isInPresentationMode();

    // Check if URL changed or presentation mode changed
    if (url !== lastUrl || currentPresentationMode !== lastPresentationMode) {
        lastUrl = url;
        lastPresentationMode = currentPresentationMode;

        // Small delay to ensure page has loaded
        setTimeout(() => {
            checkTimerVisibility();
        }, 1000);
    }
}).observe(document, { subtree: true, childList: true });

// Also listen for fullscreen changes
document.addEventListener('fullscreenchange', () => {
    setTimeout(() => {
        checkTimerVisibility();
    }, 500);
});

// Listen for window focus/blur events (can indicate presentation mode changes)
window.addEventListener('focus', () => {
    setTimeout(() => {
        checkTimerVisibility();
    }, 1000);
});

// Periodically check timer visibility (fallback)
setInterval(() => {
    checkTimerVisibility();
}, 5000);