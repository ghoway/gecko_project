document.addEventListener('DOMContentLoaded', async function() {
  const manifest = chrome.runtime.getManifest();
  const homepageUrl = manifest.homepage_url;

  const elements = {
    loading: document.getElementById('loading'),
    authContainer: document.getElementById('auth-container'),
    subscriptionContainer: document.getElementById('subscription-container'),
    servicesContainer: document.getElementById('services-container'),
    errorContainer: document.getElementById('error-container'),
    loginBtn: document.getElementById('loginBtn'),
    subscribeBtn: document.getElementById('subscribeBtn')
  };

  // Event listeners
  elements.loginBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: `${homepageUrl}/auth/signin` });
  });

  elements.subscribeBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: `${homepageUrl}/subscribe` });
  });

  // Main initialization
  try {
    await initializeExtension();
  } catch (error) {
    showError('Failed to initialize extension: ' + error.message);
  }

  async function initializeExtension() {
    // Step 1: Get JWT token from cookie
    const jwtToken = await getTokenFromCookie();

    if (!jwtToken) {
      showAuthRequired();
      return;
    }

    // Step 2: Validate token and check subscription
    const userData = await validateTokenAndSubscription(jwtToken);

    if (!userData) {
      showAuthRequired();
      return;
    }

    if (!userData.subscription || !isSubscriptionActive(userData.subscription)) {
      showSubscriptionRequired();
      return;
    }

    // Step 3: Load services
    await loadServices(jwtToken);
  }

  async function getTokenFromCookie() {
    try {
      const cookie = await chrome.cookies.get({
        url: homepageUrl,
        name: 'token'
      });
      return cookie ? cookie.value : null;
    } catch (error) {
      console.error('Error getting token from cookie:', error);
      return null;
    }
  }

  async function validateTokenAndSubscription(token) {
    try {
      const response = await fetch(`${homepageUrl}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) return null;

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }

  function isSubscriptionActive(subscription) {
    if (!subscription || subscription.status !== 'active') return false;

    const endDate = new Date(subscription.ends_at);
    const now = new Date();

    return endDate > now;
  }

  async function loadServices(token) {
    try {
      const response = await fetch(`${homepageUrl}/api/services`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch services');

      const result = await response.json();

      if (!result.success) throw new Error(result.error || 'Failed to load services');

      renderServices(result.data, token);
    } catch (error) {
      showError('Failed to load services: ' + error.message);
    }
  }

  function renderServices(groups, token) {
    elements.servicesContainer.innerHTML = '';

    if (!groups || groups.length === 0) {
      elements.servicesContainer.innerHTML = '<div class="glass-card"><p style="text-align: center; color: var(--gray-600);">No services available</p></div>';
      return;
    }

    groups.forEach(group => {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'glass-card';

      const groupTitle = document.createElement('div');
      groupTitle.className = 'category-title';
      groupTitle.textContent = group.name;
      groupDiv.appendChild(groupTitle);

      group.categories.forEach(category => {
        const categoryTitle = document.createElement('div');
        categoryTitle.className = 'subcategory-title';
        categoryTitle.textContent = category.name;
        groupDiv.appendChild(categoryTitle);

        const servicesGrid = document.createElement('div');

        category.services.forEach(service => {
          const button = document.createElement('button');
          button.className = 'service-button';
          button.textContent = service.name;
          button.dataset.serviceCode = service.code;
          button.title = `Code: ${service.code}`;

           button.addEventListener('click', async (e) => {
             await restoreServiceCookies(service.code, token, e.target);
           });

          servicesGrid.appendChild(button);
        });

        groupDiv.appendChild(servicesGrid);
      });

      elements.servicesContainer.appendChild(groupDiv);
    });

    showServices();
  }

  async function restoreServiceCookies(serviceCode, token, button) {
    try {
      // Show loading state
      const originalText = button.textContent;
      button.textContent = 'Restoring...';
      button.disabled = true;

      const response = await fetch(`${homepageUrl}/api/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ serviceCode })
      });

      if (!response.ok) throw new Error('Failed to restore cookies');

      const result = await response.json();

      if (!result.success) throw new Error(result.error || 'Failed to get cookie data');

      // Process cookie data and open tab
      await processCookiesAndOpenTab(result.data, serviceCode);

      // Close popup
      window.close();

    } catch (error) {
      console.error('Cookie restoration error:', error);
      showError('Failed to restore service: ' + error.message);

      // Reset button
      button.textContent = originalText;
      button.disabled = false;
    }
  }

  async function processCookiesAndOpenTab(cookieData, serviceCode) {
    // Parse cookie data (assuming it's JSON string or array)
    let cookiesToSet;
    try {
      cookiesToSet = typeof cookieData === 'string' ? JSON.parse(cookieData) : cookieData;
      if (!Array.isArray(cookiesToSet)) throw new Error('Invalid cookie format');
    } catch (error) {
      throw new Error('Failed to parse cookie data');
    }

    // Get target domain from first cookie
    const firstCookie = cookiesToSet[0];
    const targetDomain = firstCookie.domain.replace(/^\./, '');
    const targetUrl = `http${firstCookie.secure ? 's' : ''}://${targetDomain}`;

    // Clear existing cookies for the domain
    const existingCookies = await chrome.cookies.getAll({ domain: targetDomain });
    await Promise.all(
      existingCookies.map(cookie => {
        const url = `http${cookie.secure ? 's' : ''}://${cookie.domain.replace(/^\./, '')}${cookie.path}`;
        return new Promise(resolve => {
          chrome.cookies.remove({ url, name: cookie.name }, () => resolve());
        });
      })
    );

    // Set new cookies
    await Promise.all(cookiesToSet.map(cookie => {
      const cookieUrl = `http${cookie.secure ? 's' : ''}://${cookie.domain.replace(/^\./, '')}${cookie.path}`;

      const cookieDetails = {
        url: cookieUrl,
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        expirationDate: cookie.expirationDate
      };

      // Handle sameSite
      if (cookie.sameSite && ['no_restriction', 'lax', 'strict'].includes(cookie.sameSite)) {
        cookieDetails.sameSite = cookie.sameSite;
      }

      return new Promise((resolve) => {
        chrome.cookies.set(cookieDetails, (result) => {
          if (result) {
            resolve(result);
          } else {
            console.warn(`Failed to set cookie: ${cookie.name}`);
            resolve(null);
          }
        });
      });
    }));

    // Open tab with target URL
    chrome.tabs.create({ url: targetUrl });
  }



  function showAuthRequired() {
    elements.loading.classList.add('hidden');
    elements.authContainer.classList.remove('hidden');
  }

  function showSubscriptionRequired() {
    elements.loading.classList.add('hidden');
    elements.subscriptionContainer.classList.remove('hidden');
  }

  function showServices() {
    elements.loading.classList.add('hidden');
    elements.servicesContainer.classList.remove('hidden');
  }

  function showError(message) {
    elements.loading.classList.add('hidden');
    elements.errorContainer.classList.remove('hidden');
    document.getElementById('error-message').textContent = message;
  }
});