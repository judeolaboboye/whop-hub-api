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
                </div>                {/* VIDEO WALKTHROUGH */}
                <div className="p-4 rounded-xl border border-white/[0.04] bg-[#0A0B10]/50 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">📺 Video Setup Guide</h3>
                    <div className="aspect-video w-full rounded-lg border border-white/5 bg-black/40 flex flex-col items-center justify-center p-6 text-center space-y-3">
                        <span className="text-3xl">🎥</span>
                        <h4 className="text-xs font-semibold text-gray-300">YouTube Setup &amp; Mini-App Walkthrough Guide</h4>
                        <p className="text-[10px] text-gray-500 max-w-md leading-relaxed mx-auto">
                            Watch detailed, step-by-step videos on how to build and integrate Whop Mini Apps into the central hub, duplicate Notion CRM templates, and spin up serverless databases.
                        </p>
                        <a 
                            href="https://www.youtube.com/@nirvanaxjude"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition"
                        >
                            📺 Watch &amp; Learn on YouTube
                        </a>
                    </div>
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
                            <div className="space-y-3.5 w-full">
                                <h4 className="text-sm font-semibold text-gray-200">Configure your personal Notion database</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Navigate to the **Settings & CRM** tab. Input your **Notion API Key** and **Notion Database ID**. This creates your own isolated workspace in the CRM—no data is shared or visible to others.
                                </p>

                                <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-lg text-xs space-y-2">
                                    <span className="font-semibold text-amber-400 block">📋 How to Duplicate &amp; Configure the Template:</span>
                                    <ol className="list-decimal pl-5 text-[11px] text-gray-300 space-y-1.5">
                                        <li>
                                            Open our official <a href="https://judeolaboboye.notion.site/3777e430a0a680ab804adb53a0c6ffbd?v=3777e430a0a68023a339000c3f84d4da&amp;source=copy_link" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline font-semibold hover:text-amber-300">Notion CRM Database Template</a>.
                                        </li>
                                        <li>
                                            Click the <strong>Duplicate</strong> button in the top right corner of the page to copy it to your own Notion workspace.
                                        </li>
                                        <li>
                                            Go to the <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline font-semibold hover:text-amber-300">Notion Integrations Dashboard</a> and click <strong>Create new integration</strong>. Choose the workspace containing your duplicated database.
                                        </li>
                                        <li>
                                            Go to your duplicated database page settings in Notion, click <strong>Connect to</strong> and select your newly created integration to grant it API permissions.
                                        </li>
                                        <li>
                                            Copy the <strong>Internal Integration Token</strong> (this is your Notion API Key) and the <strong>Database ID</strong> (found in the URL of your database, e.g., <code>https://www.notion.so/WORKSPACE/DATABASE_ID?v=...</code>).
                                        </li>
                                        <li>
                                            Paste these details in the **Settings** tab of your dashboard.
                                        </li>
                                    </ol>
                                </div>
                                
                                {/* Mapped Columns table */}
                                <div className="mt-4 p-4 rounded-lg bg-black/30 border border-white/5 space-y-2.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">Notion Database Column Configuration</span>
                                    <p className="text-[10px] text-gray-500 leading-relaxed">
                                        The duplicated template already contains the exact column structure. If creating manually, ensure these exact column headers and property types match:
                                    </p>
                                    <div className="overflow-x-auto rounded border border-white/[0.04]">
                                        <table className="w-full border-collapse text-[10px] text-left text-gray-400 min-w-[350px]">
                                            <thead>
                                                <tr className="bg-white/[0.02] text-gray-300 font-bold border-b border-white/[0.04]">
                                                    <th className="p-2 border-r border-white/[0.04]">Column Name</th>
                                                    <th className="p-2">Notion Type</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/[0.02]">
                                                <tr>
                                                    <td className="p-2 border-r border-white/[0.04] font-mono text-amber-400">App_Source</td>
                                                    <td className="p-2">Title (Default First Column)</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-2 border-r border-white/[0.04] font-mono text-amber-400">App_User's_FirstName</td>
                                                    <td className="p-2">Text</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-2 border-r border-white/[0.04] font-mono text-amber-400">User_Tier</td>
                                                    <td className="p-2">Select (e.g. Trial, Paid, Commission-based)</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-2 border-r border-white/[0.04] font-mono text-amber-400">Email</td>
                                                    <td className="p-2">Email</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-2 border-r border-white/[0.04] font-mono text-amber-400">Whop_User_ID </td>
                                                    <td className="p-2">Text *(Note the trailing space)*</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-2 border-r border-white/[0.04] font-mono text-amber-400">Niche/Category</td>
                                                    <td className="p-2">Text</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-2 border-r border-white/[0.04] font-mono text-amber-400">User's_App_Usage&amp;Log</td>
                                                    <td className="p-2">URL</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-2 border-r border-white/[0.04] font-mono text-amber-400">Last_Activity</td>
                                                    <td className="p-2">Date</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
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
                            <div className="space-y-1.5 w-full">
                                <h4 className="text-sm font-semibold text-gray-200">Provision database storage on CockroachDB Serverless</h4>
                                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                                    We highly recommend using **CockroachDB Serverless** instead of standard Neon/Supabase free tiers. 
                                    * **Neon/Supabase Free**: Restricted to 500MB of storage.
                                    * **CockroachDB Free**: Offers **10 GB** of storage for free (20x larger!). This allows you to scale to tens of millions of database rows without upgrading.
                                </p>

                                <div className="p-3.5 bg-white/[0.01] border border-white/5 rounded-lg text-xs space-y-2">
                                    <span className="font-semibold text-amber-400 block">🛠️ Step-by-Step CockroachDB Provisioning:</span>
                                    <ol className="list-decimal pl-5 text-[11px] text-gray-400 space-y-1.5">
                                        <li>
                                            Go to <a href="https://cockroachlabs.cloud" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline font-semibold hover:text-amber-300">Cockroach Labs Console</a> and sign up for a free account.
                                        </li>
                                        <li>
                                            Click <strong>Create Cluster</strong>. Select <strong>Serverless</strong> (Free Tier).
                                        </li>
                                        <li>
                                            Select your cloud provider (e.g. AWS or GCP) and a region closest to your Vercel deployment.
                                        </li>
                                        <li>
                                            Click <strong>Create Cluster</strong>. Wait a few seconds for the cluster to initialize.
                                        </li>
                                        <li>
                                            Create a database SQL user (e.g., <code>nexus_admin</code>) and generate a secure password.
                                        </li>
                                        <li>
                                            Select <strong>Prisma</strong> or <strong>General connection string</strong> under the Connection window. Copy the database URL. It will look like this:
                                            <code className="block mt-1 p-2 bg-black/40 rounded border border-white/5 text-[10px] text-amber-300 font-mono break-all">
                                                postgresql://nexus_admin:YOUR_PASSWORD@YOUR_HOST:26257/defaultdb?sslmode=verify-full
                                            </code>
                                        </li>
                                        <li>
                                            Add this connection string as the <code>DATABASE_URL</code> environment variable in your Vercel project or local <code>.env.local</code>.
                                        </li>
                                    </ol>
                                </div>

                                {/* Storage Math and Capacity calculations */}
                                <div className="mt-3 p-4 rounded-lg bg-black/30 border border-white/5 space-y-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">📊 Shared Storage Math &amp; Scaling Limits</span>
                                    <div className="text-[10px] text-gray-400 leading-relaxed space-y-2.5">
                                        <p>
                                            Because user, app, and transaction tables store text and numbers, a single transaction record combined with customer data and indexes takes approximately **1.5 KB** of database space.
                                        </p>
                                        <p className="font-semibold text-gray-300">
                                            10 GB of Storage = 10,000,000 Kilobytes (approx. 6.6 Million customer transaction logs).
                                        </p>
                                        
                                        <div className="border-t border-white/5 pt-2">
                                            <p className="font-semibold text-amber-400 mb-1">Scaling Scenario: 10-20 Apps per Member with High Volume</p>
                                            <ul className="list-disc pl-4 space-y-1">
                                                <li>Suppose you host this live as a shared service for **100 active members (developers)**.</li>
                                                <li>Each developer hosts **15 Whop apps** (1,500 apps total).</li>
                                                <li>Each app processes **1,000 monthly transactions/activations** (totaling 1.5 Million transactions/month across the platform).</li>
                                                <li>This high-volume traffic generates: <code>1.5M * 1.5 KB</code> = **2.25 GB** of storage space per month.</li>
                                                <li>Without pruning, the 10 GB free tier would fill up in **4.4 months**.</li>
                                            </ul>
                                        </div>

                                        <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                            <p className="font-bold">🛡️ How Auto-Pruning Saves the Free Tier:</p>
                                            <p className="text-[9px] mt-0.5 leading-relaxed">
                                                With the built-in **Auto-Pruning retention setting** configured to **3 Months**, old logs are deleted automatically on login. The database size caps at <code>3 * 2.25 GB = 6.75 GB</code> (well under the 10 GB limit), allowing the system to run on the **free tier indefinitely** without ever running out of space!
                                            </p>
                                        </div>
                                    </div>
                                </div>
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
