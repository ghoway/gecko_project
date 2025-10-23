# Gecko Store Tools Extension

Extension Chrome untuk Gecko Store dengan UI glassmorphism yang elegan.

## 🚀 Fitur

- **Authentication Flow**: Cek JWT token dan status subscription
- **Glassmorphism UI**: Desain yang sama dengan web app
- **Service Grouping**: Services dikelompokkan berdasarkan kategori
- **Cookie Restoration**: Otomatis restore cookies untuk service access
- **Real-time Sync**: Sinkronisasi token dengan web app

## 📦 Instalasi

1. **Clone repository** ini
2. **Buka Chrome** dan navigasi ke `chrome://extensions/`
3. **Enable Developer Mode** (toggle di kanan atas)
4. **Click "Load unpacked"** dan pilih folder `extensions-dev`
5. **Extension akan muncul** di toolbar Chrome

## 🔧 Konfigurasi

### Icons
Extension membutuhkan 3 file icon PNG:
- `icons/icon16.png` (16x16px)
- `icons/icon48.png` (48x48px)
- `icons/icon128.png` (128x128px)

**Untuk membuat icons:**
```bash
# Install ImageMagick jika belum ada
sudo apt-get install imagemagick

# Convert SVG ke PNG dengan ukuran berbeda
convert icon.svg -resize 16x16 icons/icon16.png
convert icon.svg -resize 48x48 icons/icon48.png
convert icon.svg -resize 128x128 icons/icon128.png
```

### Environment
Extension menggunakan `homepage_url` dari manifest.json untuk API calls. Pastikan URL mengarah ke environment yang benar:

**Development:**
```json
"homepage_url": "https://dev.geckostore.my.id"
```

**Production:**
```json
"homepage_url": "https://geckostore.my.id"
```

## 🔄 Alur Kerja

```
1. User klik extension icon
   ↓
2. Extension cek JWT token di chrome.storage
   ↓
3. Jika tidak ada token → Redirect ke /auth/signin
   ↓
4. Jika ada token → Validasi via /api/auth/me
   ↓
5. Cek subscription status (active/tidak)
   ↓
6. Jika tidak active → Redirect ke /subscribe
   ↓
7. Jika valid → Fetch services via /api/services
   ↓
8. Render services dalam UI glassmorphism
   ↓
9. User klik service button → POST /api/services
   ↓
10. Restore cookies dan buka tab baru
```

## 🔐 Authentication

Extension menggunakan JWT token yang disimpan di `chrome.storage.local`:

```javascript
// Web app menyimpan token
chrome.storage.local.set({
  jwtToken: 'eyJhbGciOiJIUzI1NiIs...',
  userId: 'user-123',
  lastUpdated: Date.now()
});

// Extension mengambil token
const { jwtToken } = await chrome.storage.local.get(['jwtToken']);
```

## 🎨 UI Components

### Glassmorphism Cards
```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
}
```

### Service Buttons
```css
.service-button {
  background: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 8px;
  transition: all 0.2s ease;
}
```

### Blob Animations
```css
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
```

## 🛠️ Development

### File Structure
```
extensions-dev/
├── manifest.json      # Extension manifest
├── background.js      # Service worker
├── popup.html         # Popup UI
├── popup.js          # Popup logic
├── content-script.js  # Content script untuk web app sync
├── icons/            # Icon files
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md         # This file
```

### Debugging
1. **Buka DevTools** untuk extension: `chrome://extensions/` → klik "Inspect views"
2. **Console logs** akan muncul di DevTools extension
3. **Network tab** untuk melihat API calls
4. **Application tab** untuk melihat chrome.storage

### Testing Authentication
```javascript
// Manual set token untuk testing
chrome.storage.local.set({
  jwtToken: 'your-jwt-token-here',
  userId: 'test-user-id'
});
```

## 🔗 API Endpoints

Extension menggunakan endpoint berikut:

- `GET /api/auth/me` - Validasi token dan cek subscription
- `GET /api/services` - Fetch services berdasarkan user plan
- `POST /api/services` - Get cookie data untuk service tertentu

## 🚨 Troubleshooting

### Extension tidak muncul
- Pastikan manifest.json valid
- Check console errors di `chrome://extensions/`
- Reload extension setelah perubahan

### Authentication gagal
- Pastikan JWT token valid dan belum expired
- Check chrome.storage.local untuk token
- Verify API endpoints accessible

### Services tidak muncul
- Pastikan user punya subscription aktif
- Check network tab untuk API calls
- Verify user plan dan accessible services

### Cookie restoration gagal
- Check chrome.cookies permission di manifest
- Verify cookie data format dari API
- Check console untuk cookie setting errors

## 📝 Notes

- Extension hanya berfungsi untuk domain yang diizinkan di `host_permissions`
- Token disimpan di chrome.storage.local (persistent)
- UI responsive dengan min-width 400px
- Error handling comprehensive dengan user-friendly messages

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License.