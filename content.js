// Main content script for Me @ GitHub extension

(function() {
  'use strict';
  
    // Immediate console log to verify script loading\n  console.log('🚀 Me @ GitHub extension loaded!', new Date().toISOString());\n  \n  // Check if page was loaded from cache\n  if (window.performance && window.performance.navigation) {\n    const navType = window.performance.navigation.type;\n    console.log('Me @ GitHub: Navigation type:', navType);\n    if (navType === 2) { // TYPE_BACK_FORWARD\n      console.log('Me @ GitHub: Page loaded via back/forward navigation');\n    }\n  }\n  \n  // Check Performance Navigation API (modern browsers)\n  if (window.performance && window.performance.getEntriesByType) {\n    const navEntries = window.performance.getEntriesByType('navigation');\n    if (navEntries.length > 0) {\n      const navEntry = navEntries[0];\n      console.log('Me @ GitHub: Navigation entry type:', navEntry.type);\n      if (navEntry.type === 'back_forward') {\n        console.log('Me @ GitHub: Detected back/forward navigation via Performance API');\n      }\n    }\n  }"

  let username = null;
  let mentions = [];
  let currentMentionIndex = -1;

  // Get the logged-in user's username
  function getUsername() {
    // Check for username in the page header
    const userMenu = document.querySelector('meta[name="user-login"]');
    if (userMenu) {
      return userMenu.getAttribute('content');
    }
    
    // Fallback: check the signed-in user menu
    const signedInUser = document.querySelector('[data-login]');
    if (signedInUser) {
      return signedInUser.getAttribute('data-login');
    }
    
    return null;
  }

  // Find all mentions of the username in @<username> format
  // Helper function to check if a node is in an excluded area (titles, headers, navigation)
  function isInExcludedArea(node) {
    let current = node;
    
    // Walk up the DOM tree to check for excluded areas
    while (current && current !== document.body) {
      const element = current.nodeType === Node.TEXT_NODE ? current.parentElement : current;
      
      if (!element) break;
      
      // Check for title areas and headers
      const tagName = element.tagName?.toLowerCase();
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'title'].includes(tagName)) {
        return true;
      }
      
      // Check for GitHub-specific title and header classes
      const classList = element.classList;
      if (classList) {
        const excludedClasses = [
          // Issue and PR titles
          'js-issue-title',
          'js-pr-title', 
          'js-discussion-title',
          'issue-title',
          'pr-title',
          'discussion-title',
          'js-issue-row',
          'js-navigation-item-text',
          
          // Headers and navigation
          'header',
          'site-header',
          'js-navigation-item',
          'js-repo-nav',
          'subnav',
          'tabnav',
          'breadcrumb',
          'pagehead',
          'repohead',
          
          // Commit and timeline headers
          'commit-title',
          'commit-message',
          'timeline-comment-header',
          'timeline-comment-header-text',
          'timeline-comment-actions',
          'js-timeline-item',
          
          // User/author areas in headers
          'hx_hit-user',
          'commit-author',
          'author',
          'text-bold',
          
          // File headers and code areas
          'file-header',
          'file-info',
          'js-file-header',
          'blob-code-hunk',
          
          // Notification areas
          'notification-list-item-title',
          'notification-list-item-link'
        ];
        
        for (const excludedClass of excludedClasses) {
          if (classList.contains(excludedClass)) {
            return true;
          }
        }
        
        // Check for role attributes that indicate navigation or headers
        const role = element.getAttribute('role');
        if (['navigation', 'banner', 'header', 'menubar', 'toolbar'].includes(role)) {
          return true;
        }
      }
      
      // Check for common header/title selectors by ID or data attributes
      const id = element.id;
      if (id && (id.includes('header') || id.includes('title') || id.includes('nav'))) {
        return true;
      }
      
      // Check if we're inside the actual comment body areas (these are allowed)
      if (classList) {
        const allowedClasses = [
          'comment-body',
          'js-comment-body',
          'markdown-body',
          'js-comment-update',
          'edit-comment-hide',
          'js-suggested-changes-contents',
          'js-file-content'
        ];
        
        for (const allowedClass of allowedClasses) {
          if (classList.contains(allowedClass)) {
            // We're in a comment body, so this is allowed (return false)
            return false;
          }
        }
      }
      
      current = element.parentElement;
    }
    
    return false;
  }

  function findMentions() {
    if (!username) return [];
    
    const mentions = [];
    
    // First, find GitHub's native user mention links
    // Try multiple selectors as GitHub may use different classes
    const mentionSelectors = [
      'a.user-mention',
      'a[href*="/' + username + '"]',
      'a.mention',
      'a[data-hovercard-type="user"]'
    ];
    
    const allLinks = new Set();
    mentionSelectors.forEach(selector => {
      const links = document.querySelectorAll(selector);
      links.forEach(link => allLinks.add(link));
    });
    
    console.log('Me @ GitHub: Found', allLinks.size, 'potential mention links');
    
    allLinks.forEach((link, idx) => {
      const linkText = link.textContent.trim();
      const linkHref = link.getAttribute('href') || link.href;
      
      console.log(`Me @ GitHub: Link ${idx + 1}: text="${linkText}", href="${linkHref}"`);
      
      // Skip if this link is in an excluded area (title, header, etc.)
      if (isInExcludedArea(link)) {
        console.log(`Me @ GitHub: Link ${idx + 1} is in excluded area, skipping`);
        return;
      }
      
      // Check if this link mentions the current user
      // GitHub's mention links have href like "/username" or "https://github.com/username"
      const matchesText = linkText === `@${username}`;
      const matchesHref = linkHref.endsWith(`/${username}`) || linkHref === `/${username}`;
      
      if (matchesText || matchesHref) {
        console.log(`Me @ GitHub: Link ${idx + 1} matches current user!`);
        
        // Find the text node inside the link
        const textNode = Array.from(link.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
        if (textNode) {
          mentions.push({
            node: textNode,
            text: textNode.textContent,
            index: 0,
            element: link
          });
          console.log(`Me @ GitHub: Added mention from link ${idx + 1}`);
        } else {
          console.log(`Me @ GitHub: Link ${idx + 1} has no text node, children:`, link.childNodes);
        }
      }
    });
    
    console.log('Me @ GitHub: Found', mentions.length, 'mentions in user-mention links');
    
    // Then search in all other text nodes for plain text mentions
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // Skip script, style, and our own elements
          const parent = node.parentElement;
          if (!parent || 
              parent.tagName === 'SCRIPT' || 
              parent.tagName === 'STYLE' ||
              parent.classList.contains('me-at-github-counter') ||
              parent.classList.contains('me-at-github-dropdown')) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip if parent is a link that might be a mention (already processed above)
          if (parent.tagName === 'A' && parent.getAttribute('href')?.includes(`/${username}`)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip title areas, headers, and navigation elements
          if (isInExcludedArea(node)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Check if text contains the mention
          const mentionPattern = `@${username}`;
          if (node.textContent.includes(mentionPattern)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    let node;
    const pattern = new RegExp(`@${username}\\b`, 'gi');
    let plainTextCount = 0;
    while (node = walker.nextNode()) {
      const text = node.textContent;
      const matches = [...text.matchAll(pattern)];
      
      for (const match of matches) {
        mentions.push({
          node: node,
          text: text,
          index: match.index,
          element: node.parentElement
        });
        plainTextCount++;
      }
    }
    
    console.log('Me @ GitHub: Found', plainTextCount, 'plain text mentions');
    
    return mentions;
  }

  // Highlight mentions and add navigation controls
  function highlightMentions() {
    console.log('Me @ GitHub: Starting to highlight', mentions.length, 'mentions');
    
    // Group mentions by their text node to process multiple mentions in the same node
    const nodeGroups = new Map();
    mentions.forEach((mention, index) => {
      if (!nodeGroups.has(mention.node)) {
        nodeGroups.set(mention.node, []);
      }
      nodeGroups.get(mention.node).push({ ...mention, originalIndex: index });
    });
    
    console.log('Me @ GitHub: Grouped mentions into', nodeGroups.size, 'text nodes');
    
    // Process each text node
    let highlightedCount = 0;
    nodeGroups.forEach((mentionList, textNode) => {
      // Skip if already processed
      if (!textNode.parentNode || textNode.parentNode.classList?.contains('me-at-github-mention-text')) {
        return;
      }
      
      const parent = textNode.parentNode;
      
      // Special handling for GitHub's native mention links
      if (parent.classList && parent.classList.contains('user-mention')) {
        // Wrap the entire link in our highlight span
        const mentionSpan = document.createElement('span');
        mentionSpan.classList.add('me-at-github-mention-text');
        mentionSpan.classList.add('me-at-github-link-wrapper');
        
        // Get the index for this mention
        const index = mentionList[0].originalIndex;
        mentionSpan.setAttribute('data-mention-index', index);
        
        // Move the link inside our span
        parent.parentNode.insertBefore(mentionSpan, parent);
        mentionSpan.appendChild(parent);
        
        // Update the mention reference
        mentions[index].element = mentionSpan;
        
        // Add navigation controls
        addNavigationControls(mentionSpan, index);
        highlightedCount++;
        return;
      }
      
      // Handle plain text mentions
      const text = textNode.textContent;
      const mentionText = `@${username}`;
      const fragment = document.createDocumentFragment();
      
      // Sort mentions by index to process them in order
      mentionList.sort((a, b) => a.index - b.index);
      
      let lastIndex = 0;
      mentionList.forEach(mention => {
        const index = mention.originalIndex;
        
        // Add text before the mention
        if (mention.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex, mention.index)));
        }
        
        // Create mention span
        const mentionSpan = document.createElement('span');
        mentionSpan.classList.add('me-at-github-mention-text');
        mentionSpan.textContent = mentionText;
        mentionSpan.setAttribute('data-mention-index', index);
        fragment.appendChild(mentionSpan);
        
        // Update the mention reference
        mention.element = mentionSpan;
        mentions[index].element = mentionSpan;
        
        lastIndex = mention.index + mentionText.length;
        
        // Add navigation controls
        addNavigationControls(mentionSpan, index);
      });
      
      // Add remaining text
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
      }
      
      // Replace the text node with the fragment
      textNode.parentNode.replaceChild(fragment, textNode);
      highlightedCount++;
    });
    
    console.log('Me @ GitHub: Successfully highlighted', highlightedCount, 'text nodes');
    console.log('Me @ GitHub: Total highlight elements created:', document.querySelectorAll('.me-at-github-mention-text').length);
  }

  // Add prev/next navigation controls to a mention
  function addNavigationControls(element, index) {
    const nav = document.createElement('div');
    nav.classList.add('me-at-github-nav');
    
    // Ensure nav is hidden by default with inline style as fallback
    nav.style.display = 'none';
    
    nav.innerHTML = `
      <button class="me-at-github-nav-btn me-at-github-prev" title="Previous mention">←</button>
      <span class="me-at-github-nav-index">${index + 1}/${mentions.length}</span>
      <button class="me-at-github-nav-btn me-at-github-next" title="Next mention">→</button>
    `;
    
    element.appendChild(nav);
    
    let hideTimeout;
    let isNavVisible = false;
    
    // Show navigation on hover or active
    const showNav = () => {
      clearTimeout(hideTimeout);
      // Only show if we have mentions to navigate through
      if (mentions.length > 1) {
        nav.style.display = 'flex';
        isNavVisible = true;
      }
    };
    
    // Hide navigation with delay
    const hideNav = () => {
      hideTimeout = setTimeout(() => {
        nav.style.display = 'none';
        isNavVisible = false;
      }, 2000); // Keep visible for 2 seconds
    };
    
    // Keep nav visible when hovering over it
    nav.addEventListener('mouseenter', () => {
      clearTimeout(hideTimeout);
    });
    
    nav.addEventListener('mouseleave', hideNav);
    
    // Show nav on element hover/focus
    element.addEventListener('mouseenter', showNav);
    element.addEventListener('focus', showNav);
    element.addEventListener('mouseleave', hideNav);
    
    // Add event listeners
    const prevBtn = nav.querySelector('.me-at-github-prev');
    const nextBtn = nav.querySelector('.me-at-github-next');
    
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const success = navigateToMention(index - 1);
      if (success) {
        // Hide nav immediately after successful navigation
        clearTimeout(hideTimeout);
        nav.style.display = 'none';
        isNavVisible = false;
      }
    });
    
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const success = navigateToMention(index + 1);
      if (success) {
        // Hide nav immediately after successful navigation
        clearTimeout(hideTimeout);
        nav.style.display = 'none';
        isNavVisible = false;
      }
    });
  }

  // Navigate to a specific mention
  function navigateToMention(index) {
    if (mentions.length === 0) {
      console.log('Me @ GitHub: No mentions to navigate to');
      return false;
    }
    
    // Wrap around: if index is out of bounds, loop to the other end
    if (index < 0) {
      index = mentions.length - 1;
    } else if (index >= mentions.length) {
      index = 0;
    }
    
    // Ensure index is still valid
    if (index < 0 || index >= mentions.length) {
      console.log('Me @ GitHub: Invalid mention index:', index);
      return false;
    }
    
    currentMentionIndex = index;
    const mention = mentions[index];
    
    if (!mention || !mention.element) {
      console.log('Me @ GitHub: Invalid mention or element at index:', index);
      return false;
    }
    
    console.log(`Me @ GitHub: Navigating to mention ${index + 1}/${mentions.length}`);
    
    // Remove active class from all mentions
    document.querySelectorAll('.me-at-github-mention-text').forEach(el => {
      el.classList.remove('active');
    });
    
    // Add active class to current mention
    mention.element.classList.add('active');
    
    // Scroll to the mention with error handling
    try {
      mention.element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    } catch (error) {
      console.log('Me @ GitHub: Error scrolling to mention:', error);
      // Fallback: try without smooth behavior
      mention.element.scrollIntoView({
        block: 'center'
      });
    }
    
    return true;
  }

  // Create and inject the counter badge
  function createCounter() {
    const count = mentions.length;
    if (count === 0) return;
    
    // Log current page info for debugging
    console.log('Me @ GitHub: Current page URL:', location.href);
    console.log('Me @ GitHub: Page title:', document.title);
    
    // Find the issue/PR number element first - this is our primary target
    const issueSelectors = [
      '.gh-header-number',               // Issue/PR number in header
      'span.f1-light',                   // Alternative number styling  
      '.js-issue-number',                // JS issue number
      '.gh-header-title .f1-light',      // Number within title
      'h1 .f1-light',                    // Generic number in h1
      '[data-testid=\"issue-title\"] .f1-light', // New GitHub UI\n      'h1 span.color-fg-muted',          // GitHub's muted text styling\n      'h1 .color-fg-muted',              // Alternative muted styling\n      'span[data-testid=\"issue-number\"]', // Possible data attribute\n      '.issue-title-actions + h1 span',  // Adjacent to actions\n      'h1 > span:first-child',           // First span in h1 (often the number)\n      '.js-issue-title span',            // Span within issue title\n      'bdi span',                        // Span within bdi element\n      '.gh-header-meta .color-fg-muted', // Header meta with muted color\n      'span[title*=\"#\"]'                // Span with # in title attribute
    ];
    
    let issueNumberElement = null;
    let selectorUsed = null;
    
    console.log('Me @ GitHub: Looking for issue number element...');
    for (const selector of issueSelectors) {
      const elements = document.querySelectorAll(selector);
      console.log(`Me @ GitHub: Selector "${selector}" found ${elements.length} elements`);
      
      for (const element of elements) {
        if (element && element.offsetWidth > 0 && element.offsetHeight > 0) {
          console.log(`Me @ GitHub: Checking element with text: "${element.textContent.trim()}"`);
          // Check if it contains a # (issue/PR number)
          if (element.textContent.includes('#')) {
            issueNumberElement = element;
            selectorUsed = selector;
            console.log(`Me @ GitHub: ✓ Found issue number element using selector: "${selector}"`);
            console.log(`Me @ GitHub: Element text: "${element.textContent.trim()}"`);
            console.log(`Me @ GitHub: Element HTML:`, element.outerHTML.substring(0, 200));
            break;
          }
        }
      }
      if (issueNumberElement) break;
    }
    
    // Fallback to title element if no issue number found
    if (!issueNumberElement) {
      console.log('Me @ GitHub: No issue number element found, falling back to title element...');
      const titleSelectors = [
        'h1.gh-header-title',           // Most common: issue/PR title container
        'h1.js-issue-title',            // Alternative issue title
        'h1[data-testid="issue-title"]', // New GitHub UI
        '[data-testid="issue-title"]',   // New GitHub UI without h1
        'h1.d-flex',                    // GitHub's flexbox h1
        '.gh-header-title',             // Without h1 restriction
        'bdi.js-issue-title',           // Title text element
        'span.js-issue-title',          // Alternative title text element
        'main h1',                      // H1 in main content
        'h1'                            // Last resort: any h1 on the page
      ];
      
      for (const selector of titleSelectors) {
        const elements = document.querySelectorAll(selector);
        console.log(`Me @ GitHub: Title selector "${selector}" found ${elements.length} elements`);
        
        for (const element of elements) {
          if (element && element.offsetWidth > 0 && element.offsetHeight > 0) {
            issueNumberElement = element;
            selectorUsed = selector;
            console.log(`Me @ GitHub: ✓ Using title element with selector: "${selector}"`);
            console.log(`Me @ GitHub: Title element text: "${element.textContent.trim().substring(0, 100)}..."`);
            console.log(`Me @ GitHub: Title element HTML:`, element.outerHTML.substring(0, 200));
            break;
          }
        }
        if (issueNumberElement) break;
      }
    }
    
    if (!issueNumberElement) {
      console.log('Me @ GitHub: ❌ Could not find issue number or title element');
      console.log('Me @ GitHub: Debugging - Available h1 elements:');
      document.querySelectorAll('h1').forEach((h1, index) => {
        console.log(`  H1 #${index + 1}:`, h1.outerHTML.substring(0, 150));
        console.log(`    Text: "${h1.textContent.trim().substring(0, 100)}"`);
        console.log(`    Classes: "${h1.className}"`);
        console.log(`    Visible: ${h1.offsetWidth > 0 && h1.offsetHeight > 0}`);
      });
      console.log('Me @ GitHub: Debugging - All spans with # in text:');
      document.querySelectorAll('span').forEach((span, index) => {
        if (span.textContent.includes('#')) {
          console.log(`  Span #${index + 1} with #:`, span.outerHTML.substring(0, 100));
          console.log(`    Text: "${span.textContent.trim()}"`);
        }
      });
      return;
    }
    
    console.log('Me @ GitHub: Target element tag:', issueNumberElement.tagName);
    console.log('Me @ GitHub: Target element classes:', issueNumberElement.className);
    console.log('Me @ GitHub: Target element HTML:', issueNumberElement.outerHTML.substring(0, 200));
    
    // Create counter badge
    const counter = document.createElement('span');
    counter.classList.add('me-at-github-counter');
    counter.textContent = `@${count}`;
    counter.title = `${count} mention${count !== 1 ? 's' : ''} of @${username}`;
    
    // Add click handler to toggle dropdown
    counter.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown(counter);
    });
    
    // Insert the counter after the target element
    issueNumberElement.parentNode.insertBefore(counter, issueNumberElement.nextSibling);
    console.log('Me @ GitHub: Counter badge inserted after target element');
    
    // Create dropdown
    createDropdown(counter);
    console.log('Me @ GitHub: Dropdown created');
    
    // Create sticky header counter
    createStickyCounter(count);
  }
  
  // Create sticky header counter that appears when scrolling
  function createStickyCounter(count) {
    // Remove any existing sticky counter
    const existingStickyCounter = document.getElementById('me-at-github-sticky-counter');
    if (existingStickyCounter) {
      existingStickyCounter.remove();
    }
    
    // Create sticky counter
    const stickyCounter = document.createElement('div');
    stickyCounter.id = 'me-at-github-sticky-counter';
    stickyCounter.classList.add('me-at-github-sticky-counter');
    stickyCounter.textContent = `@${count}`;
    stickyCounter.title = `${count} mention${count !== 1 ? 's' : ''} of @${username}`;
    
        // Add click handler
    stickyCounter.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      // Scroll to first mention when clicked
      if (mentions.length > 0) {
        const success = navigateToMention(0);
        if (!success) {
          console.log('Me @ GitHub: Sticky counter navigation failed');
        }
      }
    });
    
    // Insert into header area
    document.body.appendChild(stickyCounter);
    
    // Show/hide based on scroll position
    let isHeaderVisible = true;
    const checkScroll = () => {
      const headerHeight = 80; // GitHub's header height
      const scrolled = window.scrollY > headerHeight;
      
      if (scrolled && isHeaderVisible) {
        stickyCounter.style.display = 'flex';
        stickyCounter.style.opacity = '1';
        isHeaderVisible = false;
      } else if (!scrolled && !isHeaderVisible) {
        stickyCounter.style.opacity = '0';
        setTimeout(() => {
          if (window.scrollY <= headerHeight) {
            stickyCounter.style.display = 'none';
          }
        }, 200);
        isHeaderVisible = true;
      }
    };
    
    window.addEventListener('scroll', checkScroll);
    checkScroll(); // Initial check
  }

  // Create the dropdown menu
  function createDropdown(counter) {
    const dropdown = document.createElement('div');
    dropdown.classList.add('me-at-github-dropdown');
    dropdown.style.display = 'none';
    dropdown.style.zIndex = '2147483647'; // Set maximum z-index immediately
    
    // Try to escape stacking context by appending to body if needed
    dropdown.addEventListener('DOMNodeInserted', function() {
      // Additional z-index enforcement when dropdown is shown
      setTimeout(() => {
        if (dropdown.style.display === 'block') {
          ensureMaxZIndex(dropdown);
        }
      }, 0);
    });
    
    const list = document.createElement('ul');
    list.classList.add('me-at-github-dropdown-list');
    
    mentions.forEach((mention, index) => {
      const li = document.createElement('li');
      li.classList.add('me-at-github-dropdown-item');
      li.setAttribute('data-mention-index', index.toString());
      
      // Create index span
      const indexSpan = document.createElement('span');
      indexSpan.classList.add('me-at-github-dropdown-index');
      indexSpan.textContent = `#${index + 1}`;
      
      // Create context span with safe DOM manipulation
      const contextSpan = document.createElement('span');
      contextSpan.classList.add('me-at-github-dropdown-context');
      
      // Get context as DocumentFragment with proper text nodes and strong tags
      const contextFragment = createContextElement(mention);
      contextSpan.appendChild(contextFragment);
      
      li.appendChild(indexSpan);
      li.appendChild(contextSpan);
      
      li.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateToMention(index);
        dropdown.style.display = 'none';
      });
      
      list.appendChild(li);
    });
    
    dropdown.appendChild(list);
    counter.appendChild(dropdown);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      dropdown.style.display = 'none';
    });
    
    // Reposition dropdown on window resize if it's visible
    window.addEventListener('resize', () => {
      if (dropdown.style.display === 'block') {
        positionDropdown(counter, dropdown);
      }
    });
  }

  // Get line content where the mention appears and create DOM nodes
  function createContextElement(mention) {
    const fullText = mention.text;
    const mentionText = `@${username}`;
    
    // Find the line containing the mention
    const lines = fullText.split('\n');
    let lineContent = '';
    let lineStartIndex = 0;
    let mentionLineIndex = -1;
    
    // Find which line contains the mention
    for (let i = 0; i < lines.length; i++) {
      const lineEndIndex = lineStartIndex + lines[i].length;
      if (mention.index >= lineStartIndex && mention.index <= lineEndIndex) {
        lineContent = lines[i].trim();
        mentionLineIndex = i;
        break;
      }
      lineStartIndex = lineEndIndex + 1; // +1 for the newline character
    }
    
    // If line is too long, truncate around the mention but prioritize showing full sentences
    const maxLength = 120;
    let displayText = lineContent;
    
    if (lineContent.length > maxLength) {
      const mentionInLine = mention.index - lineStartIndex + mentionText.length;
      const start = Math.max(0, mentionInLine - maxLength / 2);
      const end = Math.min(lineContent.length, start + maxLength);
      
      displayText = lineContent.substring(start, end);
      
      // Add ellipsis if truncated
      if (start > 0) displayText = '...' + displayText;
      if (end < lineContent.length) displayText = displayText + '...';
    }
    
    // Create a document fragment to hold the line content
    const fragment = document.createDocumentFragment();
    
    // Add line number if available (for code files or multi-line content)
    if (lines.length > 1 && mentionLineIndex >= 0) {
      const lineNumSpan = document.createElement('span');
      lineNumSpan.classList.add('me-at-github-line-number');
      lineNumSpan.textContent = `L${mentionLineIndex + 1}: `;
      fragment.appendChild(lineNumSpan);
    }
    
    // Find the mention in the display text and highlight it
    const mentionPattern = new RegExp(`@${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
    let lastIndex = 0;
    
    // Split display text by mentions and create text nodes and strong tags
    const matches = [...displayText.matchAll(mentionPattern)];
    
    matches.forEach((match) => {
      // Add text before the mention
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(displayText.substring(lastIndex, match.index)));
      }
      
      // Add the mention in a strong tag
      const strong = document.createElement('strong');
      strong.textContent = match[0];
      fragment.appendChild(strong);
      
      lastIndex = match.index + match[0].length;
    });
    
    // Add remaining text
    if (lastIndex < displayText.length) {
      fragment.appendChild(document.createTextNode(displayText.substring(lastIndex)));
    }
    
    return fragment;
  }

  // Toggle dropdown visibility with smart positioning
  function toggleDropdown(counter) {
    const dropdown = counter.querySelector('.me-at-github-dropdown');
    if (!dropdown) return;
    
    if (dropdown.style.display === 'none') {
      dropdown.style.display = 'block';
      
      // Ensure maximum z-index
      ensureMaxZIndex(dropdown);
      
      // Nuclear option: move dropdown to body if z-index issues persist
      const counterRect = counter.getBoundingClientRect();
      const bodyDropdowns = document.querySelectorAll('body > .me-at-github-dropdown-portal');
      
      // Clean up any existing body-level dropdowns
      bodyDropdowns.forEach(d => d.remove());
      
      // Check if dropdown is properly visible after a short delay
      setTimeout(() => {
        const dropdownRect = dropdown.getBoundingClientRect();
        const isVisible = dropdownRect.width > 0 && dropdownRect.height > 0;
        const computedZIndex = parseInt(window.getComputedStyle(dropdown).zIndex);
        
        if (!isVisible || computedZIndex < 1000000) {
          console.log('Me @ GitHub: Dropdown may be hidden, creating body-level portal...');
          createBodyPortalDropdown(counter, dropdown);
        }
      }, 100);
      
      // Smart positioning to keep dropdown on screen
      positionDropdown(counter, dropdown);
    } else {
      dropdown.style.display = 'none';
      // Clean up any body portal
      const bodyDropdowns = document.querySelectorAll('body > .me-at-github-dropdown-portal');
      bodyDropdowns.forEach(d => d.remove());
    }
  }
  
  // Create a body-level dropdown portal to escape stacking context issues
  function createBodyPortalDropdown(counter, originalDropdown) {
    const portalDropdown = originalDropdown.cloneNode(true);
    portalDropdown.classList.add('me-at-github-dropdown-portal');
    portalDropdown.style.position = 'fixed';
    portalDropdown.style.zIndex = '2147483647';
    
    // Position relative to counter
    const counterRect = counter.getBoundingClientRect();
    portalDropdown.style.top = (counterRect.bottom + 8) + 'px';
    portalDropdown.style.left = (counterRect.right - 300) + 'px';
    
    // Hide original and show portal
    originalDropdown.style.display = 'none';
    document.body.appendChild(portalDropdown);
    
    // Handle clicks on portal dropdown
    portalDropdown.addEventListener('click', (e) => {
      if (e.target.closest('.me-at-github-dropdown-item')) {
        const index = parseInt(e.target.closest('.me-at-github-dropdown-item').dataset.mentionIndex);
        if (!isNaN(index)) {
          navigateToMention(index);
          portalDropdown.remove();
          originalDropdown.style.display = 'none';
        }
      }
    });
    
    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', function closePortal(e) {
        if (!portalDropdown.contains(e.target) && !counter.contains(e.target)) {
          portalDropdown.remove();
          document.removeEventListener('click', closePortal);
        }
      });
    }, 0);
    
    console.log('Me @ GitHub: Created body-level dropdown portal');
  }
  
  // Ensure dropdown has maximum z-index to appear above all GitHub elements
  function ensureMaxZIndex(dropdown) {
    // Set to maximum safe integer value with additional properties
    dropdown.style.zIndex = '2147483647';
    dropdown.style.position = 'absolute';
    dropdown.style.isolation = 'isolate';
    dropdown.style.willChange = 'transform';
    dropdown.style.transform = 'translateZ(0)';
    
    // Also set z-index on parent counter
    const counter = dropdown.closest('.me-at-github-counter');
    if (counter) {
      counter.style.position = 'relative';
      counter.style.zIndex = '2147483647';
      counter.style.isolation = 'isolate';
    }
    
    // Check for GitHub popups and Box components
    const githubElements = document.querySelectorAll([
      '[role=\"dialog\"]',
      '.Popover',
      '.dropdown-menu', 
      '.autocomplete-results',
      '.suggester',
      '[class*=\"Box-\"]',
      '.Box-sc-g0xbh4-0',
      '.crMLA-D',
      '[class*=\"crMLA\"]'
    ].join(', '));
    
    let maxZIndex = 2147483647;
    
    githubElements.forEach(element => {
      const zIndex = parseInt(window.getComputedStyle(element).zIndex);
      if (!isNaN(zIndex)) {
        console.log(`Me @ GitHub: Found GitHub element with z-index ${zIndex}:`, element.className);
        if (zIndex >= maxZIndex) {
          maxZIndex = zIndex + 1;
        }
      }
    });
    
    const finalZIndex = Math.min(maxZIndex, 2147483647).toString();
    dropdown.style.zIndex = finalZIndex;
    
    console.log('Me @ GitHub: Set dropdown z-index to', finalZIndex);
    console.log('Me @ GitHub: Dropdown element:', dropdown);
  }
  
  // Position dropdown to stay within viewport bounds
  function positionDropdown(counter, dropdown) {
    // Reset positioning classes
    dropdown.classList.remove('me-at-github-dropdown-left', 'me-at-github-dropdown-up', 'me-at-github-dropdown-center', 'me-at-github-dropdown-mobile');
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollTop = window.scrollY;
    
    // Get counter position
    const counterRect = counter.getBoundingClientRect();
    const counterTop = counterRect.top + scrollTop;
    const counterLeft = counterRect.left;
    const counterRight = counterRect.right;
    const counterBottom = counterRect.bottom + scrollTop;
    
    // Get dropdown dimensions (temporarily make it visible to measure)
    const originalDisplay = dropdown.style.display;
    const originalVisibility = dropdown.style.visibility;
    dropdown.style.visibility = 'hidden';
    dropdown.style.display = 'block';
    
    const dropdownRect = dropdown.getBoundingClientRect();
    const dropdownWidth = dropdownRect.width;
    const dropdownHeight = dropdownRect.height;
    
    // Restore original visibility
    dropdown.style.display = originalDisplay;
    dropdown.style.visibility = originalVisibility;
    
    // Check horizontal positioning
    const spaceOnRight = viewportWidth - counterRight;
    const spaceOnLeft = counterLeft;
    
    // For very small screens (mobile), always use full width
    if (viewportWidth < 600) {
      dropdown.classList.add('me-at-github-dropdown-mobile');
    }
    // If dropdown would go off the right edge, position it to the left
    else if (spaceOnRight < dropdownWidth && spaceOnLeft >= dropdownWidth) {
      dropdown.classList.add('me-at-github-dropdown-left');
    }
    // If there's not enough space on either side, center it and allow scrolling
    else if (spaceOnRight < dropdownWidth && spaceOnLeft < dropdownWidth) {
      dropdown.classList.add('me-at-github-dropdown-center');
    }
    
    // Check vertical positioning
    const spaceBelow = viewportHeight - (counterRect.bottom - scrollTop);
    const spaceAbove = counterRect.top - scrollTop;
    
    // If dropdown would go off the bottom and there's more space above, position it above
    if (spaceBelow < dropdownHeight && spaceAbove >= dropdownHeight) {
      dropdown.classList.add('me-at-github-dropdown-up');
    }
  }

  // Clean up previous initialization
  function cleanup() {
    // Remove existing counters
    document.querySelectorAll('.me-at-github-counter').forEach(el => el.remove());
    
    // Remove existing sticky counter
    const stickyCounter = document.getElementById('me-at-github-sticky-counter');
    if (stickyCounter) {
      stickyCounter.remove();
    }
    
    // Remove existing highlights
    document.querySelectorAll('.me-at-github-mention-text').forEach(el => {
      const parent = el.parentNode;
      if (!parent) return;
      
      // Special handling for link wrappers - unwrap the link
      if (el.classList.contains('me-at-github-link-wrapper')) {
        const link = el.querySelector('a.user-mention');
        if (link) {
          parent.insertBefore(link, el);
        }
        el.remove();
      } else {
        // Replace with plain text for plain text mentions
        const textNode = document.createTextNode(el.textContent);
        parent.replaceChild(textNode, el);
      }
    });
  }

  // Initialize the extension
  function init() {
    console.log('Me @ GitHub: Initializing on', location.href);
    console.log('Me @ GitHub: Page readyState:', document.readyState);
    console.log('Me @ GitHub: DOM content loaded:', document.body ? 'Yes' : 'No');
    
    // Verify we're on a supported page
    const supportedPagePattern = /github\.com\/[^/]+\/[^/]+\/(issues|pull|discussions)\//;
    if (!supportedPagePattern.test(location.href)) {
      console.log('Me @ GitHub: Not on a supported page type, skipping initialization');
      return;
    }
    
    // Clean up any previous initialization
    cleanup();
    
    username = getUsername();
    if (!username) {
      console.log('Me @ GitHub: Could not detect username');
      console.log('Me @ GitHub: Checked meta[name="user-login"]:', document.querySelector('meta[name="user-login"]'));
      console.log('Me @ GitHub: Checked [data-login]:', document.querySelector('[data-login]'));
      return;
    }
    
    console.log('Me @ GitHub: Detected username:', username);
    
    // Find all mentions
    mentions = findMentions();
    console.log('Me @ GitHub: Found', mentions.length, 'mentions');
    
    if (mentions.length > 0) {
      // Initialize mention index
      if (currentMentionIndex < 0) {
        currentMentionIndex = 0;
      }
      
      // Highlight mentions
      highlightMentions();
      
      // Create counter
      createCounter();
      
      // Verify UI elements are still in DOM after a short delay
      setTimeout(() => {
        const counters = document.querySelectorAll('.me-at-github-counter');
        const highlights = document.querySelectorAll('.me-at-github-mention-text');
        console.log('Me @ GitHub: Post-init verification:');
        console.log('  - Counter elements in DOM:', counters.length);
        console.log('  - Highlight elements in DOM:', highlights.length);
        if (counters.length > 0) {
          const counter = counters[0];
          console.log('  - Counter visible:', counter.offsetWidth > 0 && counter.offsetHeight > 0);
          console.log('  - Counter display:', window.getComputedStyle(counter).display);
          console.log('  - Counter position in DOM:', counter.parentElement?.tagName, counter.parentElement?.className);
        }
      }, 100);
      return true; // Success
    } else {
      console.log('Me @ GitHub: No mentions found to highlight');
      return false; // No mentions found
    }
  }

  // Keyboard shortcut handler
  function handleKeyboardShortcut(e) {
    // Only handle shortcuts if:
    // 1. We have a valid username (extension is initialized)
    // 2. We have mentions on the page
    // 3. User is not typing in an input field
    if (!username || 
        mentions.length === 0 || 
        e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable) {
      return;
    }
    
    // Alt+N for next mention
    if (e.altKey && e.key === 'n') {
      e.preventDefault();
      e.stopPropagation();
      const success = navigateToMention(currentMentionIndex + 1);
      if (!success) {
        console.log('Me @ GitHub: Navigation failed, preventing default behavior');
      }
    }
    // Alt+P for previous mention
    else if (e.altKey && e.key === 'p') {
      e.preventDefault();
      e.stopPropagation();
      const success = navigateToMention(currentMentionIndex - 1);
      if (!success) {
        console.log('Me @ GitHub: Navigation failed, preventing default behavior');
      }
    }
  }

  // Run when DOM is ready with multiple initialization attempts
  function initializeWithRetry(attempt = 1, maxAttempts = 5) {
    console.log(`Me @ GitHub: Initialization attempt ${attempt}/${maxAttempts}`);
    console.log(`Me @ GitHub: Current URL: ${location.href}`);
    console.log(`Me @ GitHub: Document ready state: ${document.readyState}`);
    
    if (attempt > maxAttempts) {
      console.log('Me @ GitHub: Max initialization attempts reached');
      return;
    }
    
    // Check if we're still on a supported page
    const supportedPagePattern = /github\.com\/[^/]+\/[^/]+\/(issues|pull|discussions)\//;
    if (!supportedPagePattern.test(location.href)) {
      console.log('Me @ GitHub: Not on supported page, skipping initialization');
      return;
    }
    
    // Try to initialize
    const success = init();
    
    // If no mentions found and we haven't reached max attempts, try again
    if (mentions.length === 0 && attempt < maxAttempts) {
      console.log(`Me @ GitHub: No mentions found on attempt ${attempt}, retrying in ${1000 * attempt}ms...`);
      setTimeout(() => initializeWithRetry(attempt + 1, maxAttempts), 1000 * attempt);
    }
  }
  
  // Force re-initialization function (exposed globally for debugging)
  window.meAtGitHubReinit = function() {
    console.log('Me @ GitHub: Force re-initialization requested');
    cleanup();
    setTimeout(() => initializeWithRetry(), 100);
  };
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('Me @ GitHub: DOMContentLoaded event fired');
      setTimeout(() => initializeWithRetry(), 1000);
    });
  } else {
    console.log('Me @ GitHub: Document already ready');
    // Add a delay to ensure GitHub's dynamic content is loaded
    setTimeout(() => initializeWithRetry(), 1000);
  }
  
  // Additional initialization on page load (for cached pages)
  window.addEventListener('load', () => {
    console.log('Me @ GitHub: Window load event fired');
    const existingCounter = document.querySelector('.me-at-github-counter');
    if (!existingCounter) {
      console.log('Me @ GitHub: No counter found on load, initializing...');
      setTimeout(() => initializeWithRetry(), 500);
    }
  });

  // Setup keyboard shortcuts once (no cleanup needed as it's a single global handler)
  document.addEventListener('keydown', handleKeyboardShortcut);

  // Listen for browser navigation (forward/back buttons)
  window.addEventListener('popstate', () => {
    console.log('Me @ GitHub: Browser navigation detected (popstate), re-initializing...');
    setTimeout(() => initializeWithRetry(), 1000);
  });
  
  // Listen for page show event (handles cached page returns)
  window.addEventListener('pageshow', (event) => {
    console.log('Me @ GitHub: Page show detected, persisted:', event.persisted);
    if (event.persisted) {
      // Page was loaded from cache (back/forward navigation)
      console.log('Me @ GitHub: Page loaded from cache, re-initializing...');
      setTimeout(() => initializeWithRetry(), 500);
    }
  });
  
  // Listen for visibility changes (tab becomes active)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      console.log('Me @ GitHub: Page became visible, checking if extension needs initialization...');
      // Only re-initialize if we don't have any mentions or counters
      const existingCounter = document.querySelector('.me-at-github-counter');
      const existingMentions = document.querySelectorAll('.me-at-github-mention-text');
      if (!existingCounter && existingMentions.length === 0) {
        console.log('Me @ GitHub: No existing extension elements found, re-initializing...');
        setTimeout(() => initializeWithRetry(), 1000);
      }
    }
  });
  
  // Listen for window focus (browser becomes active)
  window.addEventListener('focus', () => {
    console.log('Me @ GitHub: Window focused, checking extension state...');
    const existingCounter = document.querySelector('.me-at-github-counter');
    if (!existingCounter && mentions.length > 0) {
      console.log('Me @ GitHub: Extension elements missing but mentions exist, re-initializing...');
      setTimeout(() => initializeWithRetry(), 500);
    }
  });
  
  // Listen for programmatic navigation (GitHub's single-page app routing)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function() {
    originalPushState.apply(history, arguments);
    console.log('Me @ GitHub: Programmatic navigation detected (pushState), re-initializing...');
    setTimeout(() => initializeWithRetry(), 1000);
  };
  
  history.replaceState = function() {
    originalReplaceState.apply(history, arguments);
    console.log('Me @ GitHub: Programmatic navigation detected (replaceState), re-initializing...');
    setTimeout(() => initializeWithRetry(), 1000);
  };
  
  // Listen for hash changes (single-page navigation)
  window.addEventListener('hashchange', () => {
    console.log('Me @ GitHub: Hash change detected, re-initializing...');
    setTimeout(() => initializeWithRetry(), 500);
  });
  
  // Listen for GitHub's PJAX navigation and content changes
  let lastUrl = location.href;
  const observer = new MutationObserver((mutations) => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      console.log('Me @ GitHub: Page navigation detected, re-initializing...');
      // Re-initialize after navigation with retry logic
      setTimeout(() => initializeWithRetry(), 1500);
      return;
    }
    
    // Check for content changes that might affect mentions
    let shouldRehighlight = false;
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if new content was added that might contain mentions
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Look for comment content or timeline items
            if (node.classList && (node.classList.contains('js-timeline-item') ||
                                   node.classList.contains('js-comment') ||
                                   node.querySelector && node.querySelector('.js-comment'))) {
              shouldRehighlight = true;
              break;
            }
          }
        }
        if (shouldRehighlight) break;
      }
    }
    
    if (shouldRehighlight && username) {
      console.log('Me @ GitHub: New content detected, re-highlighting mentions');
      // Re-find and highlight mentions after a short delay
      setTimeout(() => {
        // Find new mentions without cleaning up existing ones first
        const newMentions = findMentions();
        if (newMentions.length > mentions.length) {
          mentions = newMentions;
          
          // Validate and reset current mention index if needed
          if (currentMentionIndex >= mentions.length) {
            currentMentionIndex = 0;
          }
          
          // Only highlight the new mentions
          highlightMentions();
          // Update counter if needed
          const counter = document.querySelector('.me-at-github-counter');
          if (counter) {
            counter.textContent = `@${mentions.length}`;
            counter.title = `${mentions.length} mention${mentions.length !== 1 ? 's' : ''} of @${username}`;
          }
          const stickyCounter = document.getElementById('me-at-github-sticky-counter');
          if (stickyCounter) {
            stickyCounter.textContent = `@${mentions.length}`;
            stickyCounter.title = `${mentions.length} mention${mentions.length !== 1 ? 's' : ''} of @${username}`;
          }
        }
      }, 500);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Fallback: periodic check for URL changes (in case other listeners miss something)
  let currentUrl = location.href;
  setInterval(() => {
    if (location.href !== currentUrl) {
      currentUrl = location.href;
      console.log('Me @ GitHub: URL change detected via periodic check, re-initializing...');
      setTimeout(() => initializeWithRetry(), 500);
    }
  }, 2000); // Check every 2 seconds
  
  // Health check: ensure extension is active on supported pages
  setInterval(() => {
    const supportedPagePattern = /github\.com\/[^/]+\/[^/]+\/(issues|pull|discussions)\//;
    if (supportedPagePattern.test(location.href)) {
      const existingCounter = document.querySelector('.me-at-github-counter');
      const bodyText = document.body.textContent || '';
      const hasUsername = bodyText.includes(`@${username || 'unknown'}`);
      
      if (!existingCounter && hasUsername && username) {
        console.log('Me @ GitHub: Health check - extension should be active but counter missing, re-initializing...');
        setTimeout(() => initializeWithRetry(), 1000);
      }
    }
  }, 10000); // Check every 10 seconds

  // Expose force initialization function for debugging
  window.meAtGitHubForceInit = function() {
    console.log('Me @ GitHub: Force initialization requested');
    initializeWithRetry(1, 1); // Single attempt
  };
  
  // Expose diagnostic function for debugging
  window.meAtGitHubDiagnostics = function() {
    console.log('=== Me @ GitHub Diagnostics ===');
    console.log('Extension State:');
    console.log('  - Username:', username || 'NOT SET');
    console.log('  - Mentions found:', mentions.length);
    console.log('  - Current mention index:', currentMentionIndex);
    console.log('');
    console.log('DOM Elements:');
    console.log('  - Counter elements:', document.querySelectorAll('.me-at-github-counter').length);
    console.log('  - Highlight elements:', document.querySelectorAll('.me-at-github-mention-text').length);
    console.log('  - Dropdown elements:', document.querySelectorAll('.me-at-github-dropdown').length);
    console.log('');
    
    const counter = document.querySelector('.me-at-github-counter');
    if (counter) {
      console.log('Counter Element:');
      console.log('  - Exists: YES');
      console.log('  - Visible:', counter.offsetWidth > 0 && counter.offsetHeight > 0);
      console.log('  - Display:', window.getComputedStyle(counter).display);
      console.log('  - Visibility:', window.getComputedStyle(counter).visibility);
      console.log('  - Opacity:', window.getComputedStyle(counter).opacity);
      console.log('  - Parent:', counter.parentElement?.tagName, counter.parentElement?.className);
      console.log('  - Position:', counter.getBoundingClientRect());
    } else {
      console.log('Counter Element: NOT FOUND');
    }
    console.log('');
    
    console.log('Title Element Check:');
    const selectors = [
      'h1.gh-header-title',
      'h1.js-issue-title',
      'h1[data-testid="issue-title"]',
      '.gh-header-title',
      'bdi.js-issue-title',
      'span.js-issue-title',
      'h1'
    ];
    selectors.forEach(selector => {
      const el = document.querySelector(selector);
      if (el) {
        console.log(`  - ${selector}: FOUND (${el.tagName}, visible: ${el.offsetWidth > 0 && el.offsetHeight > 0})`);
      } else {
        console.log(`  - ${selector}: not found`);
      }
    });
    console.log('');
    console.log('To manually re-initialize, run: location.reload()');
    console.log('===============================');
  };
  
  console.log('Me @ GitHub: Diagnostics function available. Run meAtGitHubDiagnostics() to check extension state.');
  console.log('Me @ GitHub: Force init function available. Run meAtGitHubForceInit() to force re-initialization.');

})();
