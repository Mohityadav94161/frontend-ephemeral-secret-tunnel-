import { getCLS, getFID, getLCP, getTTFB, getFCP } from 'web-vitals';

// Store performance metrics for reporting
const metrics = {
  cls: null, // Cumulative Layout Shift
  fid: null, // First Input Delay
  lcp: null, // Largest Contentful Paint
  ttfb: null, // Time to First Byte
  fcp: null, // First Contentful Paint
  resources: [], // Resource load timing
  errors: [], // Error tracking
  interactions: [], // User interactions
  navigations: [], // Page navigations
  memoryUsage: [] // Memory usage samples
};

// Configuration options
const config = {
  reportingEndpoint: '/api/monitoring/frontend',
  reportingInterval: 30000, // 30 seconds
  samplingRate: 0.1, // 10% of users
  enabled: true
};

// Initialize monitoring
export const initMonitoring = (options = {}) => {
  // Override defaults with provided options
  Object.assign(config, options);
  
  // Only collect metrics based on sampling rate
  if (!shouldCollectMetrics()) {
    console.log('Frontend monitoring disabled based on sampling rate');
    return;
  }
  
  // Start collecting web vitals
  collectWebVitals();
  
  // Track resource timing
  observeResourceTiming();
  
  // Set up error tracking
  setupErrorTracking();
  
  // Track user interactions
  trackUserInteractions();
  
  // Track memory usage if supported
  trackMemoryUsage();
  
  // Track route changes
  trackNavigations();
  
  // Set up reporting
  if (config.enabled) {
    // Initial report
    setTimeout(reportMetrics, 10000);
    
    // Periodic reporting
    setInterval(reportMetrics, config.reportingInterval);
    
    // Report on page unload
    window.addEventListener('beforeunload', reportMetrics);
  }
  
  console.log('Frontend monitoring initialized');
};

// Determine if we should collect metrics based on sampling rate
const shouldCollectMetrics = () => {
  // Always collect in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // Use stored decision if available
  const storedDecision = localStorage.getItem('monitoring_enabled');
  if (storedDecision !== null) {
    return storedDecision === 'true';
  }
  
  // Make a new decision based on sampling rate
  const decision = Math.random() < config.samplingRate;
  localStorage.setItem('monitoring_enabled', decision.toString());
  return decision;
};

// Collect Web Vitals metrics
const collectWebVitals = () => {
  getCLS(metric => {
    metrics.cls = metric;
  });
  
  getFID(metric => {
    metrics.fid = metric;
  });
  
  getLCP(metric => {
    metrics.lcp = metric;
  });
  
  getTTFB(metric => {
    metrics.ttfb = metric;
  });
  
  getFCP(metric => {
    metrics.fcp = metric;
  });
};

// Observer resource timing
const observeResourceTiming = () => {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    
    // Filter out non-resource entries or monitoring endpoints
    const resourceEntries = entries.filter(entry => 
      entry.entryType === 'resource' && 
      !entry.name.includes(config.reportingEndpoint)
    );
    
    // Add to metrics
    metrics.resources.push(...resourceEntries.map(entry => ({
      name: entry.name,
      duration: entry.duration,
      transferSize: entry.transferSize,
      startTime: entry.startTime,
      initiatorType: entry.initiatorType,
      timestamp: Date.now()
    })));
    
    // Keep only the last 50 resources to prevent memory issues
    if (metrics.resources.length > 50) {
      metrics.resources = metrics.resources.slice(-50);
    }
  });
  
  observer.observe({ entryTypes: ['resource'] });
};

// Track errors
const setupErrorTracking = () => {
  window.addEventListener('error', (event) => {
    metrics.errors.push({
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      timestamp: Date.now(),
      path: window.location.pathname
    });
    
    // Keep only the last 10 errors
    if (metrics.errors.length > 10) {
      metrics.errors = metrics.errors.slice(-10);
    }
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    metrics.errors.push({
      message: event.reason?.message || 'Unhandled Promise Rejection',
      reason: String(event.reason).substring(0, 500),
      timestamp: Date.now(),
      path: window.location.pathname
    });
    
    // Keep only the last 10 errors
    if (metrics.errors.length > 10) {
      metrics.errors = metrics.errors.slice(-10);
    }
  });
};

