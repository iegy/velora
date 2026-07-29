/* Velora — client-side image compression
   Shrinks a user-picked photo down to a small base64 JPEG so it can be
   stored directly inside a Firestore document (no paid Storage needed).
   Tries progressively smaller dimensions/quality until it fits under
   the target size. */

function readFileAsImage(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function canvasToDataUrl(img, maxDim, quality){
  const canvas = document.createElement("canvas");
  let { width, height } = img;
  if (width > height && width > maxDim) { height = Math.round(height * (maxDim / width)); width = maxDim; }
  else if (height > maxDim) { width = Math.round(width * (maxDim / height)); height = maxDim; }
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Compresses an image File down to a data URL under maxBytes (default ~700KB).
 * Returns { dataUrl, width, height } or throws if it truly can't fit.
 */
async function compressImageToDataUrl(file, maxBytes = 700000){
  const img = await readFileAsImage(file);
  const attempts = [
    [1400, 0.82], [1400, 0.65], [1100, 0.6], [900, 0.55], [700, 0.5], [550, 0.45]
  ];
  let last = null;
  for (const [maxDim, quality] of attempts) {
    const dataUrl = canvasToDataUrl(img, maxDim, quality);
    last = dataUrl;
    if (dataUrl.length <= maxBytes) return { dataUrl, width: img.width, height: img.height };
  }
  throw new Error("IMAGE_TOO_LARGE");
}
