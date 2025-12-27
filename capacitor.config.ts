import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig & { app?: { scheme?: string; hostname?: string } } = {
  appId: 'io.ionic.hayatmuslim',
  appName: 'HayatMuslim',
  webDir: 'www',

  app: {
    scheme: 'hayatmuslim',  
    hostname: 'app'        
  },

  server: {
    androidScheme: 'https', 
  }
};

export default config;
