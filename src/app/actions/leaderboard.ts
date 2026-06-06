'use server';

import { db } from '@/lib/db';

export interface LeaderboardEntry {
    name: string;
    monthlyEarnings: number;
    yearlyEarnings: number;
    appCount: number;
}

/**
 * Aggregates monthly and yearly earnings for all opt-in developers to show on the community leaderboard.
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
        const optInUsers = await db.user.findMany({
            where: { leaderboardOptIn: true },
            include: {
                apps: {
                    include: {
                        transactions: true
                    }
                }
            }
        });

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const entries: LeaderboardEntry[] = optInUsers.map(user => {
            let monthlyEarnings = 0;
            let yearlyEarnings = 0;

            user.apps.forEach(app => {
                app.transactions.forEach(tx => {
                    const processedDate = new Date(tx.processedAt);
                    const gross = Number(tx.grossAmount);

                    if (processedDate >= startOfMonth) {
                        monthlyEarnings += gross;
                    }
                    if (processedDate >= startOfYear) {
                        yearlyEarnings += gross;
                    }
                });
            });

            // Set display name (use customized leaderboardName or mask their email)
            let displayName = user.leaderboardName || '';
            if (!displayName && user.email) {
                const parts = user.email.split('@');
                const namePart = parts[0];
                displayName = namePart.length > 3 
                    ? `${namePart.slice(0, 3)}***@${parts[1]}` 
                    : `***@${parts[1]}`;
            }

            return {
                name: displayName || 'Anonymous Dev',
                monthlyEarnings: parseFloat(monthlyEarnings.toFixed(2)),
                yearlyEarnings: parseFloat(yearlyEarnings.toFixed(2)),
                appCount: user.apps.length
            };
        });

        // Sort by monthly earnings by default
        return entries.sort((a, b) => b.monthlyEarnings - a.monthlyEarnings);
    } catch (error) {
        console.error('Failed to generate leaderboard:', error);
        return [];
    }
}
