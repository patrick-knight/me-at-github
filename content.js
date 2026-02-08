// Main content script for Me @ GitHub extension

(function() {
  'use strict';
  
    console.log('🚀 Me @ GitHub extension loaded!');

  let username = null;
  let mentions = [];
  let currentMentionIndex = -1;

  // Shared supported page patterns (DRY principle)
  const SUPPORTED_PAGE_PATTERNS = [
    /github\.com\/[^/]+\/[^/]+\/(issues|pull|discussions)\//,
    /github\.com\/orgs\/[^/]+\/discussions\//
  ];

  // Helper function to check if current page is supported
  function isOnSupportedPage() {
    return SUPPORTED_PAGE_PATTERNS.some(pattern => pattern.test(location.href));
  }

  // Get the logged-in user's username
  function getUsername() {
    // Check for username in the page header
    const userMenu = document.querySelector('meta[name="user-login"]');
    if (userMenu) {
      const username = userMenu.getAttribute('content');
      return validateUsername(username);
    }
    
    // Fallback: check the signed-in user menu
    const signedInUser = document.querySelector('[data-login]');
    if (signedInUser) {
      const username = signedInUser.getAttribute('data-login');
      return validateUsername(username);
    }
    
    return null;
  }
  
  // Validate username format (GitHub allows alphanumeric and hyphens only)
  function validateUsername(username) {
    if (!username || typeof username !== 'string') {
      return null;
    }
    // GitHub usernames: 1-39 chars, alphanumeric or hyphens, cannot start/end with hyphen
    const usernameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
    return usernameRegex.test(username) ? username : null;
  }

  // Find all mentions of the username in @<username> format
  // Helper function to check if a node is in an excluded area (titles, headers, navigation)
  function isInExcludedArea(node) {
    let current = node;
    let foundAllowedArea = false;
    
    // Walk up the DOM tree to check for excluded areas
    while (current && current !== document.body) {
      const element = current.nodeType === Node.TEXT_NODE ? current.parentElement : current;
      
      if (!element) break;
      
      // FIRST: Check if we're inside an allowed comment body area
      const classList = element.classList;
      if (classList) {
        const allowedClasses = [
          'comment-body',
          'js-comment-body',
          'markdown-body',
          'js-comment-update',
          'edit-comment-hide',
          'js-suggested-changes-contents',
          'js-file-content',
          'IssueCommentViewer-module__IssueCommentBody',
          'DiscussionCommentViewer-module__DiscussionCommentBody',
          'discussion-comment-body',
          'js-discussion-comment-body',
          'js-comment-container',
          'js-comment-text',
          'review-comment-contents',
          'js-review-comment-contents',
          'js-suggested-changes-blob',
          'js-file-line-container',
          'pull-request-review-comment',
          'timeline-comment-wrapper',
          // GitHub February 2025 UI refresh classes
          'Layout-sc-1xcs6mc-0',
          'Layout-self-start'
        ];

        for (const allowedClass of allowedClasses) {
          if (classList.contains(allowedClass)) {
            // We're in a comment body - this is definitely allowed
            foundAllowedArea = true;
            break;
          }
        }
      }

      if (!foundAllowedArea) {
        const dataTestId = element.getAttribute && element.getAttribute('data-testid');
        if (dataTestId) {
          const allowedTestIds = [
            'comment-body',
            'comment-body-inner',
            'issue-comment-body',
            'discussion-comment-body',
            'timeline-comment-body',
            'pull-request-review-comment-body',
            'review-comment-body'
          ];
          for (const allowedId of allowedTestIds) {
            if (dataTestId.includes(allowedId)) {
              foundAllowedArea = true;
              break;
            }
          }
        }
      }
      
      // If we found an allowed area, stop checking and allow it
      if (foundAllowedArea) {
        return false;
      }
      
      // Check for title areas and headers
      const tagName = element.tagName?.toLowerCase();
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'title'].includes(tagName)) {
        return true;
      }
      
      // Check for GitHub-specific title and header classes
      if (classList) {
        const excludedClasses = [
          // Issue, PR and Discussion titles
          'js-issue-title',
          'js-pr-title', 
          'js-discussion-title',
          'issue-title',
          'pr-title',
          'discussion-title',
          'js-issue-row',
          'js-navigation-item-text',
          'discussion-header',
          'js-discussion-header',
          
          // Activity feeds and list headers
          'ActivityHeader-module',
          'ActivityHeader',
          'js-activity-header',
          'activity-header',
          'list-group-item',
          'js-issue-row',
          'js-recent-activity-container',
          'js-navigation-item',
          'js-issue-list-item',
          'notification-list-item',
          'issue-list-item',
          
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
          'notification-list-item-link',
          
          // Participants and collaboration areas
          'participant-avatar',
          'participation-avatars',
          'participants'
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
      
      // Additional comprehensive checks for modern GitHub CSS modules
      const className = (element.className && element.className.toString) ? 
        element.className.toString() : 
        (element.className || '');
      
      // Check for CSS modules (GitHub's modern styling system)
      const excludedClassNamePatterns = [
        'ActivityHeader',
        'Header-module',
        'ListItem-module',
        'IssueItem-module',
        'navigation',
        'comment-reactions',
        'social-reactions',
        'reactions-container',
        'js-reaction-buttons',
        'participation-avatars',
        'participants',
        'participant-avatar',
        'assignee',
        'Assignee',
        'd-flex',
        'flex-wrap'
      ];

      if (excludedClassNamePatterns.some(pattern => className.includes(pattern))) {
        return true;
      }

      if (element.closest && (element.closest('[class*="ActivityHeader"]') ||
                              element.closest('[class*="assignee"]') ||
                              element.closest('[class*="Assignee"]'))) {
        return true;
      }
      
      // Check data attributes that might indicate list items or headers
      const dataTestId = element.getAttribute('data-testid');
      if (dataTestId && (dataTestId.includes('header') || dataTestId.includes('title') || dataTestId.includes('nav'))) {
        return true;
      }
      
      current = element.parentElement;
    }
    
    return false;
  }

  function findMentions() {
    if (!username) return [];
    
    console.log('findMentions: Searching for mentions of:', username);
    
    const mentions = [];
    
    // Optimize: Use combined selector instead of multiple querySelectorAll calls
    // This reduces DOM traversals from 4 to 1
    const combinedSelector = `a.user-mention, a[href*="/${username}"], a.mention, a[data-hovercard-type="user"]`;
    const allLinks = document.querySelectorAll(combinedSelector);
    
    console.log(`findMentions: Found ${allLinks.length} potential mention links`);
    
    allLinks.forEach((link, idx) => {
      const linkText = link.textContent.trim();
      const linkHref = link.getAttribute('href') || link.href;
      
      console.log(`findMentions: Checking link ${idx}:`, { text: linkText, href: linkHref });
      
      // Skip if this link is in an excluded area (title, header, etc.)
      const excluded = isInExcludedArea(link);
      if (excluded) {
        console.log(`findMentions: Link ${idx} is in excluded area, skipping`, link);
        return;
      }
      
      // Check if this link mentions the current user
      // GitHub's mention links have href like "/username" or "https://github.com/username"
      const matchesText = linkText === `@${username}`;
      const matchesHref = linkHref.endsWith(`/${username}`) || linkHref === `/${username}`;
      
      console.log(`findMentions: Link ${idx} matching:`, { matchesText, matchesHref });
      
      if (matchesText || matchesHref) {
        // Find the text node inside the link
        let textNode = Array.from(link.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
        if (!textNode) {
          const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
          textNode = walker.nextNode();
        }
        if (textNode) {
          console.log(`findMentions: Found mention in link ${idx}`);
          mentions.push({
            node: textNode,
            text: textNode.textContent,
            index: 0,
            element: link
          });
        } else {
          console.log(`findMentions: Link ${idx} matches but has no text node`);
        }
      }
    });
    
    // Then search in comment body containers for plain text mentions
    const commentBodySelectors = [
      '.comment-body',
      '.js-comment-body', 
      '.markdown-body',
      '[class*="IssueCommentViewer-module__IssueCommentBody"]',
      '[class*="DiscussionCommentViewer-module__DiscussionCommentBody"]',
      '.discussion-comment-body',
      '.js-discussion-comment-body',
      // PR-specific selectors
      '.js-comment-text',
      '.review-comment-contents',
      '.js-review-comment-contents',
      '.js-suggested-changes-blob',
      '.js-file-line-container',
      '[data-testid="pr-comment-body"]',
      '[data-testid="review-comment-body"]',
      '.js-timeline-item .comment-body',
      '.js-discussion .comment-body'
    ];
    
    commentBodySelectors.forEach(selector => {
      const containers = document.querySelectorAll(selector);
      
      containers.forEach((container, containerIdx) => {
        const walker = document.createTreeWalker(
          container,
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
      });
    });
    
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
      // Skip if already processed or if text node is polluted with navigation
      if (!textNode.parentNode || 
          textNode.parentNode.classList?.contains('me-at-github-mention-text') ||
          textNode.textContent.includes('←') || 
          textNode.textContent.includes('→')) {
        return;
      }
      
      const parent = textNode.parentNode;
      
      // Special handling for GitHub's native mention links
      if (parent.classList && parent.classList.contains('user-mention')) {
        // Wrap the entire link in our highlight span
        const mentionSpan = document.createElement('span');
        mentionSpan.classList.add('me-at-github-mention-text', 'me-at-github-link-wrapper');
        
        // Get the index for this mention
        const index = mentionList[0].originalIndex;
        mentionSpan.setAttribute('data-mention-index', index);
        
        // Batch DOM operations to avoid reflows
        const parentNode = parent.parentNode;
        parentNode.insertBefore(mentionSpan, parent);
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
    // Don't add navigation controls if there's only one mention
    if (mentions.length <= 1) {
      return;
    }
    
    // Check if navigation controls already exist
    if (element.querySelector('.me-at-github-nav')) {
      return;
    }
    
    // Don't add navigation to elements in excluded areas (assignees, timeline, etc.)
    if (isInExcludedArea(element)) {
      return;
    }
    
    const nav = document.createElement('div');
    nav.classList.add('me-at-github-nav');
    
    // Ensure nav is hidden by default with inline style as fallback
    nav.style.display = 'none';
    
    // Create navigation buttons safely without innerHTML
    const prevBtn = document.createElement('button');
    prevBtn.className = 'me-at-github-nav-btn me-at-github-prev';
    prevBtn.title = 'Previous mention';
    prevBtn.textContent = '←';
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'me-at-github-nav-btn me-at-github-next';
    nextBtn.title = 'Next mention';
    nextBtn.textContent = '→';
    
    nav.appendChild(prevBtn);
    nav.appendChild(nextBtn);
    
    element.appendChild(nav);
    
    let hideTimeout;
    
    // Show navigation on hover or active
    const showNav = () => {
      clearTimeout(hideTimeout);
      // Only show if we have mentions to navigate through
      if (mentions.length > 1) {
        nav.style.display = 'flex';
      }
    };
    
    // Hide navigation with delay
    const hideNav = () => {
      hideTimeout = setTimeout(() => {
        nav.style.display = 'none';
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
      }
    });
  }

  // Navigate to a specific mention
  function navigateToMention(index) {
    if (mentions.length === 0) {
      return false;
    }
    
    // Wrap around: if index is out of bounds, loop to the other end
    if (index < 0) {
      index = mentions.length - 1;
    } else if (index >= mentions.length) {
      index = 0;
    }
    
    currentMentionIndex = index;
    const mention = mentions[index];
    
    if (!mention || !mention.element) {
      return false;
    }
    
    // Remove active class from all mentions
    document.querySelectorAll('.me-at-github-mention-text').forEach(el => {
      el.classList.remove('active');
    });
    
    // Add active class to current mention
    mention.element.classList.add('active');
    
    // Scroll to the mention with error handling, using RAF to avoid forced reflow
    requestAnimationFrame(() => {
      try {
        mention.element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      } catch (error) {
        // Fallback: try without smooth behavior
        mention.element.scrollIntoView({
          block: 'center'
        });
      }
    });
    
    return true;
  }

  // Create and inject the counter badge
  function createCounter() {
    const count = mentions.length;
    console.log('createCounter called with count:', count);
    if (count === 0) return;
    
    // Find the issue/PR number element first - this is our primary target
    const issueSelectors = [
      '[class*="HeaderViewer-module__issueNumberText"]', // Priority: New GitHub UI issue number
      '.gh-header-number',               // Issue/PR number in header
      'span.f1-light',                   // Alternative number styling  
      '.js-issue-number',                // JS issue number
      '.gh-header-title .f1-light',      // Number within title
      'h1 .f1-light',                    // Generic number in h1
      '[data-testid="issue-title"] .f1-light', // New GitHub UI
      'h1 span.color-fg-muted',          // GitHub's muted text styling
      'h1 .color-fg-muted',              // Alternative muted styling
      'span[data-testid="issue-number"]', // Possible data attribute
      '.issue-title-actions + h1 span',  // Adjacent to actions
      'h1 > span:first-child',           // First span in h1 (often the number)
      '.js-issue-title span',            // Span within issue title
      'bdi span',                        // Span within bdi element
      '.gh-header-meta .color-fg-muted', // Header meta with muted color
      'span[title*="#"]'                 // Span with # in title attribute
    ];
    
    let issueNumberElement = null;
    
    for (const selector of issueSelectors) {
      const elements = document.querySelectorAll(selector);
      
      for (const element of elements) {
        if (element && element.offsetWidth > 0 && element.offsetHeight > 0) {
          // Check if it contains a # (issue/PR number)
          if (element.textContent.includes('#')) {
            issueNumberElement = element;
            break;
          }
        }
      }
      if (issueNumberElement) break;
    }
    
    // Fallback to title element if no issue number found
    if (!issueNumberElement) {
      const titleSelectors = [
        'h1.gh-header-title',
        'h1.js-issue-title',
        'h1[data-testid="issue-title"]',
        '[data-testid="issue-title"]',
        'h1.d-flex',
        '.gh-header-title',
        'bdi.js-issue-title',
        'span.js-issue-title',
        'main h1',
        'h1'
      ];
      
      for (const selector of titleSelectors) {
        const elements = document.querySelectorAll(selector);
        
        for (const element of elements) {
          if (element && element.offsetWidth > 0 && element.offsetHeight > 0) {
            issueNumberElement = element;
            break;
          }
        }
        if (issueNumberElement) break;
      }
    }
    
    if (!issueNumberElement) {
      console.log('createCounter: No issue number element found');
      return;
    }
    
    console.log('createCounter: Found issue number element:', issueNumberElement);
    
    // Create counter badge
    const counter = document.createElement('span');
    counter.classList.add('me-at-github-counter');
    counter.textContent = `${count} mention${count !== 1 ? 's' : ''}`;
    // Set title property directly to avoid attribute injection
    counter.title = count + ' mention' + (count !== 1 ? 's' : '') + ' of @' + username;
    
    console.log('createCounter: Counter element created');
    
    // Add click handler to toggle dropdown
    counter.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('Counter clicked!');
      toggleDropdown(counter);
    });
    
    // Store reference for body click handler to close dropdown on outside click
    counter._dropdownToggleHandler = (e) => {
      // Don't close if clicking on the counter itself or dropdown content
      if (counter.contains(e.target) || 
          document.querySelector('.me-at-github-dropdown-portal')?.contains(e.target)) {
        return;
      }
      
      hideDropdown(counter);
    };
    
    // Insert the counter after the target element
    issueNumberElement.parentNode.insertBefore(counter, issueNumberElement.nextSibling);
    
    // Create dropdown
    createDropdown(counter);
    
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
    stickyCounter.textContent = `${count} mention${count !== 1 ? 's' : ''}`;
    stickyCounter.title = count + ' mention' + (count !== 1 ? 's' : '') + ' of @' + username;
    
        // Add click handler
    stickyCounter.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      // Scroll to first mention when clicked
      if (mentions.length > 0) {
        navigateToMention(0);
      }
    });
    
    // Insert into GitHub's sticky header if available, otherwise fallback to body
    const stickyHeader = document.querySelector('[data-testid="issue-metadata-sticky"]');
    const stickyContent = stickyHeader?.querySelector('.HeaderMetadata-module__stickyContent--jGltj');
    
    if (stickyContent) {
      // Insert at the beginning of the sticky content
      stickyContent.insertBefore(stickyCounter, stickyContent.firstChild);
    } else {
      // Fallback: append to body with original scroll behavior
      document.body.appendChild(stickyCounter);
      
      // Show/hide based on scroll position (only for body-appended counter)
      // Throttle scroll events for better performance
      let isHeaderVisible = true;
      let scrollTimeout = null;
      const checkScroll = () => {
        if (scrollTimeout) return; // Skip if already scheduled
        
        scrollTimeout = setTimeout(() => {
          const headerHeight = 80;
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
          scrollTimeout = null;
        }, 100); // Throttle to 100ms
      };
      
      window.addEventListener('scroll', checkScroll, { passive: true });
      checkScroll(); // Initial check
    }
  }

  // Create the dropdown menu
  function createDropdown(counter) {
    const dropdown = document.createElement('div');
    dropdown.classList.add('me-at-github-dropdown');
    dropdown.style.display = 'none';
    dropdown.style.zIndex = '2147483647'; // Set maximum z-index immediately
    
    const list = document.createElement('ul');
    list.classList.add('me-at-github-dropdown-list');
    
    mentions.forEach((mention, index) => {
      const li = document.createElement('li');
      li.classList.add('me-at-github-dropdown-item');
      li.setAttribute('data-mention-index', index.toString());
      
      // Create context span with safe DOM manipulation
      const contextSpan = document.createElement('span');
      contextSpan.classList.add('me-at-github-dropdown-context');
      
      // Get context as DocumentFragment with proper text nodes and strong tags
      const contextFragment = createContextElement(mention);
      
      if (contextFragment && contextFragment.childNodes.length > 0) {
        contextSpan.appendChild(contextFragment);
      } else {
        // Fallback if no context could be created
        contextSpan.textContent = `Mention #${index + 1}: @${username}`;
      }
      
      li.appendChild(contextSpan);
      
      li.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateToMention(index);
        hideDropdown(counter);
      });
      
      list.appendChild(li);
    });
    
    dropdown.appendChild(list);
    counter.appendChild(dropdown);
  }

  // Get line content where the mention appears and create DOM nodes
  function createContextElement(mention) {
    let fullText = mention.text || '';
    const mentionText = `@${username}`;
    
    // Try to get better context from the element
    let contextText = fullText;
    if (mention.element && mention.element.closest) {
      const container = mention.element.closest('.comment-body, .js-comment-body, .markdown-body, .discussion-comment-body, .js-discussion-comment-body, [class*="DiscussionCommentViewer-module__DiscussionCommentBody"]');
      if (container) {
        // Clone the container to safely remove navigation controls without affecting the page
        const tempContainer = container.cloneNode(true);
        // Remove navigation controls from the clone
        tempContainer.querySelectorAll('.me-at-github-nav').forEach(nav => nav.remove());
        contextText = tempContainer.textContent || fullText;
      }
    }
    
    // If no meaningful text, create a simple display
    if (!contextText || contextText.trim().length < 10) {
      const fragment = document.createDocumentFragment();
      fragment.appendChild(document.createTextNode(`Mentioned as `));
      const strong = document.createElement('strong');
      strong.textContent = mentionText;
      fragment.appendChild(strong);
      return fragment;
    }
    
    // If short text, show it all with highlighting
    if (contextText.length < 100) {
      const fragment = document.createDocumentFragment();
      const displayText = contextText.trim();
      
      // Find and highlight mentions
      const mentionPattern = new RegExp(`@${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
      let lastIndex = 0;
      const matches = [...displayText.matchAll(mentionPattern)];
      
      if (matches.length === 0) {
        // No matches found, just show the text
        fragment.appendChild(document.createTextNode(displayText));
      } else {
        matches.forEach((match) => {
          if (match.index > lastIndex) {
            fragment.appendChild(document.createTextNode(displayText.substring(lastIndex, match.index)));
          }
          const strong = document.createElement('strong');
          strong.textContent = match[0];
          fragment.appendChild(strong);
          lastIndex = match.index + match[0].length;
        });
        
        if (lastIndex < displayText.length) {
          fragment.appendChild(document.createTextNode(displayText.substring(lastIndex)));
        }
      }
      
      return fragment;
    }
    
    // For longer text, use the original line-based logic
    fullText = contextText;
    
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
    
    // If we didn't find a line, fall back to showing context around the mention
    if (lineContent === '' && mention.index >= 0) {
      const start = Math.max(0, mention.index - 50);
      const end = Math.min(fullText.length, mention.index + 50);
      lineContent = fullText.substring(start, end).trim();
      if (start > 0) lineContent = '...' + lineContent;
      if (end < fullText.length) lineContent = lineContent + '...';
    }
    
    // Final fallback - just show some context from the full text
    if (lineContent === '') {
      lineContent = fullText.substring(0, 100).trim();
      if (fullText.length > 100) lineContent += '...';
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
    if (!dropdown) {
      console.log('toggleDropdown: No dropdown found');
      return;
    }
    
    console.log('toggleDropdown: Current display:', dropdown.style.display);
    
    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
      console.log('toggleDropdown: Showing dropdown');
      showDropdown(counter);
    } else {
      console.log('toggleDropdown: Hiding dropdown');
      hideDropdown(counter);
    }
  }
  
  // Show dropdown with proper positioning and event handling
  function showDropdown(counter) {
    const dropdown = counter.querySelector('.me-at-github-dropdown');
    if (!dropdown) {
      console.log('showDropdown: No dropdown found');
      return;
    }
    
    console.log('showDropdown: Showing dropdown');
    
    // First make it block but invisible so we can measure it
    dropdown.style.display = 'block';
    dropdown.style.visibility = 'hidden';
    dropdown.style.opacity = '0';
    dropdown.style.zIndex = '2147483647';
    dropdown.style.position = 'fixed';
    
    // Force a layout to ensure dimensions are available for positioning
    const height = dropdown.offsetHeight;
    
    // Position the dropdown now that it has proper dimensions
    positionDropdown(counter, dropdown);
    
    // Now make it visible
    dropdown.style.visibility = 'visible';
    dropdown.style.opacity = '1';
    
    console.log('showDropdown: Dropdown positioned');
    
    // Add body click listener for toggle functionality
    document.addEventListener('click', counter._dropdownToggleHandler, { capture: true });
  }
  
  // Hide dropdown and clean up event listeners
  function hideDropdown(counter) {
    const dropdown = counter.querySelector('.me-at-github-dropdown');
    if (dropdown) {
      dropdown.style.display = 'none';
    }
    
    // Remove body click listener
    document.removeEventListener('click', counter._dropdownToggleHandler, { capture: true });
  }
  
  // Simple positioning: dropdown directly below counter, aligned to right edge
  function positionDropdown(counter, dropdown) {
    const counterRect = counter.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const padding = 16;
    
    // Get dropdown width
    const dropdownWidth = dropdown.offsetWidth || 300;
    
    // Position below counter
    dropdown.style.top = (counterRect.bottom + 8) + 'px';
    
    // Try to align right edge of dropdown with right edge of counter
    let leftPosition = counterRect.right - dropdownWidth;
    
    // If that goes off the left edge, align left edges instead
    if (leftPosition < padding) {
      leftPosition = counterRect.left;
    }
    
    // If still goes off right edge, push it left
    if (leftPosition + dropdownWidth > viewportWidth - padding) {
      leftPosition = viewportWidth - dropdownWidth - padding;
    }
    
    dropdown.style.left = Math.max(padding, leftPosition) + 'px';
    
    console.log('Positioned dropdown at:', {
      top: counterRect.bottom + 8,
      left: leftPosition,
      counterRect
    });
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
    
    // Remove any navigation controls
    document.querySelectorAll('.me-at-github-nav').forEach(el => el.remove());
    
    // Remove any dropdown elements
    document.querySelectorAll('.me-at-github-dropdown, .me-at-github-dropdown-portal').forEach(el => el.remove());
    
    // Remove any raw navigation text that might be lingering in user mention links
    document.querySelectorAll('a.user-mention, a[data-hovercard-type="user"]').forEach(element => {
      if (element.textContent && (element.textContent.includes('←') || element.textContent.includes('→')) && element.textContent.includes('/')) {
        // Extract just the username part
        const cleanText = element.textContent.replace(/[←→\s\d\/]/g, '').replace(/^@/, '@');
        if (cleanText.startsWith('@')) {
          element.textContent = cleanText;
        }
      }
    });
  }

  // Initialize the extension
  function init() {
    console.log('init() called, current URL:', location.href);
    
    // Verify we're on a supported page
    if (!isOnSupportedPage()) {
      console.log('init(): Not on a supported page');
      return;
    }
    
    console.log('init(): On supported page, proceeding...');
    
    // Clean up any previous initialization
    cleanup();
    
    // Pre-cleanup: Remove any polluted navigation text from mention links
    document.querySelectorAll('a.user-mention, a[data-hovercard-type="user"]').forEach(link => {
      if (link.textContent && (link.textContent.includes('←') || link.textContent.includes('→')) && link.textContent.includes('/')) {
        const cleanText = link.textContent.replace(/\s*[←→]\s*/g, '').replace(/\s*\d+\/\d+\s*/g, '').trim();
        if (cleanText.startsWith('@') && cleanText.length > 1) {
          link.textContent = cleanText;
        }
      }
    });
    
    username = getUsername();
    console.log('init(): Username:', username);
    if (!username) {
      console.log('init(): No username found');
      return;
    }
    
    // Find all mentions
    mentions = findMentions();
    
    console.log('Found mentions:', mentions.length);
    
    if (mentions.length > 0) {
      // Initialize mention index
      if (currentMentionIndex < 0) {
        currentMentionIndex = 0;
      }
      
      // Highlight mentions
      console.log('Highlighting mentions...');
      highlightMentions();
      
      // Create counter
      console.log('Creating counter...');
      createCounter();
      return true; // Success
    } else {
      console.log('No mentions found');
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
      navigateToMention(currentMentionIndex + 1);
    }
    // Alt+P for previous mention
    else if (e.altKey && e.key === 'p') {
      e.preventDefault();
      e.stopPropagation();
      navigateToMention(currentMentionIndex - 1);
    }
  }

  // Run when DOM is ready with multiple initialization attempts
  function initializeWithRetry(attempt = 1, maxAttempts = 5) {
    if (attempt > maxAttempts) {
      return;
    }
    
    // Check if we're still on a supported page
    if (!isOnSupportedPage()) {
      return;
    }
    
    // Try to initialize
    init();
    
    // If no mentions found and we haven't reached max attempts, try again
    if (mentions.length === 0 && attempt < maxAttempts) {
      setTimeout(() => initializeWithRetry(attempt + 1, maxAttempts), 1000 * attempt);
    }
  }
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => initializeWithRetry(), 1000);
    });
  } else {
    setTimeout(() => initializeWithRetry(), 1000);
  }
  
  // Additional initialization on page load (for cached pages)
  window.addEventListener('load', () => {
    const existingCounter = document.querySelector('.me-at-github-counter');
    if (!existingCounter) {
      setTimeout(() => initializeWithRetry(), 500);
    }
  });

  // Setup keyboard shortcuts once (no cleanup needed as it's a single global handler)
  document.addEventListener('keydown', handleKeyboardShortcut);

  // Listen for browser navigation (forward/back buttons)
  window.addEventListener('popstate', () => {
    setTimeout(() => initializeWithRetry(), 1000);
  });
  
  // Listen for page show event (handles cached page returns)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      setTimeout(() => initializeWithRetry(), 500);
    }
  });
  
  // Listen for visibility changes (tab becomes active)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      const existingCounter = document.querySelector('.me-at-github-counter');
      const existingMentions = document.querySelectorAll('.me-at-github-mention-text');
      if (!existingCounter && existingMentions.length === 0) {
        setTimeout(() => initializeWithRetry(), 1000);
      }
    }
  });
  
  // Listen for window focus (browser becomes active)
  window.addEventListener('focus', () => {
    const existingCounter = document.querySelector('.me-at-github-counter');
    if (!existingCounter && mentions.length > 0) {
      setTimeout(() => initializeWithRetry(), 500);
    }
  });
  
  // Listen for programmatic navigation (GitHub's single-page app routing)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function() {
    originalPushState.apply(history, arguments);
    setTimeout(() => initializeWithRetry(), 1000);
  };
  
  history.replaceState = function() {
    originalReplaceState.apply(history, arguments);
    setTimeout(() => initializeWithRetry(), 1000);
  };
  
  // Listen for hash changes (single-page navigation)
  window.addEventListener('hashchange', () => {
    setTimeout(() => initializeWithRetry(), 500);
  });
  
  // Listen for GitHub's PJAX navigation and content changes
  let lastUrl = location.href;
  let mutationTimeout;
  const observer = new MutationObserver((mutations) => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(() => initializeWithRetry(), 1500);
      return;
    }
    
    // Debounce mutation checks to avoid excessive processing
    clearTimeout(mutationTimeout);
    mutationTimeout = setTimeout(() => {
    
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
            counter.textContent = `${mentions.length} mention${mentions.length !== 1 ? 's' : ''}`;
            counter.title = mentions.length + ' mention' + (mentions.length !== 1 ? 's' : '') + ' of @' + username;
          }
          const stickyCounter = document.getElementById('me-at-github-sticky-counter');
          if (stickyCounter) {
            stickyCounter.textContent = `${mentions.length} mention${mentions.length !== 1 ? 's' : ''}`;
            stickyCounter.title = mentions.length + ' mention' + (mentions.length !== 1 ? 's' : '') + ' of @' + username;
          }
        }
      }, 500);
    }
    }, 300); // Debounce mutations by 300ms
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Minimal health check with page visibility optimization
  let healthCheckInterval = setInterval(() => {
    // Skip if document is hidden (user not viewing page)
    if (!username || document.hidden) return;
    
    if (isOnSupportedPage() && !document.querySelector('.me-at-github-counter')) {
      // Use requestIdleCallback for non-critical reinitialization
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => initializeWithRetry(), { timeout: 2000 });
      } else {
        setTimeout(() => initializeWithRetry(), 1000);
      }
    }
  }, 30000);

  // Expose debugging function for force initialization
  window.meAtGitHubForceInit = function() {
    initializeWithRetry(1, 1);
  };
  
  // Expose diagnostic function for debugging
  window.meAtGitHubDiagnostics = function() {
    console.log('=== Me @ GitHub Diagnostics ===');
    console.log('Username:', username || 'NOT SET');
    console.log('Mentions found:', mentions.length);
    console.log('Counter elements:', document.querySelectorAll('.me-at-github-counter').length);
    console.log('Highlight elements:', document.querySelectorAll('.me-at-github-mention-text').length);
    console.log('===============================');
  };

})();
