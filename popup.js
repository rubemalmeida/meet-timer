document.addEventListener('DOMContentLoaded', function() {
    const increaseBtn = document.getElementById('increaseBtn');
    const decreaseBtn = document.getElementById('decreaseBtn');
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    const minutesDisplay = document.getElementById('minutesDisplay');
    const currentTimeDisplay = document.getElementById('currentTime');
    const status = document.getElementById('status');

    let targetMinutes = 0;
    let isRunning = false;
    let currentSeconds = 0;

    // Load saved state
    chrome.storage.local.get(['targetMinutes', 'isRunning', 'currentSeconds'], function(result) {
        targetMinutes = result.targetMinutes || 0;
        isRunning = result.isRunning || false;
        currentSeconds = result.currentSeconds || 0;
        updateDisplay();
    });

    function updateDisplay() {
        minutesDisplay.textContent = `${targetMinutes} min`;
        
        const minutes = Math.floor(currentSeconds / 60);
        const seconds = currentSeconds % 60;
        currentTimeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        startBtn.textContent = isRunning ? 'Pause' : 'Start';
        
        if (isRunning) {
            status.textContent = 'Timer running';
        } else if (currentSeconds > 0) {
            status.textContent = 'Timer paused';
        } else {
            status.textContent = 'Timer ready';
        }
    }

    function sendMessageToContent(message) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0] && tabs[0].url.includes('meet.google.com')) {
                chrome.tabs.sendMessage(tabs[0].id, message);
            }
        });
    }

    increaseBtn.addEventListener('click', function() {
        targetMinutes++;
        chrome.storage.local.set({targetMinutes: targetMinutes});
        sendMessageToContent({action: 'updateTarget', targetMinutes: targetMinutes});
        updateDisplay();
    });

    decreaseBtn.addEventListener('click', function() {
        if (targetMinutes > 0) {
            targetMinutes--;
            chrome.storage.local.set({targetMinutes: targetMinutes});
            sendMessageToContent({action: 'updateTarget', targetMinutes: targetMinutes});
            updateDisplay();
        }
    });

    startBtn.addEventListener('click', function() {
        isRunning = !isRunning;
        chrome.storage.local.set({isRunning: isRunning});
        sendMessageToContent({action: 'toggleTimer', isRunning: isRunning});
        updateDisplay();
    });

    resetBtn.addEventListener('click', function() {
        isRunning = false;
        currentSeconds = 0;
        chrome.storage.local.set({isRunning: false, currentSeconds: 0});
        sendMessageToContent({action: 'resetTimer'});
        updateDisplay();
    });

    // Listen for updates from content script
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'timeUpdate') {
            currentSeconds = request.currentSeconds;
            updateDisplay();
        }
    });
});