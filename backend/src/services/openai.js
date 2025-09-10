// services/openai.js
import OpenAI from "openai";

/**
 * OpenAI initialization
 * Keep this tolerant: if OPENAI_API_KEY missing, we still return sensible fallbacks.
 */
let openai = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log("✅ OpenAI initialized");
  } else {
    console.warn("⚠️ OPENAI_API_KEY not found - AI features will use fallbacks");
  }
} catch (err) {
  console.warn("⚠️ OpenAI init failed:", err.message);
  openai = null;
}

// ----------------------- Shared Thumbnail Presets + Builder -----------------------
const CATEGORY_PRESETS = {
  gaming: {
    archetype: "neon cyberpunk gaming",
    faceSize: "50-60%",
    faceMood: "intense, focused, triumphant",
    composition: "face on right third, dynamic action on left with motion blur",
    elements: "controller, RGB glow, HUD overlays, neon sparks",
    colors: "electric blue, neon green, hot pink, cyberpunk purple",
    vibe: "epic, high-energy, 'can't miss' moment",
  },
  business: {
    archetype: "clean corporate premium",
    faceSize: "40-50%",
    faceMood: "confident, assured",
    composition: "face on left third, data viz / upward graph on right",
    elements: "graph, chart, dollar symbol, polished headshot",
    colors: "deep blue, gray, accent gold, clean white",
    vibe: "trustworthy, expert, 'results-driven'",
  },
  education: {
    archetype: "clear modern academic design",
    faceSize: "40-50%",
    faceMood: "engaged, confident",
    composition: "face on one side, diagrams/text on the other",
    elements: "diagrams, icons, charts, AI visual aids",
    colors: "clear blue, academic green, accent orange",
    vibe: "clear, authoritative, helpful",
  },
  entertainment: {
    archetype: "viral pop-culture entertainment",
    faceSize: "50-60%",
    faceMood: "dramatic, excited",
    composition: "face on one side, pop element on the other",
    elements: "sparkles, stars, trending symbols, celebrity imagery",
    colors: "vibrant purple, electric pink, neon yellow",
    vibe: "fun, viral, high-energy",
  },
  travel: {
    archetype: "adventurous travel & wonder",
    faceSize: "40-50%",
    faceMood: "excited, amazed",
    composition: "face on one side, landmark/vehicle on other",
    elements: "map, landmark, scenic background, suitcase",
    colors: "sky blue, earth green, sunset orange",
    vibe: "wanderlust, inspirational",
  },
  other: {
    archetype: "viral-ready generic",
    faceSize: "45-55%",
    faceMood: "dramatic",
    composition: "face on one side, bold element on other",
    elements: "clear iconography, single focused prop",
    colors: "bright high-contrast palette",
    vibe: "attention-grabbing",
  },
};

// Negative constraints
const NEGATIVES = [
  "no small unreadable text",
  "no cluttered layout",
  "avoid washed-out colors or low contrast",
  "avoid unnatural skin tones",
  "no watermarks or logos",
  "avoid busy backgrounds that hide main subject",
].join(", ");

// Service → logo tokens map (same as googleAI)
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
  firebase: ["Firebase logo"],
  mongodb: ["MongoDB leaf logo"],
  postgres: ["Postgres elephant logo"],
  vercel: ["Vercel logo"],
  netlify: ["Netlify logo"],
  // add more as needed
};

const cleanText = (txt = "") => String(txt || "").trim().replace(/\s{2,}/g, " ");

// Detect services/brands in prompt + options
const detectServiceLogos = (basePrompt = "", options = {}) => {
  const text = `${basePrompt} ${(options.imageStyleHints || "")} ${(options.headlineText || "")}`.toLowerCase();
  const detected = new Set();

  for (const key of Object.keys(SERVICE_LOGOS)) {
    if (text.includes(key)) {
      SERVICE_LOGOS[key].forEach(token => detected.add(token));
    }
  }

  if (Array.isArray(options.explicitLogos)) options.explicitLogos.forEach(l => detected.add(l));
  return Array.from(detected);
};

