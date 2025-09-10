import { UTApi } from "uploadthing/server";

// Initialize UploadThing API
const utapi = new UTApi({
  apiKey: process.env.UPLOADTHING_TOKEN,
});

/**
 * Upload a single file to UploadThing
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - File name
 * @param {string} contentType - MIME type
 * @returns {Promise<{url: string, key: string}>}
 */
export const uploadToUploadThing = async (buffer, filename, contentType) => {
  try {
    console.log("🔍 DEBUG: Uploading to UploadThing:", { filename, contentType, size: buffer.length });
    
    const file = new File([buffer], filename, { type: contentType });
    
    const result = await utapi.uploadFiles(file);
    
    if (!result || !result[0]) {
      throw new Error("UploadThing returned empty result");
    }
    
    console.log("🔍 DEBUG: UploadThing upload successful:", result[0]);
    
    return {
      url: result[0].url,
      key: result[0].key,
    };
  } catch (error) {
    console.error("❌ UploadThing upload error:", error);
    throw new Error(`UploadThing upload failed: ${error.message}`);
  }
};

/**
 * Upload multiple files to UploadThing
 * @param {Array<{buffer: Buffer, filename: string, contentType: string}>} files - Array of file objects
 * @returns {Promise<Array<{url: string, key: string}>>}
 */
export const uploadMultipleToUploadThing = async (files) => {
  try {
    console.log("🔍 DEBUG: Uploading multiple files to UploadThing:", files.length, "files");
    
    const fileObjects = files.map(fileData => 
      new File([fileData.buffer], fileData.filename, { type: fileData.contentType })
    );
    
    const results = await utapi.uploadFiles(fileObjects);
    
    if (!results || results.length === 0) {
      throw new Error("UploadThing returned empty results");
    }
    
    console.log("🔍 DEBUG: UploadThing multiple upload successful:", results.length, "files");
    
    return results.map(result => ({
      url: result.url,
      key: result.key,
    }));
  } catch (error) {
    console.error("❌ UploadThing multiple upload error:", error);
    throw new Error(`UploadThing multiple upload failed: ${error.message}`);
  }
};

/**
 * Delete a file from UploadThing
 * @param {string} key - File key
 * @returns {Promise<boolean>}
 */
export const deleteFromUploadThing = async (key) => {
  try {
    console.log("🔍 DEBUG: Deleting from UploadThing:", key);
    
    const result = await utapi.deleteFiles([key]);
    
    console.log("🔍 DEBUG: UploadThing delete result:", result);
    
    return result.success;
  } catch (error) {
    console.error("❌ UploadThing delete error:", error);
    throw new Error(`UploadThing delete failed: ${error.message}`);
  }
};
