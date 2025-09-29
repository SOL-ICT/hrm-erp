// Development console filter utility
// This can help reduce noise in development by filtering expected 404s

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // List of expected API endpoints that might return 404s
  const expectedNotFoundEndpoints = [
    '/api/offer-letter-templates/grade',
    '/api/offer-letter-templates/salary-components'
  ];
  
  // Override console.error to filter out expected 404s
  console.error = (...args) => {
    const message = args.join(' ');
    
    // Check if this is an expected 404
    const isExpected404 = expectedNotFoundEndpoints.some(endpoint => 
      message.includes(endpoint) && message.includes('404')
    );
    
    if (isExpected404) {
      // Convert to a less prominent debug log
      console.debug('Expected API response:', ...args);
      return;
    }
    
    // Log everything else normally
    originalError.apply(console, args);
  };
}

export {};
