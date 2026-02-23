import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getUserFromToken();
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        return NextResponse.json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                maxTracks: user.maxTracks
            }
        });
    } catch (error) {
        console.error('Fetch user error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
