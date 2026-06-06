import React from 'react';

/**
 * Onboarding and setup documentation page for Whop Central Hub
 */
export default function DocsPage() {
    return (
        <div className="min-h-screen bg-[#07080C] text-white flex flex-col font-sans pb-20">
            {/* Visual background glow */}
            <div className="absolute top-[-10%] left-[10%] w-[60%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[10%] w-[50%] h-[40%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />

            {/* HEADER */}
            <header className="border-b border-white/[0.04] bg-[#0A0B10]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-black font-extrabold text-lg">
                        W
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Whop Nexus Hub Documentation</h1>
                        <p className="text-[10px] text-gray-500 tracking-wide">Developer Onboarding & Setup Guide</p>
                    </div>
                </div>
                <a 
                    href="/dashboard" 
                    className="px-4 py-2 rounded-lg border border-white/5 bg-[#14151f] hover:bg-[#1a1c29] text-xs font-semibold transition"
                >
                    Back to Dashboard →
                </a>
            </header>

            {/* MAIN CONTENT CONTAINER */}
            <main className="max-w-4xl w-full mx-auto px-6 pt-10 space-y-12 relative z-10">
                
                {/* HERO SECTION */}
                <div className="space-y-4 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                        Quick-Start Manual
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
                        Deploying & Syncing your Apps
                    </h2>
                    <p className="text-gray-400 text-sm sm:text-base max-w-2xl leading-relaxed">
                        Welcome to the Whop Central Hub developer manuals. Below you will find step-by-step instructions to hook your Whop Mini Apps into the live shared hub, or set up your own self-hosted private command center.
                      </p>
                </div>

                {/* THE CORE FEATURES */}
                <section className="space-y-6">
                    <h3 className="text-lg font-bold border-b border-white/5 pb-2 text-amber-400">💡 Glorified Core Capabilities</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-5 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-2">
                            <h4 className="text-sm font-semibold text-gray-200">📊 Granular Cohort Analysis</h4>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Tracks signup groups month-over-month, showing retention and active subscription lifecycles to calculate accurate customer lifetime value (LTV).
                            </p>
                        </div>
                        <div className="p-5 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-2">
                            <h4 className="text-sm font-semibold text-gray-200">💸 Automated Country VAT/Sales Tax</h4>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Automatically detects the purchaser's billing country and calculates estimated tax liability (EU/UK VAT, US Sales tax, Nigeria 7.5% VAT) for QuickBooks and Xero bookkeeping.
                            </p>
                        </div>
                        <div className="p-5 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-2">
                            <h4 className="text-sm font-semibold text-gray-200">🔑 Encrypted Notion CRM Sync</h4>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Synchronizes app installs to Notion databases. Developer credentials are encrypted in PostgreSQL using AES-256-GCM.
                            </p>
                        </div>
                        <div className="p-5 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-2">
                            <h4 className="text-sm font-semibold text-gray-200">✉️ SMTP Gmail Welcomes</h4>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Fires beautiful automated welcoming email campaigns to new customers immediately upon app activation.
                            </p>
                        </div>
                    </div>
                </section>

                {/* OPTION A: HOSTED HUB SETUP */}
                <section className="p-6 rounded-xl bg-[#0A0B10] border border-white/[0.04] space-y-6">
                    <div className="space-y-1">
                        <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold">Recommended Flow</span>
                        <h3 className="text-xl font-bold text-white">Option A: Using the Live Hosted Hub</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Connect your applications to the central hub without running any database infrastructure or server environments.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs shrink-0 text-amber-400">1</div>
                            <div className="space-y-1.5">
                                <h4 className="text-sm font-semibold text-gray-200">Log in via Whop OAuth</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Navigate to <a href="/dashboard" className="text-amber-400 hover:underline">/dashboard</a>, click **Connect with Whop Account**, and authorize your business profile.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs shrink-0 text-amber-400">2</div>
                            <div className="space-y-1.5">
                                <h4 className="text-sm font-semibold text-gray-200">Configure your personal Notion database</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Navigate to the **Settings & CRM** tab. Input your **Notion API Key** and **Notion Database ID**. This creates your own isolated workspace in the CRM—no data is shared or visible to others.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs shrink-0 text-amber-400">3</div>
                            <div className="space-y-1.5">
                                <h4 className="text-sm font-semibold text-gray-200">Use the Mini-App Code Generator</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Go to the **Mini-App Code Generator** tab. Choose your app from the dropdown, copy the generated Server Action block, and paste it into your Next.js project. It calls the sync endpoint dynamically:
                                </p>
                                <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-[10px] text-amber-300">
                                    POST https://hub-api-taupe.vercel.app/api/hub/notion-sync
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* OPTION B: SELF-HOSTING MANUAL */}
                <section className="p-6 rounded-xl bg-[#0A0B10] border border-white/[0.04] space-y-6">
                    <div className="space-y-1">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Infrastructure Owners</span>
                        <h3 className="text-xl font-bold text-white">Option B: Self-Hosting From Scratch</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Run a completely private version of the command center on your own servers and database.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs shrink-0 text-amber-400">1</div>
                            <div className="space-y-1.5">
                                <h4 className="text-sm font-semibold text-gray-200">Provision database storage on CockroachDB Serverless</h4>
                                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                                    We highly recommend using **CockroachDB Serverless** instead of standard Neon/Supabase free tiers. 
                                    * **Neon/Supabase Free**: Restricted to 500MB of storage.
                                    * **CockroachDB Free**: Offers **10 GB** of storage for free (20x larger!). This allows you to scale to tens of millions of database rows without upgrading.
                                    Create a free cluster, select PostgreSQL-compatible mode, and copy the database connection string.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs shrink-0 text-amber-400">2</div>
                            <div className="space-y-1.5">
                                <h4 className="text-sm font-semibold text-gray-200">Set Environment Keys</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Set these environment variables inside your self-hosted `.env` (or in Vercel Project Settings):
                                </p>
                                <ul className="list-disc pl-5 text-xs text-gray-500 space-y-1">
                                    <li>`DATABASE_URL`: Your CockroachDB connection string.</li>
                                    <li>`ENCRYPTION_KEY`: A secure 32-byte (64 hex character) encryption key (run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` in your terminal to generate one).</li>
                                    <li>`NEXT_PUBLIC_WHOP_APP_ID` & `WHOP_CLIENT_SECRET`: App credentials from your Whop Developer app dashboard settings.</li>
                                    <li>`NEXT_PUBLIC_WHOP_REDIRECT_URI`: Set to `https://your-domain.vercel.app/api/auth/callback/whop`.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs shrink-0 text-amber-400">3</div>
                            <div className="space-y-1.5">
                                <h4 className="text-sm font-semibold text-gray-200">Deploy and Migrate Schema</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Deploy your Next.js project to Vercel and run these database commands to build your tables:
                                </p>
                                <div className="p-3.5 rounded-lg bg-black/40 border border-white/5 font-mono text-[10px] text-gray-300">
                                    npx prisma generate<br/>
                                    npx prisma db push
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SPACE OPTIMIZATION & PRUNING */}
                <section className="space-y-4">
                    <h3 className="text-lg font-bold border-b border-white/5 pb-2 text-amber-400">⚙️ Space Management & Auto-Pruning</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        To maintain a clean database footprint and prevent hitting storage caps, go to **Settings & CRM** inside your dashboard. 
                        Under **Database Storage & Retention Policy**, you can configure the data retention time. Selecting "6 Months" will automatically delete all transactional logs older than 6 months for your account on login, freeing up space while keeping your dashboard metrics accurate.
                    </p>
                </section>
                
            </main>
        </div>
    );
}
