// utils/chunkErrorHandler.js

let isReloading = false;

export const handleChunkError = (error) => {
  // Prevent multiple reloads
  if (isReloading) return;

  const isChunkError =
    error.message &&
    (error.message.includes("ChunkLoadError") ||
      error.message.includes("Loading chunk") ||
      error.message.includes("Failed to import") ||
      error.message.includes("Loading CSS chunk") ||
      error.name === "ChunkLoadError");

  if (isChunkError) {
    console.warn("🔄 Chunk loading error detected, reloading page...");
    isReloading = true;

    // Clear service worker cache if available
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
    }

    // Clear browser caches
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }

    // Reload after clearing caches
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }
};

// Global error handler for chunk errors
export const setupChunkErrorHandler = () => {
  // Handle unhandled promise rejections (common for chunk errors)
  window.addEventListener("unhandledrejection", (event) => {
    if (event.reason) {
      handleChunkError(event.reason);
    }
  });

  // Handle regular errors
  window.addEventListener("error", (event) => {
    if (event.error) {
      handleChunkError(event.error);
    }
  });

  // Handle dynamic import errors specifically
  const originalImport = window.__webpack_require__;
  if (originalImport) {
    window.__webpack_require__ = function (...args) {
      try {
        return originalImport.apply(this, args);
      } catch (error) {
        handleChunkError(error);
        throw error;
      }
    };
  }
};

// Auto-setup in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  setupChunkErrorHandler();
}