// Track user interactions
const trackUserInteractions = () => {
  // Track clicks
  document.addEventListener('click', (event) => {
    if (event.target && event.target.tagName) {
      metrics.interactions.push({
        type: 'click',
        element: event.target.tagName.toLowerCase(),
        id: event.target.id || null,
        class: event.target.className || null,
        path: window.location.pathname,
        timestamp: Date.now()
      });
      
      // Keep only the last 20 interactions
      if (metrics.interactions.length > 20) {
        metrics.interactions = metrics.interactions.slice(-20);
      }
    }
  });
  
  // Track form submissions
  document.addEventListener('submit', (event) => {
    if (event.target && event.target.tagName === 'FORM') {
      metrics.interactions.push({
        type: 'form_submit',
        id: event.target.id || null,
        path: window.location.pathname,
        timestamp: Date.now()
      });
    }
  });
};

// Track memory usage
const trackMemoryUsage = () => {
  if (performance.memory) {
    const collectMemory = () => {
      metrics.memoryUsage.push({
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        timestamp: Date.now()
      });
      
      // Keep only the last 10 samples
      if (metrics.memoryUsage.length > 10) {
        metrics.memoryUsage = metrics.memoryUsage.slice(-10);
      }
    };
    
    // Collect initially
    collectMemory();
    
    // Then every 10 seconds
    setInterval(collectMemory, 10000);
  }
};

// Track navigation changes
const trackNavigations = () => {
  // Function to record navigation
  const recordNavigation = (url) => {
    metrics.navigations.push({
      path: url,
      timestamp: Date.now()
    });
    
    // Keep only the last 20 navigations
    if (metrics.navigations.length > 20) {
      metrics.navigations = metrics.navigations.slice(-20);
    }
  };
  
  // Initial page load
  recordNavigation(window.location.pathname);
  
  // For single page apps with History API
  const originalPushState = history.pushState;
  history.pushState = function() {
    originalPushState.apply(this, arguments);
    recordNavigation(arguments[2]);
  };
  
  window.addEventListener('popstate', () => {
    recordNavigation(window.location.pathname);
  });
};

// Report metrics to backend
const reportMetrics = async () => {
  if (!config.enabled) return;
  
  try {
    // Clone and clean up metrics to avoid circular references
    const reportData = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      webVitals: {
        cls: metrics.cls ? { value: metrics.cls.value, rating: metrics.cls.rating } : null,
        fid: metrics.fid ? { value: metrics.fid.value, rating: metrics.fid.rating } : null,
        lcp: metrics.lcp ? { value: metrics.lcp.value, rating: metrics.lcp.rating } : null,
        ttfb: metrics.ttfb ? { value: metrics.ttfb.value, rating: metrics.ttfb.rating } : null,
        fcp: metrics.fcp ? { value: metrics.fcp.value, rating: metrics.fcp.rating } : null,
      },
      // Include only the latest entries for each category
      resources: metrics.resources.slice(-10),
      errors: metrics.errors,
      interactions: metrics.interactions.slice(-5),
      navigations: metrics.navigations.slice(-5),
      memoryUsage: metrics.memoryUsage.slice(-1)[0]
    };
    
    // Use sendBeacon for better reliability during page unload
    if (navigator.sendBeacon && window.event && window.event.type === 'beforeunload') {
      navigator.sendBeacon(
        config.reportingEndpoint,
        JSON.stringify(reportData)
      );
    } else {
      // Use fetch for normal reporting
      await fetch(config.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData),
        // Use keepalive to allow the request to complete after page navigation
        keepalive: true
      });
    }
    
    // Clear some arrays after reporting to prevent memory bloat
    metrics.interactions = [];
    metrics.resources = [];
    
  } catch (error) {
    console.error('Error reporting frontend metrics:', error);
  }
};

// Export the monitoring interface
export default {
  init: initMonitoring,
  setEnabled: (enabled) => {
    config.enabled = enabled;
    localStorage.setItem('monitoring_enabled', enabled.toString());
  },
  isEnabled: () => config.enabled
}; 