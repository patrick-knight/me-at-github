# Quick Start Guide

Get up and running with Me @ GitHub in under 2 minutes!

## Installation (30 seconds)

1. **Download**: Clone or download this repository
   ```bash
   git clone https://github.com/patrick-knight/me-at-github.git
   ```

2. **Open Chrome Extensions**: Navigate to `chrome://extensions/`

3. **Enable Developer Mode**: Toggle the switch in the top-right corner

4. **Load Extension**: Click "Load unpacked" and select the `me-at-github` folder

5. **Done!** The extension icon should appear in your extensions list

## First Use (30 seconds)

1. **Go to GitHub**: Visit any issue, PR, or discussion where you're mentioned
   - Example: Any GitHub issue with `@yourusername` in comments

2. **Look for the Badge**: You'll see a blue `@N` badge next to the page title
   - `N` is the number of times you're mentioned

3. **Click the Badge**: Opens a dropdown showing all your mentions

4. **Click a Mention**: Instantly jump to that location on the page

## Quick Tips

### Navigation Methods

**Click Navigation**:
- Click counter badge → See all mentions
- Click dropdown item → Jump to that mention

**Hover Navigation**:
- Hover over any highlighted `@mention`
- Use ← → buttons to navigate

**Keyboard Navigation**:
- `Alt+N`: Jump to next mention
- `Alt+P`: Jump to previous mention

### What Gets Highlighted

The extension finds and highlights:
- ✅ `@yourusername` in comments
- ✅ `@yourusername` in issue descriptions
- ✅ `@yourusername` in PR descriptions
- ✅ Multiple mentions in the same line

### Visual Indicators

- **Light Blue**: Normal mention
- **Medium Blue**: Hovered mention  
- **Yellow**: Active/selected mention
- **Blue Badge**: Counter showing total mentions

## Common Use Cases

### Code Review
1. Open a PR where you're mentioned
2. Click the badge to see all review comments
3. Use keyboard shortcuts to quickly navigate

### Issue Triage
1. Open an issue with discussions
2. Badge shows how many times you're @mentioned
3. Click dropdown to see context for each mention

### Long Discussions
1. Open a discussion with many comments
2. Use prev/next buttons on mentions
3. Navigate without scrolling manually

## Troubleshooting

### "No badge appears"
- Are you logged into GitHub?
- Are you actually mentioned on the page?
- Try refreshing the page

### "Extension not working"
- Check `chrome://extensions/` - is it enabled?
- Check browser console (F12) for errors
- Reload the extension

### "Counter shows wrong number"
- Refresh the page
- Some GitHub elements may load dynamically
- Check console for debug messages

## Next Steps

- 📖 Read [FEATURES.md](FEATURES.md) for complete feature list
- 📚 Check [EXAMPLES.md](EXAMPLES.md) for detailed examples
- 🛠 See [CONTRIBUTING.md](CONTRIBUTING.md) to contribute
- 📋 Review [INSTALLATION.md](INSTALLATION.md) for details

## Support

- 🐛 Found a bug? Open an issue on GitHub
- 💡 Have an idea? Open a feature request
- ❓ Questions? Check the documentation files

## Quick Reference

```
Extension Structure:
├── manifest.json    - Extension config
├── content.js       - Main logic
├── styles.css       - UI styling
├── icons/           - Extension icons
└── *.md            - Documentation

Key Features:
✓ Auto-detection of username
✓ Mention counter badge
✓ Dropdown navigation menu
✓ Highlight mentions
✓ Prev/next buttons
✓ Keyboard shortcuts
✓ Dark mode support
✓ Smooth scrolling

Keyboard Shortcuts:
Alt+N - Next mention
Alt+P - Previous mention

Supported Pages:
✓ GitHub Issues
✓ GitHub Pull Requests
✓ GitHub Discussions
```

## That's It!

You're ready to use Me @ GitHub. Start navigating your mentions effortlessly! 🚀
