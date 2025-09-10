// services/googleAI.js
import { GoogleGenAI } from "@google/genai";
import mime from "mime";
import fs from "fs/promises";
import path from "path";
import { uploadToUploadThing } from "./uploadthing.js";

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
    // Backward-compatible: some callers pass only (prompt, category) so options may be undefined
    const enhancedPrompt = isRefinement 
      ? enhancePromptForRefinement(prompt, category, options)
      : enhancePromptForCategory(prompt, category, options);
    
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

    let variants = [];
    let index = 0;

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        const mimeType = part.inlineData.mimeType || "image/png";
        const buffer = Buffer.from(part.inlineData.data, "base64");

        const filename = `ai-${Date.now()}-${index}.${mime.getExtension(mimeType)}`;
        
        try {
          // Upload to UploadThing instead of local storage
          const uploadResult = await uploadToUploadThing(buffer, filename, mimeType);
          
          variants.push({
            url: uploadResult.url,
            key: uploadResult.key,
            mimeType,
            ext: mime.getExtension(mimeType),
          });
        } catch (uploadError) {
          console.error("❌ Failed to upload to UploadThing:", uploadError);
          // Fallback to local storage if UploadThing fails
          const uploadPath = process.env.UPLOAD_PATH || "./uploads";
          await fs.mkdir(uploadPath, { recursive: true });
          const filePath = path.join(uploadPath, filename);
          await fs.writeFile(filePath, buffer);
          
          variants.push({
            url: `/uploads/${filename}`,
            mimeType,
            ext: mime.getExtension(mimeType),
          });
        }

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

// ---------------- NEW: Service Logo Detection & Prompt Enhancement ----------------

// Map keywords to service/logo tokens we want to include in thumbnails
const SERVICE_LOGOS = {
  aws: ["AWS logo", "Amazon Web Services badge"],
  amazon: ["Amazon logo", "AWS logo"],
  google: ["Google logo", "GCP logo", "Google Cloud logo"],
  gcp: ["GCP logo", "Google Cloud logo"],
  azure: ["Microsoft Azure logo", "Azure logo"],
  stripe: ["Stripe logo"],
  paypal: ["PayPal logo"],
  upi: ["UPI logo", "UPI apps icons"],
  paytm: ["Paytm logo"],
  youtube: ["YouTube logo"],
  openai: ["OpenAI logo", "ChatGPT icon"],
  spotify: ["Spotify logo"],
  slack: ["Slack logo"],
  firebase: ["Firebase logo"],
  mongodb: ["MongoDB leaf logo"],
  postgres: ["Postgres elephant logo"],
  nginx: ["NGINX logo"],
  vercel: ["Vercel logo"],
  netlify: ["Netlify logo"],
  // add more as needed
};

// Small utility to clean user headline text
const cleanText = (txt = "") => String(txt).trim().replace(/\s{2,}/g, " ");

// Detect services mentioned in prompt/options and return a comma-separated list etc.
const detectServiceLogos = (basePrompt = "", options = {}) => {
  const text = `${basePrompt} ${(options.imageStyleHints || "")} ${(options.headlineText || "")}`.toLowerCase();
  const detected = new Set();

  for (const key of Object.keys(SERVICE_LOGOS)) {
    if (text.includes(key)) {
      SERVICE_LOGOS[key].forEach(token => detected.add(token));
    }
  }

  // Also check options.explicitLogos (caller can pass explicit list)
  if (Array.isArray(options.explicitLogos)) {
    options.explicitLogos.forEach(l => detected.add(l));
  }

  return Array.from(detected); // e.g. ["AWS logo", "Google logo"]
};

