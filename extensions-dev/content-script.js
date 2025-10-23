// Listen for JWT token updates from web app
window.addEventListener('message', (event) => {
  if (event.source !== window) return;

  if (event.data.type === 'JWT_TOKEN_UPDATE') {
    chrome.runtime.sendMessage({
      type: 'UPDATE_JWT_TOKEN',
      token: event.data.token,
      userId: event.data.userId
    });
  }
});