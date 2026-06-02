'use client';

import React, { useState, useMemo } from 'react';
import { calculateCohorts, generateBookkeepingCSV } from '@/lib/analytics';

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

interface DashboardClientProps {
    userEmail: string;
    apps: AppProp[];
    customers: CustomerProp[];
    transactions: TransactionProp[];
}

/**
 * Client Component managing dashboard layout and analytics calculations
 */
export default function DashboardClient({
    userEmail,
    apps,
    customers,
    transactions,
}: DashboardClientProps) {
    const [selectedAppId, setSelectedAppId] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<'overview' | 'cohorts' | 'ledger'>('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('all');

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

    // Helper to get styling class for cohort cells based on retention percentage
    const getCellColorClass = (val: number | undefined) => {
        if (val === undefined) return 'bg-[#12131C] text-gray-700';
        if (val >= 80) return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/10';
        if (val >= 50) return 'bg-green-500/10 text-green-400 border border-green-500/5';
        if (val >= 25) return 'bg-amber-500/10 text-amber-400 border border-amber-500/5';
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/5';
    };

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
                        className="px-3.5 py-2 rounded-lg border border-white/5 bg-[#14151f] text-xs font-semibold hover:bg-[#1a1c29] transition"
                        title="Reconnect / Switch Account"
                    >
                        🔄 Switch Account
                    </a>
                </div>
            </header>

            {/* CORE CONTENT */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
                
                {/* TAB SELECTOR */}
                <div className="flex border-b border-white/[0.04]">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-5 py-3 text-sm font-semibold tracking-wide border-b-2 transition ${
                            activeTab === 'overview' 
                                ? 'border-amber-500 text-amber-400' 
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        📊 Overview Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('cohorts')}
                        className={`px-5 py-3 text-sm font-semibold tracking-wide border-b-2 transition ${
                            activeTab === 'cohorts' 
                                ? 'border-amber-500 text-amber-400' 
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        📈 Cohort Retention Matrix
                    </button>
                    <button
                        onClick={() => setActiveTab('ledger')}
                        className={`px-5 py-3 text-sm font-semibold tracking-wide border-b-2 transition ${
                            activeTab === 'ledger' 
                                ? 'border-amber-500 text-amber-400' 
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        🧾 Financial Ledger & Taxes
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
            </main>
        </div>
    );
}
