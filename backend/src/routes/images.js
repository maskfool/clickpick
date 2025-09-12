import express from "express";
import multer from "multer";
import sharp from "sharp";
import path, { dirname } from "path";
import fs from "fs/promises";
import { protect } from "../middleware/auth.js";
import { body, validationResult } from "express-validator";
import { fileURLToPath } from "url";
import { generateImageWithGoogleAI } from "../services/googleAI.js"; // 👈 Gemini service
import cloudinaryService from "../services/cloudinary.js"; // 👈 Cloudinary service
import mem0Service from "../services/mem0.js"; // 👈 Mem0 service

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Multer setup
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  console.log("🔍 DEBUG: File filter - mimetype:", file.mimetype, "originalname:", file.originalname);
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
    files: 1,
  },
});

// Multiple file upload for reference images
const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
    files: 5, // Allow up to 5 files
  },
});

// Ensure upload directory exists
const ensureUploadDir = async () => {
  const uploadPath = process.env.UPLOAD_PATH || "./uploads";
  try {
    await fs.access(uploadPath);
  } catch {
    await fs.mkdir(uploadPath, { recursive: true });
  }
  return uploadPath;
};

/**
 * =====================================================
 * 🔥 NEW: Generate Thumbnail with Google Gemini
 * =====================================================
 * @route   POST /api/image/generate
 * @access  Public (later: protect)
 */

/**
 * =====================================================
 * 🔥 NEW: Refine Thumbnail with Context
 * =====================================================
 * @route   POST /api/image/refine
 * @access  Private
 */
router.post(
  "/refine",
  protect,
  [body("prompt").notEmpty().withMessage("Refinement prompt is required")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Validation failed", details: errors.array() });
      }

      const { prompt, baseImageId, category } = req.body;
      const userId = req.user._id;

      try {
        // Get user's image history and context
        const userContext = await mem0Service.getGenerationContext(userId, prompt);
        
        // Find the base image from user's history
        const baseImage = userContext.imageHistory.find(img => 
          img.metadata.public_id === baseImageId || 
          img.image_url.includes(baseImageId)
        );

        if (!baseImage) {
          return res.status(404).json({ error: "Base image not found in user's history" });
        }

        // Generate refined image with context
        const result = await generateImageWithGoogleAI(prompt, category, {
          referenceImage: baseImage.image_url,
          userId: userId,
          isRefinement: true,
          baseImageId: baseImageId
        });

        res.json({ 
          variants: result.variants,
          imageUrl: result.imageUrl,
          generationTime: result.generationTime,
          model: result.model,
          isRefinement: true
        });
      } catch (err) {
        console.error("❌ Image refinement error:", err);
        res.status(500).json({ error: "Failed to refine image", details: err.message });
      }
    } catch (err) {
      res.status(500).json({ error: "Server error while refining image" });
    }
  }
);

/**
 * =====================================================
 * 🔥 NEW: Get User's Image History
 * =====================================================
 * @route   GET /api/image/history
 * @access  Private
 */
router.get("/history", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { type = 'all', limit = 20 } = req.query;

    let imageHistory;
    if (type === 'all') {
      imageHistory = await mem0Service.getUserImageHistory(userId);
    } else {
      imageHistory = await mem0Service.getUserImageHistory(userId, type);
    }

    // Limit results
    imageHistory = imageHistory.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        images: imageHistory,
        count: imageHistory.length,
        type: type
      }
    });
  } catch (error) {
    console.error("Get image history error:", error);
    res.status(500).json({ success: false, error: "Failed to get image history" });
  }
});

/**
 * =====================================================
 * 🔥 NEW: Get User's Chat History
 * =====================================================
 * @route   GET /api/image/chat-history
 * @access  Private
 */