// Build thumbnail prompt with logos included when detected
const buildThumbnailPrompt = ({
  basePrompt = "",
  category = "other",
  facePresent = false,
  headlineText = "",
  subText = "",
  emotion = "",
  cta = "",
  imageStyleHints = "",
  width = 1280,
  height = 720,
  options = {}
}) => {
  const preset = CATEGORY_PRESETS[category] || CATEGORY_PRESETS.other;
  const size = `${width}x${height}`;

  const detectedLogos = detectServiceLogos(basePrompt, options);
  const logosInstruction = detectedLogos.length
    ? `Include logos/icons: ${detectedLogos.join(", ")}. Place them small but clearly visible near the related prop; ensure logos are legible and not distorted.`
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
    `Output must be ${size} and ready for immediate upload as a high-impact thumbnail.`,
    `Style archetype: ${preset.archetype}. Vibe: ${preset.vibe}. Colors: ${preset.colors}. Elements to include: ${preset.elements}. Composition hint: ${preset.composition}.`,
    FACE_RULE,
    TEXT_INSTRUCTIONS,
    SUBTEXT_INSTRUCTIONS,
    CTA_INSTRUCTION,
    "Use bold, high-contrast typography with heavy drop shadows and outlines so text is readable even on mobile thumbnails. Use dramatic lighting and AI-enhanced effects (glows, particle sparks, subtle chromatic aberration) to increase perceived quality.",
    "Integrate a 'mystery' or 'shock' element that creates curiosity but doesn't mislead. Follow the 3-second rule — the thumbnail must communicate at a glance.",
    logosInstruction,
    `Constraints: ${NEGATIVES}.`,
    basePrompt ? `User instruction: ${basePrompt}.` : "",
    imageStyleHints ? `Image hints: ${imageStyleHints}.` : "",
    "Create 3 strong variants (different color accents, text sizes, and facial crops) and prioritize readability for mobile.",
  ].filter(Boolean).join(" ");

  return composed;
};

// ----------------------- System Prompts -----------------------
const SYSTEM_PROMPTS = {
  "prompt-enhancement": `You are an expert YouTube thumbnail designer and AI prompt engineer. Enhance user prompts into compact, specific instructions that image generation models can execute. Keep enhanced prompt under ~200 words while retaining composition, face rules, colors, text, and logos when present.`,

  "thumbnail-ideas": `You are a creative YouTube thumbnail strategist. Generate bold, A/B-testable thumbnail concepts for the given topic and category.`,

  "edit-suggestions": `You are an expert image editor. Provide 3-5 actionable editing suggestions to improve readability, composition, color, and emotional impact.`,

  "thumbnail-feedback": `You are a YouTube thumbnail optimization expert. Give concise feedback focusing on visual hierarchy, readability, emotional pull, and A/B test ideas.`,

  "prompt-help": `You are an AI prompt engineering teacher. Help users format clear prompts for image generation by breaking down required tokens and showing an example final prompt.`,

  "trending-topics": `You are a YouTube trends analyst. Provide trending topics with short hooks tuned to high CTR thumbnails.`,
};

// ----------------------- Public API functions -----------------------

export const enhancePromptWithAI = async (originalPrompt, category = "other", style = "professional", tone = "neutral", options = {}) => {
  try {
    const opts = options || {};

    const baselinePrompt = buildThumbnailPrompt({
      basePrompt: originalPrompt,
      category,
      facePresent: Boolean(opts.facePresent),
      headlineText: opts.headlineText || "",
      subText: opts.subText || "",
      emotion: opts.emotion || "",
      cta: opts.cta || "",
      imageStyleHints: opts.imageStyleHints || "",
      width: opts.width || 1280,
      height: opts.height || 720,
      options: opts
    });

    if (!openai) {
      return baselinePrompt;
    }

    const systemPrompt = SYSTEM_PROMPTS["prompt-enhancement"];
    const userPrompt = [
      `Original: "${originalPrompt}"`,
      `Category: ${category}`,
      `Style: ${style}`,
      `Tone: ${tone}`,
      `Options: ${JSON.stringify(opts)}`,
      "Produce an enhanced, actionable image generation prompt (<=200 words) based on the baseline below.",
      `Baseline: ${baselinePrompt}`,
    ].join("\n");

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const result = completion.choices?.[0]?.message?.content?.trim();
    return result || baselinePrompt;
  } catch (err) {
    console.error("OpenAI prompt enhancement error:", err);
    return buildThumbnailPrompt({
      basePrompt: originalPrompt,
      category,
      facePresent: Boolean(options?.facePresent),
      headlineText: options?.headlineText || "",
      subText: options?.subText || "",
      emotion: options?.emotion || "",
      cta: options?.cta || "",
      imageStyleHints: options?.imageStyleHints || "",
      width: options?.width || 1280,
      height: options?.height || 720,
      options
    });
  }
};


