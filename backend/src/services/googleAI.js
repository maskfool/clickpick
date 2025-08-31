// services/googleAI.js
import { GoogleGenAI } from "@google/genai";
import mime from "mime";
import fs from "fs/promises";
import path from "path";

let ai = null;

const initializeAI = () => {
  if (ai) return ai; // Already initialized
  
  try {
    if (process.env.GOOGLE_AI_API_KEY) {
      ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
      console.log("✅ Gemini AI initialized");
      return ai;
    } else {
      console.warn("⚠️ GOOGLE_AI_API_KEY not found in environment variables");
      return null;
    }
  } catch (err) {
    console.warn("⚠️ Gemini AI initialization failed:", err.message);
    return null;
  }
};

export const generateImageWithGoogleAI = async (
  prompt,
  category = "other",
  options = {}
) => {
  try {
    // Initialize AI if not already done
    const aiInstance = initializeAI();
    
    if (!aiInstance) {
      return {
        imageUrl: "/api/images/placeholder",
        width: 1280,
        height: 720,
        generationTime: 0,
        model: "placeholder",
        variants: [{ url: "/api/images/placeholder" }],
      };
    }

    const model = "gemini-2.5-flash-image-preview";
    
    // Enhance prompt based on category to create YouTube-style thumbnails
    const enhancedPrompt = enhancePromptForCategory(prompt, category);
    
    // Build content array with the EXACT structure from the working Google example
    const contents = [
      { text: enhancedPrompt }
    ];

    // Attach reference image if present
    if (options.referenceImage) {
      console.log("🔍 DEBUG: Gemini service - processing reference image:", options.referenceImage);
      console.log("🔍 DEBUG: Gemini service - category:", category);
      console.log("🔍 DEBUG: Gemini service - prompt:", prompt);
      try {
                  // Simple path resolution like the working Google example
        let refPath;
        let imageBuffer;
        let mimeType;
        
        console.log("🔍 DEBUG: Processing reference image:", options.referenceImage);
        
        // Handle /uploads/ paths (most common case)
        if (options.referenceImage.startsWith('/uploads/')) {
          refPath = path.join(process.cwd(), options.referenceImage);
        } else if (options.referenceImage.startsWith('uploads/')) {
          refPath = path.join(process.cwd(), options.referenceImage);
        } else {
          // Fallback: assume it's in uploads folder
          refPath = path.join(process.cwd(), 'uploads', options.referenceImage);
        }
        
        console.log("🔍 DEBUG: Resolved to local path:", refPath);
        imageBuffer = await fs.readFile(refPath);
        mimeType = mime.getType(refPath) || "image/png";
        
        // Add reference image to the contents array (matching Google docs example)
        contents.push({
          inlineData: {
            mimeType,
            data: imageBuffer.toString("base64"),
          },
        });
        
        console.log("✅ Attached referenceImage:", options.referenceImage, "from path:", refPath);
        console.log("🔍 DEBUG: Final contents array length:", contents.length);
        console.log("🔍 DEBUG: Contents structure:", {
          text: contents[0]?.text ? "✅" : "❌",
          image: contents[1]?.inlineData ? "✅" : "❌"
        });
      } catch (err) {
        console.error("⚠️ Failed to load referenceImage:", options.referenceImage, "Error:", err.message);
        console.error("Full error:", err);
        // Continue without reference image if it fails to load
      }
    }


    
    // Generate content using the exact API structure from the working example
    const start = Date.now();
    const response = await aiInstance.models.generateContent({
      model,
      contents,
    });

    const uploadPath = process.env.UPLOAD_PATH || "./uploads";
    await fs.mkdir(uploadPath, { recursive: true });

    let variants = [];
    let index = 0;

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        const mimeType = part.inlineData.mimeType || "image/png";
        const buffer = Buffer.from(part.inlineData.data, "base64");

        const filename = `ai-${Date.now()}-${index}.${mime.getExtension(mimeType)}`;
        const filePath = path.join(uploadPath, filename);
        await fs.writeFile(filePath, buffer);

        variants.push({
          url: `/uploads/${filename}`,
          mimeType,
          ext: mime.getExtension(mimeType),
        });

        index++;
      }
    }

    if (!variants.length) {
      throw new Error("No image returned from Gemini");
    }

    return {
      imageUrl: variants[0].url,
      variants,
      width: options.width || 1280,
      height: options.height || 720,
      generationTime: Date.now() - start,
      model,
    };
  } catch (err) {
    console.error("❌ Gemini image generation error:", err);
    return {
      imageUrl: "/api/images/placeholder",
      model: "error",
      variants: [{ url: "/api/images/placeholder" }],
      error: err.message,
    };
  }
};

