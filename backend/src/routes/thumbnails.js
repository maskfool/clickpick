import express from "express";
import { body, validationResult } from "express-validator";
import multer from "multer";
import path from "path";
import fs from "fs";
import { protect } from "../middleware/auth.js";
import Thumbnail from "../models/Thumbnail.js";

import { generateImageWithGoogleAI } from "../services/googleAI.js";

const router = express.Router();

// Helper to build absolute URLs
const buildAbsoluteUrl = (req, relativePath) => {
  if (!relativePath) return null;
  return `${req.protocol}://${req.get("host")}${relativePath}`;
};

// ======================= Multer Config =======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `ref-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

// ======================= Upload Reference Image =======================
router.post(
  "/upload-reference",
  protect,
  upload.single("image"),
  async (req, res) => {
    try {
      console.log("🔍 DEBUG: Upload endpoint called");
      console.log("🔍 DEBUG: req.file:", req.file);
      console.log("🔍 DEBUG: req.body:", req.body);
      
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const relativePath = `/uploads/${req.file.filename}`;
      const absoluteUrl = buildAbsoluteUrl(req, relativePath);
      
      console.log("🔍 DEBUG: Generated relativePath:", relativePath);
      console.log("🔍 DEBUG: Generated absoluteUrl:", absoluteUrl);

      res.status(200).json({
        success: true,
        message: "Reference image uploaded successfully",
        data: { imageUrl: absoluteUrl, relativePath },
      });
    } catch (error) {
      console.error("Upload error:", error.message);
      res.status(500).json({
        success: false,
        error: "Failed to upload image",
        details: error.message,
      });
    }
  }
);

// ======================= Upload Multiple Reference Images =======================
router.post(
  "/upload-multiple-references",
  protect,
  upload.array("images", 5), // Max 5 images
  async (req, res) => {
    try {
      console.log("🔍 DEBUG: Multiple upload endpoint called");
      console.log("🔍 DEBUG: req.files:", req.files);
      console.log("🔍 DEBUG: req.body:", req.body);
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const uploadedImages = req.files.map(file => {
        const relativePath = `/uploads/${file.filename}`;
        const absoluteUrl = buildAbsoluteUrl(req, relativePath);
        return { imageUrl: absoluteUrl, relativePath };
      });
      
      console.log("🔍 DEBUG: Generated uploadedImages:", uploadedImages);

      res.status(200).json({
        success: true,
        message: `${req.files.length} reference images uploaded successfully`,
        data: { images: uploadedImages },
      });
    } catch (error) {
      console.error("Multiple upload error:", error.message);
      res.status(500).json({
        success: false,
        error: "Failed to upload images",
        details: error.message,
      });
    }
  }
);

