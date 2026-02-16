import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Sound from '@/models/Sound';

export async function GET() {
    try {
        if (!(await verifyAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await dbConnect();
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        // Calculate stats (Track Count & Blobs)
        // Vercel Blob doesn't give us easy folder sizes like FS, so we'll just return count
        // or potentially sum file sizes if stored (we didn't store file size in Sound model)
        const usersWithStats = await Promise.all(users.map(async (u) => {
            const sounds = await Sound.find({ userId: u._id });
            const trackCount = sounds.filter(s => s.file).length;

            // Note: In Vercel Blob, we don't have direct access to file size unless we head-request each URL
            // which is too slow. For now, we return 0 or just track count.
            // Future improvement: store file size in Sound model upon upload.
            const totalStorageBytes = 0;

            return {
                ...u.toObject(),
                trackCount,
                totalStorageBytes
            };
        }));

        return NextResponse.json(usersWithStats);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
