import React from 'react';

// ============================================================
// Hot Reload Utilities for UI Interactions
// ============================================================

interface HotReloadConfig {
  triggerElements: string[];
  refreshDelay?: number;
  enableLogging?: boolean;
}

class HotReloadManager {
  private config: HotReloadConfig;
  private refreshTimeout: NodeJS.Timeout | null = null;

  constructor(config: HotReloadConfig) {
    this.config = {
      refreshDelay: 100,
      enableLogging: false,
      ...config
    };
    this.initialize();
  }

  private initialize() {
    // Add click listeners to specified elements
    this.config.triggerElements.forEach(selector => {
      document.addEventListener('click', (e) => {
        const target = e.target as Element;
        if (target.matches(selector) || target.closest(selector)) {
          this.triggerRefresh();
        }
      });
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + R for manual refresh
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        this.triggerRefresh();
      }
    });

    if (this.config.enableLogging) {
      console.log('Hot Reload Manager initialized with triggers:', this.config.triggerElements);
    }
  }

  private triggerRefresh() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    this.refreshTimeout = setTimeout(() => {
      if (this.config.enableLogging) {
        console.log('🔄 Triggering hot reload...');
      }
      
      // Force page refresh
      window.location.reload();
    }, this.config.refreshDelay);
  }

  // Manual trigger method
  public refresh() {
    this.triggerRefresh();
  }

  // Disable hot reload temporarily
  public disable() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
  }

  // Re-enable hot reload
  public enable() {
    if (!this.refreshTimeout) {
      this.initialize();
    }
  }
}

// Initialize hot reload with default triggers
export const hotReloadManager = new HotReloadManager({
  triggerElements: [
    '[data-hot-reload]',
    '.refresh-trigger',
    '[data-action="refresh"]'
  ],
  enableLogging: true
});

// Hook for React components
export const useHotReload = (enabled: boolean = true) => {
  React.useEffect(() => {
    if (enabled) {
      hotReloadManager.enable();
    } else {
      hotReloadManager.disable();
    }
  }, [enabled]);
};

// Utility function to add hot reload to any element
export const addHotReloadTrigger = (element: HTMLElement, className: string = 'hot-reload-trigger') => {
  element.classList.add(className);
  element.setAttribute('data-hot-reload', 'true');
  return element;
};
