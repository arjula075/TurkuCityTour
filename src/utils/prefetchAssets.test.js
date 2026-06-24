import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { collectGameAssetUrls, prefetchGameAssets, prefetchUrl } from './prefetchAssets';

describe('prefetchAssets', () => {
    beforeEach(() => {
        vi.stubGlobal(
            'Image',
            class {
                set src(value) {
                    this._src = value;
                    queueMicrotask(() => this.onload?.());
                }
            }
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('collects hint image URLs from locations', () => {
        const urls = collectGameAssetUrls([
            {
                hints: [{ hint_text: 'a', hint_image_url: 'https://cdn.example/a.jpg' }],
            },
            {
                hints: [{ image_url: 'https://cdn.example/b.png' }],
            },
        ]);

        expect(urls).toEqual([
            'https://cdn.example/a.jpg',
            'https://cdn.example/b.png',
        ]);
    });

    it('prefetches URLs without throwing', async () => {
        await expect(prefetchUrl('https://cdn.example/x.jpg')).resolves.toBeUndefined();
        await expect(prefetchGameAssets([], ['https://cdn.example/y.jpg'])).resolves.toBeUndefined();
    });
});
