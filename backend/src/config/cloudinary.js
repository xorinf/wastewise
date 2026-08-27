import crypto from 'node:crypto';

/**
 * Image upload adapter. Two implementations:
 *   - REST: signed upload to api.cloudinary.com when keys are set
 *   - stub:  empty imageUrl when keys are missing or the upload fails
 *
 * Cloudinary's signed REST is the only path used in prod; the cloudinary
 * npm SDK is no longer used because it makes a "ping" call that fails on
 * serverless runtimes. If Cloudinary itself rejects the upload (bad
 * credentials, suspended account), we degrade gracefully and return
 * imageUrl: null so the rest of the identify flow keeps working.
 */

const configured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (configured) console.log('[cloudinary] configured (REST)');
else console.log('[cloudinary] not configured - /upload returns null');

function sha1Hex(s) {
  return crypto.createHash('sha1').update(s).digest('hex');
}

/**
 * Upload an image buffer to Cloudinary. Returns { url, public_id } on success
 * or { url: null, stub: true } if Cloudinary is misconfigured / unreachable.
 * Never throws - the identify controller wants to know "did this upload?" not
 * "why did this throw?", and a missing image shouldn't block classification.
 */
export async function uploadImage(file) {
  if (!configured) {
    return { url: null, public_id: null, stub: true };
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'wastewise';
    const signature = sha1Hex(`folder=${folder}&timestamp=${timestamp}${apiSecret}`);

    // ponytail: send the raw buffer as a multipart 'file' field. Cloudinary
    // rejects data: URLs in the 'file' field, so we use a Blob+filename form.
    const form = new FormData();
    form.set('file', new Blob([file.buffer], { type: file.mimetype || 'image/jpeg' }), file.originalname || 'upload');
    form.set('api_key', apiKey);
    form.set('timestamp', String(timestamp));
    form.set('signature', signature);
    form.set('folder', folder);

    const resp = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: form,
    });
    const json = await resp.json().catch(() => ({}));
    if (resp.ok && json.secure_url) {
      return { url: json.secure_url, public_id: json.public_id };
    }
    console.warn('[cloudinary] upload non-ok', resp.status, json?.error?.message);
    return { url: null, public_id: null, stub: true, error: json?.error?.message };
  } catch (e) {
    console.warn('[cloudinary] upload threw:', e.message);
    return { url: null, public_id: null, stub: true, error: e.message };
  }
}

export const isCloudinaryConfigured = configured;
