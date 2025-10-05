# Quick Test Guide

## The Problem

You reported: "The console is showing the detections but the on page UI is not showing up correctly"

This means the extension is finding mentions but not displaying the UI elements (counter badge, highlights, dropdown).

## What We Fixed

1. **Better Title Element Detection** - Uses multiple selectors and only visible elements
2. **Stronger CSS** - Added `!important` to prevent GitHub from hiding our styles
3. **Longer Delays** - Increased timing to 1000ms/1500ms to wait for GitHub's page to load
4. **Comprehensive Debugging** - Added detailed logs and a diagnostic function
5. **Visibility Checks** - Ensures all elements are actually visible

## How to Test (3 Steps)

### Step 1: Reload Extension (30 seconds)
1. Open Chrome
2. Go to `chrome://extensions/`
3. Find "Me @ GitHub"
4. Click the reload button (🔄)

### Step 2: Visit Issue Page (30 seconds)
1. Go to: https://github.com/github/accessibility/issues/9373
2. Press F12 to open DevTools
3. Click the Console tab
4. Refresh the page (F5)
5. Wait 2 seconds

### Step 3: Run Diagnostics (1 minute)
In the Console, type:
```javascript
meAtGitHubDiagnostics()
```

This will show you the extension's complete state.

## What Should Happen

### ✅ Success
You should see:
- A blue `@8` badge next to the issue title
- Light blue highlights on each mention of your username
- Hover over mentions to see navigation controls (← →)
- Click the badge to see dropdown menu

### ⚠️ Still Not Working?
If UI still doesn't show, the diagnostics will help us identify why.

Please share:
1. **Output from `meAtGitHubDiagnostics()`**
2. **All "Me @ GitHub:" console messages**
3. **Screenshot of the issue page**

## Quick Diagnostic Checks

Run these in DevTools Console:

```javascript
// Check counter exists
document.querySelector('.me-at-github-counter')
// Should return: <span class="me-at-github-counter">...</span>

// Check highlights exist  
document.querySelectorAll('.me-at-github-mention-text').length
// Should return: 8 (or however many mentions you have)

// Full diagnostics
meAtGitHubDiagnostics()
// Should show detailed report
```

## Common Issues & Solutions

### Issue: "Could not find title element"
**Meaning**: None of our selectors matched the title element.

**Solution**: Run diagnostics and share the title element HTML:
```javascript
document.querySelector('h1')?.outerHTML
```

### Issue: "Counter is visible: false"
**Meaning**: Counter exists but is hidden by CSS.

**Solution**: Inspect the counter element:
```javascript
const counter = document.querySelector('.me-at-github-counter');
console.log('Display:', getComputedStyle(counter).display);
console.log('Visibility:', getComputedStyle(counter).visibility);
console.log('Opacity:', getComputedStyle(counter).opacity);
```

### Issue: "Counter elements in DOM: 0"
**Meaning**: Counter was never created or was removed.

**Solution**: Check if title element was found:
```javascript
document.querySelector('h1.gh-header-title')
```

## Need More Help?

See `DEBUG_GUIDE.md` for comprehensive debugging instructions.

## Next Steps

Once we confirm if this works or identify the issue:
1. ✅ We'll fix any remaining issues
2. ✅ Remove excessive debug logging
3. ✅ Create production version
4. ✅ Update documentation
