import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import connectDB from '@/lib/db';
import Sound from '@/models/Sound';
import cloudinary from '@/lib/cloudinary';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const adminUser = await getUserFromToken();

        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await connectDB();

        const sounds = await Sound.find({ userId: id });

        // Delete physical files from Cloudinary
        for (const sound of sounds) {
            if (sound.file) {
                try {
                    const urlParts = sound.file.split('/');
                    const filenameWithExt = urlParts[urlParts.length - 1];
                    const publicId = `streamdesk/${filenameWithExt.split('.')[0]}`;
                    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
                } catch (e) {
                    console.error('Failed to delete Cloudinary file during bulk deletion:', e);
                }
            }
        }

        // Delete from DB
        await Sound.deleteMany({ userId: id });

        return NextResponse.json({ message: 'All tracks deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