router.get("/chat-history", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 10 } = req.query;

    const chatHistory = await mem0Service.getUserChatHistory(userId, parseInt(limit));

    res.json({
      success: true,
      data: {
        chatHistory: chatHistory,
        count: chatHistory.length
      }
    });
  } catch (error) {
    console.error("Get chat history error:", error);
    res.status(500).json({ success: false, error: "Failed to get chat history" });
  }
});
router.post(
  "/generate",
  [body("prompt").notEmpty().withMessage("Prompt is required")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Validation failed", details: errors.array() });
      }

      const { prompt, category, referenceImages, userId } = req.body;

      try {
        const result = await generateImageWithGoogleAI(prompt, category, {
          referenceImages: referenceImages || [],
          userId: userId || req.user?._id || 'anonymous'
        });

        // Match frontend expectation: { variants: [ { url } ] }
        res.json({ 
          variants: result.variants,
          imageUrl: result.imageUrl,
          generationTime: result.generationTime,
          model: result.model
        });
      } catch (err) {
        console.error("❌ Gemini generation error:", err);
        res.status(500).json({ error: "Failed to generate image", details: err.message });
      }
    } catch (err) {
      res.status(500).json({ error: "Server error while generating image" });
    }
  }
);

/**
 * =====================================================
 * Existing Upload / Process / Info / Delete routes
 * =====================================================
 */

// @desc    Upload user photo
// @route   POST /api/images/upload-photo
// @access  Private
router.post("/upload-photo", protect, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });

    // Process image with Sharp
    const processedBuffer = await sharp(req.file.buffer)
      .resize(200, 200, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();

    const fileName = `user-${req.user._id}-${Date.now()}.webp`;
    
    // Upload to local storage
    const uploadPath = await ensureUploadDir();
    const filePath = path.join(uploadPath, fileName);
    await fs.writeFile(filePath, processedBuffer);
    const stats = await fs.stat(filePath);

    res.json({
      success: true,
      message: "Photo uploaded successfully",
      data: { 
        imageUrl: `/uploads/${fileName}`, 
        fileName: fileName, 
        size: stats.size, 
        mimetype: "image/webp" 
      },
    });
  } catch (error) {
    console.error("Photo upload error:", error);
    res.status(500).json({ success: false, error: "Server error while uploading photo" });
  }
});

// @desc    Upload reference image for thumbnail
// @route   POST /api/images/upload-reference
// @access  Private
router.post("/upload-reference", protect, upload.single("reference"), async (req, res) => {
  try {
    console.log("🔍 DEBUG: Single upload request received");
    console.log("🔍 DEBUG: req.file:", req.file);
    console.log("🔍 DEBUG: req.user:", req.user);
    
    if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });

    // Upload to Cloudinary
    try {
      console.log("🔍 DEBUG: Attempting Cloudinary upload...");
      console.log("🔍 DEBUG: File buffer size:", req.file.buffer.length);
      console.log("🔍 DEBUG: User ID:", req.user._id);
      console.log("🔍 DEBUG: Original filename:", req.file.originalname);
      
      const cloudinaryResult = await cloudinaryService.uploadReferenceImage(
        req.file.buffer,
        req.user._id,
        req.file.originalname
      );
      
      console.log("✅ Cloudinary upload successful:", cloudinaryResult.secure_url);

      // Store image reference in Mem0
      try {
        await mem0Service.storeImageReference(
          req.user._id,
          cloudinaryResult.secure_url,
          'reference',
          {
            original_name: req.file.originalname,
            public_id: cloudinaryResult.public_id,
            size: req.file.size,
            cloudinary_url: cloudinaryResult.secure_url
          }
        );
        console.log("✅ Mem0 storage successful");
      } catch (memError) {
        console.warn("⚠️ Failed to store image reference in Mem0:", memError.message);
      }

      res.json({
        success: true,
        message: "Reference image uploaded successfully to Cloudinary",
        data: {
          imageUrl: cloudinaryResult.secure_url,
          fileName: cloudinaryResult.public_id,
          size: cloudinaryResult.bytes,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
          mimetype: cloudinaryResult.format,
          publicId: cloudinaryResult.public_id
        },
      });
    } catch (cloudinaryError) {
      console.error("❌ Cloudinary upload failed:", cloudinaryError.message);
      
      // Fallback to local storage
      console.log("🔄 Falling back to local storage...");
      const processedBuffer = await sharp(req.file.buffer)
        .resize(800, 600, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

      const fileName = `ref-${req.user._id}-${Date.now()}.webp`;
      const metadata = await sharp(processedBuffer).metadata();
      
      const uploadPath = await ensureUploadDir();
      const filePath = path.join(uploadPath, fileName);
      await fs.writeFile(filePath, processedBuffer);
      const stats = await fs.stat(filePath);

      res.json({
        success: true,
        message: "Reference image uploaded successfully (local storage fallback)",
        data: {
          imageUrl: `/uploads/${fileName}`,
          fileName: fileName,
          size: stats.size,
          width: metadata.width,
          height: metadata.height,
          mimetype: "image/webp",
          publicId: fileName
        },
      });
    }
  } catch (error) {
    console.error("Reference upload error:", error);
    res.status(500).json({ success: false, error: "Server error while uploading reference" });
  }
});

