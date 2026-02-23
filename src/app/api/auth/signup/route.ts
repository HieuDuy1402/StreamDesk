import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { username, email, password } = await req.json();

        // Validation
        if (!username || !email || !password) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
        }

        // Create user
        const user = new User({ username, email, password });
        await user.save();

        // Generate JWT
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
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
        console.error('Signup error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
