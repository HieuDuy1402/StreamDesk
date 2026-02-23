import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import connectDB from '@/lib/db';
import Sound from '@/models/Sound';
import cloudinary from '@/lib/cloudinary';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await getUserFromToken();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();

        const sound = await Sound.findOne({ id, userId: user._id });

        if (!sound) {
            return NextResponse.json({ error: 'Sound not found' }, { status: 404 });
        }

        if (sound.file) {
            try {
                // Determine public_id to delete from Cloudinary
                const urlParts = sound.file.split('/');
                const filenameWithExt = urlParts[urlParts.length - 1];
                const publicId = `streamdesk/${filenameWithExt.split('.')[0]}`;

                await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
            } catch (e) {
                console.error("Failed to delete Cloudinary file", e);
            }
        }

        await Sound.deleteOne({ id, userId: user._id });
        return NextResponse.json({ message: 'Sound deleted' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