// @desc    Upload multiple reference images
// @route   POST /api/images/upload-multiple-reference
// @access  Private
router.post("/upload-multiple-reference", protect, uploadMultiple.array("files", 5), async (req, res) => {
  try {
    console.log("🔍 DEBUG: Upload request received");
    console.log("🔍 DEBUG: req.files:", req.files);
    console.log("🔍 DEBUG: req.body:", req.body);
    console.log("🔍 DEBUG: req.user:", req.user);
    
    if (!req.files || req.files.length === 0) {
      console.log("❌ No files uploaded");
      return res.status(400).json({ success: false, error: "No files uploaded" });
    }

    const uploadedFiles = [];
    const uploadPath = await ensureUploadDir();

    for (const file of req.files) {
      try {
        console.log("🔍 DEBUG: Processing file:", file.originalname, "Size:", file.size, "Mimetype:", file.mimetype);
        
        // Upload to Cloudinary
        const cloudinaryResult = await cloudinaryService.uploadReferenceImage(
          file.buffer,
          req.user._id,
          file.originalname
        );
        
        console.log("✅ Cloudinary upload successful:", cloudinaryResult.secure_url);

        // Store image reference in Mem0
        try {
          await mem0Service.storeImageReference(
            req.user._id,
            cloudinaryResult.secure_url,
            'reference',
            {
              original_name: file.originalname,
              public_id: cloudinaryResult.public_id,
              size: file.size,
              cloudinary_url: cloudinaryResult.secure_url
            }
          );
          console.log("✅ Mem0 storage successful");
        } catch (memError) {
          console.warn("⚠️ Failed to store image reference in Mem0:", memError.message);
        }

        uploadedFiles.push({
          imageUrl: cloudinaryResult.secure_url,
          fileName: cloudinaryResult.public_id,
          size: cloudinaryResult.bytes,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
          mimetype: cloudinaryResult.format,
          publicId: cloudinaryResult.public_id
        });
        
        console.log("✅ File uploaded successfully to Cloudinary:", cloudinaryResult.public_id);
      } catch (uploadError) {
        console.error("❌ Failed to upload file to Cloudinary:", file.originalname, uploadError);
        console.error("❌ Upload error details:", uploadError.message);
        
        // Fallback to local storage if Cloudinary fails
        try {
          console.log("🔄 Falling back to local storage...");
          const processedBuffer = await sharp(file.buffer)
            .resize(800, 600, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 85 })
            .toBuffer();
          
          const fileName = `ref-${req.user._id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.webp`;
          const filePath = path.join(uploadPath, fileName);
          await fs.writeFile(filePath, processedBuffer);
          const stats = await fs.stat(filePath);
          const metadata = await sharp(processedBuffer).metadata();

          uploadedFiles.push({
            imageUrl: `/uploads/${fileName}`,
            fileName: fileName,
            size: stats.size,
            width: metadata.width,
            height: metadata.height,
            mimetype: "image/webp",
            publicId: fileName
          });
          
          console.log("✅ File uploaded to local storage as fallback:", fileName);
        } catch (fallbackError) {
          console.error("❌ Fallback to local storage also failed:", fallbackError.message);
        }
      }
    }

    console.log("🔍 DEBUG: Total uploaded files:", uploadedFiles.length);

    res.json({
      success: true,
      message: `${uploadedFiles.length} reference images uploaded successfully`,
      data: uploadedFiles,
    });
  } catch (error) {
    console.error("Multiple reference upload error:", error);
    res.status(500).json({ success: false, error: "Server error while uploading reference images" });
  }
});

