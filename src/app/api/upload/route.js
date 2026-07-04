import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary if credentials are present
const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

export async function POST(req) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    // If Cloudinary is configured, upload the image
    if (useCloudinary) {
      console.log('Uploading image to Cloudinary...');
      try {
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder: 'eventhub'
        });
        return NextResponse.json({ url: uploadResponse.secure_url });
      } catch (uploadError) {
        console.error('Cloudinary upload failed, falling back to base64:', uploadError);
        // Fall through to fallback base64
      }
    }

    // Fallback: return the original base64/data-url
    return NextResponse.json({ url: image });
  } catch (error) {
    console.error('Upload endpoint error:', error);
    return NextResponse.json({ error: 'Server error during upload' }, { status: 500 });
  }
}

