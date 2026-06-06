'use client';

import React, { useState, useMemo } from 'react';
import { calculateCohorts, generateBookkeepingCSV } from '@/lib/analytics';
import { updateUserSettings } from '@/app/actions/settings';

interface AppProp {
    id: string;
    whopAppId: string;
    appName: string;
    customerCount: number;
    transactionCount: number;
}

interface CustomerProp {
    id: string;
    whopCustomerId: string;
    email: string;
    appId: string;
    joinedCohortMonth: string;
    status: string;
}

interface TransactionProp {
    id: string;
    whopInvoiceId: string;
    appId: string;
    appName: string;
    customerId: string;
    grossAmount: number;
    netAmount: number;
    taxAmount: number;
    currency: string;
    countryCode: string;
    processedAt: string;
}

interface UserSettingsProp {
    notionApiKey: string;
    notionDatabaseId: string;
    leaderboardOptIn: boolean;
    leaderboardName: string;
    retentionMonths: number;
}

interface LeaderboardEntryProp {
    name: string;
    monthlyEarnings: number;
    yearlyEarnings: number;
    appCount: number;
}

interface DashboardClientProps {
    userEmail: string;
    apps: AppProp[];
    customers: CustomerProp[];
    transactions: TransactionProp[];
    settings: UserSettingsProp;
    leaderboard: LeaderboardEntryProp[];
}

/**
 * Premium Command Center Client dashboard with charts, settings, leaderboard, cohorts, and bookkeeping ledger
 */
