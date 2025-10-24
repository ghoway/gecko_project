/**
 * GeckoExtension - Class utama yang mengelola ekstensi
 */
class GeckoExtension {
  constructor() {
    // Inisialisasi variabel
    this.manifest = chrome.runtime.getManifest();
    this.homepageUrl = this.manifest.homepage_url;
    this.loginUrl = `${this.homepageUrl}/auth/signin`;
    this.token = null;

    // Headers untuk request API
    this.headers = new Headers();

    // Elemen DOM
    this.elements = {
      loading: document.getElementById("loading"),
      header: document.getElementById("header"),
      mainContent: document.getElementById("mainContent"),
      dashboardUrl: document.getElementById("dashboard-url"),
      profileUrl: document.getElementById("profile-url"),
      toolsContainer: document.getElementById("tools-container"),
      userMenuButton: document.getElementById("user-menu-button"),
      userMenu: document.getElementById("user-menu"),
      signoutButton: document.getElementById("signout")
    };

    // Set URLs pada tampilan
    this.updateUIUrls();
  }

  /**
   * Inisialisasi ekstensi
   */
  init() {
    console.log("Initializing extension...");

    // Cek terlebih dahulu apakah tab aktif adalah halaman login atau dashboard
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        try {
          const activeTabUrl = tabs[0].url;
          // Jika berada di halaman login spesifik, tampilkan UI login
          if (this.isLoginPage(activeTabUrl)) {
            console.log("Already on login page, showing login UI...");
            this.redirectToLoginForce();
            return;
          }

          // Jika berada di halaman dashboard, cek jika token ada
          if (this.isDashboardPage(activeTabUrl)) {
            console.log("Already on dashboard page, checking for token...");
            // Coba ambil token dari halaman ini
             chrome.scripting.executeScript(
               {
                 target: { tabId: tabs[0].id },
                 func: () => {
                   const cookies = document.cookie.split(';');
                   for (let cookie of cookies) {
                     const [name, value] = cookie.trim().split('=');
                     if (name === 'token') return value;
                   }
                   return null;
                 }
               },
               (results) => {
                 if (chrome.runtime.lastError) {
                   console.error("Error:", chrome.runtime.lastError.message);
                   this.checkAuthentication();
                   return;
                 }

                 const token = results[0]?.result;
                 if (token) {
                   // Token ada, berarti sudah login di dashboard
                   console.log("Token found on dashboard page, proceeding...");
                   this.token = token;
                   this.updateAuthHeader();

                   // Simpan token untuk penggunaan berikutnya
                   chrome.storage.local.set({
                     token: token,
                     tokenTimestamp: Date.now()
                   });

                   this.validateToken();
                 } else {
                   // Tidak ada token meskipun di dashboard, lanjutkan dengan alur auth biasa
                   this.checkAuthentication();
                 }
               }
             );
            return;
          }
        } catch (e) {
          console.error("Error checking current tab:", e);
        }
      }

