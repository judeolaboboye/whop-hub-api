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
