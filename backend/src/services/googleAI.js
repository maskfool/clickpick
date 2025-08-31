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
    
    // Check if this is a refinement (has reference image) or new generation
    const isRefinement = !!options.referenceImage;
    
    // Enhance prompt based on category and whether it's refinement or new generation
    const enhancedPrompt = isRefinement 
      ? enhancePromptForRefinement(prompt, category)
      : enhancePromptForCategory(prompt, category);
    
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

// Smart prompt enhancement for YouTube-style thumbnails with latest trends
const enhancePromptForCategory = (prompt, category) => {
  // Expert YouTube thumbnail maker persona
  const expertPersona = "You are the #1 YouTube thumbnail designer in the world, with 10+ years creating viral thumbnails for top creators like MrBeast, PewDiePie, and Markiplier. You understand the latest 2024-2025 YouTube algorithm trends, psychology of click-through rates, and what makes thumbnails go viral.";
  
  // Latest YouTube thumbnail trends (2024-2025)
  const latestTrends = "Use the latest YouTube thumbnail trends: bold, high-contrast text with drop shadows, dramatic facial expressions, bright neon colors, split-screen layouts, emoji integration, mystery elements, and 'shock factor' that makes viewers curious. Follow the '3-second rule' - viewers should understand the thumbnail instantly.";
  
  // Base YouTube thumbnail style with modern techniques
  const baseStyle = "Create a viral-worthy YouTube thumbnail using 2024-2025 best practices: 1280x720 resolution, high contrast, bold typography, dramatic lighting, and composition that stops scrolling. This should look like it belongs on trending YouTube videos with 1M+ views.";
  
  // Enhanced category-specific enhancements with latest trends
  const categoryEnhancements = {
    gaming: {
      style: "2024 gaming aesthetic: neon cyberpunk vibes, dramatic lighting, bold gaming text, controller/keyboard elements, neon glows, and 'epic' atmosphere that matches current gaming trends",
      elements: "Include modern gaming elements: RGB lighting, neon effects, dramatic poses, gaming peripherals, and elements that appeal to Gen Z gamers",
      colors: "Use trending gaming colors: electric blue, neon green, hot pink, and bright orange with dark backgrounds for maximum contrast and visibility"
    },
    business: {
      style: "2024 business aesthetic: clean corporate design, modern typography, data visualization, and professional imagery that builds trust and authority",
      elements: "Include business elements: charts, graphs, professional headshots, corporate symbols, and elements that convey success and expertise",
      colors: "Use professional colors: deep blue, corporate gray, accent gold, and clean white for a trustworthy, premium look"
    },
    food: {
      style: "2024 food aesthetic: high-quality food photography, warm lighting, appetizing presentation, and 'food porn' style that makes viewers hungry",
      elements: "Include food elements: steam, garnishes, perfect plating, close-up shots, and elements that trigger hunger and desire",
      colors: "Use appetizing colors: warm orange, rich red, golden yellow, and natural earth tones that make food look irresistible"
    },
    education: {
      style: "2024 education aesthetic: clear, modern academic design, bold typography, and visual learning elements that make complex topics accessible",
      elements: "Include educational elements: diagrams, charts, books, learning symbols, and visual aids that enhance understanding",
      colors: "Use educational colors: clear blue, academic green, accent orange, and high-contrast combinations for readability"
    },
    entertainment: {
      style: "2024 entertainment aesthetic: pop culture references, celebrity appeal, trending memes, and viral content elements that capture attention",
      elements: "Include entertainment elements: stars, sparkles, trending symbols, celebrity imagery, and elements that create FOMO",
      colors: "Use entertainment colors: vibrant purple, electric pink, bright yellow, and colors that scream 'entertainment' and 'fun'"
    },
    technology: {
      style: "2024 tech aesthetic: futuristic design, digital effects, AI/ML themes, and cutting-edge technology that looks ahead of its time",
      elements: "Include tech elements: circuits, digital effects, futuristic interfaces, AI symbols, and elements that convey innovation",
      colors: "Use tech colors: electric blue, neon green, digital purple, and colors that represent the future and innovation"
    },
    lifestyle: {
      style: "2024 lifestyle aesthetic: aspirational, Instagram-worthy, trendsetting design that makes viewers want to live that life",
      elements: "Include lifestyle elements: fashion, travel, wellness, luxury, and elements that create aspiration and envy",
      colors: "Use lifestyle colors: trendy pastels, luxury gold, modern neutrals, and colors that represent the good life"
    },
    news: {
      style: "2024 news aesthetic: authoritative, trustworthy, breaking news design that conveys urgency and credibility",
      elements: "Include news elements: headlines, breaking news graphics, journalistic imagery, and elements that build trust",
      colors: "Use news colors: authoritative red, trustworthy blue, clean white, and colors that convey seriousness and credibility"
    },
    sports: {
      style: "2024 sports aesthetic: dynamic, action-packed, high-energy design that captures the excitement of sports",
      elements: "Include sports elements: motion blur, action shots, athletic poses, team colors, and elements that convey energy",
      colors: "Use sports colors: team colors, energetic orange, dynamic red, and colors that represent power and movement"
    },
    music: {
      style: "2024 music aesthetic: artistic, creative, musical design that captures the emotion and energy of music",
      elements: "Include musical elements: instruments, sound waves, artistic imagery, and elements that represent creativity",
      colors: "Use musical colors: creative purple, artistic blue, vibrant red, and colors that represent emotion and creativity"
    },
    comedy: {
      style: "2024 comedy aesthetic: fun, humorous, meme-worthy design that makes viewers laugh and want to share",
      elements: "Include comedy elements: emojis, funny expressions, meme references, and elements that trigger laughter",
      colors: "Use comedy colors: bright yellow, fun orange, cheerful pink, and colors that represent joy and humor"
    },
    travel: {
      style: "2024 travel aesthetic: adventurous, inspiring, wanderlust design that makes viewers want to explore the world",
      elements: "Include travel elements: maps, landmarks, scenic imagery, and elements that represent adventure and discovery",
      colors: "Use travel colors: sky blue, earth green, sunset orange, and colors that represent nature and adventure"
    },
    fitness: {
      style: "2024 fitness aesthetic: energetic, motivational, health-focused design that inspires viewers to take action",
      elements: "Include fitness elements: workout equipment, active poses, health imagery, and elements that motivate",
      colors: "Use fitness colors: energetic green, motivational orange, health blue, and colors that represent vitality and energy"
    },
    beauty: {
      style: "2024 beauty aesthetic: elegant, glamorous, beauty-focused design that makes viewers want to look their best",
      elements: "Include beauty elements: makeup, skincare, fashion, and elements that represent beauty and glamour",
      colors: "Use beauty colors: elegant pink, luxury gold, sophisticated white, and colors that represent beauty and elegance"
    },
    fashion: {
      style: "2024 fashion aesthetic: trendy, stylish, fashion-forward design that sets trends and inspires style",
      elements: "Include fashion elements: clothing, accessories, runway imagery, and elements that represent style and trends",
      colors: "Use fashion colors: trending colors, luxury accents, modern neutrals, and colors that represent current fashion trends"
    }
  };

  const enhancement = categoryEnhancements[category] || categoryEnhancements.entertainment;
  
  // Build the enhanced prompt with expert persona and latest trends
  const enhancedPrompt = `${expertPersona} ${latestTrends} ${baseStyle}. ${prompt}. Style: ${enhancement.style}. Elements: ${enhancement.elements}. Colors: ${enhancement.colors}. Create a thumbnail that would get 10%+ click-through rate and go viral on YouTube. Make it impossible to scroll past without clicking.`;
  
  console.log("🔍 DEBUG: Enhanced prompt for category:", category);
  console.log("🔍 DEBUG: Original prompt:", prompt);
  console.log("🔍 DEBUG: Enhanced prompt:", enhancedPrompt);
  
  return enhancedPrompt;
};

