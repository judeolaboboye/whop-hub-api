import { cookies } from "next/headers";
import Link from "next/link";

/**
 * Premium onboarding and landing homepage for the Whop Developers Hub
 */
export default async function Home() {
    const cookieStore = await cookies();
    const userId = cookieStore.get("whop_session_user_id")?.value;
    const isLoggedIn = !!userId;

    return (
        <div className="relative min-h-screen bg-[#090A0F] text-white flex flex-col justify-between overflow-hidden font-sans">
            {/* Ambient Background Lights */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

            {/* HEADER */}
            <header className="border-b border-white/[0.04] bg-[#0A0B10]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-black font-extrabold text-lg">
                        W
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Whop Nexus Hub</h1>
                        <p className="text-[10px] text-gray-500 tracking-wide">Command Center & Analytics</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Link
                        href="/docs"
                        className="text-xs text-gray-400 hover:text-white font-medium transition"
                    >
                        📚 Docs
                    </Link>
                    {isLoggedIn ? (
                        <>
                            <Link
                                href="/dashboard"
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-semibold transition"
                            >
                                Dashboard →
                            </Link>
                            <a
                                href="/api/auth/logout"
                                className="px-3 py-2 rounded-lg border border-red-500/20 bg-red-950/20 text-red-400 text-xs font-semibold hover:bg-red-900/30 hover:border-red-500/30 transition"
                            >
                                🚪 Log Out
                            </a>
                        </>
                    ) : (
                        <a
                            href="/api/auth/whop"
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-semibold transition"
                        >
                            Connect Account
                        </a>
                    )}
                </div>
            </header>

            {/* HERO SECTION */}
            <main className="flex-1 flex flex-col items-center justify-center max-w-4xl w-full mx-auto px-6 py-16 text-center space-y-12 relative z-10">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1b1c26] border border-white/5 text-xs text-amber-400 font-medium tracking-wide mx-auto">
                        ✨ THE WHOP NEXUS ARCHITECTURE
                    </div>
                    <h2 className="text-4xl sm:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-[#E2E8F0] to-gray-500 max-w-2xl mx-auto leading-tight">
                        Your Whop Apps, Unified in One Hub.
                    </h2>
                    <p className="text-gray-400 text-sm sm:text-lg max-w-lg mx-auto leading-relaxed">
                        A premium developer command center. Access granular cohort retention analysis, automated country sales-tax estimation, and private Notion CRM syncing.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md mx-auto">
                    {isLoggedIn ? (
                        <>
                            <Link
                                href="/dashboard"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-sm transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-amber-500/10 active:scale-[0.98]"
                            >
                                Enter Command Dashboard
                            </Link>
                            <Link
                                href="/docs"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/10 bg-[#14151f] hover:bg-[#1a1c29] text-gray-300 font-semibold text-sm transition"
                            >
                                Setup Instructions
                            </Link>
                        </>
                    ) : (
                        <>
                            <a
                                href="/api/auth/whop"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-sm transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-amber-500/10 active:scale-[0.98]"
                            >
                                Connect with Whop Account
                            </a>
                            <Link
                                href="/docs"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/10 bg-[#14151f] hover:bg-[#1a1c29] text-gray-300 font-semibold text-sm transition"
                            >
                                View Documentation
                            </Link>
                        </>
                    )}
                </div>

                {/* Feature Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto text-left pt-6">
                    <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-2 hover:bg-white/[0.04] transition duration-300">
                        <div className="text-amber-400 text-xl">📊</div>
                        <h3 className="text-sm font-semibold text-gray-200">Cohort Retention Analysis</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Analyze user lifecycles month-over-month. Know exactly how long members remain subscribed and when they churn.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-2 hover:bg-white/[0.04] transition duration-300">
                        <div className="text-amber-400 text-xl">💸</div>
                        <h3 className="text-sm font-semibold text-gray-200">VAT & Sales Tax Estimation</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Automatically parses billing country codes and calculates UK/EU VAT, US sales tax, and local estimations for QuickBooks.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-2 hover:bg-white/[0.04] transition duration-300">
                        <div className="text-amber-400 text-xl">🔌</div>
                        <h3 className="text-sm font-semibold text-gray-200">Private Notion CRM Sync</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Encrypt your credentials to sync new activations into your personal Notion CRM database in real time.
                        </p>
                    </div>
                </div>
            </main>

            {/* FOOTER */}
            <footer className="border-t border-white/[0.04] bg-[#0A0B10]/40 px-6 py-6 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-4">
                <div>
                    © {new Date().getFullYear()} Whop Central Hub. All rights reserved.
                </div>
                <div className="flex items-center gap-6">
                    <a
                        href="/docs"
                        className="hover:text-gray-300 transition"
                    >
                        Developer Guides
                    </a>
                    <a
                        href="https://x.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-amber-400 font-semibold transition"
                    >
                        💬 DM the Developer on X
                    </a>
                </div>
            </footer>
        </div>
    );
}
