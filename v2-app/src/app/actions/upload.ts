'use server';

import { adminStorage } from '@/lib/firebase/admin';

export async function uploadImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      return { error: 'Dosya bulunamadı.' };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const bucket = adminStorage.bucket();
    const filename = `uploads/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const fileRef = bucket.file(filename);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      }
    });

    // Generate public Firebase Storage URL
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media`;
    
    return { url: publicUrl };
  } catch (error) {
    console.error('[Upload Error]', error);
    return { error: 'Görsel yüklenirken bir hata oluştu.' };
  }
}
