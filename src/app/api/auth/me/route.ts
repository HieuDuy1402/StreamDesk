import { NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';

export async function GET() {
    const user = await getUserFromSession();

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
}
