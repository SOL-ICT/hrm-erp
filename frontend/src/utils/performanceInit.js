/**
 * 🚀 Performance Optimization Initialization
 * Load this script early in your app to enable smart caching and API optimization
 */

// Import performance utilities
import PerformanceCache from '../utils/PerformanceCache';
import OptimizedAPIService from '../services/OptimizedAPIService';

// Initialize global performance tools
const initializePerformanceTools = () => {
    // Initialize performance cache
    if (typeof window !== 'undefined') {
        window.performanceCache = new PerformanceCache();
        window.optimizedAPI = new OptimizedAPIService();
        
        console.log('🚀 Performance optimization tools initialized');
        
        // Preload critical data after a short delay
        setTimeout(async () => {
            try {
                await window.optimizedAPI.preloadCriticalData();
                console.log('📦 Critical data preloaded');
            } catch (error) {
                console.warn('Preload failed:', error);
            }
        }, 2000);

        // Show performance metrics in development
        if (process.env.NODE_ENV === 'development') {
            // Log cache stats every 30 seconds
            setInterval(() => {
                const stats = window.optimizedAPI.getPerformanceStats();
                console.log('📊 Performance Stats:', stats);
            }, 30000);
        }

        // Listen for stats updates
        window.addEventListener('stats-updated', (event) => {
            console.log('📈 Stats updated:', event.detail);
        });
    }
};

// Auto-initialize when module loads
initializePerformanceTools();

export { initializePerformanceTools };
export default initializePerformanceTools;