// Background script for the Google Meet Timer extension

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Google Meet Timer extension installed');
});

// Handle messages between popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // This allows communication between popup and content scripts
    // Messages are automatically forwarded
    return true;
});

// Clean up storage when extension is disabled/removed
chrome.runtime.onSuspend.addListener(() => {
    // Optional: Clean up any background processes
});