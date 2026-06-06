'use server';

import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { encryptToken } from '@/lib/encryption';

/**
 * Server Action to update the developer's settings (Notion keys, leaderboard settings, retention)
 */
export async function updateUserSettings(data: {
    notionApiKey?: string;
    notionDatabaseId?: string;
    leaderboardOptIn: boolean;
    leaderboardName?: string;
    retentionMonths: number;
}) {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('whop_session_user_id')?.value;

        if (!userId) {
            return { success: false, error: 'Unauthorized: Session missing' };
        }

        // Encrypt Notion API key and Database ID if provided
        let encryptedApiKey: string | null = null;
        let encryptedDbId: string | null = null;

        if (data.notionApiKey && data.notionApiKey.trim() !== '') {
            encryptedApiKey = encryptToken(data.notionApiKey.trim());
        }
        if (data.notionDatabaseId && data.notionDatabaseId.trim() !== '') {
            encryptedDbId = encryptToken(data.notionDatabaseId.trim());
        }

        await db.user.update({
            where: { id: userId },
            data: {
                notionApiKey: encryptedApiKey,
                notionDatabaseId: encryptedDbId,
                leaderboardOptIn: data.leaderboardOptIn,
                leaderboardName: data.leaderboardName?.trim() || null,
                retentionMonths: data.retentionMonths,
            },
        });

        // Perform immediate pruning if retentionMonths > 0
        if (data.retentionMonths > 0) {
            const cutoffDate = new Date();
            cutoffDate.setMonth(cutoffDate.getMonth() - data.retentionMonths);

            const userApps = await db.whopApp.findMany({
                where: { userId },
                select: { id: true }
            });
            const appIds = userApps.map(a => a.id);

            if (appIds.length > 0) {
                await db.transaction.deleteMany({
                    where: {
                        appId: { in: appIds },
                        processedAt: { lt: cutoffDate },
                    },
                });
            }
        }

        return { success: true };
    } catch (error: any) {
        console.error('Failed to update settings:', error);
        return { success: false, error: error.message || 'Database update failed' };
    }
}
