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

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET handler: Returns the global, centralized community standings.
 */
export async function GET() {
    try {
        const entries = await db.sharedLeaderboardEntry.findMany({
            orderBy: {
                monthlyGross: 'desc'
            }
        });

        // Convert Prisma Decimal objects to standard numbers for JSON serialization
        const serialized = entries.map(e => ({
            id: e.id,
            whopUserId: e.whopUserId,
            developerName: e.developerName,
            monthlyGross: Number(e.monthlyGross),
            yearlyGross: Number(e.yearlyGross),
            updatedAt: e.updatedAt.toISOString()
        }));

        return NextResponse.json(serialized);
    } catch (error: any) {
        console.error('Failed to fetch global leaderboard:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
}

/**
 * POST handler: Syncs local developer standings into the global community table.
 * If the user has opted out, deletes their entry.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { whopUserId, developerName, monthlyGross, yearlyGross, isDelete } = body;

        if (!whopUserId) {
            return NextResponse.json({ error: 'Missing whopUserId parameter' }, { status: 400 });
        }

        // If developer opted out, delete their record from the global community leaderboard
        if (isDelete) {
            await db.sharedLeaderboardEntry.deleteMany({
                where: { whopUserId }
            });
            return NextResponse.json({ success: true, message: 'Removed developer entry from community leaderboard' });
        }

        if (!developerName || monthlyGross === undefined || yearlyGross === undefined) {
            return NextResponse.json({ error: 'Missing parameters for leaderboard update' }, { status: 400 });
        }

        // Upsert developer details into the shared table
        const entry = await db.sharedLeaderboardEntry.upsert({
            where: { whopUserId },
            update: {
                developerName,
                monthlyGross: Number(monthlyGross),
                yearlyGross: Number(yearlyGross),
                updatedAt: new Date()
            },
            create: {
                whopUserId,
                developerName,
                monthlyGross: Number(monthlyGross),
                yearlyGross: Number(yearlyGross),
                updatedAt: new Date()
            }
        });

        return NextResponse.json({ success: true, entryId: entry.id });
    } catch (error: any) {
        console.error('Failed to sync global leaderboard:', error);
        return NextResponse.json({ error: 'Failed to sync leaderboard' }, { status: 500 });
    }
}
