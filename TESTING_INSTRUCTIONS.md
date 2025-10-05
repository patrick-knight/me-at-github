# Testing Instructions for Mention Detection Fix

## What Was Changed

Based on the console log showing:
```
content.js:362 Me @ GitHub: Detected username: patrick-knight
content.js:366 Me @ GitHub: Found 0 mentions
```

We identified that the extension was:
1. ✅ Running and initializing correctly
2. ✅ Detecting the username correctly
3. ❌ **NOT finding any mentions** (0 found when 8 were visible)

## Root Causes Fixed

### 1. Timing Issue
**Problem**: Extension was running before GitHub's dynamic content fully loaded.

**Fix**: Added 500ms delay to initial load:
```javascript
setTimeout(init, 500);
```

### 2. Selector Issue
**Problem**: Extension only looked for `a.user-mention` but GitHub may use different classes or attributes.

**Fix**: Now checks multiple selectors:
- `a.user-mention` - Standard mention class
- `a[href*="/patrick-knight"]` - Any link with username in href
- `a.mention` - Alternative mention class
- `a[data-hovercard-type="user"]` - Links with user hovercard

### 3. Better Debugging
Added extensive console logging to diagnose issues:
- Total number of potential mention links found
- Details about each link (text content and href)
- Which links match the current user
- Number of plain text mentions found

## How to Test

### Step 1: Reload the Extension
1. Go to `chrome://extensions/`
2. Find "Me @ GitHub" extension
3. Click the reload icon (circular arrow)

### Step 2: Navigate to the Issue
1. Go to the GitHub issue where you're mentioned (e.g., github/accessibility#9373)
2. **Refresh the page** (F5 or Cmd+R)

### Step 3: Check the Console
1. Open Chrome DevTools (F12 or Cmd+Option+I)
2. Go to the Console tab
3. Look for messages starting with "Me @ GitHub:"

### Expected Console Output

You should now see something like:

```
Me @ GitHub: Initializing on https://github.com/github/accessibility/issues/9373
Me @ GitHub: Detected username: patrick-knight
Me @ GitHub: Found 8 potential mention links
Me @ GitHub: Link 1: text="@patrick-knight", href="/patrick-knight"
Me @ GitHub: Link 1 matches current user!
Me @ GitHub: Added mention from link 1
Me @ GitHub: Link 2: text="@patrick-knight", href="/patrick-knight"
Me @ GitHub: Link 2 matches current user!
Me @ GitHub: Added mention from link 2
...
Me @ GitHub: Found 8 mentions in user-mention links
Me @ GitHub: Found 0 plain text mentions
Me @ GitHub: Found 8 mentions
Me @ GitHub: Found title element: <h1 class="gh-header-title">
```

### Step 4: Verify Visual Elements

After the fix, you should see:

1. **Counter Badge**: A blue badge with "@8" next to the issue title
   - Located at: `[Issue Title] @8`
   - Blue background, white text, rounded corners

2. **Mention Highlights**: Light blue background around each @patrick-knight mention
   - Hover over any mention to see navigation controls (← → buttons)

3. **Dropdown Menu**: Click the counter badge to see a list of all 8 mentions
   - Each item shows context around the mention
   - Click any item to jump to that mention

## Troubleshooting

### Still seeing "Found 0 mentions"?

If console still shows 0 mentions, check:

1. **Timing**: Try increasing the delay
   - Edit content.js line 457: change `500` to `1000` or `1500`

2. **Selectors**: Check what HTML GitHub is actually using
   - In DevTools, inspect a mention on the page
   - Look for the `<a>` tag surrounding `@patrick-knight`
   - Note the class names and attributes
   - Share this info so we can add the right selector

3. **Extension Permissions**: Verify extension has access
   - Check chrome://extensions/
   - Ensure "Me @ GitHub" has "On github.com" access

### Console shows errors?

If you see JavaScript errors:
1. Note the exact error message
2. Note the file and line number
3. Share this information

### Mentions found but not highlighted?

If console shows mentions found but nothing appears:
1. Check if there are errors in the highlight or counter creation
2. Try inspecting the page title element to see if counter was added
3. Look for any CSS conflicts

## What Debug Logs Mean

- **"Found X potential mention links"**: Total links matching our selectors
- **"Link Y: text=..., href=..."**: Details about each link found
- **"Link Y matches current user!"**: This link is a mention of you
- **"Added mention from link Y"**: Successfully added to mentions list
- **"Found X mentions in user-mention links"**: Total from GitHub's links
- **"Found X plain text mentions"**: Total from plain text (not in links)
- **"Could not find title element"**: Failed to find where to put counter

## Next Steps After Testing

Once working:
1. We'll remove the excessive debug logging
2. Run security checks (CodeQL)
3. Create final version for production use
