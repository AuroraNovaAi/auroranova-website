'use server';

import { adminDb } from '@/lib/firebase/admin';
import { GalleryItemSchema, type GalleryItem } from '@/lib/schemas';

export async function getGalleryItems(): Promise<GalleryItem[]> {
  try {
    const snapshot = await adminDb.collection('gallery_items').orderBy('order', 'asc').get();
    
    const items = snapshot.docs.map(doc => {
      const data = doc.data();
      const parsed = GalleryItemSchema.safeParse({ id: doc.id, ...data });
      
      if (!parsed.success) {
        console.warn(`[Data Warning] Invalid gallery item for ID: ${doc.id}`);
        return null;
      }
      return parsed.data;
    }).filter(Boolean) as GalleryItem[];
    
    return items;
  } catch (error) {
    console.error('[Server Action Error] Failed to fetch gallery items:', error);
    return [];
  }
}

function generateSlug(name: string) {
  if (!name) return 'work-' + Date.now().toString().slice(-4);
  return name.toString().toLowerCase()
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export async function addGalleryItem(data: Omit<GalleryItem, 'id' | 'updatedAt'>) {
  try {
    const slug = data.slug || generateSlug(data.titleTR || 'untitled');
    
    const existing = await adminDb.collection('gallery_items').where('slug', '==', slug).get();
    let finalSlug = slug;
    if (!existing.empty) {
        finalSlug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const docRef = await adminDb.collection('gallery_items').add({
      ...data,
      slug: finalSlug,
      updatedAt: new Date().toISOString(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('[Server Action Error] Failed to add gallery item:', error);
    throw new Error('Failed to add gallery item');
  }
}

export async function deleteGalleryItem(id: string) {
  try {
    await adminDb.collection('gallery_items').doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error('[Server Action Error] Failed to delete gallery item:', error);
    throw new Error('Failed to delete gallery item');
  }
}

export async function updateGalleryItem(id: string, data: Partial<GalleryItem>) {
  try {
    const { id: _, ...updateData } = data as any;
    await adminDb.collection('gallery_items').doc(id).update({
      ...updateData,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error('[Server Action Error] Failed to update gallery item:', error);
    throw new Error('Failed to update gallery item');
  }
}

export async function getGalleryItemBySlug(slug: string): Promise<GalleryItem | null> {
  try {
    const snapshot = await adminDb.collection('gallery_items').where('slug', '==', slug).limit(1).get();
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    const parsed = GalleryItemSchema.safeParse({ id: doc.id, ...doc.data() });
    
    if (!parsed.success) return null;
    return parsed.data;
  } catch (error) {
    console.error('[Server Action Error] Failed to fetch gallery item by slug:', error);
    return null;
  }
}
