import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Convert file to array buffer and then to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64File = `data:${file.type};base64,${buffer.toString('base64')}`;
    
    // Upload to Cloudinary from the server
    const cloudinaryResponse = await fetch('https://api.cloudinary.com/v1_1/dvcs7czio/image/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: base64File,
        upload_preset: 'ml_default',
      }),
    });
    
    if (!cloudinaryResponse.ok) {
      const errorText = await cloudinaryResponse.text();
      console.error('Cloudinary server upload failed:', errorText);
      return NextResponse.json(
        { success: false, error: `Upload failed: ${cloudinaryResponse.status}` },
        { status: cloudinaryResponse.status }
      );
    }
    
    const result = await cloudinaryResponse.json();
    
    return NextResponse.json({
      success: true,
      secure_url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    console.error('Server upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Server upload failed' },
      { status: 500 }
    );
  }
} 