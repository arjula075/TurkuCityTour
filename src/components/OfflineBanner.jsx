import React from 'react';

import useNetworkStatus from '../hooks/useNetworkStatus';

export default function OfflineBanner() {
    const online = useNetworkStatus();

    if (online) return null;

    return (
        <div
            className="offline-banner"
            role="status"
            aria-live="polite"
        >
            No internet connection — game progress may not save until you are back online.
        </div>
    );
}
