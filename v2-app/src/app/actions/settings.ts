'use server';

import { adminDb } from '@/lib/firebase/admin';
import { SiteSettingsSchema, type SiteSettings } from '@/lib/schemas';

export async function getSettings(): Promise<SiteSettings | null> {
  try {
    const doc = await adminDb.collection('settings').doc('global').get();
    
    if (!doc.exists) {
      return null;
    }
    
    const parsed = SiteSettingsSchema.safeParse({ id: doc.id, ...doc.data() });
    
    if (!parsed.success) {
      console.warn(`[Data Warning] Invalid settings data:`, parsed.error);
      return null;
    }
    
    return parsed.data;
  } catch (error) {
    console.error('[Server Action Error] Failed to fetch settings:', error);
    throw new Error('Failed to fetch settings');
  }
}

export async function updateSettings(data: Partial<SiteSettings>) {
  try {
    const { id: _, ...updateData } = data as any;
    await adminDb.collection('settings').doc('global').set({
      ...updateData,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('[Server Action Error] Failed to update settings:', error);
    throw new Error('Failed to update settings');
  }
}
