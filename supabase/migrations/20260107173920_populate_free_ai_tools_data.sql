-- Insert tools for Chatbots & Virtual Companions
INSERT INTO free_ai_tools_tools (subcategory_id, name, slug, external_url, description, free_tier_details, pricing, category_ids) VALUES
('f30596bb-21af-4d3c-8b75-a1fc354937f0', 'ChatGPT', 'chatgpt', 'https://chat.openai.com', 'Advanced AI chatbot by OpenAI for conversations, writing, coding, and more', 'Free tier with GPT-3.5, limited GPT-4 access', 'Freemium', ARRAY['chatbots-virtual-companions']),
('f30596bb-21af-4d3c-8b75-a1fc354937f0', 'Claude', 'claude', 'https://claude.ai', 'Anthropic''s AI assistant known for nuanced conversations and long context', 'Free tier with daily message limits', 'Freemium', ARRAY['chatbots-virtual-companions']),
('f30596bb-21af-4d3c-8b75-a1fc354937f0', 'Google Gemini', 'google-gemini', 'https://gemini.google.com', 'Google''s multimodal AI chatbot with web search integration', 'Free access to Gemini Pro', 'Freemium', ARRAY['chatbots-virtual-companions']),
('f30596bb-21af-4d3c-8b75-a1fc354937f0', 'Microsoft Copilot', 'microsoft-copilot', 'https://copilot.microsoft.com', 'AI assistant powered by GPT-4 with Bing search integration', 'Free with Microsoft account', 'Free', ARRAY['chatbots-virtual-companions']),
('f30596bb-21af-4d3c-8b75-a1fc354937f0', 'Perplexity AI', 'perplexity-ai', 'https://perplexity.ai', 'AI-powered search engine with conversational interface and citations', 'Free tier with limited Pro searches', 'Freemium', ARRAY['chatbots-virtual-companions']),
('f30596bb-21af-4d3c-8b75-a1fc354937f0', 'Character.AI', 'character-ai', 'https://character.ai', 'Create and chat with AI characters and personalities', 'Free unlimited chats', 'Freemium', ARRAY['chatbots-virtual-companions']),

-- Insert tools for Office & Productivity
('09347a92-aa16-4f99-8c3c-f940e8bc4306', 'Notion AI', 'notion-ai', 'https://notion.so', 'AI-powered workspace for notes, docs, and project management', 'Limited free AI features', 'Freemium', ARRAY['office-productivity']),
('09347a92-aa16-4f99-8c3c-f940e8bc4306', 'Otter.ai', 'otter-ai', 'https://otter.ai', 'AI meeting transcription and note-taking assistant', '300 minutes free per month', 'Freemium', ARRAY['office-productivity']),
('09347a92-aa16-4f99-8c3c-f940e8bc4306', 'Gamma', 'gamma', 'https://gamma.app', 'AI-powered presentation and document creator', '400 free credits', 'Freemium', ARRAY['office-productivity']),
('09347a92-aa16-4f99-8c3c-f940e8bc4306', 'Tome', 'tome', 'https://tome.app', 'AI storytelling and presentation tool', 'Free tier with limited features', 'Freemium', ARRAY['office-productivity']),
('09347a92-aa16-4f99-8c3c-f940e8bc4306', 'Coda AI', 'coda-ai', 'https://coda.io', 'AI-enhanced collaborative documents and workflows', 'Free tier available', 'Freemium', ARRAY['office-productivity']),

-- Insert tools for Image Generation & Editing
('ada6f565-c8b0-446c-b7f4-37930b063220', 'DALL-E 3', 'dall-e-3', 'https://openai.com/dall-e-3', 'OpenAI''s advanced text-to-image generation model', 'Free via Bing Image Creator', 'Freemium', ARRAY['image-generation-editing']),
('ada6f565-c8b0-446c-b7f4-37930b063220', 'Midjourney', 'midjourney', 'https://midjourney.com', 'High-quality AI art generation via Discord', 'Limited free trial', 'Paid', ARRAY['image-generation-editing']),
('ada6f565-c8b0-446c-b7f4-37930b063220', 'Stable Diffusion', 'stable-diffusion', 'https://stability.ai', 'Open-source image generation model', 'Free and open source', 'Free', ARRAY['image-generation-editing']),
('ada6f565-c8b0-446c-b7f4-37930b063220', 'Leonardo AI', 'leonardo-ai', 'https://leonardo.ai', 'AI image generation with fine-tuned models for games and art', '150 free tokens daily', 'Freemium', ARRAY['image-generation-editing']),
('ada6f565-c8b0-446c-b7f4-37930b063220', 'Canva AI', 'canva-ai', 'https://canva.com', 'Design platform with AI image generation and editing', 'Free tier with limited AI features', 'Freemium', ARRAY['image-generation-editing']),
('ada6f565-c8b0-446c-b7f4-37930b063220', 'Adobe Firefly', 'adobe-firefly', 'https://firefly.adobe.com', 'Adobe''s generative AI for creative professionals', '25 free credits monthly', 'Freemium', ARRAY['image-generation-editing']),

-- Insert tools for Art & Creative Design
('2f9dc40e-d1f6-4931-8921-0b56ded3288b', 'Runway ML', 'runway-ml', 'https://runwayml.com', 'Creative AI tools for video, image, and audio generation', '125 free credits', 'Freemium', ARRAY['art-creative-design']),
('2f9dc40e-d1f6-4931-8921-0b56ded3288b', 'Artbreeder', 'artbreeder', 'https://artbreeder.com', 'Collaborative AI art creation through image blending', 'Free tier with limited features', 'Freemium', ARRAY['art-creative-design']),
('2f9dc40e-d1f6-4931-8921-0b56ded3288b', 'NightCafe', 'nightcafe', 'https://nightcafe.studio', 'AI art generator with multiple algorithms', '5 free credits daily', 'Freemium', ARRAY['art-creative-design']),
('2f9dc40e-d1f6-4931-8921-0b56ded3288b', 'Deep Dream Generator', 'deep-dream-generator', 'https://deepdreamgenerator.com', 'Create psychedelic AI art with neural networks', 'Free tier available', 'Freemium', ARRAY['art-creative-design']),
('2f9dc40e-d1f6-4931-8921-0b56ded3288b', 'Krea AI', 'krea-ai', 'https://krea.ai', 'Real-time AI image generation and enhancement', 'Free tier with daily limits', 'Freemium', ARRAY['art-creative-design']);;
