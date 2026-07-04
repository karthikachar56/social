import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/auth';

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { id } = params;
    const { banned } = await req.json();

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { banned },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Update user ban error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
