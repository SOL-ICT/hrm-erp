/**
 * Loading State Override System
 * Aggressively prevents loading indicators for cached routes
 */

class LoadingStateOverride {
  constructor() {
    this.overrideActive = new Set();
    this.originalStates = new Map();
    this.initialized = false;
    this.init();
  }

  init() {
    if (this.initialized) return;
    
    // Only initialize on client side
    if (typeof window === 'undefined') return;
    
    // Override common loading patterns globally
    this.setupGlobalOverrides();
    
    // Listen for route changes
    window.addEventListener('instantRender', (event) => {
      this.activateOverride(event.detail.routeKey);
    });

    // Monitor for loading elements and hide them for cached routes
    this.startLoadingElementMonitor();
    
    this.initialized = true;
    console.log('🚀 Loading State Override system active');
  }

  setupGlobalOverrides() {
    // Override common React loading patterns
    if (typeof window !== 'undefined') {
      // Intercept useState calls for loading states
      this.interceptLoadingStates();
      
      // Add global CSS to hide loading elements
      this.injectLoadingOverrideStyles();
    }
  }

  interceptLoadingStates() {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Store original console methods
    const originalLog = console.log;
    
    // Intercept and suppress loading-related logs for cached routes
    console.log = function(...args) {
      const message = args.join(' ').toLowerCase();
      if (message.includes('loading') && window.enhancedRouteCache?.stats?.instantRenders > 0) {
        // Suppress loading logs for instant renders
        return;
      }
      originalLog.apply(console, args);
    };
  }

  injectLoadingOverrideStyles() {
    // Only run on client side
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    const styleId = 'loading-override-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Hide all loading indicators for instant renders */
      .instant-route-cache[data-instant="true"] .loading,
      .instant-route-cache[data-instant="true"] .spinner,
      .instant-route-cache[data-instant="true"] [class*="loading"],
      .instant-route-cache[data-instant="true"] [class*="spinner"],
      .instant-route-cache[data-instant="true"] [class*="skeleton"],
      .instant-route-cache[data-instant="true"] .animate-spin,
      .instant-route-cache[data-instant="true"] .animate-pulse {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }

      /* Force visibility of content */
      .instant-route-cache[data-instant="true"] > div,
      .instant-route-cache[data-instant="true"] main,
      .instant-route-cache[data-instant="true"] .content {
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
      }

      /* Instant fade-in effect */
      .instant-route-cache[data-instant="true"] {
        animation: instantShow 0.1s ease-out forwards;
      }

      @keyframes instantShow {
        from { opacity: 0.8; }
        to { opacity: 1; }
      }
    `;
    
    document.head.appendChild(style);
  }

  startLoadingElementMonitor() {
    // Only run on client side
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    // Use MutationObserver to hide loading elements as they appear
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            this.checkAndHideLoadingElements(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }

  checkAndHideLoadingElements(element) {
    // Check if we're in an instant render context
    const instantContainer = element.closest('.instant-route-cache[data-instant="true"]');
    if (!instantContainer) return;

    // Hide loading-related elements
    const loadingSelectors = [
      '.loading',
      '.spinner',
      '[class*="loading"]',
      '[class*="spinner"]',
      '[class*="skeleton"]',
      '.animate-spin',
      '.animate-pulse'
    ];

    loadingSelectors.forEach(selector => {
      const elements = element.querySelectorAll ? 
        element.querySelectorAll(selector) : 
        [];
        
      elements.forEach(el => {
        el.style.display = 'none';
        el.style.opacity = '0';
        el.style.visibility = 'hidden';
      });

      // Check the element itself
      if (element.matches && element.matches(selector)) {
        element.style.display = 'none';
        element.style.opacity = '0';
        element.style.visibility = 'hidden';
      }
    });
  }

  activateOverride(routeKey) {
    // Only run on client side
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    this.overrideActive.add(routeKey);
    
    // Force hide all loading elements immediately
    setTimeout(() => {
      const container = document.querySelector(`[data-route="${routeKey}"]`);
      if (container) {
        this.checkAndHideLoadingElements(container);
      }
    }, 10);

    console.log(`🚀 Loading override active for: ${routeKey}`);
  }

  deactivateOverride(routeKey) {
    this.overrideActive.delete(routeKey);
    console.log(`🔄 Loading override deactivated for: ${routeKey}`);
  }

  isOverrideActive(routeKey) {
    return this.overrideActive.has(routeKey);
  }
}

// Create global instance
const loadingOverride = new LoadingStateOverride();

// Make available globally
if (typeof window !== 'undefined') {
  window.loadingOverride = loadingOverride;
}

export default loadingOverride;