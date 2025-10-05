// Main content script for Me @ GitHub extension

(function() {
  'use strict';

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
  function findMentions() {
    if (!username) return [];
    
    const mentions = [];
    
    // First, find GitHub's native user mention links
    const mentionLinks = document.querySelectorAll('a.user-mention');
    console.log('Me @ GitHub: Found', mentionLinks.length, 'user-mention links');
    
    mentionLinks.forEach((link, idx) => {
      const linkText = link.textContent.trim();
      const linkHref = link.getAttribute('href') || link.href;
      
      console.log(`Me @ GitHub: Link ${idx + 1}: text="${linkText}", href="${linkHref}"`);
      
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
          console.log(`Me @ GitHub: Link ${idx + 1} has no text node`);
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
              parent.classList.contains('me-at-github-dropdown') ||
              parent.classList.contains('user-mention')) {  // Skip GitHub's mention links (already processed)
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
    // Group mentions by their text node to process multiple mentions in the same node
    const nodeGroups = new Map();
    mentions.forEach((mention, index) => {
      if (!nodeGroups.has(mention.node)) {
        nodeGroups.set(mention.node, []);
      }
      nodeGroups.get(mention.node).push({ ...mention, originalIndex: index });
    });
    
    // Process each text node
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
    });
  }

  // Add prev/next navigation controls to a mention
  function addNavigationControls(element, index) {
    const nav = document.createElement('div');
    nav.classList.add('me-at-github-nav');
    nav.innerHTML = `
      <button class="me-at-github-nav-btn me-at-github-prev" title="Previous mention">←</button>
      <span class="me-at-github-nav-index">${index + 1}/${mentions.length}</span>
      <button class="me-at-github-nav-btn me-at-github-next" title="Next mention">→</button>
    `;
    
    element.appendChild(nav);
    
    // Add event listeners
    const prevBtn = nav.querySelector('.me-at-github-prev');
    const nextBtn = nav.querySelector('.me-at-github-next');
    
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateToMention(index - 1);
    });
    
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateToMention(index + 1);
    });
  }

  // Navigate to a specific mention
  function navigateToMention(index) {
    if (mentions.length === 0) return;
    
    // Wrap around: if index is out of bounds, loop to the other end
    if (index < 0) {
      index = mentions.length - 1;
    } else if (index >= mentions.length) {
      index = 0;
    }
    
    currentMentionIndex = index;
    const mention = mentions[index];
    
    // Remove active class from all mentions
    document.querySelectorAll('.me-at-github-mention-text').forEach(el => {
      el.classList.remove('active');
    });
    
    // Add active class to current mention
    mention.element.classList.add('active');
    
    // Scroll to the mention
    mention.element.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }

  // Create and inject the counter badge
  function createCounter() {
    const count = mentions.length;
    if (count === 0) return;
    
    // Find the page title - try multiple selectors for different GitHub layouts
    // Try to find the specific title content element first, then fall back to container
    let titleElement = document.querySelector(
      'h1.gh-header-title .js-issue-title, ' +
      'h1.gh-header-title bdi.js-issue-title, ' +
      'h1.gh-header-title span.js-issue-title, ' +
      'bdi.js-issue-title, ' +
      'span.js-issue-title, ' +
      'h1.gh-header-title, ' +
      'h1.js-issue-title, ' +
      'h1[data-testid="issue-title"]'
    );
    
    // If we found a child element (bdi/span), use its parent h1 instead
    if (titleElement && (titleElement.tagName === 'BDI' || titleElement.tagName === 'SPAN')) {
      titleElement = titleElement.closest('h1') || titleElement;
    }
    
    if (!titleElement) {
      console.log('Me @ GitHub: Could not find title element');
      console.log('Me @ GitHub: Available h1 elements:', document.querySelectorAll('h1'));
      return;
    }
    
    console.log('Me @ GitHub: Found title element:', titleElement);
    
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
    
    // Insert after the title
    titleElement.appendChild(counter);
    
    // Create dropdown
    createDropdown(counter);
  }

  // Create the dropdown menu
  function createDropdown(counter) {
    const dropdown = document.createElement('div');
    dropdown.classList.add('me-at-github-dropdown');
    dropdown.style.display = 'none';
    
    const list = document.createElement('ul');
    list.classList.add('me-at-github-dropdown-list');
    
    mentions.forEach((mention, index) => {
      const li = document.createElement('li');
      li.classList.add('me-at-github-dropdown-item');
      
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
  }

  // Get context text around a mention and create DOM nodes
  function createContextElement(mention) {
    const text = mention.text;
    const mentionText = `@${username}`;
    const startIndex = Math.max(0, mention.index - 30);
    const endIndex = Math.min(text.length, mention.index + mentionText.length + 30);
    
    let context = text.substring(startIndex, endIndex);
    
    // Add ellipsis if truncated
    if (startIndex > 0) context = '...' + context;
    if (endIndex < text.length) context = context + '...';
    
    // Create a document fragment to hold the context
    const fragment = document.createDocumentFragment();
    
    // Find the mention in the context
    const mentionPattern = new RegExp(`@${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
    let lastIndex = 0;
    let match;
    
    // Split context by mentions and create text nodes and strong tags
    const matches = [...context.matchAll(mentionPattern)];
    
    matches.forEach((match) => {
      // Add text before the mention
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(context.substring(lastIndex, match.index)));
      }
      
      // Add the mention in a strong tag
      const strong = document.createElement('strong');
      strong.textContent = match[0];
      fragment.appendChild(strong);
      
      lastIndex = match.index + match[0].length;
    });
    
    // Add remaining text
    if (lastIndex < context.length) {
      fragment.appendChild(document.createTextNode(context.substring(lastIndex)));
    }
    
    return fragment;
  }

  // Toggle dropdown visibility
  function toggleDropdown(counter) {
    const dropdown = counter.querySelector('.me-at-github-dropdown');
    if (!dropdown) return;
    
    if (dropdown.style.display === 'none') {
      dropdown.style.display = 'block';
    } else {
      dropdown.style.display = 'none';
    }
  }

  // Clean up previous initialization
  function cleanup() {
    // Remove existing counters
    document.querySelectorAll('.me-at-github-counter').forEach(el => el.remove());
    
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
      // Highlight mentions
      highlightMentions();
      
      // Create counter
      createCounter();
    } else {
      console.log('Me @ GitHub: No mentions found to highlight');
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
      navigateToMention(currentMentionIndex + 1);
    }
    // Alt+P for previous mention
    else if (e.altKey && e.key === 'p') {
      e.preventDefault();
      navigateToMention(currentMentionIndex - 1);
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Setup keyboard shortcuts once (no cleanup needed as it's a single global handler)
  document.addEventListener('keydown', handleKeyboardShortcut);

  // Listen for GitHub's PJAX navigation
  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      // Re-initialize after navigation with longer delay to ensure page is fully loaded
      setTimeout(init, 1000);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();
