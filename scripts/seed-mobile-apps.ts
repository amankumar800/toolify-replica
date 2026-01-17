/**
 * Seed AI Mobile Apps Data
 * 
 * Inserts popular AI mobile apps into the database with platform = 'app'
 * Run: npx ts-node scripts/seed-mobile-apps.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AppData {
    name: string;
    slug: string;
    short_description: string;
    description: string;
    website_url: string;
    pricing: string;
    status: string;
    platform: string;
    is_new: boolean;
    image_url: string | null;
}

const mobileApps: AppData[] = [
    {
        name: 'ChatGPT Mobile',
        slug: 'chatgpt-mobile',
        short_description: 'Official ChatGPT mobile app by OpenAI with voice conversations, image generation, and GPT-4 access.',
        description: "The official ChatGPT mobile app brings the power of OpenAI's AI assistant to your phone. Features voice conversations, image generation with DALL-E, GPT-4 access for subscribers, conversation history sync, and a clean mobile-optimized interface.",
        website_url: 'https://chat.openai.com',
        pricing: 'Freemium',
        status: 'published',
        platform: 'app',
        is_new: false,
        image_url: null,
    },
    {
        name: 'Claude Mobile',
        slug: 'claude-mobile',
        short_description: 'Official Anthropic Claude AI assistant app for iOS and Android with advanced reasoning capabilities.',
        description: "Claude Mobile is the official mobile app for Anthropic's AI assistant. Enjoy Claude's advanced reasoning, long context conversations, coding help, and creative writing assistance on the go. Sync conversations across devices.",
        website_url: 'https://claude.ai',
        pricing: 'Freemium',
        status: 'published',
        platform: 'app',
        is_new: false,
        image_url: null,
    },
    {
        name: 'Google Gemini',
        slug: 'gemini-mobile',
        short_description: "Google's AI assistant app with multimodal capabilities, image understanding, and Google integration.",
        description: "Google Gemini (formerly Bard) is Google's most capable AI assistant. Features multimodal understanding, image analysis, seamless Google Workspace integration, coding assistance, and access to Gemini Ultra for Pro subscribers.",
        website_url: 'https://gemini.google.com',
        pricing: 'Freemium',
        status: 'published',
        platform: 'app',
        is_new: false,
        image_url: null,
    },
    {
        name: 'Microsoft Copilot',
        slug: 'copilot-mobile',
        short_description: "Microsoft's AI assistant with GPT-4 access, image generation, and Microsoft 365 integration.",
        description: 'Microsoft Copilot brings GPT-4 powered AI to your mobile device. Create images with DALL-E 3, get coding help, summarize documents, and integrate seamlessly with Microsoft 365. Available for iOS and Android.',
        website_url: 'https://copilot.microsoft.com',
        pricing: 'Free',
        status: 'published',
        platform: 'app',
        is_new: false,
        image_url: null,
    },
    {
        name: 'Perplexity AI',
        slug: 'perplexity-mobile',
        short_description: 'AI-powered answer engine with real-time web search, citations, and follow-up questions.',
        description: 'Perplexity AI is an AI-powered search engine that provides direct answers with citations. Features real-time web search, follow-up questions, focus modes for specific domains, and a clean mobile interface. Pro tier includes GPT-4 and Claude access.',
        website_url: 'https://perplexity.ai',
        pricing: 'Freemium',
        status: 'published',
        platform: 'app',
        is_new: false,
        image_url: null,
    },
    {
        name: 'Poe',
        slug: 'poe-mobile',
        short_description: 'Multi-bot AI platform with access to ChatGPT, Claude, Gemini, and more in one app.',
        description: 'Poe by Quora provides access to multiple AI models including GPT-4, Claude, Gemini Pro, Llama, and custom bots. Create your own bots, share conversations, and switch between models. One subscription, many AIs.',
        website_url: 'https://poe.com',
        pricing: 'Freemium',
        status: 'published',
        platform: 'app',
        is_new: false,
        image_url: null,
    },
    {
        name: 'Character.AI',
        slug: 'character-ai-mobile',
        short_description: 'Create and chat with AI characters for entertainment, roleplay, learning, and companionship.',
        description: 'Character.AI lets you create and interact with AI personalities. Chat with historical figures, fictional characters, language tutors, or create your own. Features voice calls, group chats, and character creation tools.',
        website_url: 'https://character.ai',
        pricing: 'Freemium',
        status: 'published',
        platform: 'app',
        is_new: false,
        image_url: null,
    },
    {
        name: 'Replika',
        slug: 'replika-mobile',
        short_description: 'AI companion app for emotional support, conversations, and personal growth.',
        description: 'Replika is an AI companion that learns your personality and interests. Have meaningful conversations, track your mood, practice mindfulness, and develop a unique relationship with your AI friend. Video calls available for Pro subscribers.',
        website_url: 'https://replika.com',
        pricing: 'Freemium',
        status: 'published',
        platform: 'app',
        is_new: false,
        image_url: null,
    },
    {
        name: 'Pi',
        slug: 'pi-mobile',
        short_description: 'Personal AI assistant designed for natural, empathetic conversations on any topic.',
        description: 'Pi (Personal Intelligence) by Inflection AI is designed for natural, supportive conversations. Known for its empathetic communication style, Pi helps with advice, learning, brainstorming, and everyday tasks through voice or text.',
        website_url: 'https://pi.ai',
        pricing: 'Free',
        status: 'published',
        platform: 'app',
        is_new: false,
        image_url: null,
    },
    {
        name: 'Otter.ai',
        slug: 'otter-ai-mobile',
        short_description: 'AI meeting transcription app that records, transcribes, and summarizes meetings in real-time.',
        description: 'Otter.ai transforms how you capture meetings. Real-time transcription, speaker identification, automatic summaries, and searchable notes. Integrates with Zoom, Google Meet, and Microsoft Teams. Essential for professionals.',
        website_url: 'https://otter.ai',
        pricing: 'Freemium',
        status: 'published',
        platform: 'app',
        is_new: false,
        image_url: null,
    },
    {
        name: 'ELSA Speak',
        slug: 'elsa-speak-mobile',
        short_description: 'AI-powered English pronunciation coach with speech recognition and personalized feedback.',
        description: 'ELSA uses AI speech recognition to help you perfect your English pronunciation. Get instant feedback on your accent, practice with thousands of lessons, and track your progress. Used by millions worldwide.',
        website_url: 'https://elsaspeak.com',
        pricing: 'Freemium',
        status: 'published',
        platform: 'app',
        is_new: false,
        image_url: null,
    },
    {
        name: 'Lensa AI',
        slug: 'lensa-ai-mobile',
        short_description: 'AI photo editor with magic avatars, portrait enhancement, and background editing.',
        description: 'Lensa AI creates stunning AI-generated avatars from your selfies. Features professional portrait retouching, background blur, skin smoothing, and artistic filters. Made viral by its Magic Avatars feature.',
        website_url: 'https://prisma-ai.com/lensa',
        pricing: 'Freemium',
        status: 'published',
        platform: 'app',
        is_new: false,
        image_url: null,
    },
    {
        name: 'Remini',
        slug: 'remini-mobile',
        short_description: 'AI photo enhancer that restores old photos, upscales images, and improves portrait quality.',
        description: 'Remini uses AI to enhance and restore photos. Unblur faces, upscale low-resolution images, colorize old black-and-white photos, and create AI portraits. Over 100 million users trust Remini.',
        website_url: 'https://remini.ai',
        pricing: 'Freemium',
        status: 'published',
        platform: 'app',
        is_new: false,
        image_url: null,
    },
    {
        name: 'Photomath',
        slug: 'photomath-mobile',
        short_description: 'AI math solver that solves problems step-by-step from photos with detailed explanations.',
        description: "Photomath is the world's most used math learning app. Point your camera at a math problem and get instant solutions with step-by-step explanations. Covers basic math through calculus. Learn, don't just copy.",
        website_url: 'https://photomath.com',
        pricing: 'Freemium',
        status: 'published',
        platform: 'app',
        is_new: false,
        image_url: null,
    },
    {
        name: 'Be My Eyes',
        slug: 'be-my-eyes-mobile',
        short_description: 'AI-powered visual assistance app helping blind and low-vision users understand their surroundings.',
        description: 'Be My Eyes connects blind and low-vision users with sighted volunteers and AI assistance. The new Be My AI feature provides instant visual descriptions. Read labels, navigate spaces, and get help 24/7.',
        website_url: 'https://bemyeyes.com',
        pricing: 'Free',
        status: 'published',
        platform: 'app',
        is_new: false,
        image_url: null,
    },
    {
        name: 'Socratic by Google',
        slug: 'socratic-mobile',
        short_description: 'AI homework helper for students covering math, science, history, and more subjects.',
        description: 'Socratic by Google helps students understand homework problems. Take a photo of any question and get step-by-step explanations, videos, and learning resources. Covers math, science, literature, and social studies.',
        website_url: 'https://socratic.org',
        pricing: 'Free',
        status: 'published',
        platform: 'app',
        is_new: false,
        image_url: null,
    },
];

async function seedMobileApps() {
    console.log('Starting to seed AI mobile apps...\n');

    let insertedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const app of mobileApps) {
        try {
            // Try to upsert (insert or update on conflict)
            const { data, error } = await supabase
                .from('tools')
                .upsert(app, { onConflict: 'slug' })
                .select();

            if (error) {
                console.error(`❌ Error with ${app.name}: ${error.message}`);
                errorCount++;
            } else {
                console.log(`✅ ${app.name} added/updated successfully`);
                insertedCount++;
            }
        } catch (err) {
            console.error(`❌ Exception with ${app.name}:`, err);
            errorCount++;
        }
    }

    console.log(`\n========================================`);
    console.log(`Seeding complete!`);
    console.log(`✅ Successful: ${insertedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`========================================\n`);

    // Verify the count
    const { count } = await supabase
        .from('tools')
        .select('*', { count: 'exact', head: true })
        .eq('platform', 'app')
        .eq('status', 'published');

    console.log(`Total mobile apps in database: ${count}`);
}

seedMobileApps().catch(console.error);
