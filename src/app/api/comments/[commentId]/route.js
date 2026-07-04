import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Comment from '@/lib/models/Comment';
import { verifyToken } from '@/lib/auth';

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { commentId } = await params;
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });
    }

    // Admins can delete any comment; Users can delete only their own
    if (decoded.role !== 'admin' && comment.authorId !== decoded.id) {
      return NextResponse.json({ error: 'Forbidden. You cannot delete this comment.' }, { status: 403 });
    }

    await Comment.findByIdAndDelete(commentId);
    return NextResponse.json({ message: 'Comment deleted successfully.' });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
