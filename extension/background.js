chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Ambil URL dari manifest untuk jaga-jaga kalau berubah
        const manifestData = chrome.runtime.getManifest();
        const welcomeUrl = manifestData.homepage_url + '/welcome';
        chrome.tabs.create({ url: welcomeUrl });
    }
});