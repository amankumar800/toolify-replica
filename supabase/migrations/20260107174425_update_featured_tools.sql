-- Delete existing sample featured tool
DELETE FROM free_ai_tools_featured;

-- Insert real featured tools
INSERT INTO free_ai_tools_featured (name, slug, image_url, description, badge, display_order) VALUES
('ChatGPT', 'chatgpt', 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg', 'Advanced AI chatbot by OpenAI for conversations, writing, coding, and more', 'Popular', 1),
('Midjourney', 'midjourney', 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Midjourney_Emblem.png', 'High-quality AI art generation via Discord', 'Popular', 2),
('Claude', 'claude', 'https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg', 'Anthropic''s AI assistant known for nuanced conversations and long context', 'New', 3),
('GitHub Copilot', 'github-copilot', 'https://github.githubassets.com/images/modules/site/copilot/copilot.png', 'AI pair programmer that suggests code in real-time', 'Popular', 4),
('DALL-E 3', 'dall-e-3', 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg', 'OpenAI''s advanced text-to-image generation model', 'Free', 5),
('ElevenLabs', 'elevenlabs', 'https://elevenlabs.io/favicon.ico', 'AI voice generation and cloning platform', 'New', 6);;
