import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import User from '@/models/User';
import dbConnect from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

export async function getUserFromSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        console.log("Auth Debug: No token found in cookies");
        return null;
    }

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        // console.log("Auth Debug: Token verified for user", payload.userId);
        if (!payload.userId) {
            console.log("Auth Debug: Token missing userId");
            return null;
        }

        await dbConnect();
        const user = await User.findById(payload.userId).select('-password');
        if (!user) console.log("Auth Debug: User not found in DB");
        return user;
    } catch (error) {
        console.error("Auth Debug: Verification failed:", error);
        return null;
    }
}

export async function verifyAdmin() {
    const user = await getUserFromSession();
    if (!user || user.role !== 'admin') {
        return false;
    }
    return true;
}
