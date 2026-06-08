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

import { db } from '@/lib/db';

export interface LeaderboardEntry {
    name: string;
    monthlyEarnings: number;
    yearlyEarnings: number;
    appCount: number;
}

const CENTRAL_HUB_URL = process.env.NEXT_PUBLIC_CENTRAL_HUB_URL || 'https://hub-api-taupe.vercel.app';

/**
 * Fetches the global, centralized community standings from Nexus Hub.
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
        const response = await fetch(`${CENTRAL_HUB_URL}/api/hub/leaderboard-sync`, {
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch from Nexus Hub: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Map central SharedLeaderboardEntry format to Dashboard LeaderboardEntry format
        return data.map((e: any) => ({
            name: e.developerName,
            monthlyEarnings: e.monthlyGross,
            yearlyEarnings: e.yearlyGross,
            appCount: 1 // Combined metrics
        })).sort((a: any, b: any) => b.monthlyEarnings - a.monthlyEarnings);
    } catch (error) {
        console.error('Failed to get community leaderboard from Nexus Hub:', error);
        
        // Fallback: Query local standings if central server is offline
        try {
            const localEntries = await db.sharedLeaderboardEntry.findMany({
                orderBy: { monthlyGross: 'desc' }
            });
            return localEntries.map(e => ({
                name: e.developerName,
                monthlyEarnings: Number(e.monthlyGross),
                yearlyEarnings: Number(e.yearlyGross),
                appCount: 1
            }));
        } catch (localErr) {
            console.error('Local leaderboard fallback query failed:', localErr);
            return [];
        }
    }
}

/**
 * Pushes the developer's calculated earnings to the central community scoreboard.
 */
export async function syncDeveloperScore(userId: string): Promise<boolean> {
    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            include: {
                apps: {
                    include: {
                        transactions: true
                    }
                }
            }
        });

        if (!user) return false;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

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
        if (!displayName) {
            displayName = 'Anonymous Dev';
        }

        // Post data to the centralized leaderboard API
        const payload = {
            whopUserId: user.whopUserId,
            developerName: displayName,
            monthlyGross: parseFloat(monthlyEarnings.toFixed(2)),
            yearlyGross: parseFloat(yearlyEarnings.toFixed(2)),
            isDelete: !user.leaderboardOptIn // Delete if opted out
        };

        const response = await fetch(`${CENTRAL_HUB_URL}/api/hub/leaderboard-sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error('Failed to post developer score to central leaderboard:', response.statusText);
            // Continue to save locally even if central sync fails
        }

        // Save local copy
        if (user.leaderboardOptIn) {
            await db.sharedLeaderboardEntry.upsert({
                where: { whopUserId: user.whopUserId },
                update: {
                    developerName: displayName,
                    monthlyGross: monthlyEarnings,
                    yearlyGross: yearlyEarnings
                },
                create: {
                    whopUserId: user.whopUserId,
                    developerName: displayName,
                    monthlyGross: monthlyEarnings,
                    yearlyGross: yearlyEarnings
                }
            });
        } else {
            await db.sharedLeaderboardEntry.deleteMany({
                where: { whopUserId: user.whopUserId }
            });
        }

        return true;
    } catch (error) {
        console.error('Failed to sync developer score:', error);
        return false;
    }
}
