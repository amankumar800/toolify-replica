-- Insert tools for Daily Life
INSERT INTO free_ai_tools_tools (subcategory_id, name, slug, external_url, description, free_tier_details, pricing, category_ids) VALUES
('0a5d5332-1ed6-4557-bc78-d709db184c3e', 'Replika', 'replika', 'https://replika.ai', 'AI companion for emotional support and conversation', 'Free basic features', 'Freemium', ARRAY['daily-life']),
('0a5d5332-1ed6-4557-bc78-d709db184c3e', 'ELSA Speak', 'elsa-speak', 'https://elsaspeak.com', 'AI English pronunciation coach', 'Free lessons available', 'Freemium', ARRAY['daily-life']),
('0a5d5332-1ed6-4557-bc78-d709db184c3e', 'Youper', 'youper', 'https://youper.ai', 'AI-powered mental health assistant', 'Free basic features', 'Freemium', ARRAY['daily-life']),
('0a5d5332-1ed6-4557-bc78-d709db184c3e', 'Wysa', 'wysa', 'https://wysa.io', 'AI chatbot for mental wellness', 'Free tier available', 'Freemium', ARRAY['daily-life']),
('0a5d5332-1ed6-4557-bc78-d709db184c3e', 'Tasty AI', 'tasty-ai', 'https://tasty.co', 'AI recipe recommendations and meal planning', 'Free to use', 'Free', ARRAY['daily-life']),

-- Insert tools for Health & Wellness
('bc9a1fad-6a6a-40ca-bf6f-4906cab19ed3', 'Ada Health', 'ada-health', 'https://ada.com', 'AI symptom checker and health assessment', 'Free to use', 'Free', ARRAY['health-wellness']),
('bc9a1fad-6a6a-40ca-bf6f-4906cab19ed3', 'Babylon Health', 'babylon-health', 'https://babylonhealth.com', 'AI-powered health consultations', 'Free symptom checker', 'Freemium', ARRAY['health-wellness']),
('bc9a1fad-6a6a-40ca-bf6f-4906cab19ed3', 'Woebot', 'woebot', 'https://woebot.io', 'AI mental health chatbot using CBT', 'Free to use', 'Free', ARRAY['health-wellness']),
('bc9a1fad-6a6a-40ca-bf6f-4906cab19ed3', 'Flo', 'flo', 'https://flo.health', 'AI period and ovulation tracker', 'Free basic features', 'Freemium', ARRAY['health-wellness']),
('bc9a1fad-6a6a-40ca-bf6f-4906cab19ed3', 'Noom', 'noom', 'https://noom.com', 'AI-powered weight loss and health coaching', 'Free trial available', 'Paid', ARRAY['health-wellness']),

-- Insert tools for Image Analysis
('1e2703bb-f669-4d4f-8f21-aec52eadf796', 'Google Lens', 'google-lens', 'https://lens.google.com', 'AI visual search and image recognition', 'Completely free', 'Free', ARRAY['image-analysis']),
('1e2703bb-f669-4d4f-8f21-aec52eadf796', 'Remove.bg', 'remove-bg', 'https://remove.bg', 'AI background removal from images', '1 free HD image', 'Freemium', ARRAY['image-analysis']),
('1e2703bb-f669-4d4f-8f21-aec52eadf796', 'Cleanup.pictures', 'cleanup-pictures', 'https://cleanup.pictures', 'AI object removal from photos', 'Free with watermark', 'Freemium', ARRAY['image-analysis']),
('1e2703bb-f669-4d4f-8f21-aec52eadf796', 'Upscayl', 'upscayl', 'https://upscayl.org', 'Free AI image upscaler', 'Completely free', 'Free', ARRAY['image-analysis']),
('1e2703bb-f669-4d4f-8f21-aec52eadf796', 'Photoroom', 'photoroom', 'https://photoroom.com', 'AI photo editing and background removal', 'Free tier available', 'Freemium', ARRAY['image-analysis']),

-- Insert tools for Interior & Architectural Design
('80dc09d4-c0b8-4a0f-b599-3b73aa42deca', 'Interior AI', 'interior-ai', 'https://interiorai.com', 'AI interior design visualization', 'Free renders available', 'Freemium', ARRAY['interior-architectural-design']),
('80dc09d4-c0b8-4a0f-b599-3b73aa42deca', 'Planner 5D', 'planner-5d', 'https://planner5d.com', 'AI-powered home design and floor planning', 'Free basic features', 'Freemium', ARRAY['interior-architectural-design']),
('80dc09d4-c0b8-4a0f-b599-3b73aa42deca', 'RoomGPT', 'roomgpt', 'https://roomgpt.io', 'AI room redesign from photos', 'Free tier available', 'Freemium', ARRAY['interior-architectural-design']),
('80dc09d4-c0b8-4a0f-b599-3b73aa42deca', 'Homestyler', 'homestyler', 'https://homestyler.com', 'AI interior design and 3D rendering', 'Free to use', 'Freemium', ARRAY['interior-architectural-design']),
('80dc09d4-c0b8-4a0f-b599-3b73aa42deca', 'Collov AI', 'collov-ai', 'https://collov.ai', 'AI interior design generator', 'Free trial available', 'Freemium', ARRAY['interior-architectural-design']);;
