'use server';

import { adminDb } from '@/lib/firebase/admin';
import { WebUserSchema, type WebUser } from '@/lib/schemas';

export async function getMembers(): Promise<WebUser[]> {
  try {
    const snapshot = await adminDb.collection('web_users').orderBy('createdAt', 'desc').get();
    
    const members = snapshot.docs.map(doc => {
      const data = doc.data();
      const parsed = WebUserSchema.safeParse({ uid: doc.id, ...data });
      
      if (!parsed.success) {
        console.warn(`[Data Warning] Invalid member data for ID: ${doc.id}`);
        return null;
      }
      return parsed.data;
    }).filter(Boolean) as WebUser[];
    
    return members;
  } catch (error) {
    console.error('[Server Action Error] Failed to fetch members:', error);
    throw new Error('Failed to fetch members');
  }
}

export async function addMember(data: Omit<WebUser, 'uid' | 'joinDate'>) {
  try {
    const docRef = await adminDb.collection('web_users').add({
      ...data,
      joinDate: new Date().toISOString(),
    });
    return { success: true, uid: docRef.id };
  } catch (error) {
    console.error('[Server Action Error] Failed to add member:', error);
    throw new Error('Failed to add member');
  }
}

export async function updateMember(uid: string, data: Partial<WebUser>) {
  try {
    const { uid: _, ...updateData } = data as any;
    await adminDb.collection('web_users').doc(uid).update({
      ...updateData,
    });
    return { success: true };
  } catch (error) {
    console.error('[Server Action Error] Failed to update member:', error);
    throw new Error('Failed to update member');
  }
}

export async function deleteMember(uid: string) {
  try {
    await adminDb.collection('web_users').doc(uid).delete();
    return { success: true };
  } catch (error) {
    console.error('[Server Action Error] Failed to delete member:', error);
    throw new Error('Failed to delete member');
  }
}
