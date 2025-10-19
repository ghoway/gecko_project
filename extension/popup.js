// Popup script for Gecko Store Cookie Restore Extension

document.addEventListener('DOMContentLoaded', async () => {
  const content = document.getElementById('content');

  try {
    // Get stored token
    const result = await chrome.storage.local.get(['authToken']);
    const token = result.authToken;

    if (!token) {
      showUnauthenticatedView();
      return;
    }

    // Check authentication and subscription status
    const authResult = await sendMessage('checkAuth', { token });

    if (!authResult.authenticated) {
      showUnauthenticatedView();
      return;
    }

    if (!authResult.hasSubscription) {
      showNoSubscriptionView();
      return;
    }

    // User is authenticated and has subscription, show services
    showAuthenticatedView(authResult.user);

    // Load services
    loadServices(token);

  } catch (error) {
    console.error('Popup initialization error:', error);
    showError('Failed to initialize extension');
  }
});

function showUnauthenticatedView() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="status unauthenticated">
      <strong>Not Signed In</strong><br>
      Please sign in to Gecko Store first
    </div>
    <button class="login-btn" onclick="openLoginPage()">Sign In to Gecko Store</button>
  `;
}

function showNoSubscriptionView() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="status unauthenticated">
      <strong>No Active Subscription</strong><br>
      Please subscribe to access cookie restore services
    </div>
    <button class="dashboard-btn" onclick="openDashboard()">Go to Dashboard</button>
  `;
}

function showAuthenticatedView(user) {
  const subscriptionEnd = user.subscriptionEnds ? new Date(user.subscriptionEnds).toLocaleDateString() : 'N/A';

  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="status authenticated">
      <strong>Welcome back, ${user.name}!</strong><br>
      Plan: ${user.plan?.name || 'N/A'}<br>
      Expires: ${subscriptionEnd}
    </div>
    <div class="services" id="services-list">
      <div class="loading">Loading services...</div>
    </div>
  `;
}

async function loadServices(token) {
  try {
    const result = await sendMessage('getServices', { token });

    if (!result.success) {
      if (result.redirect) {
        openDashboard();
        return;
      }
      showError(result.error);
      return;
    }

    displayServices(result.services, token);
  } catch (error) {
    console.error('Load services error:', error);
    showError('Failed to load services');
  }
}

function displayServices(services, token) {
  const servicesList = document.getElementById('services-list');

  if (!services || services.length === 0) {
    servicesList.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.8); padding: 20px;">No services available</div>';
    return;
  }

  // Group services by category
  const groupedServices = groupServicesByCategory(services);

  let html = '';
  for (const [groupName, categories] of Object.entries(groupedServices)) {
    html += `<div style="margin-bottom: 15px;">
      <div style="color: rgba(255,255,255,0.9); font-weight: 600; margin-bottom: 8px; font-size: 14px;">${groupName}</div>`;

    for (const [categoryName, categoryServices] of Object.entries(categories)) {
      html += `<div style="margin-bottom: 10px;">
        <div style="color: rgba(255,255,255,0.7); font-size: 12px; margin-bottom: 5px;">${categoryName}</div>`;

      for (const service of categoryServices) {
        html += `
          <div class="service-item">
            <div class="service-info">
              <div class="service-name">${service.name}</div>
              <div class="service-code">${service.code}</div>
            </div>
            <button class="restore-btn" onclick="restoreCookies('${service.code}', '${token}')">
              Restore
            </button>
          </div>
        `;
      }

      html += '</div>';
    }

    html += '</div>';
  }

  servicesList.innerHTML = html;
}

function groupServicesByCategory(services) {
  const groups = {};

  services.forEach(service => {
    const groupName = service.category.group.name;
    const categoryName = service.category.name;

    if (!groups[groupName]) {
      groups[groupName] = {};
    }

    if (!groups[groupName][categoryName]) {
      groups[groupName][categoryName] = [];
    }

    groups[groupName][categoryName].push(service);
  });

  return groups;
}

async function restoreCookies(serviceCode, token) {
  const button = event.target;
  const originalText = button.textContent;

  try {
    button.disabled = true;
    button.textContent = 'Restoring...';

    const result = await sendMessage('restoreCookies', { serviceCode, token });

    if (result.success) {
      button.textContent = 'Restored!';
      button.style.background = '#27ae60';

      // Reset button after 3 seconds
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
        button.disabled = false;
      }, 3000);
    } else {
      if (result.redirect) {
        openDashboard();
        return;
      }

      showError(result.error);
      button.textContent = 'Failed';
      button.style.background = '#e74c3c';

      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
        button.disabled = false;
      }, 3000);
    }
  } catch (error) {
    console.error('Restore cookies error:', error);
    showError('Failed to restore cookies');
    button.textContent = 'Error';
    button.disabled = false;
  }
}

function showError(message) {
  const content = document.getElementById('content');
  const existingError = content.querySelector('.error');

  if (existingError) {
    existingError.remove();
  }

  const errorDiv = document.createElement('div');
  errorDiv.className = 'error';
  errorDiv.textContent = message;

  content.insertBefore(errorDiv, content.firstChild);

  // Auto-remove error after 5 seconds
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.remove();
    }
  }, 5000);
}

function openLoginPage() {
  chrome.tabs.create({ url: 'http://localhost:3001/auth/signin' });
}

function openDashboard() {
  chrome.tabs.create({ url: 'http://localhost:3001/dashboard' });
}

// Helper function to send messages to background script
function sendMessage(action, data) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action, ...data }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

// Make functions global for onclick handlers
window.restoreCookies = restoreCookies;
window.openLoginPage = openLoginPage;
window.openDashboard = openDashboard;