// Smart prompt enhancement for YouTube-style thumbnails
const enhancePromptForCategory = (prompt, category) => {
  // Base YouTube thumbnail style
  const baseStyle = "Create a high-quality, professional YouTube thumbnail that is eye-catching and click-worthy";
  
  // Category-specific enhancements
  const categoryEnhancements = {
    gaming: {
      style: "vibrant neon lights, dynamic composition, modern gaming aesthetic with bold text and dramatic lighting",
      elements: "Include gaming elements like controllers, neon effects, and dynamic poses",
      colors: "Use bright neon colors (cyan, magenta, yellow) with dark backgrounds for contrast"
    },
    business: {
      style: "clean, corporate, professional look with modern typography",
      elements: "Include business elements like charts, graphs, or professional imagery",
      colors: "Use professional colors (blue, gray, white) with clean lines and minimal design"
    },
    food: {
      style: "high-quality, appetizing, warm and inviting aesthetic",
      elements: "Include food photography elements, steam, garnishes, and appealing presentation",
      colors: "Use warm tones (orange, red, yellow) with natural lighting and rich textures"
    },
    education: {
      style: "clear, academic, bold and readable design",
      elements: "Include educational elements like books, diagrams, or learning symbols",
      colors: "Use clear, readable colors with high contrast and professional typography"
    },
    entertainment: {
      style: "colorful, fun, engaging, pop culture aesthetic",
      elements: "Include entertainment elements like stars, sparkles, or celebrity imagery",
      colors: "Use vibrant, energetic colors with dynamic compositions and fun typography"
    },
    technology: {
      style: "futuristic, digital, sleek tech aesthetic",
      elements: "Include tech elements like circuits, digital effects, or futuristic imagery",
      colors: "Use tech colors (blue, green, purple) with digital effects and modern design"
    },
    lifestyle: {
      style: "aspirational, modern, trendy aesthetic",
      elements: "Include lifestyle elements like fashion, travel, or wellness imagery",
      colors: "Use trendy colors with clean, modern compositions and stylish typography"
    },
    news: {
      style: "authoritative, trustworthy, professional news aesthetic",
      elements: "Include news elements like headlines, breaking news graphics, or journalistic imagery",
      colors: "Use professional colors (red, blue, white) with clear typography and authoritative design"
    },
    sports: {
      style: "dynamic, energetic, action-packed aesthetic",
      elements: "Include sports elements like motion blur, action shots, or athletic imagery",
      colors: "Use energetic colors with dynamic compositions and action-oriented design"
    },
    music: {
      style: "artistic, creative, musical aesthetic",
      elements: "Include musical elements like instruments, sound waves, or artistic imagery",
      colors: "Use creative colors with artistic compositions and musical themes"
    },
    comedy: {
      style: "fun, humorous, light-hearted aesthetic",
      elements: "Include comedy elements like emojis, funny expressions, or humorous imagery",
      colors: "Use bright, cheerful colors with playful compositions and fun typography"
    },
    travel: {
      style: "adventurous, inspiring, wanderlust aesthetic",
      elements: "Include travel elements like maps, landmarks, or scenic imagery",
      colors: "Use travel colors (blue, green, earth tones) with inspiring compositions and adventure themes"
    },
    fitness: {
      style: "energetic, motivational, health-focused aesthetic",
      elements: "Include fitness elements like workout equipment, active poses, or health imagery",
      colors: "Use energetic colors (green, orange, blue) with motivational compositions and health themes"
    },
    beauty: {
      style: "elegant, glamorous, beauty-focused aesthetic",
      elements: "Include beauty elements like makeup, skincare, or fashion imagery",
      colors: "Use elegant colors (pink, gold, white) with sophisticated compositions and beauty themes"
    },
    fashion: {
      style: "trendy, stylish, fashion-forward aesthetic",
      elements: "Include fashion elements like clothing, accessories, or runway imagery",
      colors: "Use trendy colors with clean, modern compositions and fashion-forward design"
    }
  };

  const enhancement = categoryEnhancements[category] || categoryEnhancements.other;
  
  // Build the enhanced prompt
  const enhancedPrompt = `${baseStyle}. ${prompt}. Style: ${enhancement.style}. Elements: ${enhancement.elements}. Colors: ${enhancement.colors}. Make it look like a professional YouTube thumbnail that would get high click-through rates.`;
  
  console.log("🔍 DEBUG: Enhanced prompt for category:", category);
  console.log("🔍 DEBUG: Original prompt:", prompt);
  console.log("🔍 DEBUG: Enhanced prompt:", enhancedPrompt);
  
  return enhancedPrompt;
};

