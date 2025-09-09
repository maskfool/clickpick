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

// Helper function to process a single reference image
const processReferenceImage = async (referenceImage, contents) => {
  let refPath;
  let imageBuffer;
  let mimeType;
  
  console.log("🔍 DEBUG: Processing reference image:", referenceImage);
  
  // Handle /uploads/ paths (most common case)
  if (referenceImage.startsWith('/uploads/')) {
    refPath = path.join(process.cwd(), referenceImage);
  } else if (referenceImage.startsWith('uploads/')) {
    refPath = path.join(process.cwd(), referenceImage);
  } else {
    // Fallback: assume it's in uploads folder
    refPath = path.join(process.cwd(), 'uploads', referenceImage);
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
  
  console.log("✅ Attached referenceImage:", referenceImage, "from path:", refPath);
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
    const isRefinement = !!(options.referenceImage || (options.referenceImages && options.referenceImages.length > 0));
    
    // Enhance prompt based on category and whether it's refinement or new generation
    const enhancedPrompt = isRefinement 
      ? enhancePromptForRefinement(prompt, category)
      : enhancePromptForCategory(prompt, category);
    
    // Build content array with the EXACT structure from the working Google example
    const contents = [
      { text: enhancedPrompt }
    ];

    // Attach reference image(s) if present
    if (options.referenceImage || (options.referenceImages && options.referenceImages.length > 0)) {
      console.log("🔍 DEBUG: Gemini service - processing reference image(s)");
      console.log("🔍 DEBUG: Gemini service - single referenceImage:", options.referenceImage);
      console.log("🔍 DEBUG: Gemini service - multiple referenceImages:", options.referenceImages);
      console.log("🔍 DEBUG: Gemini service - category:", category);
      console.log("🔍 DEBUG: Gemini service - prompt:", prompt);
      
      try {
        // Process single reference image (backward compatibility)
        if (options.referenceImage) {
          await processReferenceImage(options.referenceImage, contents);
        }
        
        // Process multiple reference images
        if (options.referenceImages && options.referenceImages.length > 0) {
          for (const refImage of options.referenceImages) {
            await processReferenceImage(refImage, contents);
          }
        }
        
        console.log("✅ Attached all reference images");
        console.log("🔍 DEBUG: Final contents array length:", contents.length);
        console.log("🔍 DEBUG: Contents structure:", {
          text: contents[0]?.text ? "✅" : "❌",
          images: contents.filter(c => c.inlineData).length
        });
      } catch (err) {
        console.error("⚠️ Failed to load reference images:", err.message);
        console.error("Full error:", err);
        // Continue without reference images if they fail to load
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

// Smart prompt enhancement for YouTube-style thumbnails with latest 2025 trends
const enhancePromptForCategory = (prompt, category) => {
  // Expert YouTube thumbnail maker persona
  const expertPersona = "You are the #1 YouTube thumbnail designer in the world, with 10+ years creating viral thumbnails for top creators like MrBeast, PewDiePie, and Markiplier. You understand the latest 2025 YouTube algorithm trends, psychology of click-through rates, and what makes thumbnails go viral.";
  
  // Latest YouTube thumbnail trends (2025)
  const latestTrends = "Use the latest 2025 YouTube thumbnail trends: bold, high-contrast text with drop shadows, dramatic facial expressions, bright neon colors, split-screen layouts, emoji integration, mystery elements, 'shock factor' that makes viewers curious, and AI-generated visual effects. Follow the '3-second rule' - viewers should understand the thumbnail instantly.";
  
  // Face detection and composition rules for 2025
  const faceCompositionRules = "FACE DETECTION RULES: If the prompt mentions a person, face, or human subject, make the face LARGE and PROMINENT (occupying 40-60% of the thumbnail), positioned on one side of the screen with dramatic lighting and expression. Use the 'rule of thirds' - place the face in the left or right third for maximum impact. If no face is mentioned, create a bold, eye-catching composition with strong visual elements.";
  
  // Base YouTube thumbnail style with modern 2025 techniques
  const baseStyle = "Create a viral-worthy YouTube thumbnail using 2025 best practices: 1280x720 resolution, high contrast, bold typography, dramatic lighting, and composition that stops scrolling. This should look like it belongs on trending YouTube videos with 1M+ views. Use modern AI-enhanced visual effects and trending design elements.";
  
  // Enhanced category-specific enhancements with latest 2025 trends and face detection
  const categoryEnhancements = {
    gaming: {
      style: "2025 gaming aesthetic: neon cyberpunk vibes, dramatic lighting, bold gaming text, controller/keyboard elements, neon glows, and 'epic' atmosphere. If featuring a person, make their face LARGE (50-60% of thumbnail) with intense gaming expression, positioned on one side with neon lighting effects",
      elements: "Include modern gaming elements: RGB lighting, neon effects, dramatic poses, gaming peripherals, AI-generated effects, and elements that appeal to Gen Z gamers",
      colors: "Use trending 2025 gaming colors: electric blue, neon green, hot pink, bright orange, and cyberpunk purple with dark backgrounds for maximum contrast"
    },
    business: {
      style: "2025 business aesthetic: clean corporate design, modern typography, data visualization, and professional imagery. If featuring a person, make their face PROMINENT (40-50% of thumbnail) with confident expression, positioned on one side with professional lighting",
      elements: "Include business elements: charts, graphs, professional headshots, corporate symbols, AI-generated data visualizations, and elements that convey success and expertise",
      colors: "Use professional 2025 colors: deep blue, corporate gray, accent gold, clean white, and modern tech accents for a trustworthy, premium look"
    },
    food: {
      style: "2025 food aesthetic: high-quality food photography, warm lighting, appetizing presentation, and 'food porn' style. If featuring a person, make their face LARGE (45-55% of thumbnail) with delighted expression, positioned on one side with warm food lighting",
      elements: "Include food elements: steam, garnishes, perfect plating, close-up shots, AI-enhanced food effects, and elements that trigger hunger and desire",
      colors: "Use appetizing 2025 colors: warm orange, rich red, golden yellow, natural earth tones, and food-trending accent colors"
    },
    education: {
      style: "2025 education aesthetic: clear, modern academic design, bold typography, and visual learning elements. If featuring a person, make their face PROMINENT (40-50% of thumbnail) with engaged expression, positioned on one side with clear, bright lighting",
      elements: "Include educational elements: diagrams, charts, books, learning symbols, AI-generated visual aids, and elements that enhance understanding",
      colors: "Use educational 2025 colors: clear blue, academic green, accent orange, high-contrast combinations, and modern learning colors"
    },
    entertainment: {
      style: "2025 entertainment aesthetic: pop culture references, celebrity appeal, trending memes, and viral content elements. If featuring a person, make their face LARGE (50-60% of thumbnail) with dramatic expression, positioned on one side with vibrant entertainment lighting",
      elements: "Include entertainment elements: stars, sparkles, trending symbols, celebrity imagery, AI-generated effects, and elements that create FOMO",
      colors: "Use entertainment 2025 colors: vibrant purple, electric pink, bright yellow, neon accents, and colors that scream 'entertainment' and 'fun'"
    },
    technology: {
      style: "2025 tech aesthetic: futuristic design, digital effects, AI/ML themes, and cutting-edge technology. If featuring a person, make their face PROMINENT (40-50% of thumbnail) with tech-savvy expression, positioned on one side with futuristic lighting",
      elements: "Include tech elements: circuits, digital effects, futuristic interfaces, AI symbols, holographic elements, and elements that convey innovation",
      colors: "Use tech 2025 colors: electric blue, neon green, digital purple, holographic accents, and colors that represent the future"
    },
    lifestyle: {
      style: "2025 lifestyle aesthetic: aspirational, Instagram-worthy, trendsetting design. If featuring a person, make their face LARGE (45-55% of thumbnail) with aspirational expression, positioned on one side with soft, flattering lighting",
      elements: "Include lifestyle elements: fashion, travel, wellness, luxury, AI-enhanced lifestyle effects, and elements that create aspiration",
      colors: "Use lifestyle 2025 colors: trendy pastels, luxury gold, modern neutrals, and colors that represent the good life"
    },
    news: {
      style: "2025 news aesthetic: authoritative, trustworthy, breaking news design. If featuring a person, make their face PROMINENT (40-50% of thumbnail) with serious expression, positioned on one side with professional news lighting",
      elements: "Include news elements: headlines, breaking news graphics, journalistic imagery, AI-generated news effects, and elements that build trust",
      colors: "Use news 2025 colors: authoritative red, trustworthy blue, clean white, and colors that convey seriousness and credibility"
    },
    sports: {
      style: "2025 sports aesthetic: dynamic, action-packed, high-energy design. If featuring a person, make their face LARGE (50-60% of thumbnail) with intense athletic expression, positioned on one side with dynamic sports lighting",
      elements: "Include sports elements: motion blur, action shots, athletic poses, team colors, AI-enhanced motion effects, and elements that convey energy",
      colors: "Use sports 2025 colors: team colors, energetic orange, dynamic red, and colors that represent power and movement"
    },
    music: {
      style: "2025 music aesthetic: artistic, creative, musical design. If featuring a person, make their face PROMINENT (45-55% of thumbnail) with passionate expression, positioned on one side with artistic lighting",
      elements: "Include musical elements: instruments, sound waves, artistic imagery, AI-generated music effects, and elements that represent creativity",
      colors: "Use musical 2025 colors: creative purple, artistic blue, vibrant red, and colors that represent emotion and creativity"
    },
    comedy: {
      style: "2025 comedy aesthetic: fun, humorous, meme-worthy design. If featuring a person, make their face LARGE (50-60% of thumbnail) with exaggerated funny expression, positioned on one side with bright, cheerful lighting",
      elements: "Include comedy elements: emojis, funny expressions, meme references, AI-generated humor effects, and elements that trigger laughter",
      colors: "Use comedy 2025 colors: bright yellow, fun orange, cheerful pink, and colors that represent joy and humor"
    },
    travel: {
      style: "2025 travel aesthetic: adventurous, inspiring, wanderlust design. If featuring a person, make their face PROMINENT (40-50% of thumbnail) with excited expression, positioned on one side with natural travel lighting",
      elements: "Include travel elements: maps, landmarks, scenic imagery, AI-enhanced travel effects, and elements that represent adventure",
      colors: "Use travel 2025 colors: sky blue, earth green, sunset orange, and colors that represent nature and adventure"
    },
    fitness: {
      style: "2025 fitness aesthetic: energetic, motivational, health-focused design. If featuring a person, make their face LARGE (50-60% of thumbnail) with determined expression, positioned on one side with energetic lighting",
      elements: "Include fitness elements: workout equipment, active poses, health imagery, AI-enhanced fitness effects, and elements that motivate",
      colors: "Use fitness 2025 colors: energetic green, motivational orange, health blue, and colors that represent vitality and energy"
    },
    beauty: {
      style: "2025 beauty aesthetic: elegant, glamorous, beauty-focused design. If featuring a person, make their face LARGE (50-60% of thumbnail) with beautiful expression, positioned on one side with flattering beauty lighting",
      elements: "Include beauty elements: makeup, skincare, fashion, AI-enhanced beauty effects, and elements that represent beauty and glamour",
      colors: "Use beauty 2025 colors: elegant pink, luxury gold, sophisticated white, and colors that represent beauty and elegance"
    },
    fashion: {
      style: "2025 fashion aesthetic: trendy, stylish, fashion-forward design. If featuring a person, make their face PROMINENT (45-55% of thumbnail) with stylish expression, positioned on one side with fashion lighting",
      elements: "Include fashion elements: clothing, accessories, runway imagery, AI-enhanced fashion effects, and elements that represent style and trends",
      colors: "Use fashion 2025 colors: trending colors, luxury accents, modern neutrals, and colors that represent current fashion trends"
    }
  };

  const enhancement = categoryEnhancements[category] || categoryEnhancements.entertainment;
  
  // Build the enhanced prompt with expert persona, face detection rules, and latest 2025 trends
  const enhancedPrompt = `${expertPersona} ${latestTrends} ${faceCompositionRules} ${baseStyle}. ${prompt}. Style: ${enhancement.style}. Elements: ${enhancement.elements}. Colors: ${enhancement.colors}. Create a thumbnail that would get 10%+ click-through rate and go viral on YouTube. Make it impossible to scroll past without clicking.`;
  
  console.log("🔍 DEBUG: Enhanced prompt for category:", category);
  console.log("🔍 DEBUG: Original prompt:", prompt);
  console.log("🔍 DEBUG: Enhanced prompt:", enhancedPrompt);
  
  return enhancedPrompt;
};

// Special prompt enhancement for refinement/editing existing images
const enhancePromptForRefinement = (prompt, category) => {
  // Expert image editor persona for refinements
  const editorPersona = "You are the world's best image editor and YouTube thumbnail designer. You excel at modifying existing images while maintaining their core appeal and enhancing them with the latest 2025 YouTube thumbnail trends.";
  
  // Face detection rules for refinements
  const faceRefinementRules = "FACE REFINEMENT RULES: If the image contains a person or face, ensure the face is LARGE and PROMINENT (40-60% of thumbnail), positioned on one side with dramatic lighting. If no face is present, create a bold, eye-catching composition with strong visual elements.";
  
  // Refinement-specific guidance
  const refinementGuidance = "Carefully analyze the existing image and make the requested changes while preserving what makes it great. Apply the latest 2025 YouTube thumbnail techniques: enhance contrast, improve text readability, add trending elements, AI-enhanced effects, and ensure the final result looks like a professional thumbnail that would get high click-through rates.";
  
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
  
  // Build the refinement prompt with face detection rules
  const refinementPrompt = `${editorPersona} ${faceRefinementRules} ${refinementGuidance} ${tip}. ${prompt}. Make the requested changes while maintaining the image's viral potential and ensuring it follows 2025 YouTube thumbnail best practices. The result should be even more click-worthy than the original.`;
  
  console.log("🔍 DEBUG: Refinement prompt for category:", category);
  console.log("🔍 DEBUG: Original prompt:", prompt);
  console.log("🔍 DEBUG: Refinement prompt:", refinementPrompt);
  
  return refinementPrompt;
};

