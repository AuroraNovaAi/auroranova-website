'use server';

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function getCloudinarySignature() {
  const timestamp = Math.round(new Date().getTime() / 1000);
  
  const paramsToSign = {
    timestamp: timestamp,
    folder: 'auroranova-videos'
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET as string
  );

  return {
    timestamp,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder: 'auroranova-videos'
  };
}

export async function generateTransformationUrl(publicId: string, action: string, options?: { start?: string, end?: string }) {
  let transformation: any[] = [];
  
  // Base trim object
  const baseTrim: any = {};
  if (options?.start && options.start !== '') baseTrim['start_offset'] = options.start;
  if (options?.end && options.end !== '') baseTrim['end_offset'] = options.end;
  
  // Always apply trim first to the base video if provided
  if (Object.keys(baseTrim).length > 0) {
    transformation.push({ ...baseTrim });
  }

  if (action === 'reverse') {
    transformation.push({ effect: 'reverse' });
  } else if (action === 'remove_audio') {
    transformation.push({ audio_codec: 'none' });
  } else if (action === 'clone2x') {
    const layerId = publicId.replace(/\//g, ':');
    // Overlay the exact same segment
    transformation.push(
      { flags: 'splice', overlay: `video:${layerId}` },
      Object.keys(baseTrim).length > 0 ? { ...baseTrim } : {},
      { flags: 'layer_apply' }
    );
  } else if (action === 'boomerang') {
    const layerId = publicId.replace(/\//g, ':');
    // Overlay the exact same segment, but reversed
    transformation.push(
      { flags: 'splice', overlay: `video:${layerId}` },
      { ...baseTrim, effect: 'reverse' },
      { flags: 'layer_apply' }
    );
  }

  // Always apply AI-based optimal compression
  transformation.push({ quality: 'auto', fetch_format: 'mp4' });

  const url = cloudinary.url(publicId, {
    resource_type: 'video',
    transformation: transformation
  });

  return url;
}
