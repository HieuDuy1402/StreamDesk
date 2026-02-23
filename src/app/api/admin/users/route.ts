import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Sound from '@/models/Sound';

export async function GET() {
    try {
        const adminUser = await getUserFromToken();
        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await connectDB();
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        // Enhance each user with stats
        const usersWithStats = await Promise.all(users.map(async (u) => {
            const sounds = await Sound.find({ userId: u._id });
            const trackCount = sounds.filter(s => s.file).length;

            // Note: Cloudinary file sizes are not stored locally to avoid slow API fetching.
            // Consider saving fileSize when uploading if this data is crucial.
            const totalStorageBytes = 0;

            return {
                ...u.toObject(),
                trackCount,
                totalStorageBytes
            };
        }));

        return NextResponse.json(usersWithStats);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
