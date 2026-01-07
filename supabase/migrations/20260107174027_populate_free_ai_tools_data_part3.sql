-- Insert tools for Voice Generation & Conversion
INSERT INTO free_ai_tools_tools (subcategory_id, name, slug, external_url, description, free_tier_details, pricing, category_ids) VALUES
('bdcd474e-4410-4a6d-b397-25a8ee61690e', 'ElevenLabs', 'elevenlabs', 'https://elevenlabs.io', 'AI voice generation and cloning platform', '10,000 characters free monthly', 'Freemium', ARRAY['voice-generation-conversion']),
('bdcd474e-4410-4a6d-b397-25a8ee61690e', 'Murf AI', 'murf-ai', 'https://murf.ai', 'AI voice generator for videos and presentations', '10 minutes free', 'Freemium', ARRAY['voice-generation-conversion']),
('bdcd474e-4410-4a6d-b397-25a8ee61690e', 'Play.ht', 'play-ht', 'https://play.ht', 'AI text-to-speech with realistic voices', '2,500 words free', 'Freemium', ARRAY['voice-generation-conversion']),
('bdcd474e-4410-4a6d-b397-25a8ee61690e', 'Resemble AI', 'resemble-ai', 'https://resemble.ai', 'AI voice cloning and synthesis', 'Free tier available', 'Freemium', ARRAY['voice-generation-conversion']),
('bdcd474e-4410-4a6d-b397-25a8ee61690e', 'Speechify', 'speechify', 'https://speechify.com', 'AI text-to-speech reader for documents', 'Free basic features', 'Freemium', ARRAY['voice-generation-conversion']),

-- Insert tools for Business Management
('139e26f5-4d6d-48f9-a36e-89e9d87566a7', 'Fireflies.ai', 'fireflies-ai', 'https://fireflies.ai', 'AI meeting assistant for transcription and notes', '800 minutes free storage', 'Freemium', ARRAY['business-management']),
('139e26f5-4d6d-48f9-a36e-89e9d87566a7', 'Reclaim AI', 'reclaim-ai', 'https://reclaim.ai', 'AI calendar management and scheduling', 'Free for individuals', 'Freemium', ARRAY['business-management']),
('139e26f5-4d6d-48f9-a36e-89e9d87566a7', 'Motion', 'motion', 'https://usemotion.com', 'AI-powered task and project management', '7-day free trial', 'Paid', ARRAY['business-management']),
('139e26f5-4d6d-48f9-a36e-89e9d87566a7', 'Clockwise', 'clockwise', 'https://clockwise.com', 'AI calendar optimization for teams', 'Free tier available', 'Freemium', ARRAY['business-management']),
('139e26f5-4d6d-48f9-a36e-89e9d87566a7', 'Krisp', 'krisp', 'https://krisp.ai', 'AI noise cancellation for calls', '60 minutes free daily', 'Freemium', ARRAY['business-management']),

-- Insert tools for Music & Audio
('0f491d41-dcbb-494e-9fd7-a7bd9ab30fc2', 'Suno AI', 'suno-ai', 'https://suno.ai', 'AI music generation from text prompts', '50 credits daily', 'Freemium', ARRAY['music-audio']),
('0f491d41-dcbb-494e-9fd7-a7bd9ab30fc2', 'Udio', 'udio', 'https://udio.com', 'AI music creation with vocals and instruments', 'Free tier with credits', 'Freemium', ARRAY['music-audio']),
('0f491d41-dcbb-494e-9fd7-a7bd9ab30fc2', 'AIVA', 'aiva', 'https://aiva.ai', 'AI composer for emotional soundtrack music', 'Free tier with limitations', 'Freemium', ARRAY['music-audio']),
('0f491d41-dcbb-494e-9fd7-a7bd9ab30fc2', 'Soundraw', 'soundraw', 'https://soundraw.io', 'AI music generator for content creators', 'Free preview, paid download', 'Freemium', ARRAY['music-audio']),
('0f491d41-dcbb-494e-9fd7-a7bd9ab30fc2', 'Mubert', 'mubert', 'https://mubert.com', 'AI-generated royalty-free music', 'Free tier available', 'Freemium', ARRAY['music-audio']),
('0f491d41-dcbb-494e-9fd7-a7bd9ab30fc2', 'Boomy', 'boomy', 'https://boomy.com', 'Create and release AI-generated songs', 'Free to create', 'Freemium', ARRAY['music-audio']),

-- Insert tools for AI Detection & Anti-Detection
('bf327da7-5824-4bf3-adb9-aa535d4090d8', 'GPTZero', 'gptzero', 'https://gptzero.me', 'AI content detection for educators', 'Free tier with limits', 'Freemium', ARRAY['ai-detection-anti-detection']),
('bf327da7-5824-4bf3-adb9-aa535d4090d8', 'Originality.ai', 'originality-ai', 'https://originality.ai', 'AI and plagiarism detection tool', 'Pay per scan', 'Paid', ARRAY['ai-detection-anti-detection']),
('bf327da7-5824-4bf3-adb9-aa535d4090d8', 'Copyleaks', 'copyleaks', 'https://copyleaks.com', 'AI content detection and plagiarism checker', 'Free trial available', 'Freemium', ARRAY['ai-detection-anti-detection']),
('bf327da7-5824-4bf3-adb9-aa535d4090d8', 'Undetectable AI', 'undetectable-ai', 'https://undetectable.ai', 'Humanize AI-generated content', 'Free trial available', 'Freemium', ARRAY['ai-detection-anti-detection']),
('bf327da7-5824-4bf3-adb9-aa535d4090d8', 'Winston AI', 'winston-ai', 'https://gowinston.ai', 'AI content detection with high accuracy', 'Free tier available', 'Freemium', ARRAY['ai-detection-anti-detection']);;
