// Silent content script that works in the background
// This runs in the context of the web page without any visible UI

(function() {
  'use strict';
  
  let sidebarContainer, isVisible = false;
  let textSelectionEnabled = false;
  
  // Check if sidebar is already injected
  if (document.getElementById('chrome-extension-sidebar')) {
    sidebarContainer = document.getElementById('chrome-extension-sidebar');
    isVisible = sidebarContainer.style.transform !== 'translateX(100%)';
    return;
  }
  
  // Create sidebar container (hidden by default)
  sidebarContainer = document.createElement('div');
  sidebarContainer.id = 'chrome-extension-sidebar';
  sidebarContainer.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 300px;
    height: 100vh;
    z-index: 999999;
    pointer-events: none;
    transition: transform 0.3s ease-in-out;
    transform: translateX(100%);
  `;
  
  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('sidebar.html');
  iframe.allowTransparency = "true";
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    pointer-events: auto;
  `;
  
  // Toggle function
  function toggleSidebar() {
    if (isVisible) {
      sidebarContainer.style.transform = 'translateX(100%)';
    } else {
      sidebarContainer.style.transform = 'translateX(0)';
    }
    isVisible = !isVisible;
  }

  // Text selection bypass functions
  function enableTextSelection() {
    if (textSelectionEnabled) return;
    
    textSelectionEnabled = true;
    document.body.classList.add('text-selection-enabled');
    
    // Override CSS properties that disable text selection
    const style = document.createElement('style');
    style.id = 'text-selection-bypass';
    style.textContent = `
      * {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
        -webkit-touch-callout: text !important;
        -webkit-tap-highlight-color: rgba(0, 123, 255, 0.3) !important;
      }
      
      *::selection {
        background-color: #007bff !important;
        color: white !important;
      }
      
      *::-moz-selection {
        background-color: #007bff !important;
        color: white !important;
      }
      
      /* Override common text selection blockers */
      [style*="user-select: none"],
      [style*="user-select:none"],
      [style*="-webkit-user-select: none"],
      [style*="-moz-user-select: none"],
      [style*="-ms-user-select: none"] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      
      /* Override oncontextmenu blockers */
      * {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
    `;
    document.head.appendChild(style);
    
    // Override JavaScript event handlers that prevent text selection
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (type === 'selectstart' || type === 'mousedown' || type === 'mouseup' || type === 'contextmenu') {
        // Don't add event listeners that prevent text selection
        return;
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
    
    // Remove existing event listeners that prevent text selection
    document.addEventListener('selectstart', function(e) {
      e.stopPropagation();
      return true;
    }, true);
    
    document.addEventListener('mousedown', function(e) {
      e.stopPropagation();
      return true;
    }, true);
    
    document.addEventListener('contextmenu', function(e) {
      e.stopPropagation();
      return true;
    }, true);
    
    console.log('Text selection enabled');
  }

  function disableTextSelection() {
    if (!textSelectionEnabled) return;
    
    textSelectionEnabled = false;
    document.body.classList.remove('text-selection-enabled');
    
    // Remove the bypass styles
    const style = document.getElementById('text-selection-bypass');
    if (style) {
      style.remove();
    }
    
    console.log('Text selection disabled');
  }
  
  // Add keyboard shortcut support (Alt+S)
  document.addEventListener('keydown', function(event) {
    if (event.altKey && event.key === 'S') {
      event.preventDefault();
      toggleSidebar();
    }
  });
  
  // Listen for messages from background script and sidebar
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleSidebar') {
      toggleSidebar();
      sendResponse({ success: true });
    } else if (request.action === 'toggleTextSelection') {
      if (request.enabled) {
        enableTextSelection();
      } else {
        disableTextSelection();
      }
      sendResponse({ success: true });
    }
  });
  
  // Append elements
  sidebarContainer.appendChild(iframe);
  document.body.appendChild(sidebarContainer);
  
  console.log('Chrome extension sidebar injected silently');
})(); 