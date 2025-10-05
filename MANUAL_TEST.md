# Manual Extension Testing

If the extension isn't working automatically, you can test it manually.

## Bookmarklet Test

Create a bookmark with this JavaScript code to manually test the extension:

```javascript
javascript:(function(){
  // Force load the extension logic if it's not already loaded
  if (typeof window.meAtGitHubDiagnostics === 'undefined') {
    alert('Extension not loaded. Check Chrome extensions page.');
    return;
  }
  
  // Run diagnostics
  window.meAtGitHubDiagnostics();
  
  // Try to force initialization
  if (typeof window.meAtGitHubForceInit === 'function') {
    window.meAtGitHubForceInit();
  }
})();
```

## Manual Console Commands

Open Chrome DevTools Console and run these commands:

### 1. Check if extension loaded:
```javascript
typeof window.meAtGitHubDiagnostics !== 'undefined'
```

### 2. Run full diagnostics:
```javascript
meAtGitHubDiagnostics()
```

### 3. Check for mentions manually:
```javascript
// Replace 'patrick-knight' with your GitHub username
document.body.innerHTML.includes('@patrick-knight')
```

### 4. Find elements that might contain issue number:
```javascript
// Find all elements containing #
Array.from(document.querySelectorAll('*')).filter(el => 
  el.textContent.includes('#') && 
  el.children.length === 0 &&
  el.textContent.match(/#\d+/)
).forEach((el, i) => 
  console.log(`Element ${i+1}:`, el.textContent.trim(), el)
);
```

### 5. Force extension to re-initialize:
```javascript
// This will be available after the extension loads
if (typeof window.meAtGitHubForceInit === 'function') {
  window.meAtGitHubForceInit();
}
```

## Expected Behavior

When working correctly, you should see:
1. `🚀 Me @ GitHub extension loaded!` message in console
2. Counter badge (like `@3`) next to the issue number
3. Highlighted mentions throughout the page
4. Sticky counter when scrolling (if mentions exist)

## If Still Not Working

1. Check that you're logged into GitHub
2. Ensure the page contains actual mentions of your username
3. Try refreshing the page
4. Check Chrome extension permissions
5. Reload the extension in chrome://extensions/