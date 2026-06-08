'use server';

/**
 * Copyright (C) 2026 Jude Victor Olaboboye
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { encryptToken } from '@/lib/encryption';

/**
 * Server Action to update the developer's settings (Notion keys, leaderboard settings, retention, Resend keys)
 */
export async function updateUserSettings(data: {
    notionApiKey?: string;
    notionDatabaseId?: string;
    leaderboardOptIn: boolean;
    leaderboardName?: string;
    retentionMonths: number;
    resendApiKey?: string;
    autoWelcomeEmail: boolean;
    autoCancelEmail: boolean;
    welcomeEmailSubject?: string;
    welcomeEmailBody?: string;
    cancelEmailSubject?: string;
    cancelEmailBody?: string;
}) {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('whop_session_user_id')?.value;

        if (!userId) {
            return { success: false, error: 'Unauthorized: Session missing' };
        }

        // Encrypt Notion API key, Database ID, and Resend API Key if provided
        let encryptedApiKey: string | null = null;
        let encryptedDbId: string | null = null;
        let encryptedResendKey: string | null = null;

        if (data.notionApiKey && data.notionApiKey.trim() !== '') {
            encryptedApiKey = encryptToken(data.notionApiKey.trim());
        }
        if (data.notionDatabaseId && data.notionDatabaseId.trim() !== '') {
            encryptedDbId = encryptToken(data.notionDatabaseId.trim());
        }
        if (data.resendApiKey && data.resendApiKey.trim() !== '') {
            encryptedResendKey = encryptToken(data.resendApiKey.trim());
        }

        await db.user.update({
            where: { id: userId },
            data: {
                notionApiKey: encryptedApiKey,
                notionDatabaseId: encryptedDbId,
                leaderboardOptIn: data.leaderboardOptIn,
                leaderboardName: data.leaderboardName?.trim() || null,
                retentionMonths: data.retentionMonths,
                resendApiKey: encryptedResendKey,
                autoWelcomeEmail: data.autoWelcomeEmail,
                autoCancelEmail: data.autoCancelEmail,
                welcomeEmailSubject: data.welcomeEmailSubject?.trim() || null,
                welcomeEmailBody: data.welcomeEmailBody || null,
                cancelEmailSubject: data.cancelEmailSubject?.trim() || null,
                cancelEmailBody: data.cancelEmailBody || null,
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

/**
 * Wipes out all customer and transaction data associated with the user's apps (Mock data reset)
 */
export async function resetDeveloperDatabase() {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('whop_session_user_id')?.value;

        if (!userId) {
            return { success: false, error: 'Unauthorized: Session missing' };
        }

        const userApps = await db.whopApp.findMany({
            where: { userId },
            select: { id: true }
        });
        const appIds = userApps.map(a => a.id);

        if (appIds.length > 0) {
            // Delete all transactions first due to foreign key constraints
            await db.transaction.deleteMany({
                where: { appId: { in: appIds } }
            });

            // Delete all customers
            await db.customer.deleteMany({
                where: { appId: { in: appIds } }
            });

            // Delete all apps associated with this developer
            await db.whopApp.deleteMany({
                where: { userId }
            });
        }

        return { success: true };
    } catch (error: any) {
        console.error('Failed to reset developer database:', error);
        return { success: false, error: error.message || 'Database reset failed' };
    }
}

/**
 * Upgrades the user's tier to PREMIUM
 */
export async function upgradeUserTier() {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('whop_session_user_id')?.value;

        if (!userId) {
            return { success: false, error: 'Unauthorized: Session missing' };
        }

        await db.user.update({
            where: { id: userId },
            data: { tier: 'PREMIUM' }
        });

        return { success: true };
    } catch (error: any) {
        console.error('Failed to upgrade user tier:', error);
        return { success: false, error: error.message || 'Upgrade failed' };
    }
}
