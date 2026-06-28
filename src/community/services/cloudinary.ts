// ============================================================
// FIZI Community — Cloudinary Upload Service
// Credentials are read from .env (EXPO_PUBLIC_*)
// ============================================================

import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '';

/**
 * Compresses a local image URI and uploads it to Cloudinary.
 * Returns the secure HTTPS URL of the uploaded image.
 */
export async function uploadImageToCloudinary(localUri: string): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary credentials missing. Set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env'
    );
  }

  // ── Step 1: Compress ──────────────────────────────────────
  const compressed = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: 1080 } }],
    { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG }
  );

  // ── Step 2: Build FormData ────────────────────────────────
  const formData = new FormData();
  formData.append('file', {
    uri: compressed.uri,
    type: 'image/jpeg',
    name: `fizi_post_${Date.now()}.jpg`,
  } as any);
  formData.append('upload_preset', UPLOAD_PRESET);
  // formData.append('folder', 'fizi/community'); // Removed because Unsigned presets might reject explicit folders

  // ── Step 3: Upload ────────────────────────────────────────
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary upload failed: ${errorText}`);
  }

  const data = await response.json();
  return data.secure_url as string;
}

/**
 * Constructs a transformation URL from an existing Cloudinary URL.
 * Useful for generating thumbnails (w_300,h_300,c_fill).
 */
export function buildCloudinaryThumb(url: string, width = 300, height = 300): string {
  if (!url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill,q_80/`);
}
