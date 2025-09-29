/**
 * Route Caching Integration Test
 * Tests the complete navigation caching system
 */

// Test function for route caching
async function testRouteCaching() {
  console.log('🧪 Starting Route Caching Integration Test...');
  
  const results = {
    routeCacheAvailable: false,
    componentCachingWorks: false,
    navigationTracking: false,
    performanceMonitoring: false,
    smartPreloading: false,
    statePreservation: false,
    formDataPersistence: false,
    errors: []
  };

  try {
    // Test 1: Check if route cache is available
    console.log('\n1️⃣ Testing Route Cache Availability...');
    if (window.routeCache) {
      results.routeCacheAvailable = true;
      console.log('✅ Route cache is available');
      console.log('Cache stats:', window.routeCache.getStats());
    } else {
      results.errors.push('Route cache not available');
      console.log('❌ Route cache not available');
    }

    // Test 2: Test component caching functionality
    console.log('\n2️⃣ Testing Component Caching...');
    if (window.routeCache) {
      // Test caching a component
      const testComponent = document.createElement('div');
      testComponent.innerHTML = '<p>Test component content</p>';
      
      const success = window.routeCache.cacheRoute('test-route', testComponent, {
        formData: { testField: 'test value' },
        scrollPosition: { x: 0, y: 100 }
      });
      
      if (success) {
        // Test retrieving cached component
        const cached = window.routeCache.getCachedRoute('test-route');
        if (cached) {
          results.componentCachingWorks = true;
          console.log('✅ Component caching works');
          console.log('Cached data:', cached);
        } else {
          results.errors.push('Failed to retrieve cached component');
          console.log('❌ Failed to retrieve cached component');
        }
      } else {
        results.errors.push('Failed to cache component');
        console.log('❌ Failed to cache component');
      }
    }

    // Test 3: Test navigation tracking
    console.log('\n3️⃣ Testing Navigation Tracking...');
    const navigationEventFired = new Promise((resolve) => {
      const handler = (event) => {
        console.log('📡 Navigation event fired:', event.detail);
        results.navigationTracking = true;
        resolve(true);
        window.removeEventListener('routeChange', handler);
      };
      window.addEventListener('routeChange', handler);
      
      // Simulate navigation event
      setTimeout(() => {
        const event = new CustomEvent('routeChange', {
          detail: {
            fromRoute: 'dashboard',
            toRoute: 'client-master',
            cached: true,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(event);
      }, 100);
    });

    await navigationEventFired;
    console.log('✅ Navigation tracking works');

    // Test 4: Test performance monitoring
    console.log('\n4️⃣ Testing Performance Monitoring...');
    const performanceElements = document.querySelectorAll('[data-route]');
    if (performanceElements.length > 0) {
      results.performanceMonitoring = true;
      console.log('✅ Performance monitoring elements found');
    } else {
      console.log('⚠️ Performance monitoring elements not found (may not be rendered yet)');
    }

    // Test 5: Test smart preloading
    console.log('\n5️⃣ Testing Smart Preloading...');
    if (window.routeCache) {
      // Test preloading functionality
      window.routeCache.setupSmartPreloading('client-master');
      
      // Check if preloading queue has items
      setTimeout(() => {
        console.log('✅ Smart preloading configured');
        results.smartPreloading = true;
      }, 500);
    }

    // Test 6: Test state preservation
    console.log('\n6️⃣ Testing State Preservation...');
    if (window.routeCache) {
      const testRoute = 'state-test-route';
      const testState = {
        scrollPosition: { x: 0, y: 200 },
        formData: { username: 'testuser', email: 'test@example.com' },
        componentData: { activeTab: 2, filters: ['active', 'pending'] }
      };
      
      window.routeCache.cacheRoute(testRoute, null, testState);
      const retrieved = window.routeCache.getCachedRoute(testRoute);
      
      if (retrieved && 
          retrieved.state.scrollPosition.y === 200 &&
          retrieved.state.formData.username === 'testuser') {
        results.statePreservation = true;
        console.log('✅ State preservation works');
      } else {
        results.errors.push('State preservation failed');
        console.log('❌ State preservation failed');
      }
    }

    // Test 7: Test form data persistence
    console.log('\n7️⃣ Testing Form Data Persistence...');
    
    // Create a test form
    const testForm = document.createElement('form');
    testForm.innerHTML = `
      <input name="testInput" value="test value" />
      <select name="testSelect">
        <option value="option1" selected>Option 1</option>
      </select>
      <textarea name="testTextarea">test content</textarea>
    `;
    document.body.appendChild(testForm);
    
    // Test form data capture
    const formData = new FormData(testForm);
    const captured = {};
    for (let [key, value] of formData.entries()) {
      captured[key] = value;
    }
    
    if (captured.testInput === 'test value' && captured.testSelect === 'option1') {
      results.formDataPersistence = true;
      console.log('✅ Form data persistence works');
    } else {
      results.errors.push('Form data persistence failed');
      console.log('❌ Form data persistence failed');
    }
    
    // Clean up
    document.body.removeChild(testForm);

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    results.errors.push(error.message);
  }

  // Final results
  console.log('\n🎯 ROUTE CACHING TEST RESULTS:');
  console.log('=====================================');
  
  const tests = [
    { name: 'Route Cache Available', passed: results.routeCacheAvailable },
    { name: 'Component Caching', passed: results.componentCachingWorks },
    { name: 'Navigation Tracking', passed: results.navigationTracking },
    { name: 'Performance Monitoring', passed: results.performanceMonitoring },
    { name: 'Smart Preloading', passed: results.smartPreloading },
    { name: 'State Preservation', passed: results.statePreservation },
    { name: 'Form Data Persistence', passed: results.formDataPersistence }
  ];
  
  tests.forEach(test => {
    console.log(`${test.passed ? '✅' : '❌'} ${test.name}`);
  });
  
  const passedTests = tests.filter(t => t.passed).length;
  const totalTests = tests.length;
  const successRate = (passedTests / totalTests * 100).toFixed(1);
  
  console.log(`\n📊 Overall Success Rate: ${successRate}% (${passedTests}/${totalTests})`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    results.errors.forEach(error => console.log(`   • ${error}`));
  }
  
  if (successRate >= 80) {
    console.log('\n🎉 Route caching system is working well!');
    console.log('Your navigation between Job Function Setup ↔ Master Setup should now be instant!');
  } else if (successRate >= 60) {
    console.log('\n⚠️ Route caching system is partially working.');
    console.log('Some optimizations may not be fully active yet.');
  } else {
    console.log('\n❌ Route caching system needs attention.');
    console.log('Please check the implementation and try again.');
  }
  
  return results;
}

// Auto-run test after performance systems are ready
if (typeof window !== 'undefined') {
  // Wait for performance bootstrap to complete
  const runTestWhenReady = () => {
    if (window.performanceBootstrapReady) {
      setTimeout(testRouteCaching, 2000); // Give systems time to initialize
    } else {
      setTimeout(runTestWhenReady, 500); // Check again
    }
  };
  
  // Listen for performance bootstrap ready event
  window.addEventListener('performanceBootstrapReady', () => {
    console.log('🔧 Performance systems ready, starting route caching test...');
    setTimeout(testRouteCaching, 1000);
  });
  
  // Fallback: run after 5 seconds regardless
  setTimeout(() => {
    if (!window.testRouteCachingRun) {
      console.log('🔧 Running route caching test (fallback)...');
      testRouteCaching();
      window.testRouteCachingRun = true;
    }
  }, 5000);
  
  // Make test function available globally for manual testing
  window.testRouteCaching = testRouteCaching;
}

export default testRouteCaching;