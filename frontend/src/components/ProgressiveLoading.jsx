import React from 'react';
import '../styles/progressive-loading.css';

/**
 * 🚀 Progressive Loading Components for Better UX
 */

// Dashboard Statistics Skeleton
export const DashboardStatsSkeleton = ({ count = 4 }) => (
    <div className="dashboard-stats-loading">
        {Array.from({ length: count }, (_, index) => (
            <div key={index} className="stat-card-skeleton">
                <div className="stat-value-skeleton"></div>
                <div className="stat-label-skeleton"></div>
            </div>
        ))}
    </div>
);

// Data Table Skeleton
export const DataTableSkeleton = ({ rows = 5, columns = 4 }) => (
    <div className="table-loading">
        {Array.from({ length: rows }, (_, rowIndex) => (
            <div key={rowIndex} className="table-skeleton-row">
                {Array.from({ length: columns }, (_, colIndex) => {
                    let className = "table-skeleton-cell";
                    if (colIndex === 0) className += " narrow";
                    if (colIndex === 1) className += " wide";
                    
                    return <div key={colIndex} className={className}></div>;
                })}
            </div>
        ))}
    </div>
);

// Card List Skeleton
export const CardListSkeleton = ({ count = 3 }) => (
    <div className="progressive-loader">
        {Array.from({ length: count }, (_, index) => (
            <div key={index} className="skeleton-card">
                <div className="skeleton-line skeleton-title"></div>
                <div className="skeleton-line skeleton-text"></div>
                <div className="skeleton-line skeleton-text short"></div>
            </div>
        ))}
    </div>
);

// Smart Loading Wrapper
export const SmartLoader = ({ 
    loading, 
    error, 
    data, 
    children, 
    skeleton: Skeleton = CardListSkeleton,
    errorMessage = "Failed to load data",
    retryButton = null
}) => {
    if (loading) {
        return <Skeleton />;
    }

    if (error) {
        return (
            <div className="error-state" style={{
                padding: '40px 20px',
                textAlign: 'center',
                background: '#f8f9fa',
                borderRadius: '8px',
                margin: '20px 0'
            }}>
                <div style={{ color: '#dc3545', marginBottom: '16px' }}>
                    ⚠️ {errorMessage}
                </div>
                {retryButton}
            </div>
        );
    }

    if (!data) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>No data available</div>;
    }

    return children;
};

// Cache Status Indicator
export const CacheIndicator = ({ status, message, duration = 3000 }) => {
    const [visible, setVisible] = React.useState(true);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    if (!visible) return null;

    return (
        <div className={`cache-indicator ${status}`}>
            {status === 'hit' && '📦'} 
            {status === 'miss' && '🔄'} 
            {status === 'error' && '⚠️'} 
            {message}
        </div>
    );
};

// Progressive Image Loading
export const ProgressiveImage = ({ src, alt, className, placeholder }) => {
    const [loaded, setLoaded] = React.useState(false);
    const [error, setError] = React.useState(false);

    return (
        <div className={`progressive-image ${className}`}>
            {!loaded && !error && (
                <div className="image-skeleton" style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, #e9ecef 25%, #f8f9fa 50%, #e9ecef 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                    borderRadius: '4px'
                }}></div>
            )}
            <img
                src={src}
                alt={alt}
                style={{ display: loaded ? 'block' : 'none' }}
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
            />
            {error && placeholder && (
                <div className="image-placeholder">{placeholder}</div>
            )}
        </div>
    );
};

// Performance Metrics Display (for development)
export const PerformanceMetrics = () => {
    const [metrics, setMetrics] = React.useState(null);
    const cache = window.performanceCache;

    React.useEffect(() => {
        const updateMetrics = () => {
            if (cache) {
                setMetrics({
                    ...cache.getCacheStats(),
                    performance: {
                        navigation: performance.getEntriesByType('navigation')[0]?.duration || 0,
                        memory: performance.memory ? {
                            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
                        } : null
                    }
                });
            }
        };

        updateMetrics();
        const interval = setInterval(updateMetrics, 5000);
        return () => clearInterval(interval);
    }, [cache]);

    if (!metrics) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '8px',
            fontSize: '12px',
            zIndex: 1000,
            minWidth: '200px'
        }}>
            <div><strong>Cache Stats</strong></div>
            <div>Memory: {metrics.memoryEntries}</div>
            <div>LocalStorage: {metrics.localStorageEntries}</div>
            <div>SessionStorage: {metrics.sessionStorageEntries}</div>
            {metrics.performance.memory && (
                <div>Memory: {metrics.performance.memory.used}MB / {metrics.performance.memory.total}MB</div>
            )}
            <div>Load Time: {Math.round(metrics.performance.navigation)}ms</div>
        </div>
    );
};