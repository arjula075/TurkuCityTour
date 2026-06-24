import { isNativePlatform } from './platform';

/** Hide splash screen and configure status bar on Capacitor builds. */
export async function initNativeShell() {
    if (!isNativePlatform()) return;

    const [{ SplashScreen }, { StatusBar, Style }] = await Promise.all([
        import('@capacitor/splash-screen'),
        import('@capacitor/status-bar'),
    ]);

    await StatusBar.setStyle({ style: Style.Light });
    await SplashScreen.hide();
}
