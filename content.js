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
    
    // Search in all text nodes
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
      }
    }
    
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
    const titleElement = document.querySelector(
      '.gh-header-title, .js-issue-title, h1.js-issue-title, ' +
      'bdi.js-issue-title, h1[data-testid="issue-title"], ' +
      '.gh-header-title .js-issue-title'
    );
    if (!titleElement) {
      console.log('Me @ GitHub: Could not find title element');
      return;
    }
    
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
      
      // Get context around the mention
      const context = getContextText(mention);
      
      li.innerHTML = `
        <span class="me-at-github-dropdown-index">#${index + 1}</span>
        <span class="me-at-github-dropdown-context">${context}</span>
      `;
      
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

  // Get context text around a mention
  function getContextText(mention) {
    const text = mention.text;
    const mentionText = `@${username}`;
    const startIndex = Math.max(0, mention.index - 30);
    const endIndex = Math.min(text.length, mention.index + mentionText.length + 30);
    
    let context = text.substring(startIndex, endIndex);
    
    // Add ellipsis if truncated
    if (startIndex > 0) context = '...' + context;
    if (endIndex < text.length) context = context + '...';
    
    // Escape HTML
    context = context.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Highlight the mention
    context = context.replace(
      new RegExp(`@${username}`, 'gi'),
      `<strong>@${username}</strong>`
    );
    
    return context;
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
      if (parent) {
        // Replace with plain text
        const textNode = document.createTextNode(el.textContent);
        parent.replaceChild(textNode, el);
      }
    });
  }

  // Initialize the extension
  function init() {
    // Clean up any previous initialization
    cleanup();
    
    username = getUsername();
    if (!username) {
      console.log('Me @ GitHub: Could not detect username');
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
    }
  }

  // Add keyboard shortcuts
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Only handle shortcuts if we have mentions and not typing in an input
      if (mentions.length === 0 || 
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
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Setup keyboard shortcuts once
  setupKeyboardShortcuts();

  // Listen for GitHub's PJAX navigation
  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      // Re-initialize after navigation
      setTimeout(init, 500);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();
