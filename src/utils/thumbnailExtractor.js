export async function extractThumbnail(file, timeInSeconds = 0.1) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.crossOrigin = 'anonymous';
        video.src = URL.createObjectURL(file);

        video.onloadedmetadata = () => {
            video.currentTime = Math.min(timeInSeconds, video.duration - 0.1);
        };

        video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const thumbnailFile = new File([blob], 'thumbnail.png', {
                            type: 'image/png',
                            lastModified: Date.now(),
                        });
                        resolve(thumbnailFile); // ✅ return File directly
                        URL.revokeObjectURL(video.src);
                    } else {
                        reject(new Error('Thumbnail creation failed'));
                    }
                },
                'image/png',
                1.0
            );
        };

        video.onerror = () => reject(new Error('Video load error'));
    });
}
