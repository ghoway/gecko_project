chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    const manifest = chrome.runtime.getManifest();
    const welcomeUrl = manifest.homepage_url + '/welcome';
    chrome.tabs.create({ url: welcomeUrl });
  }
});

// Handle JWT token updates from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_JWT_TOKEN') {
    if (message.token) {
      chrome.storage.local.set({
        jwtToken: message.token,
        userId: message.userId,
        lastUpdated: Date.now()
      });
    } else {
      chrome.storage.local.remove(['jwtToken', 'userId']);
    }
  }
});