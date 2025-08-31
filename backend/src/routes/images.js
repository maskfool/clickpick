import express from "express";
import multer from "multer";
import sharp from "sharp";
import path, { dirname } from "path";
import fs from "fs/promises";
import { protect } from "../middleware/auth.js";
import { body, validationResult } from "express-validator";
import { fileURLToPath } from "url";
import { generateImageWithGoogleAI } from "../services/googleAI.js"; // 👈 Gemini service

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Multer setup
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed"), false);
};
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
    files: 1,
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
router.post(
  "/generate",
  [body("prompt").notEmpty().withMessage("Prompt is required")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Validation failed", details: errors.array() });
      }

      const { prompt, category } = req.body;

      try {
        const result = await generateImageWithGoogleAI(prompt, category);

        // Match frontend expectation: { variants: [ { url } ] }
        res.json({ variants: result.variants });
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

    const uploadPath = await ensureUploadDir();
    const fileName = `user-${req.user._id}-${Date.now()}.webp`;
    const filePath = path.join(uploadPath, fileName);

    await sharp(req.file.buffer).resize(200, 200, { fit: "cover" }).webp({ quality: 80 }).toFile(filePath);

    const stats = await fs.stat(filePath);

    res.json({
      success: true,
      message: "Photo uploaded successfully",
      data: { imageUrl: `/uploads/${fileName}`, fileName, size: stats.size, mimetype: "image/webp" },
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
    if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });

    const uploadPath = await ensureUploadDir();
    const fileName = `ref-${req.user._id}-${Date.now()}.webp`;
    const filePath = path.join(uploadPath, fileName);

    await sharp(req.file.buffer)
      .resize(800, 600, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(filePath);

    const stats = await fs.stat(filePath);
    const metadata = await sharp(filePath).metadata();

    res.json({
      success: true,
      message: "Reference image uploaded successfully",
      data: {
        imageUrl: `/uploads/${fileName}`,
        fileName,
        size: stats.size,
        width: metadata.width,
        height: metadata.height,
        mimetype: "image/webp",
      },
    });
  } catch (error) {
    console.error("Reference upload error:", error);
    res.status(500).json({ success: false, error: "Server error while uploading reference" });
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