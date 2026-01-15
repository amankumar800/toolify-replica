-- Migration: Seed initial platform data for known tools
-- Purpose: Populate platform flags for tools we know have apps/extensions/Discord
-- Part of: Apps Filter Implementation

-- Known tools with mobile apps (iOS/Android)
-- ChatGPT, Notion, Perplexity, Gemini, Claude, Poe all have official mobile apps
UPDATE tools SET has_mobile_app = true WHERE slug IN (
  'chatgpt',
  'notion-ai', 
  'perplexity',
  'gemini',
  'claude',
  'poe',
  'character-ai',
  'replika',
  'bing-chat',
  'you-com'
);

-- Known tools with browser extensions (Chrome/Firefox)
-- These have official browser extensions for enhanced productivity
UPDATE tools SET has_browser_extension = true WHERE slug IN (
  'chatgpt',
  'grammarly',
  'perplexity',
  'jasper',
  'quillbot',
  'compose-ai',
  'writesonic',
  'copy-ai',
  'gemini'
);

-- Known tools with Discord bots/integration
-- These primarily operate through Discord
UPDATE tools SET has_discord_bot = true WHERE slug IN (
  'midjourney',
  'leonardo-ai',
  'stable-diffusion'
);

-- Log the update counts for verification
DO $$
DECLARE
  app_count INTEGER;
  ext_count INTEGER;
  discord_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO app_count FROM tools WHERE has_mobile_app = true;
  SELECT COUNT(*) INTO ext_count FROM tools WHERE has_browser_extension = true;
  SELECT COUNT(*) INTO discord_count FROM tools WHERE has_discord_bot = true;
  
  RAISE NOTICE 'Platform data seeded: % mobile apps, % extensions, % Discord bots', 
    app_count, ext_count, discord_count;
END $$;
