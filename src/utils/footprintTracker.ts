import axios from 'axios';
import { API_URL } from '@/config';
import * as UAParser from 'ua-parser-js';
import { v4 as uuidv4 } from 'uuid';
import Fingerprint2 from 'fingerprintjs2';

interface GeoLocation {
  country: string;
  city: string;
  region: string;
  timezone: string;
  provider: string;
}

interface TrackerOptions {
  trackMouseMovements?: boolean;
  trackClicks?: boolean;
  trackScrollDepth?: boolean;
  trackTimeOnPage?: boolean;
  trackReferrer?: boolean;
  trackDeviceInfo?: boolean;
  trackGeoLocation?: boolean;
  userId?: string;
}

interface FootprintData {
  sessionId: string;
  fingerprint: string | null;
  userId: string | null;
  activityType: string;
  path: string;
  referer: string | null;
  ipAddress: string | null;
  timestamp: string;
  browserInfo: {
    browser: string;
    version: string;
    os: string;
    osVersion: string;
    device: string;
    deviceType: string;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
  };
  geolocation: GeoLocation | null;
  data?: Record<string, unknown>;
}

interface AnalyticsData {
  sessionId: string;
  timeOnPage: number;
  clicks: number;
  mouseMoves: number;
  maxScrollDepth: number;
  lastActivityTime: string;
  fingerprint: string | null;
  browserInfo: UAParser.IResult;
  geolocation: GeoLocation | null;
}

class FootprintTracker {
  private sessionId: string;
  private startTime: number;
  private lastActivityTime: number;
  private maxScrollDepth: number = 0;
  private clicks: number = 0;
  private mouseMoves: number = 0;
  private pageLoads: number = 0;
  private fingerprint: string | null = null;
  private geoLocation: GeoLocation | null = null;
  private options: TrackerOptions;
  private userId: string | null = null;
  private parser: UAParser.UAParser;
  private isTracking: boolean = false;
  private eventListeners: { [key: string]: EventListener } = {};

  constructor(options: TrackerOptions = {}) {
    // Default options
    this.options = {
      trackMouseMovements: true,
      trackClicks: true,
      trackScrollDepth: true,
      trackTimeOnPage: true,
      trackReferrer: true,
      trackDeviceInfo: true,
      trackGeoLocation: true,
      ...options
    };

    this.sessionId = uuidv4();
    this.startTime = Date.now();
    this.lastActivityTime = this.startTime;
    this.userId = options.userId || null;
    this.parser = new UAParser.UAParser();

    // Start collecting fingerprint data
    this.generateFingerprint();

    if (this.options.trackGeoLocation) {
      this.getGeoLocation();
    }
  }

  public start(): void {
    if (this.isTracking) return;
    this.isTracking = true;

    // Track page load
    this.trackPageLoad();

    // Set up event listeners based on options
    if (this.options.trackClicks) {
      this.eventListeners.click = this.handleClick.bind(this);
      document.addEventListener('click', this.eventListeners.click);
    }

    if (this.options.trackMouseMovements) {
      this.eventListeners.mousemove = this.handleMouseMove.bind(this);
      document.addEventListener('mousemove', this.eventListeners.mousemove, { passive: true });
    }

    if (this.options.trackScrollDepth) {
      this.eventListeners.scroll = this.handleScroll.bind(this);
      window.addEventListener('scroll', this.eventListeners.scroll, { passive: true });
    }

    if (this.options.trackTimeOnPage) {
      // Set up tracking for when user leaves the page
      this.eventListeners.beforeunload = this.handlePageExit.bind(this);
      window.addEventListener('beforeunload', this.eventListeners.beforeunload);
    }

    // Record initial state
    this.recordActivity('page_view');
  }

