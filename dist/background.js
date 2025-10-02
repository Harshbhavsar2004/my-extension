// Background service worker for Chrome extension
// Works silently in the background, only responding to keyboard shortcuts

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-sidebar') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await injectContentScript(tab);
      // Send message to toggle sidebar if already injected
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' });
      } catch (error) {
        // Content script not injected yet, inject it first
        await injectContentScript(tab);
      }
    }
  }
});

// Helper function to inject content script
async function injectContentScript(tab) {
  // Check if we can inject scripts on this tab
  if (!tab.url) {
    console.log('No URL available for tab');
    return;
  }
  
  // Don't inject on chrome://, chrome-extension://, or other restricted URLs
  if (tab.url.startsWith('chrome://') || 
      tab.url.startsWith('chrome-extension://') || 
      tab.url.startsWith('moz-extension://') ||
      tab.url.startsWith('edge://') ||
      tab.url.startsWith('about:') ||
      tab.url.startsWith('view-source:') ||
      tab.url.startsWith('data:') ||
      tab.url.startsWith('file://')) {
    console.log('Cannot inject on restricted URL:', tab.url);
    return;
  }
  
  try {
    // Inject the sidebar when the extension icon is clicked
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['assets/contentScript.js']
    });
    console.log('Content script injected successfully');
  } catch (error) {
    console.error('Failed to inject content script:', error);
  }
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openSidebar') {
    // Handle sidebar opening logic
    sendResponse({ success: true });
  }
}); 