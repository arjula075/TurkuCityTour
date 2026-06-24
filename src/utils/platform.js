import { Capacitor } from '@capacitor/core';

/** True when running inside a Capacitor WebView (iOS or Android). */
export function isNativePlatform() {
    return Capacitor.isNativePlatform();
}
