// ClawGPT Production Configuration
// This file provides smart defaults for deployed versions
// Safe to commit - no sensitive data

(function() {
  // Detect if we're running on Vercel or other production environment
  const isProduction = window.location.hostname !== 'localhost'
                    && window.location.hostname !== '127.0.0.1';

  const isVercel = window.location.hostname.includes('vercel.app');

  // Production configuration - only apply if not already configured
  if (isProduction && typeof window.CLAWGPT_CONFIG === 'undefined') {
    window.CLAWGPT_CONFIG = {
      // Production mode - relay is the only viable option
      gatewayUrl: 'relay',  // Special value to indicate relay-only mode

      // No auth token in production (users must set via UI or URL params)
      authToken: '',

      // Default session
      sessionKey: 'main',

      // Production defaults
      darkMode: true,

      // Relay server
      relayServer: 'wss://clawgpt-relay.fly.dev',

      // Indicate this is a production deployment
      isProduction: true,
      isVercel: isVercel
    };

    console.log('🌐 Running in production mode - relay connections only');
  }
})();
