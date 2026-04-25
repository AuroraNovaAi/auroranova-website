'use server';

import { adminDb } from '@/lib/firebase/admin';
import { SiteContentSchema, type SiteContent } from '@/lib/schemas';

export async function getSiteContent(): Promise<SiteContent[]> {
  try {
    const snapshot = await adminDb.collection('site_content').get();
    
    const content = snapshot.docs.map(doc => {
      const data = doc.data();
      const parsed = SiteContentSchema.safeParse({ id: doc.id, ...data });
      
      if (!parsed.success) {
        console.warn(`[Data Warning] Invalid site content for ID: ${doc.id}`);
        return null;
      }
      return parsed.data;
    }).filter(Boolean) as SiteContent[];
    
    return content;
  } catch (error) {
    console.error('[Server Action Error] Failed to fetch site content:', error);
    throw new Error('Failed to fetch site content');
  }
}

export async function updateSiteContent(id: string, data: Partial<SiteContent>) {
  try {
    const { id: _, ...updateData } = data as any;
    // We use set with merge: true so if the document doesn't exist yet, it creates it
    await adminDb.collection('site_content').doc(id).set({
      ...updateData,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('[Server Action Error] Failed to update site content:', error);
    throw new Error('Failed to update site content');
  }
}
