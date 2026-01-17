-- Migration: Insert AI Mobile Apps Data
-- Purpose: Add popular AI mobile apps to the tools table
-- Date: 2026-01-17
-- Part of: Apps Filter Implementation

-- First, update any existing tools that have official mobile apps
UPDATE tools 
SET platform = 'app'
WHERE slug IN (
  'chatgpt',
  'claude',
  'gemini',
  'perplexity',
  'poe',
  'character-ai',
  'replika',
  'microsoft-copilot',
  'you-com'
) AND platform = 'web';

-- Insert new AI mobile apps that don't exist yet
INSERT INTO tools (
  name,
  slug,
  short_description,
  long_description,
  website_url,
  pricing,
  status,
  platform,
  is_new,
  image_url
) VALUES
-- ChatGPT Mobile (if not exists)
(
  'ChatGPT',
  'chatgpt-mobile',
  'Official ChatGPT mobile app by OpenAI with voice conversations, image generation, and GPT-4 access.',
  'The official ChatGPT mobile app brings the power of OpenAI''s AI assistant to your phone. Features voice conversations, image generation with DALL-E, GPT-4 access for subscribers, conversation history sync, and a clean mobile-optimized interface.',
  'https://chat.openai.com',
  'Freemium',
  'published',
  'app',
  false,
  'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg'
),
-- Claude Mobile
(
  'Claude Mobile',
  'claude-mobile',
  'Official Anthropic Claude AI assistant app for iOS and Android with advanced reasoning capabilities.',
  'Claude Mobile is the official mobile app for Anthropic''s AI assistant. Enjoy Claude''s advanced reasoning, long context conversations, coding help, and creative writing assistance on the go. Sync conversations across devices.',
  'https://claude.ai',
  'Freemium',
  'published',
  'app',
  false,
  'https://upload.wikimedia.org/wikipedia/commons/8/8a/Claude_AI_logo.svg'
),
-- Google Gemini
(
  'Google Gemini',
  'gemini-mobile',
  'Google''s AI assistant app with multimodal capabilities, image understanding, and Google integration.',
  'Google Gemini (formerly Bard) is Google''s most capable AI assistant. Features multimodal understanding, image analysis, seamless Google Workspace integration, coding assistance, and access to Gemini Ultra for Pro subscribers.',
  'https://gemini.google.com',
  'Freemium',
  'published',
  'app',
  false,
  'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg'
),
-- Microsoft Copilot
(
  'Microsoft Copilot',
  'copilot-mobile',
  'Microsoft''s AI assistant with GPT-4 access, image generation, and Microsoft 365 integration.',
  'Microsoft Copilot brings GPT-4 powered AI to your mobile device. Create images with DALL-E 3, get coding help, summarize documents, and integrate seamlessly with Microsoft 365. Available for iOS and Android.',
  'https://copilot.microsoft.com',
  'Free',
  'published',
  'app',
  false,
  'https://upload.wikimedia.org/wikipedia/commons/2/2a/Microsoft_365_Copilot_Icon.svg'
),
-- Perplexity AI
(
  'Perplexity AI',
  'perplexity-mobile',
  'AI-powered answer engine with real-time web search, citations, and follow-up questions.',
  'Perplexity AI is an AI-powered search engine that provides direct answers with citations. Features real-time web search, follow-up questions, focus modes for specific domains, and a clean mobile interface. Pro tier includes GPT-4 and Claude access.',
  'https://perplexity.ai',
  'Freemium',
  'published',
  'app',
  false,
  NULL
),
-- Poe by Quora
(
  'Poe',
  'poe-mobile',
  'Multi-bot AI platform with access to ChatGPT, Claude, Gemini, and more in one app.',
  'Poe by Quora provides access to multiple AI models including GPT-4, Claude, Gemini Pro, Llama, and custom bots. Create your own bots, share conversations, and switch between models. One subscription, many AIs.',
  'https://poe.com',
  'Freemium',
  'published',
  'app',
  false,
  NULL
),
-- Character.AI
(
  'Character.AI',
  'character-ai-mobile',
  'Create and chat with AI characters for entertainment, roleplay, learning, and companionship.',
  'Character.AI lets you create and interact with AI personalities. Chat with historical figures, fictional characters, language tutors, or create your own. Features voice calls, group chats, and character creation tools.',
  'https://character.ai',
  'Freemium',
  'published',
  'app',
  false,
  NULL
),
-- Replika
(
  'Replika',
  'replika-mobile',
  'AI companion app for emotional support, conversations, and personal growth.',
  'Replika is an AI companion that learns your personality and interests. Have meaningful conversations, track your mood, practice mindfulness, and develop a unique relationship with your AI friend. Video calls available for Pro subscribers.',
  'https://replika.com',
  'Freemium',
  'published',
  'app',
  false,
  NULL
),
-- Pi by Inflection
(
  'Pi',
  'pi-mobile',
  'Personal AI assistant designed for natural, empathetic conversations on any topic.',
  'Pi (Personal Intelligence) by Inflection AI is designed for natural, supportive conversations. Known for its empathetic communication style, Pi helps with advice, learning, brainstorming, and everyday tasks through voice or text.',
  'https://pi.ai',
  'Free',
  'published',
  'app',
  false,
  NULL
),
-- Otter.ai
(
  'Otter.ai',
  'otter-ai-mobile',
  'AI meeting transcription app that records, transcribes, and summarizes meetings in real-time.',
  'Otter.ai transforms how you capture meetings. Real-time transcription, speaker identification, automatic summaries, and searchable notes. Integrates with Zoom, Google Meet, and Microsoft Teams. Essential for professionals.',
  'https://otter.ai',
  'Freemium',
  'published',
  'app',
  false,
  NULL
),
-- ELSA Speak
(
  'ELSA Speak',
  'elsa-speak-mobile',
  'AI-powered English pronunciation coach with speech recognition and personalized feedback.',
  'ELSA uses AI speech recognition to help you perfect your English pronunciation. Get instant feedback on your accent, practice with thousands of lessons, and track your progress. Used by millions worldwide.',
  'https://elsaspeak.com',
  'Freemium',
  'published',
  'app',
  false,
  NULL
),
-- Lensa AI
(
  'Lensa AI',
  'lensa-ai-mobile',
  'AI photo editor with magic avatars, portrait enhancement, and background editing.',
  'Lensa AI creates stunning AI-generated avatars from your selfies. Features professional portrait retouching, background blur, skin smoothing, and artistic filters. Made viral by its Magic Avatars feature.',
  'https://prisma-ai.com/lensa',
  'Freemium',
  'published',
  'app',
  false,
  NULL
),
-- Remini
(
  'Remini',
  'remini-mobile',
  'AI photo enhancer that restores old photos, upscales images, and improves portrait quality.',
  'Remini uses AI to enhance and restore photos. Unblur faces, upscale low-resolution images, colorize old black-and-white photos, and create AI portraits. Over 100 million users trust Remini.',
  'https://remini.ai',
  'Freemium',
  'published',
  'app',
  false,
  NULL
),
-- Photomath
(
  'Photomath',
  'photomath-mobile',
  'AI math solver that solves problems step-by-step from photos with detailed explanations.',
  'Photomath is the world''s most used math learning app. Point your camera at a math problem and get instant solutions with step-by-step explanations. Covers basic math through calculus. Learn, don''t just copy.',
  'https://photomath.com',
  'Freemium',
  'published',
  'app',
  false,
  NULL
),
-- Be My Eyes
(
  'Be My Eyes',
  'be-my-eyes-mobile',
  'AI-powered visual assistance app helping blind and low-vision users understand their surroundings.',
  'Be My Eyes connects blind and low-vision users with sighted volunteers and AI assistance. The new Be My AI feature provides instant visual descriptions. Read labels, navigate spaces, and get help 24/7.',
  'https://bemyeyes.com',
  'Free',
  'published',
  'app',
  false,
  NULL
),
-- Socratic by Google
(
  'Socratic by Google',
  'socratic-mobile',
  'AI homework helper for students covering math, science, history, and more subjects.',
  'Socratic by Google helps students understand homework problems. Take a photo of any question and get step-by-step explanations, videos, and learning resources. Covers math, science, literature, and social studies.',
  'https://socratic.org',
  'Free',
  'published',
  'app',
  false,
  NULL
)
ON CONFLICT (slug) DO UPDATE SET
  platform = EXCLUDED.platform,
  short_description = EXCLUDED.short_description,
  long_description = EXCLUDED.long_description,
  status = EXCLUDED.status;

-- Log the result
DO $$
DECLARE
  app_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO app_count FROM tools WHERE platform = 'app' AND status = 'published';
  RAISE NOTICE 'Total mobile apps in database: %', app_count;
END $$;
