'use server';

import { adminDb } from '@/lib/firebase/admin';
import { ProductSchema, type Product } from '@/lib/schemas';

/**
 * Fetches all active and inactive products from Firestore
 * Validates them against the Zod schema to ensure data integrity
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const snapshot = await adminDb.collection('products').orderBy('nameTR').get();
    
    const products = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // We parse the data through our Zod schema. 
      // This protects our UI from crashing if Firestore has malformed data.
      const parsed = ProductSchema.safeParse({ id: doc.id, ...data });
      
      if (!parsed.success) {
        console.warn(`[Data Warning] Invalid product data for ID: ${doc.id}`);
        // We log the error but skip the malformed product so the rest of the app doesn't crash
        return null;
      }
      
      return parsed.data;
    }).filter(Boolean) as Product[];
    
    return products;
  } catch (error) {
    console.error('[Server Action Error] Failed to fetch products:', error);
    return [];
  }
}

function generateSlug(name: string) {
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

export async function addProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const slug = data.slug || generateSlug(data.nameTR);
    
    const existing = await adminDb.collection('products').where('slug', '==', slug).get();
    let finalSlug = slug;
    if (!existing.empty) {
        finalSlug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const docRef = await adminDb.collection('products').add({
      ...data,
      slug: finalSlug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('[Server Action Error] Failed to add product:', error);
    throw new Error('Failed to add product');
  }
}

export async function deleteProduct(id: string) {
  try {
    await adminDb.collection('products').doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error('[Server Action Error] Failed to delete product:', error);
    throw new Error('Failed to delete product');
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const snapshot = await adminDb.collection('products').where('slug', '==', slug).limit(1).get();
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    const parsed = ProductSchema.safeParse({ id: doc.id, ...doc.data() });
    
    if (!parsed.success) return null;
    return parsed.data;
  } catch (error) {
    console.error('[Server Action Error] Failed to fetch product by slug:', error);
    return null;
  }
}
