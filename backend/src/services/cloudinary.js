import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env' });

// Configure Cloudinary
console.log("🔍 DEBUG: Cloudinary config - Cloud name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("🔍 DEBUG: Cloudinary config - API key:", process.env.CLOUDINARY_API_KEY ? "Set" : "Not set");
console.log("🔍 DEBUG: Cloudinary config - API secret:", process.env.CLOUDINARY_API_SECRET ? "Set" : "Not set");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

class CloudinaryService {
  constructor() {
    this.cloudinary = cloudinary;
  }

  /**
   * Upload image to Cloudinary with optimization
   * @param {Buffer} buffer - Image buffer
   * @param {string} folder - Folder name in Cloudinary
   * @param {string} publicId - Public ID for the image
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Upload result
   */
  async uploadImage(buffer, folder, publicId, options = {}) {
    try {
      // Process image with Sharp for optimization
      const processedBuffer = await this.processImage(buffer, options);
      
      const uploadOptions = {
        folder: `clickpick/${folder}`,
        public_id: publicId,
        resource_type: 'image',
        format: 'webp',
        quality: 'auto',
        transformation: [
          { quality: 'auto:best' },
          { fetch_format: 'auto' }
        ],
        ...options
      };

      return new Promise((resolve, reject) => {
        this.cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              console.log('✅ Image uploaded to Cloudinary:', result.secure_url);
              resolve(result);
            }
          }
        ).end(processedBuffer);
      });
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Process image with Sharp for optimization
   * @param {Buffer} buffer - Image buffer
   * @param {Object} options - Processing options
   * @returns {Promise<Buffer>} Processed buffer
   */
  async processImage(buffer, options = {}) {
    const {
      width = 1280,
      height = 720,
      quality = 85,
      format = 'webp'
    } = options;

    return await sharp(buffer)
      .resize(width, height, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .webp({ quality })
      .toBuffer();
  }

  /**
   * Upload reference image (user uploaded)
   * @param {Buffer} buffer - Image buffer
   * @param {string} userId - User ID
   * @param {string} filename - Original filename
   * @returns {Promise<Object>} Upload result
   */
  async uploadReferenceImage(buffer, userId, filename) {
    const publicId = `ref-${userId}-${Date.now()}`;
    return await this.uploadImage(buffer, 'reference', publicId, {
      width: 800,
      height: 600,
      quality: 85
    });
  }

  /**
   * Upload generated image (AI created)
   * @param {Buffer} buffer - Image buffer
   * @param {string} userId - User ID
   * @param {string} prompt - Generation prompt
   * @returns {Promise<Object>} Upload result
   */
  async uploadGeneratedImage(buffer, userId, prompt) {
    const publicId = `gen-${userId}-${Date.now()}`;
    return await this.uploadImage(buffer, 'generated', publicId, {
      width: 1280,
      height: 720,
      quality: 90,
      context: {
        prompt: prompt.substring(0, 100) // Cloudinary context limit
      }
    });
  }

  /**
   * Upload refined image (AI refined)
   * @param {Buffer} buffer - Image buffer
   * @param {string} userId - User ID
   * @param {string} baseImageId - Base image ID
   * @param {string} refinementPrompt - Refinement prompt
   * @returns {Promise<Object>} Upload result
   */
  async uploadRefinedImage(buffer, userId, baseImageId, refinementPrompt) {
    const publicId = `refined-${userId}-${Date.now()}`;
    return await this.uploadImage(buffer, 'refined', publicId, {
      width: 1280,
      height: 720,
      quality: 90,
      context: {
        base_image: baseImageId,
        refinement: refinementPrompt.substring(0, 100)
      }
    });
  }

  /**
   * Get optimized image URL with transformations
   * @param {string} publicId - Public ID of the image
   * @param {Object} transformations - Cloudinary transformations
   * @returns {string} Optimized URL
   */
  getOptimizedUrl(publicId, transformations = {}) {
    return this.cloudinary.url(publicId, {
      ...transformations,
      quality: 'auto',
      fetch_format: 'auto'
    });
  }

  /**
   * Delete image from Cloudinary
   * @param {string} publicId - Public ID of the image
   * @returns {Promise<Object>} Delete result
   */
  async deleteImage(publicId) {
    try {
      const result = await this.cloudinary.uploader.destroy(publicId);
      console.log('✅ Image deleted from Cloudinary:', publicId);
      return result;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  /**
   * Get image information
   * @param {string} publicId - Public ID of the image
   * @returns {Promise<Object>} Image information
   */
  async getImageInfo(publicId) {
    try {
      return await this.cloudinary.api.resource(publicId);
    } catch (error) {
      console.error('Cloudinary get info error:', error);
      throw new Error(`Failed to get image info: ${error.message}`);
    }
  }
}

export default new CloudinaryService();
