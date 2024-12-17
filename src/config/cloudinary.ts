import { v2 as cloudinary } from 'cloudinary';
import { error } from 'console';
import { resolve } from 'path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export default cloudinary;

interface CloudinaryUploadResult {
    secure_url: string;
  }
  

export const uploadToCloudinary = (fileBuffer: Buffer, folder: string): Promise<CloudinaryUploadResult> => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result as CloudinaryUploadResult); 
          }
        }
      ).end(fileBuffer);
    });
  };
  
  const extractPublicId = (url: string): string => {
    const parts = url.split("/");
  
    // Find the index of the version string (starts with 'v')
    const versionIndex = parts.findIndex((part: string) => part.startsWith("v"));
  
    if (versionIndex === -1 || versionIndex + 1 >= parts.length) {
      throw new Error("Invalid Cloudinary URL. Cannot extract public_id.");
    }
  
    // Get the public ID with extension
    const publicIdWithExtension = parts.slice(versionIndex + 1).join("/");
  
    // Remove the extension from the public ID
    return publicIdWithExtension.split(".").slice(0, -1).join(".");
  };
  

  export const deleteFromCloudinary = async (imageUrl: string) => {
    try {
      const publicId = extractPublicId(imageUrl);
  
      if (!publicId) {
        throw new Error("Invalid image URL. Cannot extract public_id.");
      }
  
      const result = await cloudinary.uploader.destroy(publicId);
  
      if (result.result === "ok") {
        console.log("Image deleted successfully");
        return { success: true, message: "Image deleted successfully" };
      } else {
        console.warn("Image not found or already deleted:", result.result);
        return { success: false, message: "Image not found or already deleted" };
      }
    } catch (error: any) {
      console.error("Delete Image Error:", error);
      return { success: false, message: `Failed to delete image: ${error.message}` };
    }
  };
  
  
  
  
