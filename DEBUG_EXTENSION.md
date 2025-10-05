# Debugging Extension Installation

## Quick Installation Check

If the extension isn't working on GitHub, follow these steps to debug:

### 1. Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `me-at-github` folder
5. You should see "Me @ GitHub" extension appear

### 2. Verify Extension is Active
1. Go to any GitHub issue (like https://github.com/github/accessibility/issues/9373)
2. Open Chrome DevTools (F12 or Cmd+Option+I)
3. Go to the **Console** tab
4. You should see: `🚀 Me @ GitHub extension loaded!` with timestamp
5. If you don't see this message, the extension isn't loading

### 3. Check Extension Permissions
1. In `chrome://extensions/`, find "Me @ GitHub"
2. Click "Details"
3. Ensure "Allow on all sites" or at least "Allow on github.com"

### 4. Run Diagnostics
If the extension loaded but counter isn't showing:
1. On the GitHub page, open Console in DevTools
2. Type: `meAtGitHubDiagnostics()`
3. Press Enter
4. This will show detailed debug information

### 5. Manual Test
You can also manually test if you're mentioned:
1. In Console, type: `document.body.innerHTML.includes('@your-username')`
2. Replace `your-username` with your actual GitHub username
3. If this returns `true`, you should see the counter

## Common Issues

### Extension Not Loading
- **Cause**: Extension not properly installed
- **Solution**: Reload extension in `chrome://extensions/`

### No Counter Appearing  
- **Cause**: Your username not detected or no mentions found
- **Solution**: Run `meAtGitHubDiagnostics()` to debug

### Counter in Wrong Position
- **Cause**: GitHub UI changes
- **Solution**: Extension will auto-adapt with improved selectors

## Force Refresh
If issues persist:
1. Go to `chrome://extensions/`
2. Click refresh icon on "Me @ GitHub" extension
3. Reload the GitHub page
4. Check console for loading message

## Test Page
You can test with the included test file:
1. Navigate to the extension folder
2. Open `test.html` in Chrome
3. You should see the counter and highlights working