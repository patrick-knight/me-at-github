# Contributing to Me @ GitHub

Thank you for your interest in contributing to Me @ GitHub! This document provides guidelines and information for contributors.

## Development Setup

1. Clone the repository
2. No build step required - this is a vanilla JavaScript extension
3. Load the extension in Chrome using Developer mode

## Project Structure

```
me-at-github/
├── manifest.json          # Chrome extension configuration
├── content.js             # Main extension logic (~400 lines)
├── styles.css             # UI styling (~200 lines)
├── icons/                 # Extension icons (16px, 48px, 128px)
├── README.md              # Main documentation
├── INSTALLATION.md        # Installation instructions
├── EXAMPLES.md            # Usage examples and demos
└── CONTRIBUTING.md        # This file
```

## Code Architecture

### Main Components

1. **Username Detection** (`getUsername`)
   - Detects logged-in GitHub username from page metadata
   - Falls back to various DOM selectors

2. **Mention Detection** (`findMentions`)
   - Uses TreeWalker API to scan text nodes
   - Finds all instances of `@username` pattern
   - Returns array of mention objects with location info

3. **Highlighting** (`highlightMentions`)
   - Wraps mentions in styled spans
   - Handles multiple mentions in same text node
   - Preserves DOM structure

4. **Counter Badge** (`createCounter`)
   - Adds badge to page title
   - Shows total mention count
   - Handles click to toggle dropdown

5. **Dropdown Menu** (`createDropdown`)
   - Lists all mentions with context
   - Allows quick navigation
   - Shows surrounding text for each mention

6. **Navigation** (`navigateToMention`)
   - Scrolls to specific mention
   - Highlights active mention
   - Supports wrap-around (first ↔ last)

7. **Keyboard Shortcuts** (`handleKeyboardShortcut`)
   - Alt+N: Next mention
   - Alt+P: Previous mention
   - Only active when not typing

## Coding Standards

### JavaScript
- Use ES6+ features
- Prefer `const` over `let`
- Use descriptive variable names
- Add comments for complex logic
- Wrap code in IIFE to avoid global scope pollution

### HTML/DOM Manipulation
- Always escape user-generated content
- Use `textContent` for plain text, `innerHTML` only for trusted HTML
- Create elements with `document.createElement`
- Avoid inline event handlers

### CSS
- Use BEM-like naming: `.me-at-github-*`
- Support both light and dark modes
- Keep specificity low
- Use GitHub's color palette

### Security
- **Always** escape HTML content from page
- Never use `eval()` or `Function()` constructor
- Validate and sanitize all inputs
- Run CodeQL before committing

## Testing Checklist

Before submitting changes:

- [ ] JavaScript syntax is valid (`node -c content.js`)
- [ ] Manifest.json is valid JSON
- [ ] Icons are present and correct sizes
- [ ] Extension loads without errors
- [ ] Works on GitHub issues
- [ ] Works on GitHub pull requests
- [ ] Works on GitHub discussions
- [ ] Counter badge appears correctly
- [ ] Dropdown shows all mentions
- [ ] Click navigation works
- [ ] Keyboard shortcuts work
- [ ] Prev/Next buttons work
- [ ] Wrap-around navigation works
- [ ] Dark mode displays correctly
- [ ] No console errors
- [ ] CodeQL security scan passes

## Common Issues and Solutions

### Issue: Mentions not detected
**Solution**: Check username detection logic, ensure page has loaded

### Issue: Counter appears multiple times
**Solution**: Improve cleanup() function to remove old counters

### Issue: Navigation doesn't work
**Solution**: Verify mention elements still exist after highlighting

### Issue: Dropdown stays open
**Solution**: Add proper click-outside handler

## Making Changes

1. Create a feature branch
2. Make focused, minimal changes
3. Test thoroughly (see checklist above)
4. Run security checks
5. Update documentation if needed
6. Submit pull request with clear description

## Security Guidelines

This extension handles user content from GitHub pages. Always:

1. **Escape HTML**: Use `textContent` or proper escaping
2. **Validate Input**: Check all data from the page
3. **Run CodeQL**: Use `codeql_checker` before committing
4. **Review Dependencies**: Keep dependencies minimal
5. **No External Requests**: Don't send data anywhere

## Performance Considerations

- Use TreeWalker instead of regex on entire HTML
- Batch DOM updates when possible
- Debounce or throttle frequent operations
- Clean up event listeners
- Minimize re-initialization

## Browser Compatibility

Currently supports:
- Chrome (Manifest V3)
- Edge (Chromium-based)

Future support:
- Firefox (needs Manifest V2 version)
- Safari (needs different approach)

## Feature Requests

Ideas for future versions:

- [ ] Firefox extension version
- [ ] Configurable colors
- [ ] Export mention list
- [ ] Filter by author
- [ ] Notification on new mentions
- [ ] Search within mentions
- [ ] Mention statistics

## Questions or Issues?

- Open an issue on GitHub
- Check EXAMPLES.md for usage help
- Check INSTALLATION.md for setup help
- Review existing code for patterns

## License

This project is licensed under the ISC License.
