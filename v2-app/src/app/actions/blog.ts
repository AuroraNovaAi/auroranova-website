'use server';

import { adminDb } from '@/lib/firebase/admin';
import { BlogPostSchema, type BlogPost } from '@/lib/schemas';

export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const snapshot = await adminDb.collection('blog_posts').orderBy('order', 'asc').get();
    
    const posts = snapshot.docs.map(doc => {
      const data = doc.data();
      const parsed = BlogPostSchema.safeParse({ id: doc.id, ...data });
      
      if (!parsed.success) {
        console.warn(`[Data Warning] Invalid blog post data for ID: ${doc.id}`);
        return null;
      }
      return parsed.data;
    }).filter(Boolean) as BlogPost[];
    
    return posts;
  } catch (error) {
    console.error('[Server Action Error] Failed to fetch blog posts:', error);
    throw new Error('Failed to fetch blog posts');
  }
}

function generateSlug(name: string) {
  if (!name) return 'blog-' + Date.now().toString().slice(-4);
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

export async function addBlogPost(data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const slug = data.slug || generateSlug(data.titleTR || 'untitled');
    
    const existing = await adminDb.collection('blog_posts').where('slug', '==', slug).get();
    let finalSlug = slug;
    if (!existing.empty) {
        finalSlug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const docRef = await adminDb.collection('blog_posts').add({
      ...data,
      slug: finalSlug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('[Server Action Error] Failed to add blog post:', error);
    throw new Error('Failed to add blog post');
  }
}

export async function deleteBlogPost(id: string) {
  try {
    await adminDb.collection('blog_posts').doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error('[Server Action Error] Failed to delete blog post:', error);
    throw new Error('Failed to delete blog post');
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const snapshot = await adminDb.collection('blog_posts').where('slug', '==', slug).limit(1).get();
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    const parsed = BlogPostSchema.safeParse({ id: doc.id, ...doc.data() });
    
    if (!parsed.success) return null;
    return parsed.data;
  } catch (error) {
    console.error('[Server Action Error] Failed to fetch blog post by slug:', error);
    return null;
  }
}
