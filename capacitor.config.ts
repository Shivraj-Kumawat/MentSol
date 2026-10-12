import { CapacitorConfig } from '@capacitor/cli';

// Set to true for development (hot reload from Lovable preview)
// Set to false for production builds (uses bundled web assets)
const isDevelopment = false;

const config: CapacitorConfig = {
  appId: 'app.lovable.9c6d35476c0641538b16b9dd6cd14714',
  appName: 'MentSol',
  webDir: 'dist',
  
  // Development server config - COMMENT OUT FOR PRODUCTION BUILDS
  ...(isDevelopment && {
    server: {
      url: 'https://9c6d3547-6c06-4153-8b16-b9dd6cd14714.lovableproject.com?forceHideBadge=true',
      cleartext: true,
      androidScheme: 'https'
    }
  }),
  
  plugins: {
    App: {
      handleUrl: 'mentsol' // Deep link scheme
    }
  }
};

export default config;
