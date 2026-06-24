/** Prefetch remote assets into the browser cache (best-effort). */
export function prefetchUrl(url) {
    if (!url || typeof url !== 'string') return Promise.resolve();

    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
    });
}

/** Collect image URLs from game location/hint payloads (supports future hint images). */
export function collectGameAssetUrls(locations) {
    const urls = new Set();

    for (const location of locations ?? []) {
        for (const hint of location.hints ?? []) {
            for (const key of ['hint_image_url', 'image_url', 'url']) {
                if (hint[key]) urls.add(hint[key]);
            }
        }
    }

    return [...urls];
}

/** Prefetch hint images and optional signed URLs when a game starts. */
export async function prefetchGameAssets(locations, extraUrls = []) {
    const urls = [...collectGameAssetUrls(locations), ...extraUrls].filter(Boolean);
    if (!urls.length) return;

    await Promise.allSettled(urls.map(prefetchUrl));
}
