import { ImageResponse } from 'next/og';
import { getToolBySlug } from '@/lib/services/tools.service';
import { Tool } from '@/lib/types/tool';

export const runtime = 'edge';
export const alt = 'Tool Details';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

// Next.js 15+ compatible: params is a Promise
export default async function Image(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const tool = await getToolBySlug(params.slug);

    if (!tool) {
        return new ImageResponse(
            (
                <div style={{
                    fontSize: 48,
                    background: 'white',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    Toolify.ai Replica
                </div>
            ),
            { ...size }
        );
    }

    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 48,
                    background: '#5800FF',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    padding: '40px',
                    textAlign: 'center',
                }}
            >
                <div style={{ fontSize: 80, fontWeight: 'bold', marginBottom: 20 }}>
                    {tool.name}
                </div>
                <div style={{ fontSize: 32, opacity: 0.9 }}>
                    {tool.shortDescription}
                </div>
                <div style={{
                    marginTop: 40,
                    background: 'white',
                    borderRadius: 20,
                    padding: '10px 30px',
                    color: '#5800FF',
                    fontSize: 24,
                    fontWeight: 'bold'
                }}>
                    View on Toolify Replica
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
