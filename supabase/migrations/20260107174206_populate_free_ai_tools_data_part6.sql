-- Insert tools for Business Research
INSERT INTO free_ai_tools_tools (subcategory_id, name, slug, external_url, description, free_tier_details, pricing, category_ids) VALUES
('e4c84e5d-30e1-4636-9cd5-8bf1521280af', 'Crayon', 'crayon', 'https://crayon.co', 'AI competitive intelligence platform', 'Demo available', 'Paid', ARRAY['business-research']),
('e4c84e5d-30e1-4636-9cd5-8bf1521280af', 'Kompyte', 'kompyte', 'https://kompyte.com', 'AI-powered competitor tracking', 'Demo available', 'Paid', ARRAY['business-research']),
('e4c84e5d-30e1-4636-9cd5-8bf1521280af', 'Owler', 'owler', 'https://owler.com', 'AI business insights and company data', 'Free basic access', 'Freemium', ARRAY['business-research']),
('e4c84e5d-30e1-4636-9cd5-8bf1521280af', 'Crunchbase', 'crunchbase', 'https://crunchbase.com', 'AI-enhanced company and funding data', 'Free basic searches', 'Freemium', ARRAY['business-research']),
('e4c84e5d-30e1-4636-9cd5-8bf1521280af', 'SimilarWeb', 'similarweb', 'https://similarweb.com', 'AI website traffic and analytics', 'Free basic features', 'Freemium', ARRAY['business-research']),

-- Insert tools for Other
('97fa09e2-47e6-447d-a5d7-6d2071618915', 'Zapier AI', 'zapier-ai', 'https://zapier.com', 'AI-powered workflow automation', 'Free tier with 100 tasks', 'Freemium', ARRAY['other-1']),
('97fa09e2-47e6-447d-a5d7-6d2071618915', 'Make (Integromat)', 'make', 'https://make.com', 'AI-enhanced automation platform', 'Free tier available', 'Freemium', ARRAY['other-1']),
('97fa09e2-47e6-447d-a5d7-6d2071618915', 'IFTTT', 'ifttt', 'https://ifttt.com', 'AI-powered app connections and automations', 'Free tier with 2 applets', 'Freemium', ARRAY['other-1']),
('97fa09e2-47e6-447d-a5d7-6d2071618915', 'Bardeen', 'bardeen', 'https://bardeen.ai', 'AI browser automation and workflows', 'Free tier available', 'Freemium', ARRAY['other-1']),
('97fa09e2-47e6-447d-a5d7-6d2071618915', 'n8n', 'n8n', 'https://n8n.io', 'Open-source AI workflow automation', 'Free self-hosted', 'Freemium', ARRAY['other-1']);;
