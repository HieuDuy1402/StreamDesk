import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const adminUser = await getUserFromToken();

        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { maxTracks } = await req.json();

        if (typeof maxTracks !== 'number' || maxTracks < 0) {
            return NextResponse.json({ error: 'Invalid track limit' }, { status: 400 });
        }

        await connectDB();
        const user = await User.findByIdAndUpdate(
            id,
            { maxTracks },
            { new: true }
        ).select('-password');

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
