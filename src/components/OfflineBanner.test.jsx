import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../utils/platform', () => ({
    isNativePlatform: () => false,
}));

import OfflineBanner from './OfflineBanner';

describe('OfflineBanner', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('is hidden when online', () => {
        vi.stubGlobal('navigator', { onLine: true });
        const { container } = render(<OfflineBanner />);
        expect(container).toBeEmptyDOMElement();
    });

    it('shows message when offline', () => {
        vi.stubGlobal('navigator', { onLine: false });
        render(<OfflineBanner />);
        expect(screen.getByRole('status')).toHaveTextContent(/no internet connection/i);
    });
});
