// Background script for Gecko Store Cookie Restore Extension

const API_BASE_URL = 'http://localhost:3001'; // Change to production URL when deploying

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'restoreCookies') {
    handleCookieRestore(request.serviceCode, request.token)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep the message channel open for async response
  }

  if (request.action === 'getServices') {
    getAccessibleServices(request.token)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'checkAuth') {
    checkAuthentication(request.token)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Handle cookie restoration
async function handleCookieRestore(serviceCode, token) {
  try {
    console.log('Restoring cookies for service:', serviceCode);

    // Call the restore API
    const response = await fetch(`${API_BASE_URL}/api/restore-cookie`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ serviceCode })
    });

    const data = await response.json();

    if (!data.success) {
      // If authentication fails or no subscription, redirect to dashboard
      if (data.error === 'Authentication required' || data.error === 'Active subscription required') {
        chrome.tabs.create({ url: `${API_BASE_URL}/dashboard` });
        return {
          success: false,
          error: 'Please login and subscribe to access this service',
          redirect: true
        };
      }
      throw new Error(data.error || 'Failed to restore cookies');
    }

    // Set cookies in the browser
    const cookies = data.data.cookies;
    const currentTab = await getCurrentTab();

    if (cookies && cookies.length > 0) {
      for (const cookie of cookies) {
        await setCookie(cookie, currentTab.url);
      }
    }

    return {
      success: true,
      message: `Cookies restored for ${serviceCode}`,
      cookiesSet: cookies ? cookies.length : 0
    };

  } catch (error) {
    console.error('Cookie restore error:', error);
    throw error;
  }
}

// Get accessible services for the user
async function getAccessibleServices(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/services`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!data.success) {
      if (data.error === 'Authentication required' || data.error === 'Active subscription required') {
        chrome.tabs.create({ url: `${API_BASE_URL}/dashboard` });
        return {
          success: false,
          error: 'Please login and subscribe to access services',
          redirect: true
        };
      }
      throw new Error(data.error || 'Failed to fetch services');
    }

    return {
      success: true,
      services: data.data
    };

  } catch (error) {
    console.error('Get services error:', error);
    throw error;
  }
}

// Check if user is authenticated and has active subscription
async function checkAuthentication(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!data.success) {
      return { authenticated: false, hasSubscription: false };
    }

    const user = data.data;
    const hasSubscription = user.current_plan_id &&
                          user.subscription_ends_at &&
                          new Date(user.subscription_ends_at) > new Date();

    return {
      authenticated: true,
      hasSubscription,
      user: {
        name: user.name,
        email: user.email,
        plan: user.plan,
        subscriptionEnds: user.subscription_ends_at
      }
    };

  } catch (error) {
    console.error('Auth check error:', error);
    return { authenticated: false, hasSubscription: false };
  }
}

// Set a cookie in the browser
async function setCookie(cookieData, currentUrl) {
  const cookie = {
    url: currentUrl,
    name: cookieData.name,
    value: cookieData.value,
    domain: cookieData.domain,
    path: cookieData.path || '/',
    secure: cookieData.secure || false,
    httpOnly: cookieData.httpOnly || false,
    sameSite: cookieData.sameSite || 'lax',
    expirationDate: cookieData.expirationDate
  };

  // Remove existing cookie first
  try {
    await chrome.cookies.remove({
      url: currentUrl,
      name: cookieData.name
    });
  } catch (e) {
    // Cookie might not exist, continue
  }

  // Set new cookie
  await chrome.cookies.set(cookie);
}

// Get current active tab
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Gecko Store Cookie Restore extension installed');
});