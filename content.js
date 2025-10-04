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
    
    const pattern = new RegExp(`@${username}\\b`, 'gi');
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
          if (pattern.test(node.textContent)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent;
      const matches = text.matchAll(pattern);
      
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
    mentions.forEach((mention, index) => {
      const element = mention.element;
      const text = mention.node.textContent;
      const mentionText = `@${username}`;
      
      // Don't highlight if already highlighted
      if (element.classList.contains('me-at-github-mention')) {
        return;
      }
      
      // Wrap the mention in a span
      const beforeText = text.substring(0, mention.index);
      const afterText = text.substring(mention.index + mentionText.length);
      
      const wrapper = document.createElement('span');
      wrapper.classList.add('me-at-github-mention');
      wrapper.setAttribute('data-mention-index', index);
      
      const beforeNode = document.createTextNode(beforeText);
      const mentionSpan = document.createElement('span');
      mentionSpan.classList.add('me-at-github-mention-text');
      mentionSpan.textContent = mentionText;
      const afterNode = document.createTextNode(afterText);
      
      wrapper.appendChild(beforeNode);
      wrapper.appendChild(mentionSpan);
      wrapper.appendChild(afterNode);
      
      // Replace the text node
      mention.node.parentNode.replaceChild(wrapper, mention.node);
      mention.element = mentionSpan;
      
      // Add navigation controls
      addNavigationControls(mentionSpan, index);
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
    if (index < 0 || index >= mentions.length) return;
    
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
    
    // Find the page title (h1)
    const titleElement = document.querySelector('.gh-header-title, .js-issue-title, h1.js-issue-title');
    if (!titleElement) return;
    
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

  // Initialize the extension
  function init() {
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

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Also observe for dynamic content changes (GitHub uses PJAX)
  const observer = new MutationObserver((mutations) => {
    // Check if the page has changed significantly
    const hasSignificantChange = mutations.some(mutation => {
      return mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0;
    });
    
    if (hasSignificantChange) {
      // Re-initialize after a delay to let the page settle
      setTimeout(init, 500);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();
