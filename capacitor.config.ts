import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aiwhishpers.snakemaze2026',
  appName: 'Snake Maze 2026',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-3710029547742219~6978419692',
    },
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#C7F0D8',
      androidSplashResourceName: 'splash',
    },
    StatusBar: {
      backgroundColor: '#C7F0D8',
      style: 'DARK',
    },
  },
};

export default config;
