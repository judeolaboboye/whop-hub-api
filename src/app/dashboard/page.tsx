import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import DashboardClient from './DashboardClient';
import { estimateTransactionFinance } from '@/lib/analytics';
import { getLeaderboard, syncDeveloperScore } from '@/app/actions/leaderboard';
import { redirect } from 'next/navigation';

/**
 * Server Component for the Hub Command Center Dashboard
 */
export default async function DashboardPage() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('whop_session_user_id')?.value;

    // 1. Auth Gate: If no session exists, redirect to landing page
    if (!userId) {
        redirect('/');
    }

    // 2. Fetch User & Associated Models from PostgreSQL
    let user = await db.user.findUnique({
        where: { id: userId },
        include: {
            apps: {
                include: {
                    customers: true,
                    transactions: {
                        orderBy: { processedAt: 'desc' }
                    }
                }
            }
        }
    });

    if (!user) {
        // Clear broken session and refresh
        return (
            <div className="min-h-screen bg-[#090A0F] text-white flex flex-col items-center justify-center">
                <p className="text-red-400 mb-4">User session not found in database.</p>
                <a href="/api/auth/whop" className="px-4 py-2 bg-amber-500 text-black rounded font-semibold">
                    Re-authenticate
                </a>
            </div>
        );
    }

    // Auto-Upgrade admin to PREMIUM on dashboard load if they are currently on FREE
    const isAdmin = user.email === 'judeolaboboye@gmail.com' || (process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL);
    if (isAdmin && user.tier === 'FREE') {
        user = await db.user.update({
            where: { id: user.id },
            data: { tier: 'PREMIUM' },
            include: {
                apps: {
                    include: {
                        customers: true,
                        transactions: {
                            orderBy: { processedAt: 'desc' }
                        }
                    }
                }
            }
        });
    }

    // 3. Automated Seeder for Initial Demo/Testing Experience
    // If the database is completely empty of apps or transactions, auto-populate mock data
    const totalApps = user.apps.length;
    const totalTransactions = user.apps.reduce((sum, app) => sum + app.transactions.length, 0);

    if (totalApps === 0 || totalTransactions === 0) {
        console.log('[Seeder] Seeding developer database with beautiful metrics...');
        
        // Ensure at least one app exists
        let defaultApp = user.apps[0];
        if (!defaultApp) {
            const createdApp = await db.whopApp.create({
                data: {
                    whopAppId: 'app_sample_chat_hub',
                    appName: 'Sample Community Hub',
                    userId: user.id
                }
            });
            defaultApp = {
                ...createdApp,
                customers: [],
                transactions: []
            };
        }

        // Mock customers & transactions over a 4-month span for cohort charts
        const mockCustomersData = [
            { id: 'c1', email: 'alex@domain.com', cohortMonth: new Date(2026, 2, 1) }, // March
            { id: 'c2', email: 'sarah@domain.com', cohortMonth: new Date(2026, 2, 1) },
            { id: 'c3', email: 'michael@domain.com', cohortMonth: new Date(2026, 2, 1) },
            { id: 'c4', email: 'jessica@domain.com', cohortMonth: new Date(2026, 2, 1) },
            { id: 'c5', email: 'david@domain.com', cohortMonth: new Date(2026, 3, 1) }, // April
            { id: 'c6', email: 'emily@domain.com', cohortMonth: new Date(2026, 3, 1) },
            { id: 'c7', email: 'james@domain.com', cohortMonth: new Date(2026, 3, 1) },
            { id: 'c8', email: 'robert@domain.com', cohortMonth: new Date(2026, 4, 1) }, // May
            { id: 'c9', email: 'linda@domain.com', cohortMonth: new Date(2026, 4, 1) },
        ];

        const mockTransactionsData = [
            // Month 0 transactions (March)
            { customerId: 'c1', gross: 29.99, date: new Date(2026, 2, 5), country: 'US', invoice: 'inv_m1_1' },
            { customerId: 'c2', gross: 29.99, date: new Date(2026, 2, 10), country: 'GB', invoice: 'inv_m1_2' },
            { customerId: 'c3', gross: 29.99, date: new Date(2026, 2, 12), country: 'DE', invoice: 'inv_m1_3' },
            { customerId: 'c4', gross: 29.99, date: new Date(2026, 2, 20), country: 'NG', invoice: 'inv_m1_4' },
            
            // Month 1 renewals (April)
            { customerId: 'c1', gross: 29.99, date: new Date(2026, 3, 5), country: 'US', invoice: 'inv_a1_1' },
            { customerId: 'c2', gross: 29.99, date: new Date(2026, 3, 10), country: 'GB', invoice: 'inv_a1_2' },
            { customerId: 'c3', gross: 29.99, date: new Date(2026, 3, 12), country: 'DE', invoice: 'inv_a1_3' },
            // April signup transactions
            { customerId: 'c5', gross: 49.99, date: new Date(2026, 3, 2), country: 'US', invoice: 'inv_a1_4' },
            { customerId: 'c6', gross: 49.99, date: new Date(2026, 3, 15), country: 'FR', invoice: 'inv_a1_5' },
            { customerId: 'c7', gross: 49.99, date: new Date(2026, 3, 22), country: 'CA', invoice: 'inv_a1_6' },

            // Month 2 renewals (May)
            { customerId: 'c1', gross: 29.99, date: new Date(2026, 4, 5), country: 'US', invoice: 'inv_my1_1' },
            { customerId: 'c2', gross: 29.99, date: new Date(2026, 4, 10), country: 'GB', invoice: 'inv_my1_2' },
            { customerId: 'c5', gross: 49.99, date: new Date(2026, 4, 2), country: 'US', invoice: 'inv_my1_3' },
            { customerId: 'c6', gross: 49.99, date: new Date(2026, 4, 15), country: 'FR', invoice: 'inv_my1_4' },
            // May signups
            { customerId: 'c8', gross: 19.99, date: new Date(2026, 4, 3), country: 'US', invoice: 'inv_my1_5' },
            { customerId: 'c9', gross: 19.99, date: new Date(2026, 4, 28), country: 'NG', invoice: 'inv_my1_6' },

            // Month 3 renewals (June)
            { customerId: 'c1', gross: 29.99, date: new Date(2026, 5, 5), country: 'US', invoice: 'inv_j1_1' },
            { customerId: 'c5', gross: 49.99, date: new Date(2026, 5, 2), country: 'US', invoice: 'inv_j1_2' },
            { customerId: 'c8', gross: 19.99, date: new Date(2026, 5, 3), country: 'US', invoice: 'inv_j1_3' },
        ];

        // Write seeded data to PostgreSQL
        for (const cust of mockCustomersData) {
            const dbCust = await db.customer.upsert({
                where: { whopCustomerId: cust.id },
                update: {},
                create: {
                    whopCustomerId: cust.id,
                    email: cust.email,
                    appId: defaultApp.id,
                    joinedCohortMonth: cust.cohortMonth,
                    status: 'ACTIVE'
                }
            });

            // Associate relevant transactions
            const txs = mockTransactionsData.filter(t => t.customerId === cust.id);
            for (const tx of txs) {
                const fin = estimateTransactionFinance(tx.gross, tx.country);
                await db.transaction.upsert({
                    where: { whopInvoiceId: tx.invoice },
                    update: {},
                    create: {
                        whopInvoiceId: tx.invoice,
                        appId: defaultApp.id,
                        customerId: dbCust.id,
                        grossAmount: tx.gross,
                        netAmount: fin.netAmount,
                        taxAmount: fin.taxAmount,
                        currency: 'usd',
                        countryCode: tx.country,
                        processedAt: tx.date
                    }
                });
            }
        }

        // Re-query database to fetch fresh seeded values
        user = await db.user.findUnique({
            where: { id: userId },
            include: {
                apps: {
                    include: {
                        customers: true,
                        transactions: {
                            orderBy: { processedAt: 'desc' }
                        }
                    }
                }
            }
        }) as any;
    }

    // 4. Flatten queries to feed visual component arrays
    const allApps = user!.apps;
    const allCustomers = allApps.flatMap(a => a.customers);
    const allTransactions = allApps.flatMap(a => a.transactions).sort((a, b) => 
        new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()
    );

    // 3-Month Cutoff for FREE tier
    const isFreeTier = user!.tier === 'FREE';
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 3);

    const filteredTransactions = isFreeTier
        ? allTransactions.filter(t => new Date(t.processedAt) >= cutoffDate)
        : allTransactions;

    // Prepare serialized data props
    const serializedApps = allApps.map(a => {
        const appTxs = isFreeTier
            ? a.transactions.filter(t => new Date(t.processedAt) >= cutoffDate)
            : a.transactions;
        return {
            id: a.id,
            whopAppId: a.whopAppId,
            appName: a.appName,
            customerCount: a.customers.length,
            transactionCount: appTxs.length
        };
    });

    const serializedCustomers = allCustomers.map(c => ({
        id: c.id,
        whopCustomerId: c.whopCustomerId,
        email: c.email,
        appId: c.appId,
        joinedCohortMonth: c.joinedCohortMonth.toISOString(),
        status: c.status,
        name: c.name,
        username: c.username,
        bio: c.bio,
        profilePictureUrl: c.profilePictureUrl
    }));

    const serializedTransactions = filteredTransactions.map(t => {
        const app = allApps.find(a => a.id === t.appId);
        return {
            id: t.id,
            whopInvoiceId: t.whopInvoiceId,
            appId: t.appId,
            appName: app ? app.appName : 'Unknown App',
            customerId: t.customerId,
            grossAmount: Number(t.grossAmount),
            netAmount: Number(t.netAmount),
            taxAmount: Number(t.taxAmount),
            currency: t.currency,
            countryCode: t.countryCode,
            processedAt: t.processedAt.toISOString()
        };
    });

    // Decrypt developer settings if they exist
    let decryptedNotionKey = '';
    let decryptedNotionDb = '';
    let decryptedResendKey = '';

    if (user!.notionApiKey) {
        try {
            const { decryptToken } = await import('@/lib/encryption');
            decryptedNotionKey = decryptToken(user!.notionApiKey);
        } catch (err) {
            console.error('Failed to decrypt notionApiKey:', err);
        }
    }
    if (user!.notionDatabaseId) {
        try {
            const { decryptToken } = await import('@/lib/encryption');
            decryptedNotionDb = decryptToken(user!.notionDatabaseId);
        } catch (err) {
            console.error('Failed to decrypt notionDatabaseId:', err);
        }
    }
    if (user!.resendApiKey) {
        try {
            const { decryptToken } = await import('@/lib/encryption');
            decryptedResendKey = decryptToken(user!.resendApiKey);
        } catch (err) {
            console.error('Failed to decrypt resendApiKey:', err);
        }
    }

    const serializedSettings = {
        notionApiKey: decryptedNotionKey,
        notionDatabaseId: decryptedNotionDb,
        leaderboardOptIn: user!.leaderboardOptIn,
        leaderboardName: user!.leaderboardName || '',
        retentionMonths: user!.retentionMonths,
        tier: user!.tier,
        resendApiKey: decryptedResendKey,
        autoWelcomeEmail: user!.autoWelcomeEmail,
        autoCancelEmail: user!.autoCancelEmail,
        welcomeEmailSubject: user!.welcomeEmailSubject || 'Welcome to the community!',
        welcomeEmailBody: user!.welcomeEmailBody || '',
        cancelEmailSubject: user!.cancelEmailSubject || 'Checking in...',
        cancelEmailBody: user!.cancelEmailBody || '',
    };

    // Synchronize developer standings into the global shared community leaderboard
    try {
        await syncDeveloperScore(user!.id);
    } catch (syncErr) {
        console.error('Failed to auto-sync developer score on dashboard render:', syncErr);
    }

    // Fetch public leaderboard entries
    const leaderboardData = await getLeaderboard();

    return (
        <DashboardClient 
            userEmail={user!.email}
            apps={serializedApps}
            customers={serializedCustomers}
            transactions={serializedTransactions}
            settings={serializedSettings}
            leaderboard={leaderboardData}
        />
    );
}
