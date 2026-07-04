import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import Admin from '@/lib/models/Admin';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(req) {
  try {
    await connectDB();
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check password length
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    // Check if email belongs to an existing admin
    const adminExists = await Admin.findOne({ email: cleanEmail });
    if (adminExists) {
      return NextResponse.json({ error: 'This email is reserved for administrative accounts.' }, { status: 400 });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword
    });

    await newUser.save();

    const token = signToken({ id: newUser._id, email: newUser.email, name: newUser.name, role: 'user' });

    return NextResponse.json({
      token,
      role: 'user',
      user: { id: newUser._id, name: newUser.name, email: newUser.email, avatar: newUser.avatar }
    }, { status: 201 });
  } catch (e) {
    console.error('Signup error:', e);
    return NextResponse.json({ error: 'Server error during signup.' }, { status: 500 });
  }
}