export default function DashboardClient({
    userEmail,
    apps,
    customers,
    transactions,
    settings,
    leaderboard,
}: DashboardClientProps) {
    const [selectedAppId, setSelectedAppId] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<'overview' | 'cohorts' | 'ledger' | 'generator' | 'leaderboard' | 'settings'>('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('all');
    const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);

    // Settings Form States
    const [notionApiKey, setNotionApiKey] = useState(settings.notionApiKey || '');
    const [notionDatabaseId, setNotionDatabaseId] = useState(settings.notionDatabaseId || '');
    const [leaderboardOptIn, setLeaderboardOptIn] = useState(settings.leaderboardOptIn);
    const [leaderboardName, setLeaderboardName] = useState(settings.leaderboardName || '');
    const [retentionMonths, setRetentionMonths] = useState(settings.retentionMonths);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // Leaderboard Toggle (Monthly vs Yearly)
    const [leaderboardPeriod, setLeaderboardPeriod] = useState<'monthly' | 'yearly'>('monthly');

    // 1. Filter data based on selected Whop App
    const filteredCustomers = useMemo(() => {
        if (selectedAppId === 'all') return customers;
        return customers.filter(c => c.appId === selectedAppId);
    }, [customers, selectedAppId]);

    const filteredTransactions = useMemo(() => {
        if (selectedAppId === 'all') return transactions;
        return transactions.filter(t => t.appId === selectedAppId);
    }, [transactions, selectedAppId]);

    // 2. Overview Analytics Calculations
    const metrics = useMemo(() => {
        const gross = filteredTransactions.reduce((sum, t) => sum + t.grossAmount, 0);
        const net = filteredTransactions.reduce((sum, t) => sum + t.netAmount, 0);
        const tax = filteredTransactions.reduce((sum, t) => sum + t.taxAmount, 0);
        const totalCust = filteredCustomers.length;
        const activeCust = filteredCustomers.filter(c => c.status === 'ACTIVE').length;
        const churnedCust = filteredCustomers.filter(c => c.status === 'CHURNED' || c.status === 'CANCELLED').length;
        const churnRate = totalCust > 0 ? parseFloat(((churnedCust / totalCust) * 100).toFixed(1)) : 0;

        return {
            gross: parseFloat(gross.toFixed(2)),
            net: parseFloat(net.toFixed(2)),
            tax: parseFloat(tax.toFixed(2)),
            totalCustomers: totalCust,
            activeCustomers: activeCust,
            churnRate,
        };
    }, [filteredTransactions, filteredCustomers]);

    // 2.5 Revenue Share by App and Country Calculations
    const revenueByApp = useMemo(() => {
        const appMap: Record<string, { name: string; gross: number }> = {};
        filteredTransactions.forEach(t => {
            if (!appMap[t.appId]) {
                appMap[t.appId] = { name: t.appName, gross: 0 };
            }
            appMap[t.appId].gross += t.grossAmount;
        });
        const totalGross = Object.values(appMap).reduce((sum, item) => sum + item.gross, 0);
        return Object.entries(appMap)
            .map(([id, item]) => ({
                id,
                name: item.name,
                gross: parseFloat(item.gross.toFixed(2)),
                percentage: totalGross > 0 ? Math.round((item.gross / totalGross) * 100) : 0,
            }))
            .sort((a, b) => b.gross - a.gross);
    }, [filteredTransactions]);

    const revenueByCountry = useMemo(() => {
        const countryMap: Record<string, number> = {};
        filteredTransactions.forEach(t => {
            const country = t.countryCode.toUpperCase() || 'UNKNOWN';
            countryMap[country] = (countryMap[country] || 0) + t.grossAmount;
        });
        const totalGross = Object.values(countryMap).reduce((sum, gross) => sum + gross, 0);
        return Object.entries(countryMap)
            .map(([country, gross]) => ({
                country,
                gross: parseFloat(gross.toFixed(2)),
                percentage: totalGross > 0 ? Math.round((gross / totalGross) * 100) : 0,
            }))
            .sort((a, b) => b.gross - a.gross)
            .slice(0, 5); // top 5
    }, [filteredTransactions]);

    const dynamicOrigin = useMemo(() => {
        if (typeof window !== 'undefined') {
            return window.location.origin;
        }
        return 'https://hub-api-taupe.vercel.app';
    }, []);

    // 2.8 12-Month Multi-App SVG Trend Charts Calculation
    const chartData = useMemo(() => {
        const months: { key: string; label: string; apps: Record<string, number>; total: number }[] = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
                label: date.toLocaleString('default', { month: 'short' }),
                apps: {} as Record<string, number>,
                total: 0
            });
        }

        filteredTransactions.forEach(t => {
            const txDate = new Date(t.processedAt);
            const key = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
            const monthObj = months.find(m => m.key === key);
            if (monthObj) {
                const gross = t.grossAmount;
                monthObj.total += gross;
                monthObj.apps[t.appId] = (monthObj.apps[t.appId] || 0) + gross;
            }
        });

        return months;
    }, [filteredTransactions]);

    // Plot values for SVG chart drawing
    const svgChartConfig = useMemo(() => {
        const width = 800;
        const height = 240;
        const padding = 35;

        const maxVal = Math.max(...chartData.map(d => d.total), 100);

        const getX = (index: number) => padding + (index * (width - 2 * padding)) / (chartData.length - 1);
        const getY = (val: number) => height - padding - (val * (height - 2 * padding)) / maxVal;

        const gridLines = [0, 0.25, 0.5, 0.75, 1].map(pct => {
            const val = pct * maxVal;
            const y = getY(val);
            return { y, val: Math.round(val) };
        });

        const overallPath = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.total)}`).join(' ');

        // Individual lines for specific apps (shown when "all" is selected)
        const colors = [
            'stroke-amber-500', 
            'stroke-emerald-500', 
            'stroke-blue-500', 
            'stroke-pink-500', 
            'stroke-purple-500'
        ];
        const appPaths = apps.map((app, idx) => {
            const colorClass = colors[idx % colors.length];
            const path = chartData.map((d, i) => {
                const val = d.apps[app.id] || 0;
                return `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`;
            }).join(' ');

            return {
                id: app.id,
                name: app.appName,
                colorClass,
                path
            };
        });

        return {
            width,
            height,
            padding,
            getX,
            getY,
            gridLines,
            overallPath,
            appPaths
        };
    }, [chartData, apps]);

    // 3. Dynamic Cohort Matrices calculation
    const cohortRows = useMemo(() => {
        const formatCustomers = filteredCustomers.map(c => ({
            id: c.id,
            joinedCohortMonth: new Date(c.joinedCohortMonth),
        }));
        const formatTransactions = filteredTransactions.map(t => ({
            customerId: t.customerId,
            processedAt: new Date(t.processedAt),
        }));

        return calculateCohorts(formatCustomers, formatTransactions);
    }, [filteredCustomers, filteredTransactions]);

    // 4. Ledger Searching and Filtering
    const countryList = useMemo(() => {
        const countries = new Set(transactions.map(t => t.countryCode.toUpperCase()));
        return Array.from(countries).sort();
    }, [transactions]);

    const searchedTransactions = useMemo(() => {
        return filteredTransactions.filter(t => {
            const matchesSearch = 
                t.whopInvoiceId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                t.appName.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesCountry = selectedCountry === 'all' || t.countryCode.toUpperCase() === selectedCountry.toUpperCase();
            
            return matchesSearch && matchesCountry;
        });
    }, [filteredTransactions, searchQuery, selectedCountry]);

    // 5. CSV Export trigger
    const handleDownloadCSV = () => {
        const exportFormat = searchedTransactions.map(t => ({
            whopInvoiceId: t.whopInvoiceId,
            processedAt: new Date(t.processedAt),
            appName: t.appName,
            grossAmount: t.grossAmount,
            feeAmount: parseFloat((t.grossAmount - t.netAmount - t.taxAmount).toFixed(2)),
            taxAmount: t.taxAmount,
            netAmount: t.netAmount,
            currency: t.currency,
            countryCode: t.countryCode,
        }));

        const csvString = generateBookkeepingCSV(exportFormat);
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `whop_bookkeeping_${selectedAppId === 'all' ? 'all_apps' : 'app'}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 6. Settings Saving Handler
    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveStatus('saving');
        setErrorMessage('');

        const res = await updateUserSettings({
            notionApiKey,
            notionDatabaseId,
            leaderboardOptIn,
            leaderboardName,
            retentionMonths
        });

        if (res.success) {
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } else {
            setSaveStatus('error');
            setErrorMessage(res.error || 'Failed to update settings');
        }
    };

    // Helper to get styling class for cohort cells
    const getCellColorClass = (val: number | undefined) => {
        if (val === undefined) return 'bg-[#12131C] text-gray-700';
        if (val >= 80) return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/10';
        if (val >= 50) return 'bg-green-500/10 text-green-400 border border-green-500/5';
        if (val >= 25) return 'bg-amber-500/10 text-amber-400 border border-amber-500/5';
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/5';
    };

    // Sorted Leaderboard Entries based on Selected Period (Monthly vs Yearly)
    const sortedLeaderboard = useMemo(() => {
        return [...leaderboard].sort((a, b) => {
            if (leaderboardPeriod === 'monthly') {
                return b.monthlyEarnings - a.monthlyEarnings;
            }
            return b.yearlyEarnings - a.yearlyEarnings;
        });
    }, [leaderboard, leaderboardPeriod]);

    return (
        <div className="min-h-screen bg-[#07080C] text-white flex flex-col font-sans">
            {/* Upper Glow elements */}
            <div className="absolute top-[-10%] left-[20%] w-[50%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

            {/* HEADER */}
            <header className="border-b border-white/[0.04] bg-[#0A0B10]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-black font-extrabold text-lg">
                        W
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Whop Nexus Hub</h1>
                        <p className="text-[10px] text-gray-500 tracking-wide">{userEmail}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* App selector dropdown */}
                    <div className="relative flex-1 sm:flex-none">
                        <select
                            value={selectedAppId}
                            onChange={(e) => setSelectedAppId(e.target.value)}
                            className="w-full sm:w-56 px-4 py-2 rounded-lg bg-[#14151f] border border-white/5 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500/50 appearance-none cursor-pointer"
                        >
                            <option value="all">🌐 All Apps Combined</option>
                            {apps.map(app => (
                                <option key={app.id} value={app.id}>
                                    📱 {app.appName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <a 
                        href="/api/auth/whop" 
                        className="px-3.5 py-2 rounded-lg border border-white/5 bg-[#14151f] text-xs font-semibold hover:bg-[#1a1c29] transition hover:border-white/10"
                        title="Reconnect / Switch Account"
                    >
                        🔄 Switch Account
                    </a>
                    <a 
                        href="/api/auth/logout" 
                        className="px-3.5 py-2 rounded-lg border border-white/5 bg-red-950/20 text-red-400 text-xs font-semibold hover:bg-red-900/30 hover:border-red-500/30 transition active:scale-[0.98]"
                        title="Log Out Session"
                    >
                        🚪 Log Out
                    </a>
                </div>
            </header>

            {/* CORE CONTENT */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
                
                {/* TAB SELECTOR */}
                <div className="flex border-b border-white/[0.04] overflow-x-auto scrollbar-none">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-5 py-3 text-sm font-semibold tracking-wide border-b-2 whitespace-nowrap transition ${
                            activeTab === 'overview' 
                                ? 'border-amber-500 text-amber-400' 
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        📊 Overview Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('cohorts')}
                        className={`px-5 py-3 text-sm font-semibold tracking-wide border-b-2 whitespace-nowrap transition ${
                            activeTab === 'cohorts' 
                                ? 'border-amber-500 text-amber-400' 
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        📈 Cohort Retention Matrix
                    </button>
                    <button
                        onClick={() => setActiveTab('ledger')}
                        className={`px-5 py-3 text-sm font-semibold tracking-wide border-b-2 whitespace-nowrap transition ${
                            activeTab === 'ledger' 
                                ? 'border-amber-500 text-amber-400' 
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        🧾 Financial Ledger & Taxes
                    </button>
                    <button
                        onClick={() => setActiveTab('generator')}
                        className={`px-5 py-3 text-sm font-semibold tracking-wide border-b-2 whitespace-nowrap transition ${
                            activeTab === 'generator' 
                                ? 'border-amber-500 text-amber-400' 
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        🔌 Mini-App Code Generator
                    </button>
                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        className={`px-5 py-3 text-sm font-semibold tracking-wide border-b-2 whitespace-nowrap transition ${
                            activeTab === 'leaderboard' 
                                ? 'border-amber-500 text-amber-400' 
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        🏆 Community Leaderboard
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-5 py-3 text-sm font-semibold tracking-wide border-b-2 whitespace-nowrap transition ${
                            activeTab === 'settings' 
                                ? 'border-amber-500 text-amber-400' 
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        ⚙️ Settings & CRM
                    </button>
                </div>

                {/* TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="p-5 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-2">
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Gross Income</span>
                                <div className="text-2xl font-bold">${metrics.gross.toLocaleString()}</div>
                                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                                    <span>●</span> Total sales revenue
                                </span>
                            </div>
                            <div className="p-5 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-2">
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Net Payouts</span>
                                <div className="text-2xl font-bold text-amber-400">${metrics.net.toLocaleString()}</div>
                                <span className="text-[10px] text-gray-500">Excluding processor fees</span>
                            </div>
                            <div className="p-5 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-2">
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Est. Tax Liability</span>
                                <div className="text-2xl font-bold text-red-400">${metrics.tax.toLocaleString()}</div>
                                <span className="text-[10px] text-gray-500">VAT / Sales Tax estimates</span>
                            </div>
                            <div className="p-5 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-2">
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Active Customers</span>
                                <div className="text-2xl font-bold text-emerald-400">{metrics.activeCustomers}</div>
                                <span className="text-[10px] text-gray-500">Out of {metrics.totalCustomers} total</span>
                            </div>
                            <div className="p-5 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-2">
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Churn Rate</span>
                                <div className="text-2xl font-bold text-rose-400">{metrics.churnRate}%</div>
                                <span className="text-[10px] text-gray-500">Cancelled / Total customers</span>
                            </div>
                        </div>

                        {/* Interactive SVG Line Chart */}
                        <div className="p-6 rounded-xl bg-[#0A0B10]/80 border border-white/[0.04] space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm font-semibold tracking-wider text-gray-400 uppercase">12-Month Revenue Growth</h3>
                                    <p className="text-xs text-gray-500">Gross revenue trend calculated for active applications</p>
                                </div>
                                {selectedAppId === 'all' && (
                                    <div className="flex items-center gap-3 text-[10px] flex-wrap">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-white border border-white/20" />
                                            <span className="text-gray-400">Total Combined</span>
                                        </div>
                                        {apps.slice(0, 3).map((app, idx) => {
                                            const bgColors = ['bg-amber-500', 'bg-emerald-500', 'bg-blue-500'];
                                            return (
                                                <div key={app.id} className="flex items-center gap-1.5">
                                                    <span className={`w-2.5 h-2.5 rounded-full ${bgColors[idx % bgColors.length]}`} />
                                                    <span className="text-gray-400">{app.appName}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="relative w-full overflow-hidden">
                                <svg 
                                    viewBox={`0 0 ${svgChartConfig.width} ${svgChartConfig.height}`} 
                                    className="w-full h-56 font-mono text-[9px] fill-gray-500"
                                >
                                    {/* Horizontal gridlines and Y values */}
                                    {svgChartConfig.gridLines.map((line, idx) => (
                                        <g key={idx}>
                                            <line 
                                                x1={svgChartConfig.padding} 
                                                y1={line.y} 
                                                x2={svgChartConfig.width - svgChartConfig.padding} 
                                                y2={line.y} 
                                                className="stroke-white/[0.03]" 
                                                strokeWidth="1" 
                                            />
                                            <text 
                                                x={svgChartConfig.padding - 8} 
                                                y={line.y + 3} 
                                                textAnchor="end"
                                            >
                                                ${line.val}
                                            </text>
                                        </g>
                                    ))}

                                    {/* X-axis Month Labels */}
                                    {chartData.map((d, i) => (
                                        <text 
                                            key={i} 
                                            x={svgChartConfig.getX(i)} 
                                            y={svgChartConfig.height - 10} 
                                            textAnchor="middle"
                                        >
                                            {d.label}
                                        </text>
                                    ))}

                                    {/* App lines (if all Apps is selected) */}
                                    {selectedAppId === 'all' && svgChartConfig.appPaths.map((app) => (
                                        <path 
                                            key={app.id}
                                            d={app.path} 
                                            fill="none" 
                                            className={`${app.colorClass} opacity-60`} 
                                            strokeWidth="2" 
                                            strokeDasharray="4 2"
                                        />
                                    ))}

                                    {/* Primary Gross Line */}
                                    <path 
                                        d={svgChartConfig.overallPath} 
                                        fill="none" 
                                        className="stroke-white" 
                                        strokeWidth="3.5" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                    />

                                    {/* Interactive dots representing values */}
                                    {chartData.map((d, i) => (
                                        <circle 
                                            key={i}
                                            cx={svgChartConfig.getX(i)}
                                            cy={svgChartConfig.getY(d.total)}
                                            r="4.5"
                                            className="fill-[#07080C] stroke-amber-500"
                                            strokeWidth="2.5"
                                        />
                                    ))}
                                </svg>
                            </div>
                        </div>

                        {/* Visual Revenue Distributions */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* App Revenue Share */}
                            <div className="p-6 rounded-xl bg-[#0A0B10]/60 border border-white/[0.04] space-y-4">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Revenue Share by App</h3>
                                {revenueByApp.length === 0 ? (
                                    <div className="text-xs text-gray-500 py-6 text-center">No transaction history found.</div>
                                ) : (
                                    <div className="space-y-4">
                                        {revenueByApp.map(app => (
                                            <div key={app.id} className="space-y-1.5">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-300 font-medium">📱 {app.name}</span>
                                                    <span className="text-amber-400 font-semibold">${app.gross.toLocaleString()} ({app.percentage}%)</span>
                                                </div>
                                                <div className="w-full bg-white/[0.02] h-2 rounded-full overflow-hidden border border-white/5">
                                                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-1000" style={{ width: `${app.percentage}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Country Revenue Share */}
                            <div className="p-6 rounded-xl bg-[#0A0B10]/60 border border-white/[0.04] space-y-4">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Top Countries by Volume</h3>
                                {revenueByCountry.length === 0 ? (
                                    <div className="text-xs text-gray-500 py-6 text-center">No country transaction history.</div>
                                ) : (
                                    <div className="space-y-4">
                                        {revenueByCountry.map(c => (
                                            <div key={c.country} className="space-y-1.5">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-300 font-medium">📍 {c.country}</span>
                                                    <span className="text-emerald-400 font-semibold">${c.gross.toLocaleString()} ({c.percentage}%)</span>
                                                </div>
                                                <div className="w-full bg-white/[0.02] h-2 rounded-full overflow-hidden border border-white/5">
                                                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-1000" style={{ width: `${c.percentage}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Summary & Integration Callout */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="p-6 rounded-xl bg-gradient-to-br from-[#12131E] to-[#0A0B10] border border-white/[0.04] lg:col-span-2 space-y-4">
                                <h3 className="text-lg font-bold">App Development Integration</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    This dashboard is fully connected to your PostgreSQL database. Any Whop Mini Apps you build in other workspaces can immediately report activations to this Hub. To sync a new app, copy <b>WHOP_MINI_APP_WORKSPACE_TEMPLATE.md</b> into the app's workspace as its <b>GEMINI.md</b> and configure the endpoints.
                                </p>
                                <div className="p-4 rounded-lg bg-black/40 border border-white/5 font-mono text-xs text-amber-300">
                                    POST https://hub-api-taupe.vercel.app/api/hub/notion-sync
                                </div>
                            </div>
                            
                            <div className="p-6 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-4 flex flex-col justify-between">
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold">Quick Bookkeeping Export</h3>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        Download transaction CSV files calculated with estimated country VAT rates and net developer incomes. Compatible with QuickBooks, Xero, or tax auditing reports.
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setActiveTab('ledger');
                                    }}
                                    className="w-full py-3 rounded-lg bg-[#14151f] hover:bg-[#1a1c29] border border-white/5 text-xs font-semibold tracking-wide transition active:scale-[0.98]"
                                >
                                    Go to Bookkeeping Ledger →
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: COHORT RETENTION MATRIX */}
                {activeTab === 'cohorts' && (
                    <div className="p-6 rounded-xl bg-[#0A0B10] border border-white/[0.04] space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold">Cohorts & Subscriber Retention Matrix</h3>
                            <p className="text-xs text-gray-500">
                                Groups customers by signup cohort month and tracks the percentage of active renewals over the subsequent 11 months.
                            </p>
                        </div>

                        {cohortRows.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 text-sm">
                                No cohort history found. Check if your database contains transactions.
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-white/[0.03]">
                                <table className="w-full border-collapse text-left text-xs min-w-[700px]">
                                    <thead>
                                        <tr className="bg-[#12131A] text-gray-400 font-semibold uppercase tracking-wider border-b border-white/[0.03]">
                                            <th className="p-4 w-28">Cohort Month</th>
                                            <th className="p-4 w-20 text-center">Cohort Size</th>
                                            {Array.from({ length: 12 }).map((_, idx) => (
                                                <th key={idx} className="p-4 text-center">M{idx}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.02]">
                                        {cohortRows.map((row, rIdx) => (
                                            <tr key={rIdx} className="hover:bg-white/[0.01]">
                                                <td className="p-4 font-semibold text-gray-300">{row.cohortMonth}</td>
                                                <td className="p-4 text-center font-medium text-gray-400">{row.size} users</td>
                                                {Array.from({ length: 12 }).map((_, mIdx) => {
                                                    const val = row.retention[mIdx];
                                                    return (
                                                        <td key={mIdx} className="p-2 text-center">
                                                            <div className={`py-2 px-1 rounded-md text-[11px] font-semibold transition ${getCellColorClass(val)}`}>
                                                                {val !== undefined ? `${val}%` : '-'}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: LEDGER & TAXES */}
                {activeTab === 'ledger' && (
                    <div className="p-6 rounded-xl bg-[#0A0B10] border border-white/[0.04] space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="text-lg font-bold">Multi-Currency Transaction Ledger</h3>
                                <p className="text-xs text-gray-500">Advanced Country-based tax estimation list</p>
                            </div>
                            <button
                                onClick={handleDownloadCSV}
                                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs transition duration-300 hover:from-amber-400 hover:to-amber-500 shadow-md shadow-amber-500/5 active:scale-[0.98]"
                            >
                                📥 Export Bookkeeping CSV
                            </button>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by Invoice ID or App Name..."
                                    className="w-full pl-4 pr-4 py-2.5 rounded-lg bg-[#14151f] border border-white/5 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                                />
                            </div>
                            <div className="relative w-full sm:w-44">
                                <select
                                    value={selectedCountry}
                                    onChange={(e) => setSelectedCountry(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg bg-[#14151f] border border-white/5 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500/50 appearance-none cursor-pointer"
                                >
                                    <option value="all">🌍 All Countries</option>
                                    {countryList.map(code => (
                                        <option key={code} value={code}>
                                            📍 {code}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {searchedTransactions.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 text-sm">
                                No matching transaction entries found.
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-white/[0.03]">
                                <table className="w-full border-collapse text-left text-xs min-w-[800px]">
                                    <thead>
                                        <tr className="bg-[#12131A] text-gray-400 font-semibold uppercase tracking-wider border-b border-white/[0.03]">
                                            <th className="p-4">Invoice ID</th>
                                            <th className="p-4">App Source</th>
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Gross</th>
                                            <th className="p-4">Est. Fees</th>
                                            <th className="p-4">Est. Tax</th>
                                            <th className="p-4">Net Income</th>
                                            <th className="p-4">Country</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.02] text-gray-300">
                                        {searchedTransactions.map((tx) => {
                                            const fee = parseFloat((tx.grossAmount - tx.netAmount - tx.taxAmount).toFixed(2));
                                            return (
                                                <tr key={tx.id} className="hover:bg-white/[0.01]">
                                                    <td className="p-4 font-mono text-gray-400 text-[10px]">{tx.whopInvoiceId}</td>
                                                    <td className="p-4 font-semibold text-white">{tx.appName}</td>
                                                    <td className="p-4 text-gray-500">{tx.processedAt.slice(0, 10)}</td>
                                                    <td className="p-4 text-emerald-400">${tx.grossAmount.toFixed(2)}</td>
                                                    <td className="p-4 text-gray-500">${fee.toFixed(2)}</td>
                                                    <td className="p-4 text-red-400">${tx.taxAmount.toFixed(2)}</td>
                                                    <td className="p-4 font-semibold text-amber-400">${tx.netAmount.toFixed(2)}</td>
                                                    <td className="p-4 text-center">
                                                        <span className="px-2 py-1 rounded bg-white/5 border border-white/5 font-semibold text-[10px] text-gray-400">
                                                            {tx.countryCode}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 4: MINI-APP CODE GENERATOR */}
                {activeTab === 'generator' && (
                    <div className="p-6 rounded-xl bg-[#0A0B10] border border-white/[0.04] space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold">🔌 Mini-App Integration & Code Generator</h3>
                            <p className="text-xs text-gray-500">
                                Generate ready-to-use Next.js Server Actions and custom onboarding templates to sync your spoke apps with this central hub database.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="space-y-4 lg:col-span-1 p-5 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">1. Select Target App</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Choose which Whop App in your hub you want to connect to. The generated code will automatically carry the correct parameters.
                                </p>
                                <div className="space-y-2">
                                    <label className="text-[11px] text-gray-500 uppercase font-semibold">Whop App</label>
                                    <select
                                        value={selectedAppId}
                                        onChange={(e) => setSelectedAppId(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-[#14151f] border border-white/5 text-xs text-gray-300 focus:outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="all">🌐 Select an app to configure...</option>
                                        {apps.map(app => (
                                            <option key={app.id} value={app.id}>
                                                📱 {app.appName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="p-3.5 rounded-lg bg-[#12131A] border border-white/[0.03] space-y-2 text-xs">
                                    <div className="font-semibold text-gray-300">Active Connection Endpoint</div>
                                    <div className="font-mono text-[10px] text-amber-300 break-all select-all">
                                        {dynamicOrigin}/api/hub/notion-sync
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-2 space-y-4">
                                <div className="p-5 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">2. Next.js Server Action Code</h4>
                                        <button
                                            onClick={() => {
                                                const selectedAppName = selectedAppId === 'all' 
                                                    ? 'Your App Name' 
                                                    : apps.find(a => a.id === selectedAppId)?.appName || 'Your App Name';
                                                
                                                const codeString = `'use server';

export async function syncAppUser({
    email,
    whopUserId,
    name,
    userTier = 'Trial'
}: {
    email: string;
    whopUserId: string;
    name: string;
    userTier?: string;
}) {
    try {
        const response = await fetch('${dynamicOrigin}/api/hub/notion-sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                whopUserId,
                name,
                appSource: '${selectedAppName}',
                userTier
            }),
        });

        if (!response.ok) {
            throw new Error(\`Failed to sync: \${response.statusText}\`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed syncing with Whop Central Hub:', error);
        return { success: false, error: 'Hub synchronization failed' };
    }
}`;
                                                navigator.clipboard.writeText(codeString);
                                                setCopiedSnippet(true);
                                                setTimeout(() => setCopiedSnippet(false), 2000);
                                            }}
                                            className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-semibold tracking-wide transition flex items-center gap-1.5 text-amber-400"
                                        >
                                            {copiedSnippet ? '✅ Copied!' : '📋 Copy Code'}
                                        </button>
                                    </div>
                                    
                                    <div className="overflow-x-auto rounded-lg border border-white/5 bg-black/40">
                                        <pre className="p-4 font-mono text-[10px] text-gray-300 leading-relaxed">
{`'use server';

export async function syncAppUser({
    email,
    whopUserId,
    name,
    userTier = 'Trial'
}: {
    email: string;
    whopUserId: string;
    name: string;
    userTier?: string;
}) {
    try {
        const response = await fetch('${dynamicOrigin}/api/hub/notion-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                whopUserId,
                name,
                appSource: '${selectedAppId === 'all' ? 'Your App Name' : apps.find(a => a.id === selectedAppId)?.appName || 'Your App Name'}',
                userTier
            }),
        });

        return await response.json();
    } catch (error) {
        console.error('Hub synchronization failed:', error);
        return { success: false };
    }
}`}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 5: PUBLIC COMMUNITY LEADERBOARD */}
                {activeTab === 'leaderboard' && (
                    <div className="p-6 rounded-xl bg-[#0A0B10] border border-white/[0.04] space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="text-lg font-bold">🏆 Public Community Leaderboard</h3>
                                <p className="text-xs text-gray-500">
                                    Top earning applications in the Whop Hub ecosystem. Configure your visibility under Settings.
                                </p>
                            </div>
                            <div className="flex rounded-lg bg-[#14151F] border border-white/5 p-1 text-xs">
                                <button
                                    onClick={() => setLeaderboardPeriod('monthly')}
                                    className={`px-4 py-1.5 rounded-md font-semibold transition ${
                                        leaderboardPeriod === 'monthly' 
                                            ? 'bg-amber-500 text-black' 
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    This Month
                                </button>
                                <button
                                    onClick={() => setLeaderboardPeriod('yearly')}
                                    className={`px-4 py-1.5 rounded-md font-semibold transition ${
                                        leaderboardPeriod === 'yearly' 
                                            ? 'bg-amber-500 text-black' 
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    This Year
                                </button>
                            </div>
                        </div>

                        {sortedLeaderboard.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 text-sm">
                                No developers have opted into the leaderboard yet. Be the first under the Settings tab!
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-white/[0.03]">
                                <table className="w-full border-collapse text-left text-xs min-w-[600px]">
                                    <thead>
                                        <tr className="bg-[#12131A] text-gray-400 font-semibold uppercase tracking-wider border-b border-white/[0.03]">
                                            <th className="p-4 w-16 text-center">Rank</th>
                                            <th className="p-4">Developer Alias</th>
                                            <th className="p-4 w-28 text-center">Apps Managed</th>
                                            <th className="p-4 text-right">Monthly Income</th>
                                            <th className="p-4 text-right">Yearly Income</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.02] text-gray-300">
                                        {sortedLeaderboard.map((item, idx) => {
                                            const rankColors = ['text-amber-400 font-bold', 'text-gray-300 font-bold', 'text-amber-600 font-bold'];
                                            const rankBadges = ['🥇', '🥈', '🥉'];
                                            const isTop3 = idx < 3;

                                            return (
                                                <tr key={idx} className="hover:bg-white/[0.01]">
                                                    <td className="p-4 text-center font-mono font-semibold">
                                                        {isTop3 ? (
                                                            <span className="text-lg" title={`Rank ${idx + 1}`}>{rankBadges[idx]}</span>
                                                        ) : (
                                                            <span>#{idx + 1}</span>
                                                        )}
                                                    </td>
                                                    <td className={`p-4 ${isTop3 ? rankColors[idx] : 'text-white'}`}>
                                                        {item.name}
                                                    </td>
                                                    <td className="p-4 text-center text-gray-400 font-semibold">
                                                        {item.appCount}
                                                    </td>
                                                    <td className="p-4 text-right text-emerald-400 font-semibold">
                                                        ${item.monthlyEarnings.toLocaleString()}
                                                    </td>
                                                    <td className="p-4 text-right text-amber-500 font-semibold">
                                                        ${item.yearlyEarnings.toLocaleString()}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 6: SETTINGS & CRM */}
                {activeTab === 'settings' && (
                    <div className="p-6 rounded-xl bg-[#0A0B10] border border-white/[0.04] space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold">⚙️ Developer Preferences & CRM Settings</h3>
                            <p className="text-xs text-gray-500">
                                Set up custom integrations, configure your leaderboard card, and adjust data storage pruning settings.
                            </p>
                        </div>

                        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
                            {/* Notion Keys Card */}
                            <div className="p-5 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">1. Private Notion CRM integration</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Provide your personal Notion credentials. When your Whop Mini Apps send activations, they will sync to **your** database, fully isolated. Keys are encrypted with military-grade AES-256-GCM. Leaving this blank disables Notion CRM sync.
                                </p>
                                
                                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-xs text-amber-400 leading-relaxed space-y-1">
                                    <p className="font-semibold">💡 Notion CRM Database Setup:</p>
                                    <p className="text-gray-400 text-[11px]">
                                        To sync data correctly, duplicate our official template with all configured column headers: 
                                        <a 
                                            href="https://www.notion.so/judeolaboboye/31a7e430a0a680dabd67ceea8d3caf27?v=31a7e430a0a680f6b3ea000c95904cbe&source=copy_link" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-amber-400 underline ml-1 font-bold hover:text-amber-300 transition"
                                        >
                                            Duplicate Notion Database Template →
                                        </a>
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-400 font-semibold uppercase">Notion API Key</label>
                                        <input
                                            type="password"
                                            value={notionApiKey}
                                            onChange={(e) => setNotionApiKey(e.target.value)}
                                            placeholder="ntn_..."
                                            className="w-full px-3 py-2 rounded-lg bg-[#14151f] border border-white/5 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500/50 font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-400 font-semibold uppercase">Notion Database ID</label>
                                        <input
                                            type="text"
                                            value={notionDatabaseId}
                                            onChange={(e) => setNotionDatabaseId(e.target.value)}
                                            placeholder="e.g. 31a7e430a0a6..."
                                            className="w-full px-3 py-2 rounded-lg bg-[#14151f] border border-white/5 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500/50 font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Leaderboard Settings */}
                            <div className="p-5 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">2. Leaderboard Opt-In (Gamification)</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Enable this to compete with other developers in the Whop Central Hub network.
                                </p>
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        id="optin"
                                        checked={leaderboardOptIn}
                                        onChange={(e) => setLeaderboardOptIn(e.target.checked)}
                                        className="mt-1 w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500/50 bg-[#14151F] cursor-pointer"
                                    />
                                    <div className="space-y-1">
                                        <label htmlFor="optin" className="text-xs font-semibold text-gray-300 cursor-pointer select-none">
                                            Participate in the Public Leaderboard
                                        </label>
                                        <p className="text-[11px] text-gray-500 leading-relaxed">
                                            Aggregates your total monthly and yearly revenue across all connected apps.
                                        </p>
                                    </div>
                                </div>

                                {leaderboardOptIn && (
                                    <div className="space-y-1 max-w-sm pt-2">
                                        <label className="text-[10px] text-gray-400 font-semibold uppercase">Leaderboard Display Name / Alias</label>
                                        <input
                                            type="text"
                                            value={leaderboardName}
                                            onChange={(e) => setLeaderboardName(e.target.value)}
                                            placeholder="e.g. BuilderX, ProfitAI"
                                            className="w-full px-3 py-2 rounded-lg bg-[#14151f] border border-white/5 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                                        />
                                        <p className="text-[9px] text-gray-500">Leaving this blank displays a masked version of your email (e.g. jud***@domain.com)</p>
                                    </div>
                                )}
                            </div>

                            {/* Data Retention & Storage Pruning settings */}
                            <div className="p-5 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">3. Database Storage & Retention Policy</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Manage your PostgreSQL database footprint. Configure how long old transactions should remain stored before being automatically deleted. Recommended to prevent running out of database space.
                                </p>
                                <div className="space-y-2 max-w-xs">
                                    <label className="text-[10px] text-gray-400 font-semibold uppercase">Keep Transaction Records For</label>
                                    <select
                                        value={retentionMonths}
                                        onChange={(e) => setRetentionMonths(Number(e.target.value))}
                                        className="w-full px-3 py-2.5 rounded-lg bg-[#14151f] border border-white/5 text-xs text-gray-300 focus:outline-none appearance-none cursor-pointer"
                                    >
                                        <option value={0}>♾️ Keep Forever (No Pruning)</option>
                                        <option value={3}>🗓️ 3 Months (Auto-delete older records)</option>
                                        <option value={6}>🗓️ 6 Months (Auto-delete older records)</option>
                                        <option value={12}>🗓️ 12 Months (Auto-delete older records)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Form submit footer */}
                            <div className="flex items-center gap-4">
                                <button
                                    type="submit"
                                    disabled={saveStatus === 'saving'}
                                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs transition duration-300 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 active:scale-[0.98]"
                                >
                                    {saveStatus === 'saving' ? 'Saving Changes...' : '💾 Save Settings'}
                                </button>

                                {saveStatus === 'success' && (
                                    <span className="text-xs text-emerald-400 font-semibold animate-pulse">
                                        ✅ Settings saved successfully!
                                    </span>
                                )}

                                {saveStatus === 'error' && (
                                    <span className="text-xs text-rose-400 font-semibold">
                                        ❌ {errorMessage}
                                    </span>
                                )}
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}
