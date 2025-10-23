// popup.js

document.addEventListener('DOMContentLoaded', function () {
    const loadingEl = document.getElementById('loading');
    const headerContentEl = document.getElementById('header-content');
    const toolsContainerEl = document.getElementById('tools-container');
    const messageContainerEl = document.getElementById('message-container');
    const softLogoutBtn = document.getElementById('softLogoutBtn');
    const searchInput = document.getElementById('search-input'); // Search bar

    const manifestData = chrome.runtime.getManifest();
    const homepageUrl = manifestData.homepage_url;

    function showHeaderContent() {
        loadingEl.classList.add('hidden');
        headerContentEl.classList.remove('hidden');
    }

    function showMessage(text, showButton = false) {
        showHeaderContent();
        toolsContainerEl.classList.add('hidden');
        messageContainerEl.classList.remove('hidden');

        let content = `<p>${text}</p>`;
        if (showButton) {
            content += `<button id="loginBtn" class="login-button">Login Sekarang</button>`;
        }
        messageContainerEl.innerHTML = content;

        if (showButton) {
            document.getElementById('loginBtn').addEventListener('click', () => {
                chrome.tabs.create({ url: homepageUrl + '/login' });
            });
        }
    }

    // --- LOGIKA PENCARIAN ---
    function handleSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        const categories = document.querySelectorAll('.category');

        categories.forEach(category => {
            const services = category.querySelectorAll('.service-button');
            let categoryHasVisibleService = false;

            services.forEach(service => {
                const serviceName = service.textContent.toLowerCase();
                if (serviceName.includes(searchTerm)) {
                    service.style.display = 'block';
                    categoryHasVisibleService = true;
                } else {
                    service.style.display = 'none';
                }
            });

            if (categoryHasVisibleService) {
                category.style.display = 'block';
            } else {
                category.style.display = 'none';
            }
        });
    }

    searchInput.addEventListener('input', handleSearch);


    // --- LOGIKA SOFT LOGOUT ---
    async function softLogout() {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!activeTab || !activeTab.url) {
            alert('Tidak dapat mendeteksi tab aktif.');
            return;
        }

        const url = new URL(activeTab.url);
        const domain = url.hostname.replace(/^www\./, '');

        try {
            const cookies = await chrome.cookies.getAll({ domain: domain });
            if (cookies.length === 0) {
                alert(`Tidak ada cookie yang ditemukan untuk ${domain}.`);
                return;
            }

            await Promise.all(
                cookies.map(cookie => {
                    return new Promise((resolve) => {
                        const cookieUrl = `http${cookie.secure ? 's' : ''}://${cookie.domain.replace(/^\./, '')}${cookie.path}`;
                        chrome.cookies.remove({ url: cookieUrl, name: cookie.name }, () => resolve());
                    });
                })
            );

            // alert(`Berhasil logout dari ${domain}. Halaman akan dimuat ulang.`);
            chrome.tabs.reload(activeTab.id);
            window.close();

        } catch (error) {
            console.error('Soft logout error:', error);
            alert('Gagal melakukan soft logout.');
        }
    }

    softLogoutBtn.addEventListener('click', softLogout);


    // --- Logika Utama (Cek Login & Fetch Tools) ---
    chrome.cookies.get({ url: homepageUrl, name: 'gecko-session' }, function (cookie) {
        if (!cookie) {
            showMessage("Silakan login ke Gecko Store untuk menggunakan layanan ini.", true);
            softLogoutBtn.classList.add('hidden');
            document.getElementById('search-container').classList.add('hidden');
            return;
        }
        softLogoutBtn.classList.remove('hidden');
        fetchTools(cookie.value);
    });

    async function fetchTools(sessionToken) {
        try {
            const response = await fetch(`${homepageUrl}/api/dashboard/get-tools`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionToken })
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            renderTools(result.data, sessionToken);
        } catch (error) {
            showMessage(error.message || "Gagal memuat data. Pastikan Anda sudah login dan langganan aktif.");
        }
    }

    function renderTools(categories, sessionToken) {
        showHeaderContent();
        toolsContainerEl.innerHTML = '';
        toolsContainerEl.classList.remove('hidden');

        if (categories.length === 0) {
            toolsContainerEl.innerHTML = '<p style="text-align:center;">Tidak ada layanan yang tersedia saat ini.</p>';
            return;
        }

        categories.forEach(category => {
            if (category.services && category.services.length > 0) {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'category';
                const title = document.createElement('div');
                title.className = 'category-title';
                title.textContent = category.name;
                categoryDiv.appendChild(title);
                const servicesGrid = document.createElement('div');
                servicesGrid.className = 'services-grid';
                category.services.forEach(service => {
                    const button = document.createElement('button');
                    button.className = 'service-button';
                    button.textContent = service.name;
                    button.title = service.name;
                    button.dataset.serviceCode = service.code;
                    servicesGrid.appendChild(button);
                });
                categoryDiv.appendChild(servicesGrid);
                toolsContainerEl.appendChild(categoryDiv);
            }
        });

        document.querySelectorAll('.service-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const serviceCode = e.currentTarget.dataset.serviceCode;
                restoreCookies(serviceCode, sessionToken);
            });
        });
    }

    async function restoreCookies(serviceCode, sessionToken) {
        loadingEl.classList.remove('hidden');
        headerContentEl.classList.remove('hidden');
        toolsContainerEl.classList.add('hidden');
        messageContainerEl.classList.add('hidden');

        try {
            const response = await fetch(`${homepageUrl}/api/dashboard/get-tools`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionToken, serviceCode })
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.message);

            let cookiesToSet = result.data;
            if (typeof cookiesToSet === 'string') {
                cookiesToSet = JSON.parse(cookiesToSet);
            }
            if (!Array.isArray(cookiesToSet) || cookiesToSet.length === 0) throw new Error("Format data cookie tidak valid.");

            const firstCookie = cookiesToSet[0];
            const targetDomain = firstCookie.domain.replace(/^\./, '');
            const targetUrl = `http${firstCookie.secure ? 's' : ''}://${targetDomain}`;

            const existingCookies = await chrome.cookies.getAll({ domain: targetDomain });
            await Promise.all(
                existingCookies.map(cookie => {
                    return new Promise((resolve) => {
                        const url = `http${cookie.secure ? 's' : ''}://${cookie.domain.replace(/^\./, '')}${cookie.path}`;
                        chrome.cookies.remove({ url: url, name: cookie.name }, () => resolve());
                    });
                })
            );
            console.log(`Cleared ${existingCookies.length} old cookies for ${targetDomain}`);

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

                const validSameSiteValues = ["no_restriction", "lax", "strict"];
                if (cookie.sameSite && validSameSiteValues.includes(cookie.sameSite)) {
                    cookieDetails.sameSite = cookie.sameSite;
                }

                return new Promise((resolve, reject) => {
                    chrome.cookies.set(cookieDetails, (setCookie) => {
                        if (setCookie) {
                            resolve(setCookie);
                        } else {
                            console.warn(`Gagal mengatur cookie: ${cookie.name}`, chrome.runtime.lastError?.message);
                            resolve(null);
                        }
                    });
                });
            }));

            if (targetUrl) {
                chrome.tabs.create({ url: targetUrl });
            }
            window.close();

        } catch (error) {
            showMessage(error.message || "Gagal merestore cookie.");
        }
    }
});