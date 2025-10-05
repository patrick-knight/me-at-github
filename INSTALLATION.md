# Installation Guide

## Installing the Extension in Chrome

### Step 1: Download the Extension
1. Download or clone this repository to your local machine
2. Extract the files if downloaded as a ZIP

### Step 2: Open Chrome Extensions Page
1. Open Google Chrome
2. Navigate to `chrome://extensions/` or:
   - Click the three-dot menu (⋮) in the top right
   - Go to "More tools" → "Extensions"

### Step 3: Enable Developer Mode
1. Look for the "Developer mode" toggle in the top right corner
2. Turn it ON

### Step 4: Load the Extension
1. Click the "Load unpacked" button that appears
2. Navigate to the folder containing the extension files
3. Select the folder and click "Select Folder" (or "Open")

### Step 5: Verify Installation
1. You should see "Me @ GitHub" in your list of extensions
2. Make sure the extension is enabled (toggle should be blue/on)

## Testing the Extension

1. Navigate to any GitHub issue, pull request, or discussion where you're mentioned
2. Example: Visit any GitHub issue where someone has mentioned you using `@yourusername`
3. You should see:
   - A blue badge (e.g., `@3`) next to the page title showing the mention count
   - Highlighted mentions throughout the page
   - A dropdown when you click the badge
   - Prev/Next navigation controls when hovering over mentions

## Troubleshooting

### Extension Doesn't Show
- Make sure you're on a GitHub issue, pull request, or discussion page
- Check that you're logged into GitHub
- Try refreshing the page

### No Mentions Detected
- Verify you're actually mentioned on the page using `@yourusername` format
- Check the browser console (F12) for any error messages
- Make sure the extension is enabled in `chrome://extensions/`

### Counter Not Appearing
- Some GitHub pages may have different layouts
- Try refreshing the page
- Check the browser console for debug messages

## Updating the Extension

When you make changes to the code:
1. Go to `chrome://extensions/`
2. Find "Me @ GitHub"
3. Click the refresh/reload icon (🔄) on the extension card

## Uninstalling

1. Go to `chrome://extensions/`
2. Find "Me @ GitHub"
3. Click "Remove"
4. Confirm the removal
