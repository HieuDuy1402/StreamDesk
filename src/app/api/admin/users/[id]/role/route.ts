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
        const { role } = await req.json();

        if (!['user', 'admin'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        await dbConnect();
        const user = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true }
        ).select('-password');

        return NextResponse.json(user);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
