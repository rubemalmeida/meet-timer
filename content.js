// Timer state
let timerState = {
    targetMinutes: 0,
    currentSeconds: 0,
    isRunning: false,
    startTime: null,
    pausedTime: 0,
    timerElement: null,
    intervalId: null,
    isBlinking: false
};

// Initialize timer when page loads
function initTimer() {
    if (timerState.timerElement) {
        return; // Timer already exists
    }

    // Create timer element
    const timerDiv = document.createElement('div');
    timerDiv.id = 'meet-timer-display';
    timerDiv.className = 'meet-timer';
    timerDiv.textContent = '00:00';

    // Add to page
    document.body.appendChild(timerDiv);
    timerState.timerElement = timerDiv;

    // Load saved state
    chrome.storage.local.get(['targetMinutes', 'isRunning', 'currentSeconds', 'startTime', 'pausedTime'], function(result) {
        timerState.targetMinutes = result.targetMinutes || 0;
        timerState.isRunning = result.isRunning || false;
        timerState.currentSeconds = result.currentSeconds || 0;
        timerState.startTime = result.startTime;
        timerState.pausedTime = result.pausedTime || 0;

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
    chrome.runtime.sendMessage({
        action: 'timeUpdate',
        currentSeconds: timerState.currentSeconds
    }).catch(() => {}); // Ignore errors if popup is closed
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
            chrome.storage.local.set({
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

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
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
                
                chrome.storage.local.set({
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
            
            chrome.storage.local.set({
                startTime: null,
                pausedTime: 0
            });
            break;
    }
});

// Initialize timer when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTimer);
} else {
    initTimer();
}

// Re-initialize if navigating within Meet (SPA behavior)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        // Small delay to ensure page has loaded
        setTimeout(() => {
            if (!document.getElementById('meet-timer-display')) {
                initTimer();
            }
        }, 1000);
    }
}).observe(document, { subtree: true, childList: true });