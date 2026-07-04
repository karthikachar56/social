import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Event from '@/lib/models/Event';
import News from '@/lib/models/News';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { type, postType } = await req.json(); // type: 'share' or 'download'

    if (!['share', 'download'].includes(type) || !['event', 'news'].includes(postType)) {
      return NextResponse.json({ error: 'Invalid parameters.' }, { status: 400 });
    }

    const Model = postType === 'event' ? Event : News;
    const updateField = type === 'share' ? 'shares' : 'downloads';

    const updated = await Model.findByIdAndUpdate(
      id,
      { $inc: { [updateField]: 1 } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Increment stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
