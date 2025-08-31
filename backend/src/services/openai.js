import OpenAI from 'openai';

// Initialize OpenAI only if API key is available
let openai = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  console.log('OpenAI not configured - AI features will be disabled');
}

// System prompts for different AI tasks
const SYSTEM_PROMPTS = {
  'prompt-enhancement': `You are an expert YouTube thumbnail designer and AI prompt engineer. Your job is to enhance user prompts to create better, more detailed prompts for AI image generation.

Key principles:
1. Make prompts specific and detailed
2. Include visual elements, colors, composition, and style
3. Optimize for YouTube thumbnail appeal
4. Consider the category context
5. Keep the enhanced prompt under 200 words

Format your response as a clean, enhanced prompt that can be directly used for image generation.`,

  'thumbnail-ideas': `You are a creative YouTube thumbnail strategist. Generate innovative thumbnail ideas that will increase click-through rates.

Consider:
1. Visual impact and attention-grabbing elements
2. Emotional triggers and curiosity gaps
3. Category-specific design trends
4. Target audience preferences
5. Current design trends

Provide 5-8 specific thumbnail concepts with brief descriptions.`,

  'edit-suggestions': `You are an expert image editor and AI prompt engineer. Analyze the current image and user goal to provide specific editing suggestions.

Focus on:
1. Specific visual changes needed
2. Technical prompt improvements
3. Style and composition adjustments
4. Color and lighting modifications
5. Element positioning and sizing

Provide 3-5 actionable editing suggestions.`,

  'thumbnail-feedback': `You are a YouTube thumbnail optimization expert. Analyze the thumbnail description and provide constructive feedback.

Evaluate:
1. Visual appeal and click-worthiness
2. Brand consistency and recognition
3. Target audience alignment
4. Technical quality and readability
5. Competitive positioning

Provide specific, actionable feedback with improvement suggestions.`,

  'prompt-help': `You are an AI prompt engineering expert specializing in image generation. Help users write effective prompts for their specific needs.

Focus on:
1. Clear, descriptive language
2. Technical specifications
3. Style and mood indicators
4. Composition and layout details
5. Category-specific elements

Provide step-by-step guidance and example prompts.`,

  'trending-topics': `You are a YouTube trends analyst. Identify current trending topics and themes that would make compelling thumbnails.

Consider:
1. Current viral content and memes
2. Seasonal and timely themes
3. Emerging trends in various categories
4. Audience engagement patterns
5. Content creator opportunities

Provide 8-12 trending topics with brief descriptions.`
};

// Function to enhance prompts with AI
export const enhancePromptWithAI = async (originalPrompt, category, style, tone) => {
  try {
    // Check if OpenAI is available
    if (!openai) {
      // Return a basic enhanced prompt without AI
      return `${originalPrompt}, ${category || 'general'} style, professional YouTube thumbnail, high quality, eye-catching, 1280x720`;
    }

    const systemPrompt = SYSTEM_PROMPTS['prompt-enhancement'];
    
    const userPrompt = `Enhance this prompt for AI image generation:

Original Prompt: "${originalPrompt}"
Category: ${category || 'general'}
Style: ${style || 'professional'}
Tone: ${tone || 'neutral'}

Please create an enhanced, detailed prompt that will generate a high-quality YouTube thumbnail image. Focus on visual elements, composition, colors, and style that will make the thumbnail stand out.`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to enhance prompt with AI');
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
