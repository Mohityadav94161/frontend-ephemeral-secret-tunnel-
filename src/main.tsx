import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import monitoring from './lib/monitoring'

// Initialize frontend performance monitoring
monitoring.init({
  reportingEndpoint: '/api/monitoring/frontend',
  samplingRate: 0.25, // Monitor 25% of users in production
  reportingInterval: 30000, // Report every 30 seconds
});

createRoot(document.getElementById("root")!).render(<App />);