      // Jika tidak di halaman login atau dashboard, lanjutkan dengan pengecekan autentikasi
      this.checkAuthentication();
    });
  }

  /**
   * Periksa autentikasi dari berbagai sumber
   */
  checkAuthentication() {
    // Cek token di chrome.storage terlebih dahulu
    chrome.storage.local.get(['token', 'tokenTimestamp'], (result) => {
      const tokenAge = Date.now() - (result.tokenTimestamp || 0);
      const isTokenFresh = tokenAge < 86400000; // Token kurang dari 24 jam

      if (result.token && isTokenFresh) {
        console.log("Token ditemukan di storage extension");
        this.token = result.token;
        this.updateAuthHeader();
        this.validateToken();
      } else {
        // Jika tidak ada token di storage, periksa tab yang ada
        this.checkTabsForGeckoDomain();
      }
    });
  }

  /**
   * Cek apakah ada tab yang terbuka dengan domain gecko
   */
  checkTabsForGeckoDomain() {
    const self = this; // Simpan referensi this untuk callback

    chrome.tabs.query({}, (tabs) => {
      // Cari tab dengan domain gecko
      const geckoTab = tabs.find(tab => {
        try {
          return new URL(tab.url).hostname === new URL(self.homepageUrl).hostname;
        } catch (e) {
          return false;
        }
      });

      if (geckoTab) {
        // Jika ada, cek apakah tab tersebut adalah halaman login
        if (self.isLoginPage(geckoTab.url)) {
          console.log("Found tab already on login page, redirecting to login...");
          self.redirectToLoginForce();
          return;
        }

        // Coba ambil token dari tab yang ada
        chrome.scripting.executeScript(
          {
            target: { tabId: geckoTab.id },
            func: () => {
              const cookies = document.cookie.split(';');
              for (let cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'token') return value;
              }
              return null;
            }
          },
          (results) => {
            if (chrome.runtime.lastError) {
              console.error("Error:", chrome.runtime.lastError.message);
              self.redirectToLoginForce();
              return;
            }

            const token = results[0]?.result;
            if (token) {
              console.log("Token ditemukan di tab yang sudah ada");
              // Simpan token untuk penggunaan berikutnya
              chrome.storage.local.set({
                token: token,
                tokenTimestamp: Date.now()
              });

              self.token = token;
              self.updateAuthHeader();
              self.validateToken();
            } else {
              self.redirectToLoginForce();
            }
          }
        );
      } else {
        // Jika tidak ada tab terbuka, langsung arahkan ke login
        self.redirectToLoginForce();
      }
    });
  }

  /**
   * Update header dengan token autentikasi
   */
  updateAuthHeader() {
    if (this.token) {
      this.headers.set("Authorization", `Bearer ${this.token}`);
    } else {
      this.headers.delete("Authorization");
    }
  }

  /**
   * Update URL pada tampilan
   */
  updateUIUrls() {
    if (this.elements.dashboardUrl) {
      this.elements.dashboardUrl.href = `${this.homepageUrl}/dashboard`;
    }
    if (this.elements.profileUrl) {
      this.elements.profileUrl.href = `${this.homepageUrl}/profile`;
    }
  }

  /**
   * Request options untuk fetch
   */
  requestOptions(method, body = '') {
    return {
      method: method,
      headers: this.headers,
      ...(method !== "GET" && body && { body: body }),
      redirect: "follow"
    };
  }

  /**
   * Cek apakah URL adalah URL halaman login
   * @param {string} url - URL yang akan diperiksa
   * @returns {boolean} - true jika URL adalah halaman login
   */
  isLoginPage(url) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.toLowerCase();
      // Lebih spesifik untuk halaman login
      return path === '/auth/signin' || path === '/auth/signin/' || path.endsWith('/auth/signin');
    } catch (e) {
      return false;
    }
  }

  /**
   * Cek apakah URL adalah URL dashboard
   * @param {string} url - URL yang akan diperiksa
   * @returns {boolean} - true jika URL adalah dashboard
   */
  isDashboardPage(url) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.toLowerCase();
      // Check for dashboard page
      return path === '/dashboard' || path.startsWith('/dashboard/');
    } catch (e) {
      return false;
    }
  }

  /**
   * Cek apakah URL adalah URL login atau dashboard
   * @param {string} url - URL yang akan diperiksa
   * @returns {boolean} - true jika URL adalah login atau dashboard
   */
  isLoginOrDashboardPage(url) {
    return this.isLoginPage(url) || this.isDashboardPage(url);
  }

  /**
   * Redirect ke halaman login jika tidak di halaman login/dashboard
   */
  redirectToLogin() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        // Jika berada di halaman login, gunakan redirectToLoginForce
        if (this.isLoginPage(tabs[0].url)) {
          this.redirectToLoginForce();
          return;
        }

        // Jika tidak di halaman login, buka tab login baru
        if (!this.isLoginOrDashboardPage(tabs[0].url)) {
          chrome.tabs.create({ url: this.loginUrl });
          window.close();
          return;
        }
      }

      // Jika tidak ada tab aktif atau sudah di dashboard, gunakan redirectToLoginForce
      this.redirectToLoginForce();
    });
  }

  /**
   * Paksa redirect ke halaman login (tanpa pengecekan)
   */
  redirectToLoginForce() {
    // Sembunyikan loading
    if (this.elements.loading) {
      this.elements.loading.classList.add("hidden");
    }

    // Hapus elemen login prompt sebelumnya jika ada
    const existingPrompt = document.getElementById("login-prompt");
    if (existingPrompt) {
      existingPrompt.remove();
    }

    // Tampilkan pesan sedang di halaman login
    const container = document.createElement("div");
    container.id = "login-prompt";
    container.classList.add("flex", "flex-col", "items-center", "justify-center", "p-6", "text-white", "text-center");
    container.innerHTML = `
      <img src="icons/logo.png" alt="Gecko Store Logo" class="w-20 h-20 mb-4">
      <h2 class="text-xl font-bold mb-2 text-gray-700">Please Login</h2>
      <p class="py-4 text-gray-600">You need to login to your Gecko Store account to continue.</p>
      <button id="refresh-login-button" class="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-lg hover:scale-105">Go to Login</button>
    `;

    document.body.appendChild(container);

    // Add event listener untuk button
    document.getElementById("refresh-login-button").addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          // Update tab aktif ke halaman login
          chrome.tabs.update(tabs[0].id, { url: this.loginUrl });
        } else {
          // Buat tab baru
          chrome.tabs.create({ url: this.loginUrl });
        }
        window.close();
      });
    });
  }

  /**
   * Clear token cookie from web app
   */
  clearTokenCookie() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          }
        });
      }
    });
  }


  /**
   * Setup event listeners dan UI interaktif
   */
  startContent() {
    // Toggle user menu
    if (this.elements.userMenuButton && this.elements.userMenu) {
      this.elements.userMenuButton.addEventListener('click', () => {
        this.elements.userMenu.classList.toggle('hidden');
      });

      // Close the dropdown menu when clicking outside of it
      document.addEventListener('click', (event) => {
        const isClickInside = this.elements.userMenu.contains(event.target) ||
                              this.elements.userMenuButton.contains(event.target);
        if (!isClickInside) {
          this.elements.userMenu.classList.add('hidden');
        }
      });
    }
  }

  /**
   * Inisialisasi fitur utama
   */
  startFeatures() {
    this.getTools();

    // Logout
    if (this.elements.signoutButton) {
      this.elements.signoutButton.addEventListener('click', () => this.attemptLogout());
    }
  }

  /**
   * Attempt logout
   */
  attemptLogout() {
    console.log("Attempting logout...");
    const self = this;

    fetch(`${this.homepageUrl}/api/auth/signout`, this.requestOptions("POST", ""))
      .then((response) => {
        console.log("Logout response:", response.status);
        // Hapus token dari storage extension
        chrome.storage.local.remove(['token', 'tokenTimestamp']);
        self.clearTokenCookie();
        window.close();
        self.redirectToLogin();
      })
      .catch((error) => {
        console.error("Error saat logout:", error.message);
        // Force logout dengan menghapus token dan redirect
        chrome.storage.local.remove(['token', 'tokenTimestamp']);
        self.clearTokenCookie();
        self.redirectToLogin();
      });
  }

  /**
   * Get services
   */
  getTools() {
    console.log("Get services...");
    const self = this;

    return fetch(`${this.homepageUrl}/api/services`, this.requestOptions("GET"))
      .then((response) => {
        console.log("Response status:", response.status);
        if (response.status === 200) {
          console.log("Get services berhasil");
          return response.json();
        } else if (response.status === 401) {
          console.warn(`Get services gagal dengan status 401, redirect ke login...`);
          chrome.storage.local.remove(['token', 'tokenTimestamp']);
          self.clearTokenCookie();
          self.redirectToLogin();
          return null;
        } else {
          console.warn(`Get services gagal dengan status ${response.status}`);
          return response.text().then(text => {
            console.error("Response text:", text);
            throw new Error(`Get services failed with status ${response.status}`);
          });
        }
      })
      .then((result) => {
        console.log("API result:", result);
        if (result === null || !result.success) {
          console.warn("API result not successful:", result);
          return null;
        }
        console.log("Rendering tools with data:", result.data);
        self.renderTools(result.data);
        return result.data;
      })
      .catch((error) => {
        console.error("Error Get services:", error.message);
        return null;
      });
  }

  /**
   * Render services
   */
  renderTools(groups) {
    const toolsContainer = this.elements.toolsContainer;
    if (!toolsContainer || !groups) {
      console.warn("No tools container or groups data");
      toolsContainer.innerHTML = "<div class='text-gray-600 text-center py-4'>No services available</div>";
      return;
    }

    console.log("Rendering groups:", groups);
    toolsContainer.innerHTML = "";

    groups.forEach((group) => {
      console.log("Rendering group:", group.name);
      const groupDiv = document.createElement("div");
      groupDiv.classList.add("mb-4");

      // Tambahkan judul group
      const groupTitle = document.createElement("h2");
      groupTitle.classList.add("text-lg", "font-semibold", "text-gray-700", "mb-3", "pb-1", "border-b", "border-gray-300");
      groupTitle.textContent = group.name;
      groupDiv.appendChild(groupTitle);

      group.categories.forEach((category) => {
        console.log("Rendering category:", category.name);
        // Header kategori
        const categoryTitle = document.createElement("h3");
        categoryTitle.classList.add("text-sm", "font-medium", "text-gray-600", "mb-2", "mt-3");
        categoryTitle.textContent = category.name;
        groupDiv.appendChild(categoryTitle);

        const servicesGrid = document.createElement("div");
        servicesGrid.classList.add("grid", "grid-cols-1", "gap-2");

        category.services.forEach((service) => {
          console.log("Rendering service:", service.name);
          const serviceButton = document.createElement("button");
          serviceButton.classList.add("service-button", "text-left", "w-full");
          serviceButton.textContent = service.name;
          serviceButton.dataset.serviceCode = service.code;
          serviceButton.title = `Code: ${service.code}`;

          serviceButton.addEventListener("click", () => this.fetchAndDisplayToolDetail(service.code));

          servicesGrid.appendChild(serviceButton);
        });

        groupDiv.appendChild(servicesGrid);
      });

      toolsContainer.appendChild(groupDiv);
    });

    console.log("Services rendered successfully");
  }

  /**
   * Fetch and display service detail
   */
  fetchAndDisplayToolDetail(serviceCode) {
    const self = this;

    fetch(`${this.homepageUrl}/api/services`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ serviceCode })
    })
      .then((response) => {
        if (response.status === 200) {
          console.log("Get service cookies berhasil:", response);
          return response.json();
        } else if (response.status === 401) {
          console.warn(`Get service cookies gagal dengan status 401, redirect ke login...`);
          chrome.storage.local.remove(['token', 'tokenTimestamp']);
          self.clearTokenCookie();
          self.redirectToLogin();
          return null;
        } else {
          console.warn(`Get service cookies gagal dengan status ${response.status}.`);
          throw new Error(`Get service cookies failed with status ${response.status}`);
        }
      })
      .then((result) => {
        if (result === null || !result.success) return;

        // Process cookie data and open tab
        self.processCookiesAndOpenTab(result.data, serviceCode);
      })
      .catch((error) => {
        console.error("Error service cookies:", error.message);
      });
  }

  /**
   * Process cookies and open tab
   */
  processCookiesAndOpenTab(cookieData, serviceCode) {
    if (!cookieData || !Array.isArray(cookieData)) {
      console.error("Invalid cookie data");
      return;
    }

    // Get target domain from first cookie
    const firstCookie = cookieData[0];
    const targetDomain = firstCookie.domain.replace(/^\./, '');
    const targetUrl = `http${firstCookie.secure ? 's' : ''}://${targetDomain}`;

    // Clear existing cookies for the domain
    chrome.cookies.getAll({ domain: targetDomain }, (existingCookies) => {
      const clearPromises = existingCookies.map(cookie => {
        const url = `http${cookie.secure ? 's' : ''}://${cookie.domain.replace(/^\./, '')}${cookie.path}`;
        return new Promise(resolve => {
          chrome.cookies.remove({ url, name: cookie.name }, () => resolve());
        });
      });

      Promise.all(clearPromises).then(() => {
        // Set new cookies
        const setPromises = cookieData.map(cookie => {
          const cookieUrl = `http${cookie.secure ? 's' : ''}://${cookie.domain.replace(/^\./, '')}${cookie.path}`;

          const cookieDetails = {
            url: cookieUrl,
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly
          };

          if (cookie.expirationDate) {
            cookieDetails.expirationDate = cookie.expirationDate;
          }

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
        });

        Promise.all(setPromises).then(() => {
          // Open tab with target URL
          chrome.tabs.create({ url: targetUrl });
        });
      });
    });
  }

  /**
   * Validasi token
   */
  validateToken() {
    console.log("Validating token...");
    const self = this;

    fetch(`${this.homepageUrl}/api/auth/me`, this.requestOptions("GET"))
      .then((response) => {
        console.log("Validate token response status:", response.status);
        if (!response.ok) {
          console.log(`Token tidak valid (${response.status}), redirect ke login...`);
          chrome.storage.local.remove(['token', 'tokenTimestamp']);
          self.clearTokenCookie();
          self.redirectToLogin();
          return;
        }
        return response.json();
      })
      .then((data) => {
        console.log("Validate token response data:", data);
        if (!data || !data.success) {
          console.log("Token validation failed");
          chrome.storage.local.remove(['token', 'tokenTimestamp']);
          self.clearTokenCookie();
          self.redirectToLogin();
          return;
        }

        console.log("Token validated successfully:", data.data);
        self.updateAuthHeader();

        // Check subscription status
        self.checkSubscription();
      })
      .catch((error) => {
        console.error("Network error when validating token:", error);
        chrome.storage.local.remove(['token', 'tokenTimestamp']);
        self.clearTokenCookie();
        self.redirectToLogin();
      });
  }

  /**
   * Check subscription status
   */
  checkSubscription() {
    console.log("Checking subscription...");
    const self = this;

    fetch(`${this.homepageUrl}/api/subscriptions/status`, this.requestOptions("GET"))
      .then((response) => {
        console.log("Subscription check response status:", response.status);
        if (!response.ok) {
          console.log("Subscription check failed, assuming no subscription");
          self.redirectToSubscribe();
          return;
        }
        return response.json();
      })
      .then((data) => {
        console.log("Subscription data:", data);
        if (!data || !data.success || !data.data.hasActiveSubscription) {
          console.log("No active subscription, redirecting to subscribe");
          self.redirectToSubscribe();
          return;
        }

        console.log("Subscription active, showing extension");
        self.elements.loading.classList.add("hidden");
        self.elements.header.classList.remove("hidden");
        self.elements.mainContent.classList.remove("hidden");
        self.startContent();
        self.startFeatures();
      })
      .catch((error) => {
        console.error("Error checking subscription:", error);
        // On error, assume no subscription for security
        self.redirectToSubscribe();
      });
  }

  /**
   * Redirect to subscribe page
   */
  redirectToSubscribe() {
    console.log("Redirecting to subscribe page");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.update(tabs[0].id, { url: `${this.homepageUrl}/subscribe` });
      } else {
        chrome.tabs.create({ url: `${this.homepageUrl}/subscribe` });
      }
      window.close();
    });
  }
}

/**
 * Inisialisasi aplikasi saat DOM siap
 */
document.addEventListener("DOMContentLoaded", function() {
  console.log("Script loaded");
  const app = new GeckoExtension();
  app.init();
});