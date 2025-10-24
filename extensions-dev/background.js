chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    const manifest = chrome.runtime.getManifest();
    const welcomeUrl = manifest.homepage_url + '/welcome';
    chrome.tabs.create({ url: welcomeUrl });
  }
});

// Handle token updates from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "storeToken" && message.data) {
    console.log("Token received and stored");
    // Simpan di chrome.storage untuk diakses oleh popup
    chrome.storage.local.set({
      token: message.data.token,
      tokenTimestamp: Date.now()
    });
  }
});