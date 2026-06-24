import type { CapacitorConfig } from '@capacitor/cli';

const devServerUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
    appId: 'fi.turkucitytour.app',
    appName: 'TurkuCityTour',
    webDir: 'dist',
    server: {
        androidScheme: 'https',
        ...(devServerUrl
            ? {
                  url: devServerUrl,
                  cleartext: devServerUrl.startsWith('http://'),
              }
            : {}),
    },
};

export default config;
