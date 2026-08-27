import { v2 as cloudinary } from 'cloudinary';

const configured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (configured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('[cloudinary] configured');
} else {
  console.log('[cloudinary] not configured - /upload will return data: URL placeholder');
}

/**
 * Upload an image. Returns { url, public_id } or throws.
 */
export async function uploadImage(file) {
  if (!configured) {
    // ponytail: when keys are added, this fallback deletes itself.
    return { url: `data:image/jpeg;base64,${file.buffer.toString('base64').slice(0, 0)}`, public_id: null, stub: true };
  }
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: 'wastewise' }, (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, public_id: result.public_id });
      })
      .end(file.buffer);
  });
}

export const isCloudinaryConfigured = configured;
