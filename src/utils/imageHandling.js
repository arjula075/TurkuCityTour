import heic2any from "heic2any";

export async function createImageWithThumbnail(file, options = {}) {
    const { maxSize = 100 } = options;
    let workingFile = file;

    const originalName = file.name;
    const lowerName = originalName.toLowerCase();
    const isLikelyHEIC = lowerName.endsWith(".heic");

    try {
        // Convert only if it's HEIC or HEIF
        if (
            file.type === "image/heic" ||
            file.type === "image/heif" ||
            (isLikelyHEIC && (!file.type || file.type === "application/octet-stream"))
        ) {
            try {
                const jpegBlob = await heic2any({
                    blob: file,
                    toType: "image/jpeg",
                    quality: 0.8,
                });

                workingFile = new File(
                    [jpegBlob],
                    originalName.replace(/\.heic$/i, ".jpg"),
                    { type: "image/jpeg" }
                );
            } catch (conversionError) {
                if (
                    conversionError?.message?.includes("Image is already browser readable")
                ) {
                    console.warn("Skipping HEIC conversion: already browser-readable.");
                } else {
                    throw conversionError;
                }
            }
        }

        if (!workingFile.type.startsWith("image/")) {
            throw new Error("Unsupported image type: " + workingFile.type);
        }

        const imageBitmap = await createImageBitmap(workingFile);
        const { width, height } = calculateThumbnailSize(imageBitmap, maxSize);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(imageBitmap, 0, 0, width, height);

        const blob = await new Promise((resolve) =>
            canvas.toBlob(resolve, workingFile.type, 0.8)
        );

        const thumbnailFile = new File([blob], `thumb_${workingFile.name}`, {
            type: workingFile.type,
        });

        return {
            originalFile: workingFile,
            thumbnailFile,
            fileType: workingFile.type,
        };
    } catch (err) {
        console.error("Error during image processing:", err);
        throw err;
    }
}

function calculateThumbnailSize(image, maxSize) {
    const aspectRatio = image.width / image.height;
    if (image.width > image.height) {
        return {
            width: maxSize,
            height: Math.round(maxSize / aspectRatio),
        };
    } else {
        return {
            width: Math.round(maxSize * aspectRatio),
            height: maxSize,
        };
    }
}
