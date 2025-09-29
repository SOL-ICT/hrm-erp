/**
 * Performance System Test - Complete Integration
 * Run this in browser console to test all performance features
 */

async function testPerformanceSystem() {
  console.log('🚀 Starting Performance System Test...');
  
  // Test 1: Check if performance cache is available
  console.log('\n📦 Testing Performance Cache...');
  if (window.performanceCache) {
    // Store test data
    await window.performanceCache.store('test-key', { message: 'Hello Cache!' }, 5000);
    
    // Retrieve test data
    const cached = await window.performanceCache.get('test-key');
    console.log(cached ? '✅ Cache working' : '❌ Cache failed');
    
    // Show cache stats
    const stats = window.performanceCache.getStats();
    console.log('Cache Stats:', stats);
  } else {
    console.log('❌ Performance cache not available');
  }
  
  // Test 2: Check if optimized API is available
  console.log('\n🌐 Testing Optimized API...');
  if (window.optimizedAPI) {
    try {
      // Test API request (assuming auth endpoint exists)
      const response = await window.optimizedAPI.request('/api/user', {
        cache: true,
        priority: 'high',
        useLocalStorage: true
      });
      console.log('✅ API request successful');
      console.log('Response cached:', response._cached || false);
    } catch (error) {
      console.log('⚠️ API test failed (expected if endpoint doesn\'t exist):', error.message);
    }
    
    // Show API stats
    const apiStats = window.optimizedAPI.getStats();
    console.log('API Stats:', apiStats);
  } else {
    console.log('❌ Optimized API not available');
  }
  
  // Test 3: Test progressive loader
  console.log('\n⏳ Testing Progressive Loader...');
  if (window.progressiveLoader) {
    // Show skeleton
    window.progressiveLoader.show('test-container', 'card');
    console.log('✅ Skeleton loader shown');
    
    // Hide after 2 seconds
    setTimeout(() => {
      window.progressiveLoader.hide('test-container');
      console.log('✅ Skeleton loader hidden');
    }, 2000);
  } else {
    console.log('❌ Progressive loader not available');
  }
  
  // Test 4: Performance monitoring
  console.log('\n📊 Performance Monitoring...');
  if (window.performance && window.performance.mark) {
    window.performance.mark('test-start');
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));
    
    window.performance.mark('test-end');
    window.performance.measure('test-duration', 'test-start', 'test-end');
    
    const measures = window.performance.getEntriesByType('measure');
    const testMeasure = measures.find(m => m.name === 'test-duration');
    
    console.log(`✅ Performance test completed in ${testMeasure?.duration || 0}ms`);
  }
  
  // Test 5: Memory usage check
  console.log('\n💾 Memory Usage Check...');
  if (window.performance && window.performance.memory) {
    const memory = window.performance.memory;
    console.log(`Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Total: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`);
  }
  
  console.log('\n🎉 Performance System Test Complete!');
  
  return {
    cacheAvailable: !!window.performanceCache,
    apiAvailable: !!window.optimizedAPI,
    loaderAvailable: !!window.progressiveLoader,
    performanceAPIAvailable: !!window.performance?.mark
  };
}

// Auto-run test after 2 seconds (when system should be initialized)
setTimeout(() => {
  if (typeof window !== 'undefined') {
    console.log('🔧 Performance system should be initialized. Running test...');
    testPerformanceSystem().then(results => {
      console.log('📋 Test Results:', results);
      
      // Store test results globally
      window.performanceTestResults = results;
    });
  }
}, 2000);

// Export for manual testing
if (typeof window !== 'undefined') {
  window.testPerformanceSystem = testPerformanceSystem;
}

export default testPerformanceSystem;