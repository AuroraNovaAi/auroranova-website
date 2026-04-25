'use server';

import { adminDb } from '@/lib/firebase/admin';
import { ContactSubmissionSchema, type ContactSubmission } from '@/lib/schemas';

export async function getSubmissions(): Promise<ContactSubmission[]> {
  try {
    const snapshot = await adminDb.collection('contact_submissions').orderBy('timestamp', 'desc').get();
    
    const submissions = snapshot.docs.map(doc => {
      const data = doc.data();
      const parsed = ContactSubmissionSchema.safeParse({ id: doc.id, ...data });
      
      if (!parsed.success) {
        console.warn(`[Data Warning] Invalid submission data for ID: ${doc.id}`);
        return null;
      }
      return parsed.data;
    }).filter(Boolean) as ContactSubmission[];
    
    return submissions;
  } catch (error) {
    console.error('[Server Action Error] Failed to fetch submissions:', error);
    throw new Error('Failed to fetch submissions');
  }
}

export async function addSubmission(data: Omit<ContactSubmission, 'id' | 'timestamp'>) {
  try {
    const docRef = await adminDb.collection('contact_submissions').add({
      ...data,
      timestamp: new Date().toISOString(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('[Server Action Error] Failed to add submission:', error);
    throw new Error('Failed to add submission');
  }
}

export async function updateSubmission(id: string, data: Partial<ContactSubmission>) {
  try {
    const { id: _, ...updateData } = data as any;
    await adminDb.collection('contact_submissions').doc(id).update({
      ...updateData,
    });
    return { success: true };
  } catch (error) {
    console.error('[Server Action Error] Failed to update submission:', error);
    throw new Error('Failed to update submission');
  }
}

export async function deleteSubmission(id: string) {
  try {
    await adminDb.collection('contact_submissions').doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error('[Server Action Error] Failed to delete submission:', error);
    throw new Error('Failed to delete submission');
  }
}