// @desc    Process and resize image
// @route   POST /api/images/process
// @access  Private
router.post(
  "/process",
  protect,
  [
    body("imageUrl").notEmpty().withMessage("Image URL is required"),
    body("width").optional().isInt({ min: 100, max: 4000 }),
    body("height").optional().isInt({ min: 100, max: 4000 }),
    body("format").optional().isIn(["webp", "jpeg", "png"]),
    body("quality").optional().isInt({ min: 1, max: 100 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Validation failed", details: errors.array() });
      }

      const { imageUrl, width = 1280, height = 720, format = "webp", quality = 85 } = req.body;

      const fileName = path.basename(imageUrl);
      const uploadPath = await ensureUploadDir();
      const inputPath = path.join(uploadPath, fileName);

      try {
        await fs.access(inputPath);
      } catch {
        return res.status(404).json({ error: "Image file not found" });
      }

      const outputFileName = `processed-${Date.now()}.${format}`;
      const outputPath = path.join(uploadPath, outputFileName);

      let sharpInstance = sharp(inputPath).resize(width, height, { fit: "cover" });

      switch (format) {
        case "webp":
          sharpInstance = sharpInstance.webp({ quality });
          break;
        case "jpeg":
          sharpInstance = sharpInstance.jpeg({ quality });
          break;
        case "png":
          sharpInstance = sharpInstance.png({ quality });
          break;
      }

      await sharpInstance.toFile(outputPath);

      const stats = await fs.stat(outputPath);
      const metadata = await sharp(outputPath).metadata();

      res.json({
        success: true,
        message: "Image processed successfully",
        data: {
          imageUrl: `/uploads/${outputFileName}`,
          fileName: outputFileName,
          size: stats.size,
          width: metadata.width,
          height: metadata.height,
          format,
          quality,
        },
      });
    } catch (error) {
      console.error("Process error:", error);
      res.status(500).json({ success: false, error: "Server error while processing image" });
    }
  }
);

// @desc    Get image info
// @route   GET /api/images/info/:filename
// @access  Public
router.get("/info/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const uploadPath = await ensureUploadDir();
    const filePath = path.join(uploadPath, filename);

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: "Image file not found" });
    }

    const stats = await fs.stat(filePath);
    const metadata = await sharp(filePath).metadata();

    res.json({
      success: true,
      data: { filename, size: stats.size, ...metadata, created: stats.birthtime, modified: stats.mtime },
    });
  } catch (error) {
    console.error("Info error:", error);
    res.status(500).json({ success: false, error: "Server error while getting info" });
  }
});

// @desc    Delete image
// @route   DELETE /api/images/:filename
// @access  Private
router.delete("/:filename", protect, async (req, res) => {
  try {
    const { filename } = req.params;
    const uploadPath = await ensureUploadDir();
    const filePath = path.join(uploadPath, filename);

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: "Image not found" });
    }

    await fs.unlink(filePath);
    res.json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ success: false, error: "Server error while deleting image" });
  }
});

// @desc    Serve uploaded images
// @route   GET /uploads/:filename
// @access  Public
router.get("/uploads/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const uploadPath = await ensureUploadDir();
    const filePath = path.join(uploadPath, filename);

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: "Image not found" });
    }

    res.setHeader("Content-Type", "image/webp");
    res.setHeader("Cache-Control", "public, max-age=31536000");
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Serve error:", error);
    res.status(500).json({ success: false, error: "Server error while serving image" });
  }
});

// @desc    Placeholder when AI disabled
// @route   GET /api/images/placeholder
// @access  Public
router.get("/placeholder", async (req, res) => {
  try {
    const svg = `
      <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" text-anchor="middle" fill="#6b7280">
          AI Image Generation Disabled
        </text>
      </svg>
    `;
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(svg);
  } catch (error) {
    console.error("Placeholder error:", error);
    res.status(500).json({ success: false, error: "Server error while generating placeholder" });
  }
});

export default router;