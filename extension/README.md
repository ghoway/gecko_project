# Gecko Store Cookie Restore Extension

A Chrome extension for restoring cookies from the Gecko Store SaaS platform.

## Features

- 🔐 **Secure Authentication**: JWT-based authentication with the main platform
- 🍪 **Cookie Restoration**: Restore cookies for subscribed services
- 📋 **Service Management**: View and access all available services
- 🔄 **Real-time Sync**: Automatic synchronization with user subscriptions
- 🛡️ **Access Control**: Respects subscription limits and permissions

## Installation

### Development Setup

1. **Load the Extension**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `extension` folder from this project

2. **Configure API URL**:
   - The extension is configured to work with `http://localhost:3001`
   - For production, update `API_BASE_URL` in `background.js`

3. **Authentication**:
   - The extension will automatically detect if you're logged in to Gecko Store
   - If not authenticated, it will prompt you to sign in
   - If no active subscription, it will redirect to purchase a plan

## Usage

### Basic Usage

1. **Sign In**: Make sure you're signed in to Gecko Store in a browser tab
2. **Open Extension**: Click the Gecko Store icon in Chrome toolbar
3. **View Services**: See all services available to your subscription plan
4. **Restore Cookies**: Click "Restore" next to any service to set cookies

### Service Hierarchy

Services are organized hierarchically:
- **Groups**: Top-level categories (e.g., "Basic Services", "Premium Services")
- **Categories**: Sub-categories within groups (e.g., "Social Media", "Streaming")
- **Services**: Individual services with cookie data

## API Integration

The extension communicates with these Gecko Store APIs:

- `GET /api/auth/me` - Check authentication status
- `GET /api/services` - Get accessible services (requires auth + subscription)
- `POST /api/restore-cookie` - Restore cookies for a service (requires auth + subscription)

## Permissions

The extension requires these Chrome permissions:

- `cookies`: To set cookies in the browser
- `storage`: To store authentication tokens
- `activeTab`: To interact with the current tab
- `tabs`: To open new tabs for authentication
- `scripting`: For content script injection

## Development

### File Structure

```
extension/
├── manifest.json          # Extension manifest
├── background.js          # Background service worker
├── popup.html            # Extension popup UI
├── popup.js              # Popup JavaScript logic
├── content.js            # Content script (optional)
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

### Building Icons

You'll need to create extension icons in the `icons/` directory:
- `icon16.png`: 16x16 pixels
- `icon48.png`: 48x48 pixels
- `icon128.png`: 128x128 pixels

### Testing

1. **Load Extension**: Follow installation steps above
2. **Test Authentication**: Try accessing the extension without being logged in
3. **Test Services**: Login and verify services appear
4. **Test Cookie Restore**: Click restore and verify cookies are set

## Security Considerations

- All API calls require valid JWT tokens
- Extension validates subscription status before allowing access
- Cookies are set securely with appropriate flags
- No sensitive data is stored in extension storage

## Troubleshooting

### Extension Not Loading
- Ensure all files are in the correct directory structure
- Check that `manifest.json` is valid JSON
- Verify Chrome developer mode is enabled

### Authentication Issues
- Make sure you're logged in to Gecko Store in a browser tab
- Check that the API URL in `background.js` matches your setup
- Verify JWT token is valid and not expired

### Services Not Showing
- Confirm you have an active subscription
- Check browser console for API errors
- Verify the `/api/services` endpoint is working

### Cookie Restore Failing
- Ensure you have permission to access the service
- Check that the service exists and has cookie data
- Verify cookie setting permissions are granted

## Contributing

1. Test all changes thoroughly
2. Follow the existing code style
3. Update this README for any new features
4. Ensure security best practices are maintained

## License

This extension is part of the Gecko Store platform.