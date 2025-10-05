# Debug Guide - UI Not Showing Issue

## Current Issue

The console shows that mentions are being detected, but the UI elements (counter badge, highlights, dropdown) are not visible on the page.

## What We've Added

### Enhanced Debugging Logs

The extension now logs detailed information at every step:

1. **Initialization**
   - URL being initialized
   - Username detected
   - Number of mentions found

2. **Highlighting Process**
   - Number of mentions to highlight
   - Number of text nodes processed
   - Number of highlight elements created

3. **Counter Creation**
   - Which selector found the title element
   - Title element's tag, classes, and HTML
   - Whether counter is visible (has dimensions)
   - Counter's computed display style

4. **Post-Init Verification** (runs 100ms after init)
   - How many counter elements exist in DOM
   - How many highlight elements exist in DOM
   - Whether counter is visible
   - Counter's position in DOM

### CSS Improvements

Added `!important` rules to ensure GitHub's styles don't hide our elements:
- `display: inline-flex !important` on counter
- `background: #0969da !important` on counter
- `display: inline !important` on highlights
- `background: #ddf4ff !important` on highlights

## How to Test

### Step 1: Clear Browser Cache
1. Open Chrome DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Step 2: Reload Extension
1. Go to `chrome://extensions/`
2. Find "Me @ GitHub"
3. Click the reload icon (🔄)

### Step 3: Navigate to Issue
1. Go to https://github.com/github/accessibility/issues/9373
2. Open Chrome DevTools (F12)
3. Go to Console tab
4. Refresh the page (F5)

### Step 4: Collect Debug Information

Copy ALL console messages that start with "Me @ GitHub:" and share them. They should look like:

```
Me @ GitHub: Initializing on https://github.com/...
Me @ GitHub: Detected username: patrick-knight
Me @ GitHub: Found 8 potential mention links
Me @ GitHub: Link 1: text="@patrick-knight", href="/patrick-knight"
... (more link details) ...
Me @ GitHub: Found 8 mentions in user-mention links
Me @ GitHub: Found 8 mentions
Me @ GitHub: Starting to highlight 8 mentions
Me @ GitHub: Grouped mentions into X text nodes
Me @ GitHub: Successfully highlighted X text nodes
Me @ GitHub: Total highlight elements created: X
Me @ GitHub: Found title element using selector: "h1.gh-header-title"
Me @ GitHub: Title element tag: H1
Me @ GitHub: Title element classes: gh-header-title
Me @ GitHub: Title element HTML: <h1 class="gh-header-title">...
Me @ GitHub: Counter badge inserted as child of title element
Me @ GitHub: Counter element: <span class="me-at-github-counter">...
Me @ GitHub: Counter is visible: true/false
Me @ GitHub: Counter computed style: inline-flex
Me @ GitHub: Dropdown created
Me @ GitHub: Post-init verification:
  - Counter elements in DOM: X
  - Highlight elements in DOM: X
  - Counter visible: true/false
  - Counter display: inline-flex
  - Counter position in DOM: H1 gh-header-title
```

## What to Look For

### Scenario A: Title Element Not Found

If you see:
```
Me @ GitHub: Could not find title element with any selector
```

**This means**: The title element selectors don't match GitHub's current HTML structure.

**Next step**: In DevTools Elements tab, inspect the issue title and share the HTML structure.

### Scenario B: Counter Created But Not Visible

If you see:
```
Me @ GitHub: Counter badge inserted
Me @ GitHub: Counter is visible: false
```

**This means**: Counter exists in DOM but has no dimensions (hidden by CSS).

**Next step**: In DevTools Elements tab:
1. Search for `me-at-github-counter` using Cmd+F
2. When found, check the Styles panel
3. Look for any styles with `display: none` or `visibility: hidden`
4. Share what you see

### Scenario C: Counter Created and Initially Visible, But Disappears

If you see:
```
Me @ GitHub: Counter is visible: true
... (later) ...
Me @ GitHub: Post-init verification:
  - Counter elements in DOM: 0
```

**This means**: Counter was created but then removed from DOM by GitHub.

**Next step**: This is likely a GitHub PJAX issue or DOM manipulation. We may need to use MutationObserver to re-add the counter.

### Scenario D: Counter in DOM But Wrong Position

If you see:
```
Me @ GitHub: Counter elements in DOM: 1
Me @ GitHub: Counter visible: false
Me @ GitHub: Counter position in DOM: BODY (empty string)
```

**This means**: Counter is not attached to the title element properly.

**Next step**: The title element selector worked but appendChild failed. We need to try a different insertion method.

### Scenario E: Highlights Not Created

If you see:
```
Me @ GitHub: Starting to highlight 8 mentions
Me @ GitHub: Successfully highlighted 0 text nodes
Me @ GitHub: Total highlight elements created: 0
```

**This means**: The highlighting logic is failing.

**Next step**: The mention nodes may not be valid or accessible. Need to debug the `highlightMentions()` function.

## Additional Diagnostics

### Check if Extension is Running

In DevTools Console, type:
```javascript
document.querySelector('meta[name="user-login"]')?.getAttribute('content')
```

This should return your GitHub username. If it doesn't, you're not logged in or GitHub changed their HTML.

### Check if Counter Exists Anywhere

In DevTools Console, type:
```javascript
document.querySelectorAll('.me-at-github-counter')
```

This should return a list of elements. If length is 0, counter was never created or was removed.

### Check Counter Visibility Manually

In DevTools Console, type:
```javascript
const counter = document.querySelector('.me-at-github-counter');
if (counter) {
  console.log('Counter found!');
  console.log('Visible:', counter.offsetWidth > 0 && counter.offsetHeight > 0);
  console.log('Display:', window.getComputedStyle(counter).display);
  console.log('Parent:', counter.parentElement?.tagName, counter.parentElement?.className);
  console.log('Position:', counter.getBoundingClientRect());
} else {
  console.log('Counter not found in DOM');
}
```

### Check Highlights

In DevTools Console, type:
```javascript
document.querySelectorAll('.me-at-github-mention-text').length
```

This should return the number of highlighted mentions.

## Share Results

Please share:
1. **All console logs** starting with "Me @ GitHub:"
2. **Results** of the additional diagnostic commands above
3. **Screenshot** of the issue page
4. **HTML structure** of the title element (from Elements tab)

This will help us identify exactly where the issue is!
