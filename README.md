# Me @ GitHub

A Chrome extension that helps you easily find and navigate to every place you've been mentioned in GitHub issues, pull requests, and discussions.

## Features

- 🔍 **Auto-detection**: Automatically finds all mentions of your GitHub username in the `@username` format
- 📊 **Mention Counter**: Displays a badge next to the issue/PR number showing the total count of mentions
- 📌 **Sticky Counter**: Shows a floating counter in the top-right corner when scrolling down the page
- 📋 **Quick Navigation**: Click the counter to see a dropdown list of all mentions with context
- 🎯 **Jump to Mention**: Click any item in the list to scroll directly to that mention
- ⬅️➡️ **Prev/Next Controls**: Hover over any highlighted mention to see navigation buttons (stay visible longer for easier use)
- 🔄 **Dynamic Updates**: Automatically detects new mentions when "load more" content is added
- 🎨 **GitHub-styled UI**: Seamlessly integrates with GitHub's interface (supports both light and dark modes)

## Quick Start

## Installation

### From Source (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top right
4. Click "Load unpacked" and select the extension directory
5. Navigate to any GitHub issue, pull request, or discussion where you're mentioned



## Usage

1. Navigate to any GitHub issue, pull request, or discussion
2. If you're mentioned anywhere on the page, you'll see a blue badge (e.g., `@3`) next to the issue/PR number
3. When scrolling down, a floating counter appears in the top-right corner for easy access
4. Click any counter to open a dropdown showing all mentions with surrounding context
5. Click any item in the dropdown to jump directly to that mention
6. Hover over any highlighted mention to see prev/next navigation buttons (they stay visible for 2 seconds)
7. Use the navigation buttons to move between mentions sequentially
8. The extension automatically updates when new content loads (like "load more" buttons)

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

## Documentation

- 🎨 [VISUAL_GUIDE.md](VISUAL_GUIDE.md) - Visual walkthrough with UI diagrams
- 📖 [FEATURES.md](FEATURES.md) - Complete feature list and technical specs
- 🛠 [CONTRIBUTING.md](CONTRIBUTING.md) - Development and contribution guide

## Development

The extension consists of:
- `manifest.json` - Chrome extension configuration
- `content.js` - Main logic for finding and highlighting mentions (~430 lines)
- `styles.css` - Styling for the counter, dropdown, and highlights (~230 lines)
- `icons/` - Extension icons in various sizes (16px, 48px, 128px)

## Privacy

This extension:
- Only runs on GitHub.com pages
- Does not collect or transmit any data
- Only accesses the current page's content to find mentions
- Stores no personal information

## License

ISC