  public stop(): void {
    if (!this.isTracking) return;
    this.isTracking = false;

    // Remove event listeners
    if (this.eventListeners.click) {
      document.removeEventListener('click', this.eventListeners.click);
    }

    if (this.eventListeners.mousemove) {
      document.removeEventListener('mousemove', this.eventListeners.mousemove);
    }

    if (this.eventListeners.scroll) {
      window.removeEventListener('scroll', this.eventListeners.scroll);
    }

    if (this.eventListeners.beforeunload) {
      window.removeEventListener('beforeunload', this.eventListeners.beforeunload);
    }
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public trackEvent(eventName: string, data?: Record<string, unknown>): void {
    this.recordActivity(eventName, data);
  }

  private generateFingerprint(): void {
    Fingerprint2.get((components: Array<{value: string}>) => {
      const values = components.map(component => component.value);
      this.fingerprint = Fingerprint2.x64hash128(values.join(''), 31);
    });
  }

  private getGeoLocation(): void {
    // Using a free geolocation API
    axios.get('https://api.ipgeolocation.io/ipgeo?apiKey=YOUR_API_KEY')
      .then(response => {
        this.geoLocation = {
          country: response.data.country_name,
          city: response.data.city,
          region: response.data.state_prov,
          timezone: response.data.time_zone.name,
          provider: response.data.isp
        };
      })
      .catch(error => {
        console.error('Error getting geolocation:', error);
      });
  }

  private handleClick(event: MouseEvent): void {
    this.clicks++;
    this.lastActivityTime = Date.now();

    // Determine what was clicked
    const target = event.target as HTMLElement;
    const elementType = target.tagName;
    const className = target.className;
    const id = target.id;
    const text = target.textContent?.substring(0, 50);

    this.recordActivity('click', {
      elementType,
      className,
      id,
      text,
      x: event.clientX,
      y: event.clientY
    });
  }

  private handleMouseMove(event: MouseEvent): void {
    // Throttle mouse move tracking to once every 100 moves to reduce overhead
    this.mouseMoves++;
    if (this.mouseMoves % 100 === 0) {
      this.lastActivityTime = Date.now();
    }
  }

  private handleScroll(): void {
    // Track maximum scroll depth as percentage
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollPercentage = (scrollTop / scrollHeight) * 100;

    if (scrollPercentage > this.maxScrollDepth) {
      this.maxScrollDepth = scrollPercentage;
      
      // Record scroll depths at 25%, 50%, 75%, and 100%
      if (
        (this.maxScrollDepth >= 25 && this.maxScrollDepth < 50) ||
        (this.maxScrollDepth >= 50 && this.maxScrollDepth < 75) ||
        (this.maxScrollDepth >= 75 && this.maxScrollDepth < 100) ||
        this.maxScrollDepth >= 100
      ) {
        this.recordActivity('scroll_depth', {
          depth: Math.floor(this.maxScrollDepth)
        });
      }
    }

    this.lastActivityTime = Date.now();
  }

  private handlePageExit(): void {
    const timeOnPage = Date.now() - this.startTime;
    
    this.recordActivity('page_exit', {
      timeOnPage,
      maxScrollDepth: this.maxScrollDepth,
      clicks: this.clicks
    });
  }

  private trackPageLoad(): void {
    this.pageLoads++;
    this.recordActivity('page_load', {
      pageLoadCount: this.pageLoads
    });
  }

  private recordActivity(activityType: string, data?: Record<string, unknown>): void {
    const browserInfo = this.parser.getResult();
    
    const footprintData: FootprintData = {
      sessionId: this.sessionId,
      fingerprint: this.fingerprint,
      userId: this.userId,
      activityType,
      path: window.location.pathname,
      referer: document.referrer || null,
      ipAddress: null, // Will be captured on the server side
      timestamp: new Date().toISOString(),
      browserInfo: {
        browser: browserInfo.browser.name || 'Unknown',
        version: browserInfo.browser.version || 'Unknown',
        os: browserInfo.os.name || 'Unknown',
        osVersion: browserInfo.os.version || 'Unknown',
        device: browserInfo.device.model || 'Unknown',
        deviceType: browserInfo.device.type || 'desktop',
        isMobile: browserInfo.device.type === 'mobile',
        isTablet: browserInfo.device.type === 'tablet',
        isDesktop: !browserInfo.device.type
      },
      geolocation: this.geoLocation,
      data
    };

    // Send to server or store locally
    this.sendToServer(footprintData);
  }

  private sendToServer(data: FootprintData): void {
    // Use a debounce mechanism for performance
    setTimeout(() => {
      fetch(`${API_URL}/analytics/footprint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        // Send as non-essential background task
        keepalive: true
      }).catch(error => {
        console.error('Error recording footprint:', error);
      });
    }, 0);
  }

  // Get analytics data
  public getAnalytics(): AnalyticsData {
    return {
      sessionId: this.sessionId,
      timeOnPage: Date.now() - this.startTime,
      clicks: this.clicks,
      mouseMoves: this.mouseMoves,
      maxScrollDepth: this.maxScrollDepth,
      lastActivityTime: new Date(this.lastActivityTime).toISOString(),
      fingerprint: this.fingerprint,
      browserInfo: this.parser.getResult(),
      geolocation: this.geoLocation
    };
  }
}

// Singleton instance
let instance: FootprintTracker | null = null;

export const initFootprintTracker = (options?: TrackerOptions): FootprintTracker => {
  if (!instance) {
    instance = new FootprintTracker(options);
  }
  return instance;
};

export const getFootprintTracker = (): FootprintTracker | null => {
  return instance;
};

export default FootprintTracker; 