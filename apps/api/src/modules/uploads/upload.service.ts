import { v2 as cloudinary } from "cloudinary";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";

export const isCloudinaryConfigured = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Signs an upload request so the admin's browser can upload a file straight
 * to Cloudinary - the file's bytes never pass through our API at all.
 */
export function createUploadSignature() {
  if (!isCloudinaryConfigured) {
    throw ApiError.badRequest("Image upload isn't configured on this server. Paste an image URL instead.");
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "nimbus-ecommerce";
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, env.CLOUDINARY_API_SECRET!);

  return {
    timestamp,
    folder,
    signature,
    apiKey: env.CLOUDINARY_API_KEY,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
  };
}