// Universal category presets (based on your earlier categories + observed trends)
const CATEGORY_PRESETS = {
  gaming: {
    archetype: "neon cyberpunk gaming",
    faceSize: "50-60%",
    faceMood: "intense, focused, triumphant",
    composition: "face on right third, dynamic action on left with motion blur",
    elements: "controller, RGB glow, HUD overlays, neon sparks",
    colors: "electric blue, neon green, hot pink, cyberpunk purple",
    vibe: "epic, high-energy, 'can't miss' moment"
  },
  business: {
    archetype: "clean corporate premium",
    faceSize: "40-50%",
    faceMood: "confident, assured",
    composition: "face on left third, data viz / upward graph on right",
    elements: "graph, chart, dollar symbol, polished headshot",
    colors: "deep blue, gray, accent gold, clean white",
    vibe: "trustworthy, expert, 'results-driven'"
  },
  food: {
    archetype: "appetizing close-up food photography",
    faceSize: "45-55%",
    faceMood: "delighted, satisfied",
    composition: "large close-up of food with face reacting on side",
    elements: "steam, garnish, close-up texture, glossy highlights",
    colors: "warm orange, rich red, golden yellow, earth tones",
    vibe: "mouth-watering, irresistible"
  },
  education: {
    archetype: "clear modern academic design",
    faceSize: "40-50%",
    faceMood: "engaged, confident",
    composition: "face on one side, diagrams/text on the other",
    elements: "diagrams, icons, charts, AI visual aids",
    colors: "clear blue, academic green, accent orange",
    vibe: "clear, authoritative, helpful"
  },
  entertainment: {
    archetype: "viral pop-culture entertainment",
    faceSize: "50-60%",
    faceMood: "dramatic, excited",
    composition: "face on one side, pop element on the other",
    elements: "sparkles, stars, trending symbols, celebrity imagery",
    colors: "vibrant purple, electric pink, neon yellow",
    vibe: "fun, viral, high-energy"
  },
  technology: {
    archetype: "futuristic tech & AI",
    faceSize: "40-50%",
    faceMood: "curious, tech-savvy",
    composition: "face on one side, holographic UI on the other",
    elements: "circuits, holograms, AI/ML icons, subtle grids",
    colors: "electric blue, neon green, digital purple",
    vibe: "innovative, cutting-edge"
  },
  lifestyle: {
    archetype: "aspirational instagram-worthy",
    faceSize: "45-55%",
    faceMood: "happy, aspirational",
    composition: "face on one side, lifestyle scene on other",
    elements: "fashion/accessories, travel, luxury cues",
    colors: "trendy pastels, luxury gold, modern neutrals",
    vibe: "aspirational, stylish"
  },
  news: {
    archetype: "authoritative breaking news",
    faceSize: "40-50%",
    faceMood: "serious, concerned",
    composition: "face on one side, headline/block on other",
    elements: "breaking-badge, headline strip, newsroom elements",
    colors: "authoritative red, trustworthy blue, clean white",
    vibe: "urgent, credible"
  },
  sports: {
    archetype: "dynamic action sports",
    faceSize: "50-60%",
    faceMood: "intense, determined",
    composition: "face on side, action/motion on other",
    elements: "motion blur, ball/gear, team colors",
    colors: "energetic orange, dynamic red, team colors",
    vibe: "high-energy, competitive"
  },
  music: {
    archetype: "artistic musical energy",
    faceSize: "45-55%",
    faceMood: "passionate, intense",
    composition: "face on side, instrument/notes on other",
    elements: "sound waves, instruments, stage lights",
    colors: "creative purple, artistic blue, vibrant red",
    vibe: "emotional, creative"
  },
  comedy: {
    archetype: "bright meme-ready comedy",
    faceSize: "50-60%",
    faceMood: "exaggerated, silly",
    composition: "face large with exaggerated expression",
    elements: "emojis, meme overlays, funny props",
    colors: "bright yellow, fun orange, cheerful pink",
    vibe: "joyful, shareable"
  },
  travel: {
    archetype: "adventurous travel & wonder",
    faceSize: "40-50%",
    faceMood: "excited, amazed",
    composition: "face on one side, landmark/vehicle on other",
    elements: "map, landmark, scenic background, suitcase",
    colors: "sky blue, earth green, sunset orange",
    vibe: "wanderlust, inspirational"
  },
  fitness: {
    archetype: "motivational fitness energy",
    faceSize: "50-60%",
    faceMood: "determined, focused",
    composition: "face on side, action/movement on other",
    elements: "workout gear, sweat, motion effects",
    colors: "energetic green, motivational orange, health blue",
    vibe: "empowering, active"
  },
  beauty: {
    archetype: "glamorous beauty close-up",
    faceSize: "50-60%",
    faceMood: "confident, flawless",
    composition: "face large with soft flattering light",
    elements: "makeup close-up, smooth skin retouch",
    colors: "elegant pink, luxury gold, sophisticated white",
    vibe: "glamour, aspiration"
  },
  fashion: {
    archetype: "trendy fashion-forward",
    faceSize: "45-55%",
    faceMood: "stylish, confident",
    composition: "face on side, outfit/pose on other",
    elements: "runway cues, accessories, bold typography",
    colors: "trending colors, luxury accents, modern neutrals",
    vibe: "stylish, editorial"
  },
  other: {
    archetype: "viral-ready generic",
    faceSize: "45-55%",
    faceMood: "dramatic",
    composition: "face on one side, bold element on other",
    elements: "clear iconography, single focused prop",
    colors: "bright high-contrast palette",
    vibe: "attention-grabbing"
  }
};

// Negative constraints to prevent common failures
const NEGATIVES = [
  "no small unreadable text",
  "no cluttered layout",
  "avoid washed-out colors or low contrast",
  "avoid unnatural skin tones",
  "no watermarks or logos",
  "avoid busy backgrounds that hide main subject"
].join(", ");

