-- Insert tools for Coding & Development
INSERT INTO free_ai_tools_tools (subcategory_id, name, slug, external_url, description, free_tier_details, pricing, category_ids) VALUES
('578b13cc-2337-482c-8ba0-dd5784003e13', 'GitHub Copilot', 'github-copilot', 'https://github.com/features/copilot', 'AI pair programmer that suggests code in real-time', 'Free for students and open source', 'Freemium', ARRAY['coding-development']),
('578b13cc-2337-482c-8ba0-dd5784003e13', 'Cursor', 'cursor', 'https://cursor.sh', 'AI-first code editor built for pair programming with AI', 'Free tier with limited requests', 'Freemium', ARRAY['coding-development']),
('578b13cc-2337-482c-8ba0-dd5784003e13', 'Replit AI', 'replit-ai', 'https://replit.com', 'Online IDE with AI code completion and generation', 'Free tier available', 'Freemium', ARRAY['coding-development']),
('578b13cc-2337-482c-8ba0-dd5784003e13', 'Tabnine', 'tabnine', 'https://tabnine.com', 'AI code completion for all major IDEs', 'Free tier with basic completions', 'Freemium', ARRAY['coding-development']),
('578b13cc-2337-482c-8ba0-dd5784003e13', 'Codeium', 'codeium', 'https://codeium.com', 'Free AI code completion and chat for developers', 'Free for individuals', 'Free', ARRAY['coding-development']),
('578b13cc-2337-482c-8ba0-dd5784003e13', 'Amazon CodeWhisperer', 'amazon-codewhisperer', 'https://aws.amazon.com/codewhisperer', 'AI coding companion from AWS', 'Free for individual use', 'Free', ARRAY['coding-development']),

-- Insert tools for Video & Animation
('74a87366-d1d7-4c9a-9340-2e528831dc0c', 'Runway Gen-2', 'runway-gen-2', 'https://runwayml.com', 'Text-to-video and image-to-video AI generation', '125 free credits', 'Freemium', ARRAY['video-animation']),
('74a87366-d1d7-4c9a-9340-2e528831dc0c', 'Pika Labs', 'pika-labs', 'https://pika.art', 'AI video generation and editing platform', 'Free tier with daily credits', 'Freemium', ARRAY['video-animation']),
('74a87366-d1d7-4c9a-9340-2e528831dc0c', 'HeyGen', 'heygen', 'https://heygen.com', 'AI avatar video generation for marketing', '1 free credit', 'Freemium', ARRAY['video-animation']),
('74a87366-d1d7-4c9a-9340-2e528831dc0c', 'Synthesia', 'synthesia', 'https://synthesia.io', 'Create AI videos with virtual presenters', 'Free demo available', 'Paid', ARRAY['video-animation']),
('74a87366-d1d7-4c9a-9340-2e528831dc0c', 'D-ID', 'd-id', 'https://d-id.com', 'AI-powered talking avatar videos', '5 minutes free', 'Freemium', ARRAY['video-animation']),
('74a87366-d1d7-4c9a-9340-2e528831dc0c', 'Lumen5', 'lumen5', 'https://lumen5.com', 'AI video creation from blog posts and text', 'Free tier with watermark', 'Freemium', ARRAY['video-animation']),

-- Insert tools for Education & Translation
('65c24845-aed7-4a27-a6eb-9331b8a1535f', 'Duolingo', 'duolingo', 'https://duolingo.com', 'AI-powered language learning platform', 'Free with ads', 'Freemium', ARRAY['education-translation']),
('65c24845-aed7-4a27-a6eb-9331b8a1535f', 'DeepL', 'deepl', 'https://deepl.com', 'AI translation service with superior accuracy', '500,000 characters free monthly', 'Freemium', ARRAY['education-translation']),
('65c24845-aed7-4a27-a6eb-9331b8a1535f', 'Quillbot', 'quillbot', 'https://quillbot.com', 'AI paraphrasing and grammar checking tool', 'Free tier with limited features', 'Freemium', ARRAY['education-translation']),
('65c24845-aed7-4a27-a6eb-9331b8a1535f', 'Socratic by Google', 'socratic', 'https://socratic.org', 'AI homework helper for students', 'Completely free', 'Free', ARRAY['education-translation']),
('65c24845-aed7-4a27-a6eb-9331b8a1535f', 'Photomath', 'photomath', 'https://photomath.com', 'AI math problem solver with step-by-step solutions', 'Free basic features', 'Freemium', ARRAY['education-translation']),

-- Insert tools for Writing & Editing
('02ec08eb-4056-4185-bc06-b5dda5451979', 'Grammarly', 'grammarly', 'https://grammarly.com', 'AI writing assistant for grammar and style', 'Free basic grammar checking', 'Freemium', ARRAY['writing-editing']),
('02ec08eb-4056-4185-bc06-b5dda5451979', 'Jasper', 'jasper', 'https://jasper.ai', 'AI content creation platform for marketing', '7-day free trial', 'Paid', ARRAY['writing-editing']),
('02ec08eb-4056-4185-bc06-b5dda5451979', 'Copy.ai', 'copy-ai', 'https://copy.ai', 'AI copywriting tool for marketing content', '2,000 words free monthly', 'Freemium', ARRAY['writing-editing']),
('02ec08eb-4056-4185-bc06-b5dda5451979', 'Writesonic', 'writesonic', 'https://writesonic.com', 'AI writer for blogs, ads, and product descriptions', '10,000 words free', 'Freemium', ARRAY['writing-editing']),
('02ec08eb-4056-4185-bc06-b5dda5451979', 'Hemingway Editor', 'hemingway-editor', 'https://hemingwayapp.com', 'AI-powered writing clarity and readability checker', 'Free online version', 'Freemium', ARRAY['writing-editing']),
('02ec08eb-4056-4185-bc06-b5dda5451979', 'Sudowrite', 'sudowrite', 'https://sudowrite.com', 'AI writing assistant for fiction authors', 'Free trial available', 'Paid', ARRAY['writing-editing']);;
