document.addEventListener('DOMContentLoaded', function () {
    const increaseBtn = document.getElementById('increaseBtn');
    const decreaseBtn = document.getElementById('decreaseBtn');
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    const minutesDisplay = document.getElementById('minutesDisplay');
    const currentTimeDisplay = document.getElementById('currentTime');
    const status = document.getElementById('status');
    const meetCheckbox = document.getElementById('meetCheckbox');
    const presentationCheckbox = document.getElementById('presentationCheckbox');

    let targetMinutes = 0;
    let isRunning = false;
    let currentSeconds = 0;
    let showOnMeet = true;
    let showOnPresentation = true;

    // Helper functions for safe storage operations
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

    // Load saved state
    safeStorageGet(['targetMinutes', 'isRunning', 'currentSeconds', 'showOnMeet', 'showOnPresentation'], function (result) {
        targetMinutes = result.targetMinutes || 0;
        isRunning = result.isRunning || false;
        currentSeconds = result.currentSeconds || 0;
        showOnMeet = result.showOnMeet !== undefined ? result.showOnMeet : true;
        showOnPresentation = result.showOnPresentation !== undefined ? result.showOnPresentation : true;

        meetCheckbox.checked = showOnMeet;
        presentationCheckbox.checked = showOnPresentation;

        updateDisplay();
    });

    function updateDisplay() {
        minutesDisplay.textContent = `${targetMinutes} min`;

        const minutes = Math.floor(currentSeconds / 60);
        const seconds = currentSeconds % 60;
        currentTimeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        startBtn.textContent = isRunning ? 'Pause' : 'Start';

        // Enable/disable start button based on checkbox state
        const hasAnyCheckboxEnabled = showOnMeet || showOnPresentation;
        startBtn.disabled = !hasAnyCheckboxEnabled;

        // Enable/disable checkboxes based on timer state
        const canChangeCheckboxes = currentSeconds === 0 && !isRunning;
        meetCheckbox.disabled = !canChangeCheckboxes;
        presentationCheckbox.disabled = !canChangeCheckboxes;

        if (isRunning) {
            status.textContent = 'Timer running';
        } else if (currentSeconds > 0) {
            status.textContent = 'Timer paused';
        } else if (!hasAnyCheckboxEnabled) {
            status.textContent = 'Select where to show timer';
        } else {
            status.textContent = 'Timer ready';
        }
    }

    function sendMessageToContent(message) {
        if (chrome.tabs && chrome.tabs.query && chrome.tabs.sendMessage) {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs[0] && tabs[0].url &&
                    (tabs[0].url.includes('meet.google.com') ||
                        tabs[0].url.includes('docs.google.com/presentation/'))) {
                    chrome.tabs.sendMessage(tabs[0].id, message).catch(() => {
                        // Ignore errors if content script is not ready
                    });
                }
            });
        }
    }

    // Checkbox event listeners
    meetCheckbox.addEventListener('change', function () {
        showOnMeet = meetCheckbox.checked;
        safeStorageSet({ showOnMeet: showOnMeet });
        sendMessageToContent({ action: 'updateVisibility', showOnMeet: showOnMeet, showOnPresentation: showOnPresentation });
        updateDisplay();
    });

    presentationCheckbox.addEventListener('change', function () {
        showOnPresentation = presentationCheckbox.checked;
        safeStorageSet({ showOnPresentation: showOnPresentation });
        sendMessageToContent({ action: 'updateVisibility', showOnMeet: showOnMeet, showOnPresentation: showOnPresentation });
        updateDisplay();
    });

    increaseBtn.addEventListener('click', function () {
        targetMinutes++;
        safeStorageSet({ targetMinutes: targetMinutes });
        sendMessageToContent({ action: 'updateTarget', targetMinutes: targetMinutes });
        updateDisplay();
    });

    decreaseBtn.addEventListener('click', function () {
        if (targetMinutes > 0) {
            targetMinutes--;
            safeStorageSet({ targetMinutes: targetMinutes });
            sendMessageToContent({ action: 'updateTarget', targetMinutes: targetMinutes });
            updateDisplay();
        }
    });

    startBtn.addEventListener('click', function () {
        isRunning = !isRunning;
        safeStorageSet({ isRunning: isRunning });
        sendMessageToContent({ action: 'toggleTimer', isRunning: isRunning });
        updateDisplay();
    });

    resetBtn.addEventListener('click', function () {
        isRunning = false;
        currentSeconds = 0;
        safeStorageSet({ isRunning: false, currentSeconds: 0 });
        sendMessageToContent({ action: 'resetTimer' });
        updateDisplay();
    });

    // Listen for updates from content script
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.action === 'timeUpdate') {
            currentSeconds = request.currentSeconds;
            updateDisplay();
        }
    });
});