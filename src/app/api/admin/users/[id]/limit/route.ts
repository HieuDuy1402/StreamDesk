import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { id } = await params;
        const { maxTracks } = await req.json();

        await dbConnect();
        const user = await User.findByIdAndUpdate(
            id,
            { maxTracks },
            { new: true }
        ).select('-password');

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        return NextResponse.json(user);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