// Function to chat with AI for various purposes
export const chatWithAI = async (taskType, context) => {
  try {
    // Check if OpenAI is available
    if (!openai) {
      // Return basic responses without AI
      switch (taskType) {
        case 'thumbnail-ideas':
          return `Here are some basic thumbnail ideas for "${context.topic}":
1. Bold text with contrasting background
2. Character or object in focus with dramatic lighting
3. Split-screen comparison layout
4. Emotional facial expression close-up
5. Action shot with dynamic composition
6. Colorful geometric elements with text overlay
7. Before/after transformation
8. Mystery element with question mark or hidden details`;
        case 'edit-suggestions':
          return `Based on your goal "${context.userGoal}", consider:
1. Adjusting brightness and contrast for better visibility
2. Changing color scheme to match your brand
3. Repositioning text elements for better readability
4. Adding or removing background elements
5. Enhancing focal points with shadows or highlights`;
        case 'thumbnail-feedback':
          return `Your thumbnail shows good potential! Consider:
1. Ensuring text is readable at small sizes
2. Using high contrast colors for better visibility
3. Creating a clear focal point
4. Testing different color schemes
5. Adding subtle shadows for depth`;
        case 'prompt-help':
          return `To write an effective prompt for "${context.topic}":
1. Start with the main subject or concept
2. Add specific visual details (colors, style, mood)
3. Include composition preferences (close-up, wide shot, etc.)
4. Specify any text or graphic elements
5. Mention the target audience or purpose`;
        case 'trending-topics':
          return `Current trending topics for great thumbnails:
1. AI and technology breakthroughs
2. Sustainable living and eco-friendly solutions
3. Mental health and wellness tips
4. Creative DIY and craft projects
5. Travel and adventure experiences
6. Financial literacy and investment tips
7. Fitness and nutrition trends
8. Educational content and skill development`;
        default:
          return 'AI features are currently disabled. Please configure your API keys for full functionality.';
      }
    }

    const systemPrompt = SYSTEM_PROMPTS[taskType];
    if (!systemPrompt) {
      throw new Error(`Unknown task type: ${taskType}`);
    }

    let userPrompt = '';
    
    switch (taskType) {
      case 'thumbnail-ideas':
        userPrompt = `Generate thumbnail ideas for:
Topic: ${context.topic}
Category: ${context.category || 'general'}
Target Audience: ${context.targetAudience || 'general viewers'}
Style: ${context.style || 'modern'}

Please provide creative, engaging thumbnail concepts.`;
        break;

      case 'edit-suggestions':
        userPrompt = `Current Image: ${context.currentImage}
User Goal: ${context.userGoal}
Category: ${context.category || 'general'}

What specific editing suggestions would you recommend?`;
        break;

      case 'thumbnail-feedback':
        userPrompt = `Analyze this thumbnail:
Image Description: ${context.imageDescription}
Category: ${context.category}
Target Audience: ${context.targetAudience || 'general'}
Purpose: ${context.purpose || 'informative'}

Provide feedback and improvement suggestions.`;
        break;

      case 'prompt-help':
        userPrompt = `Help me write a prompt for:
Topic: ${context.topic}
Category: ${context.category}
Difficulty Level: ${context.difficulty || 'beginner'}
Specific Elements: ${context.specificElements ? context.specificElements.join(', ') : 'none specified'}

Guide me through writing an effective prompt.`;
        break;

      case 'trending-topics':
        userPrompt = `Find trending topics for:
Category: ${context.category || 'all categories'}
Limit: ${context.limit || 10}

What are the current trending topics that would make great thumbnails?`;
        break;

      default:
        throw new Error(`Unsupported task type: ${taskType}`);
    }

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 500,
      temperature: 0.8,
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI chat error:', error);
    throw new Error(`Failed to complete ${taskType} task`);
  }
};

// Function to get AI-powered thumbnail optimization suggestions
export const getThumbnailOptimization = async (thumbnailData) => {
  try {
    const systemPrompt = `You are a YouTube thumbnail optimization expert. Analyze the thumbnail data and provide specific optimization suggestions to improve click-through rates and engagement.

Focus on:
1. Visual hierarchy and composition
2. Color psychology and contrast
3. Text placement and readability
4. Emotional triggers and curiosity gaps
5. Brand consistency and recognition
6. A/B testing recommendations`;

    const userPrompt = `Analyze this thumbnail and provide optimization suggestions:

Title: ${thumbnailData.title}
Description: ${thumbnailData.description}
Category: ${thumbnailData.category}
Current Prompt: ${thumbnailData.finalPrompt}
Tags: ${thumbnailData.tags?.join(', ') || 'none'}

What specific optimizations would you recommend?`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI optimization error:', error);
    throw new Error('Failed to get thumbnail optimization suggestions');
  }
};

// Function to generate SEO-optimized titles and descriptions
export const generateSEOContent = async (topic, category, targetAudience) => {
  try {
    const systemPrompt = `You are a YouTube SEO expert. Generate SEO-optimized titles and descriptions for YouTube videos that will improve discoverability and click-through rates.

Focus on:
1. Keyword optimization and search intent
2. Compelling and click-worthy titles
3. Detailed descriptions with relevant keywords
4. Call-to-action elements
5. Category-specific optimization strategies`;

    const userPrompt = `Generate SEO-optimized content for:

Topic: ${topic}
Category: ${category}
Target Audience: ${targetAudience || 'general'}

Please provide:
1. 3 optimized video titles
2. 1 detailed video description
3. 10 relevant tags/keywords
4. SEO optimization tips`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 600,
      temperature: 0.8,
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI SEO content error:', error);
    throw new Error('Failed to generate SEO content');
  }
};
