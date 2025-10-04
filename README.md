# Me @ GitHub

A Chrome extension that helps you easily find and navigate to every place you've been mentioned in GitHub issues, pull requests, and discussions.

## Features

- 🔍 **Auto-detection**: Automatically finds all mentions of your GitHub username in the `@username` format
- 📊 **Mention Counter**: Displays a badge at the end of the page title showing the total count of mentions
- 📋 **Quick Navigation**: Click the counter to see a dropdown list of all mentions with context
- 🎯 **Jump to Mention**: Click any item in the list to scroll directly to that mention
- ⬅️➡️ **Prev/Next Controls**: Hover over any highlighted mention to see navigation buttons for moving between mentions
- 🎨 **GitHub-styled UI**: Seamlessly integrates with GitHub's interface (supports both light and dark modes)

## Installation

### From Source (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top right
4. Click "Load unpacked" and select the extension directory
5. Navigate to any GitHub issue, pull request, or discussion where you're mentioned

## Usage

1. Navigate to any GitHub issue, pull request, or discussion
2. If you're mentioned anywhere on the page, you'll see a blue badge (e.g., `@3`) next to the page title
3. Click the badge to open a dropdown showing all mentions with surrounding context
4. Click any item in the dropdown to jump directly to that mention
5. Hover over any highlighted mention to see prev/next navigation buttons
6. Use the navigation buttons to move between mentions sequentially

### Keyboard Shortcuts

- **Alt+N**: Navigate to the next mention
- **Alt+P**: Navigate to the previous mention

Note: Keyboard shortcuts work when you're not typing in an input field or text area.

## How It Works

The extension:
1. Detects your logged-in GitHub username
2. Scans the page for all instances of `@yourusername`
3. Highlights each mention with a subtle background color
4. Adds a counter badge to the page title
5. Creates an interactive dropdown for quick navigation
6. Provides inline prev/next controls on each mention

## Development

The extension consists of:
- `manifest.json` - Chrome extension configuration
- `content.js` - Main logic for finding and highlighting mentions
- `styles.css` - Styling for the counter, dropdown, and highlights
- `icons/` - Extension icons in various sizes

## Privacy

This extension:
- Only runs on GitHub.com pages
- Does not collect or transmit any data
- Only accesses the current page's content to find mentions
- Stores no personal information

## License

ISC
