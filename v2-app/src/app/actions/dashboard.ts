'use server';

import { adminDb } from '@/lib/firebase/admin';

export interface DashboardStats {
  totalMembers: number;
  newThisWeek: number;
  todayViews: number;
  unreadSubmissions: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // 1. Total Members
    const membersSnapshot = await adminDb.collection('web_users').count().get();
    const totalMembers = membersSnapshot.data().count;

    // 2. New This Week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoISO = oneWeekAgo.toISOString();
    
    // web_users joinDate is stored as an ISO string based on the addMember action
    const newMembersSnapshot = await adminDb.collection('web_users')
      .where('joinDate', '>=', oneWeekAgoISO)
      .count()
      .get();
    const newThisWeek = newMembersSnapshot.data().count;

    // 3. Unread Submissions
    const unreadSubsSnapshot = await adminDb.collection('contact_submissions')
      .where('read', '==', false)
      .count()
      .get();
    const unreadSubmissions = unreadSubsSnapshot.data().count;

    // 4. Today Views (Placeholder until actual analytics integration)
    const todayViews = 124; 

    return {
      totalMembers,
      newThisWeek,
      todayViews,
      unreadSubmissions
    };
  } catch (error) {
    console.error('[Server Action Error] Failed to fetch dashboard stats:', error);
    throw new Error('Failed to fetch dashboard stats');
  }
}
