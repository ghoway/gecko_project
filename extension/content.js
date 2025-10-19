// Content script for Gecko Store Cookie Restore Extension

// This script runs on all pages and can interact with the DOM
// Currently just a placeholder for future enhancements

console.log('Gecko Store extension loaded on:', window.location.href);

// Listen for messages from background script if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle any content script specific messages here
  if (request.action === 'contentAction') {
    // Handle content actions
    sendResponse({ success: true });
  }
});