// ======================= Create Thumbnail =======================
router.post(
  "/",
  protect,
  [
    body("title").isLength({ min: 1, max: 100 }),
    body("category").isIn([
      "education","gaming","technology","entertainment","lifestyle",
      "business","news","sports","music","comedy","travel",
      "food","fitness","beauty","fashion","other",
    ]),
    body("originalPrompt").isLength({ min: 10, max: 1000 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { title, description, category, originalPrompt, referenceImage, referenceImages } = req.body;
      
      console.log("🔍 DEBUG: Backend received request:");
      console.log("🔍 DEBUG: referenceImage:", referenceImage);
      console.log("🔍 DEBUG: referenceImages:", referenceImages);
      console.log("🔍 DEBUG: typeof referenceImage:", typeof referenceImage);
      console.log("🔍 DEBUG: originalPrompt:", originalPrompt);
      
      // Create DB record
      const thumbnail = await Thumbnail.create({
        user: req.user._id,
        title,
        description,
        category,
        originalPrompt,
        referenceImage: referenceImage || null,
        referenceImages: referenceImages || [],
        status: "generating",
        finalPrompt: originalPrompt,
        imageUrl: "/api/images/placeholder",
      });

      // Generate image directly with user's prompt (no enhancement)
      try {
        const imageResult = await generateImageWithGoogleAI(originalPrompt, category, {
          referenceImage,
          referenceImages,
        });

        thumbnail.finalPrompt = originalPrompt;
        thumbnail.imageUrl = imageResult.imageUrl;
        thumbnail.variants = imageResult.variants;
        thumbnail.metadata = {
          width: imageResult.width,
          height: imageResult.height,
          aiModel: imageResult.model,
        };
        thumbnail.generationTime = imageResult.generationTime;
        thumbnail.status = "completed";
        await thumbnail.save();

        const absoluteThumbnail = {
          ...thumbnail.toObject(),
          imageUrl: buildAbsoluteUrl(req, thumbnail.imageUrl),
          variants: (thumbnail.variants || []).map((v) => ({
            ...v,
            url: buildAbsoluteUrl(req, v.url),
          })),
        };

        res.status(201).json({
          success: true,
          message: "Thumbnail generated",
          data: { thumbnail: absoluteThumbnail },
        });
      } catch (e) {
        console.error("Image gen failed:", e.message);
        thumbnail.status = "failed";
        await thumbnail.save();
        res.status(500).json({
          success: false,
          error: "Image generation failed",
          details: e.message,
        });
      }
    } catch (e) {
      res.status(500).json({
        success: false,
        error: "Server error",
        details: e.message,
      });
    }
  }
);

// ======================= Refine Thumbnail =======================
router.patch(
  "/:id/refine",
  protect,
  [
    body("userPrompt").isLength({ min: 5 }),
    body("chatHistory").optional().isArray().withMessage("Chat history must be an array"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { id } = req.params;
      const { userPrompt, chatHistory = [] } = req.body;

      const thumbnail = await Thumbnail.findById(id);
      if (!thumbnail) {
        return res.status(404).json({ success: false, error: "Thumbnail not found" });
      }

      // Use the LATEST generated image as the input for refinement (not the original reference image)
      const latestImageToUse = thumbnail.imageUrl;
      
      console.log("🔍 DEBUG: Refine endpoint - thumbnail data:", {
        id: thumbnail._id,
        originalReferenceImage: thumbnail.referenceImage,
        latestGeneratedImage: thumbnail.imageUrl,
        category: thumbnail.category
      });
      
      if (!latestImageToUse) {
        return res.status(400).json({ 
          success: false, 
          error: "No generated image found to refine" 
        });
      }
      
      console.log("🔍 DEBUG: Refine endpoint - using latest image:", latestImageToUse);
      console.log("🔍 DEBUG: Refine endpoint - latestImageToUse type:", typeof latestImageToUse);
      console.log("🔍 DEBUG: Refine endpoint - latestImageToUse starts with /uploads:", latestImageToUse.startsWith('/uploads'));

      // Build context from chat history and previous edits
      let contextPrompt = userPrompt;
      
      if (chatHistory.length > 0) {
        // Include recent chat messages as context
        const recentMessages = chatHistory.slice(-5); // Last 5 messages
        const chatContext = recentMessages
          .map(msg => `${msg.role}: ${msg.content}`)
          .join('\n');
        contextPrompt = `Previous conversation context:\n${chatContext}\n\nCurrent refinement request: ${userPrompt}`;
      }
      
      // Also include previous edit history for continuity
      if (thumbnail.edits && thumbnail.edits.length > 0) {
        const lastEdit = thumbnail.edits[thumbnail.edits.length - 1];
        contextPrompt = `Previous edit: "${lastEdit.userPrompt}" → "${lastEdit.aiPrompt}"\n\n${contextPrompt}`;
      }

      // Generate refined image using the LATEST generated image as reference (no prompt enhancement)
      console.log("🔍 DEBUG: Refine endpoint - calling Gemini with:", {
        contextPrompt,
        category: thumbnail.category,
        referenceImage: latestImageToUse
      });
      
      console.log("🔍 DEBUG: Refine endpoint - about to call generateImageWithGoogleAI");
      console.log("🔍 DEBUG: Refine endpoint - referenceImage being passed:", latestImageToUse);
      
      const imageResult = await generateImageWithGoogleAI(contextPrompt, thumbnail.category, {
        referenceImage: latestImageToUse, // Use latest generated image, not original reference
      });
      
      console.log("🔍 DEBUG: Refine endpoint - Gemini returned:", imageResult);

      // Save edit history
      await thumbnail.addEdit(userPrompt, contextPrompt, imageResult.imageUrl, latestImageToUse);

      // Update main fields
      thumbnail.imageUrl = imageResult.imageUrl;
      thumbnail.finalPrompt = contextPrompt;
      thumbnail.variants = imageResult.variants;
      thumbnail.metadata = {
        width: imageResult.width,
        height: imageResult.height,
        aiModel: imageResult.model,
      };

      await thumbnail.save();

      const absoluteThumbnail = {
        ...thumbnail.toObject(),
        imageUrl: buildAbsoluteUrl(req, thumbnail.imageUrl),
        variants: (thumbnail.variants || []).map((v) => ({
          ...v,
          url: buildAbsoluteUrl(req, v.url),
        })),
      };

      res.status(200).json({
        success: true,
        message: "Thumbnail refined using latest generated image",
        data: { thumbnail: absoluteThumbnail },
      });
    } catch (e) {
      console.error("Refine error:", e.message);
      res.status(500).json({
        success: false,
        error: "Failed to refine thumbnail",
        details: e.message,
      });
    }
  }
);

export default router;