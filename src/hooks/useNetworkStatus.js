import { useEffect, useState } from 'react';

import { isNativePlatform } from '../utils/platform';

function useWebNetworkStatus() {
    const [online, setOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );

    useEffect(() => {
        const onOnline = () => setOnline(true);
        const onOffline = () => setOnline(false);

        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);

        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, []);

    return online;
}

/**
 * Tracks connectivity for offline UI.
 * Uses @capacitor/network on native; navigator.onLine on web.
 */
export default function useNetworkStatus() {
    const webOnline = useWebNetworkStatus();
    const [nativeOnline, setNativeOnline] = useState(true);

    useEffect(() => {
        if (!isNativePlatform()) return undefined;

        let listener;
        let cancelled = false;

        (async () => {
            const { Network } = await import('@capacitor/network');
            if (cancelled) return;

            const status = await Network.getStatus();
            setNativeOnline(status.connected);

            listener = await Network.addListener('networkStatusChange', (s) => {
                setNativeOnline(s.connected);
            });
        })();

        return () => {
            cancelled = true;
            listener?.remove();
        };
    }, []);

    return isNativePlatform() ? nativeOnline : webOnline;
}