// Special prompt enhancement for refinement/editing existing images
const enhancePromptForRefinement = (prompt, category) => {
  // Expert image editor persona for refinements
  const editorPersona = "You are the world's best image editor and YouTube thumbnail designer. You excel at modifying existing images while maintaining their core appeal and enhancing them with the latest 2024-2025 YouTube thumbnail trends.";
  
  // Refinement-specific guidance
  const refinementGuidance = "Carefully analyze the existing image and make the requested changes while preserving what makes it great. Apply the latest YouTube thumbnail techniques: enhance contrast, improve text readability, add trending elements, and ensure the final result looks like a professional thumbnail that would get high click-through rates.";
  
  // Category-specific refinement tips
  const refinementTips = {
    gaming: "Enhance gaming elements, improve neon effects, add trending gaming symbols, and make it more epic and click-worthy",
    business: "Refine professional elements, improve typography, enhance data visualization, and maintain corporate credibility",
    food: "Enhance food appeal, improve lighting, add appetizing elements, and make it more mouth-watering",
    education: "Improve clarity, enhance visual learning elements, and make complex topics more accessible",
    entertainment: "Add trending elements, enhance pop culture references, and make it more viral-worthy",
    technology: "Enhance futuristic elements, improve digital effects, and make it look more cutting-edge",
    lifestyle: "Enhance aspirational elements, improve visual appeal, and make it more Instagram-worthy",
    news: "Maintain authority, improve headline clarity, and enhance breaking news impact",
    sports: "Enhance energy and action, improve dynamic elements, and make it more exciting",
    music: "Enhance artistic elements, improve emotional impact, and make it more creative",
    comedy: "Enhance humor elements, add trending memes, and make it more shareable",
    travel: "Enhance adventure appeal, improve scenic elements, and make it more inspiring",
    fitness: "Enhance motivational elements, improve energy, and make it more inspiring",
    beauty: "Enhance glamour, improve beauty elements, and make it more aspirational",
    fashion: "Enhance style elements, improve trendiness, and make it more fashion-forward"
  };
  
  const tip = refinementTips[category] || refinementTips.entertainment;
  
  // Build the refinement prompt
  const refinementPrompt = `${editorPersona} ${refinementGuidance} ${tip}. ${prompt}. Make the requested changes while maintaining the image's viral potential and ensuring it follows 2024-2025 YouTube thumbnail best practices. The result should be even more click-worthy than the original.`;
  
  console.log("🔍 DEBUG: Refinement prompt for category:", category);
  console.log("🔍 DEBUG: Original prompt:", prompt);
  console.log("🔍 DEBUG: Refinement prompt:", refinementPrompt);
  
  return refinementPrompt;
};

