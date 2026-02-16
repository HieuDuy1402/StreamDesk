import { NextResponse } from 'next/server';
import { verifyAdmin, getUserFromSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Sound from '@/models/Sound';
import { del } from '@vercel/blob';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Double check admin
        const currentUser = await getUserFromSession();
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;

        // Prevent self-delete
        if (id === currentUser._id.toString()) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        await dbConnect();

        // Delete all sounds files first
        const sounds = await Sound.find({ userId: id });
        for (const sound of sounds) {
            if (sound.file) {
                try {
                    await del(sound.file);
                } catch (e) { console.error(e) }
            }
        }
        await Sound.deleteMany({ userId: id });

        const user = await User.findByIdAndDelete(id);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        return NextResponse.json({ message: 'User deleted' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
