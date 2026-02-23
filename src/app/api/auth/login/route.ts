import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { email, password } = await req.json();

        // Validation
        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Generate JWT
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60,
            sameSite: 'lax',
            path: '/',
        });

        return NextResponse.json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                maxTracks: user.maxTracks
            }
        });
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
