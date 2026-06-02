import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import DashboardClient from './DashboardClient';
import { estimateTransactionFinance } from '@/lib/analytics';

/**
 * Server Component for the Hub Command Center Dashboard
 */
export default async function DashboardPage() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('whop_session_user_id')?.value;

    // 1. Auth Gate: If no session exists, render a premium onboarding page
    if (!userId) {
        return (
            <div className="relative min-h-screen bg-[#090A0F] text-white flex flex-col items-center justify-center px-4 overflow-hidden font-sans">
                {/* Visual Glow Gradients */}
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

                <div className="relative max-w-2xl w-full text-center space-y-8 z-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1b1c26] border border-white/5 text-xs text-amber-400 font-medium tracking-wide">
                            ✨ THE WHOP NEXUS ARCHITECTURE
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-[#E2E8F0] to-gray-500">
                            Whop Developers Hub
                        </h1>
                        <p className="text-gray-400 text-sm sm:text-lg max-w-lg mx-auto leading-relaxed">
                            A unified analytics command center. Access granular cohort analysis, automated country-specific tax reports, and cross-app metrics.
                        </p>
                    </div>

                    {/* Feature Highlights Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto text-left">
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                            <div className="text-amber-400 text-lg mb-1">📊</div>
                            <h3 className="text-sm font-semibold mb-1">Cohort Retention</h3>
                            <p className="text-xs text-gray-500">Track Month-over-Month subscriber retention cohorts.</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                            <div className="text-amber-400 text-lg mb-1">💸</div>
                            <h3 className="text-sm font-semibold mb-1">Tax Accounting</h3>
                            <p className="text-xs text-gray-500">Automated UK/EU VAT and US sales tax estimates.</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                            <div className="text-amber-400 text-lg mb-1">🔌</div>
                            <h3 className="text-sm font-semibold mb-1">Multi-App Sync</h3>
                            <p className="text-xs text-gray-500">Centralized ledger connecting all Whop Mini Apps.</p>
                        </div>
                    </div>

                    <div>
                        <a
                            href="/api/auth/whop"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-sm transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-amber-500/10 active:scale-[0.98]"
                        >
                            Connect with Whop Account
                        </a>
                        <p className="text-xs text-gray-500 mt-3">Secure OAuth 2.1 PKCE authorization</p>
                    </div>
                </div>
            </div>
        );
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

    // Prepare serialized data props
    const serializedApps = allApps.map(a => ({
        id: a.id,
        whopAppId: a.whopAppId,
        appName: a.appName,
        customerCount: a.customers.length,
        transactionCount: a.transactions.length
    }));

    const serializedCustomers = allCustomers.map(c => ({
        id: c.id,
        whopCustomerId: c.whopCustomerId,
        email: c.email,
        appId: c.appId,
        joinedCohortMonth: c.joinedCohortMonth.toISOString(),
        status: c.status
    }));

    const serializedTransactions = allTransactions.map(t => {
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

    return (
        <DashboardClient 
            userEmail={user!.email}
            apps={serializedApps}
            customers={serializedCustomers}
            transactions={serializedTransactions}
        />
    );
}