// Build a consistent thumbnail prompt from tokens (now includes detected logos)
const buildThumbnailPrompt = ({
  basePrompt,
  category = "entertainment",
  facePresent = false,
  headlineText = "",
  subText = "",
  emotion = "",          // e.g. "shocked", "delighted", "angry"
  cta = "",              // optional CTA text: "Watch Now", "Don't Miss"
  imageStyleHints = "",  // any extra hints from user e.g. "use my sample image"
  size = "1280x720",
  options = {}
}) => {
  const preset = CATEGORY_PRESETS[category] || CATEGORY_PRESETS["other"];

  // detect logos and add to hints
  const detectedLogos = detectServiceLogos(basePrompt, options);
  const logosInstruction = detectedLogos.length
    ? `Include these service logos/icons: ${detectedLogos.join(", ")}. Place them small but clearly visible in a corner or near related prop; ensure logos are legible and not distorted.`
    : "";

  const FACE_RULE = facePresent
    ? `IF FACE: Place face LARGE (${preset.faceSize}) occupying the left OR right third. Expression: ${emotion || preset.faceMood}. Dramatic lighting, high contrast, slight vignette.`
    : "No face: create a bold, high-contrast central focal point with strong shapes and AI-enhanced effects.";

  const TEXT_INSTRUCTIONS = headlineText
    ? `Primary headline text (big, readable): "${cleanText(headlineText)}" — place as a 2-line max, very bold, with heavy drop shadow and outline for legibility.`
    : "No primary headline text required.";

  const SUBTEXT_INSTRUCTIONS = subText
    ? `Secondary text (small): "${cleanText(subText)}" — keep <30% width, high contrast, simple font.`
    : "";

  const CTA_INSTRUCTION = cta ? `Add a small CTA badge: "${cleanText(cta)}" placed top-left or bottom-right.` : "";

  const composed = [
    "You are the #1 YouTube thumbnail creator: produce a thumbnail that is 'scroll-stopping' and optimized for maximum CTR on YouTube in 2025.",
    `Output must be sized ${size} and ready for immediate upload as a high-impact thumbnail.`,
    `Style archetype: ${preset.archetype}. Vibe: ${preset.vibe}. Colors: ${preset.colors}. Elements to include: ${preset.elements}. Composition hint: ${preset.composition}.`,
    FACE_RULE,
    TEXT_INSTRUCTIONS,
    SUBTEXT_INSTRUCTIONS,
    CTA_INSTRUCTION,
    "Use bold, high-contrast typography with heavy drop shadows and outlines so text is readable even on mobile thumbnails. Use dramatic lighting and AI-enhanced effects (glows, particle sparks, subtle chromatic aberration) to increase perceived quality.",
    "Integrate a 'mystery' or 'shock' element that creates curiosity but doesn't mislead. Keep designs consistent with top creators (large faces, one bold headline, simple readable layout). Follow the 3-second rule — the thumbnail must communicate at a glance.",
    logosInstruction,
    `Constraints: ${NEGATIVES}.`,
    basePrompt ? `User request / instruction: ${basePrompt}.` : "",
    imageStyleHints ? `Image hints: ${imageStyleHints}.` : "",
    "Return only image content (do not include generation metadata in the image). Create 3 strong variants (different color accents, text sizes, and facial crops) and prioritize readability for mobile."
  ].filter(Boolean).join(" ");

  console.log("🔍 DEBUG: Built thumbnail prompt:", composed.slice(0, 350), "...");
  return composed;
};

// Backward-compatible enhancePromptForCategory
const enhancePromptForCategory = (prompt, category = "entertainment", options = {}) => {
  // allow callers that only pass (prompt, category)
  const opts = options || {};
  const enhanced = buildThumbnailPrompt({
    basePrompt: prompt,
    category,
    facePresent: Boolean(opts.facePresent || /face|me|I |person|human/i.test(prompt)),
    headlineText: opts.headlineText || "",
    subText: opts.subText || "",
    emotion: opts.emotion || "",
    cta: opts.cta || "",
    imageStyleHints: opts.imageStyleHints || "",
    size: `${opts.width || 1280}x${opts.height || 720}`,
    options: opts
  });

  console.log("🔍 DEBUG: enhancePromptForCategory =>", { category, options: opts });
  return enhanced;
};

// Backward-compatible enhancePromptForRefinement
const enhancePromptForRefinement = (prompt, category = "entertainment", options = {}) => {
  const opts = options || {};
  const preservation = "Preserve the original photo's core content and likeness. Improve contrast, crop for face prominence if needed, retouch skin subtly, enhance expression clarity, and increase text readability without obscuring important areas.";
  const refinementHints = opts.refinementHints || "Enhance contrast, remove noise, refine eyes and mouth for stronger emotion, add subtle glow to main subject.";

  const enhanced = buildThumbnailPrompt({
    basePrompt: `${preservation} ${refinementHints} ${prompt}`,
    category,
    facePresent: Boolean(opts.facePresent || /face|person|self|me/i.test(prompt)),
    headlineText: opts.headlineText || "",
    subText: opts.subText || "",
    emotion: opts.emotion || "",
    cta: opts.cta || "",
    imageStyleHints: `Use provided reference images as the visual base; prioritize face crop and lighting. ${opts.imageStyleHints || ""}`,
    size: `${opts.width || 1280}x${opts.height || 720}`,
    options: opts
  });

  console.log("🔍 DEBUG: enhancePromptForRefinement =>", { category, options: opts });
  return enhanced;
};