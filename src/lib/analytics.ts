export interface CohortRow {
    cohortMonth: string; // e.g. "2026-06"
    size: number; // Number of customers who joined in this cohort
    retention: number[]; // Percentage of customers active in Month 0, Month 1, Month 2...
}

export interface TaxEstimate {
    taxRate: number;
    taxAmount: number;
    feeAmount: number;
    netAmount: number;
}

// standard VAT/GST/Sales Tax rates (2026 guidelines)
export const TAX_RATES: Record<string, number> = {
    GB: 0.20, // UK VAT
    DE: 0.19, // Germany VAT
    FR: 0.20, // France VAT
    IT: 0.22, // Italy VAT
    ES: 0.21, // Spain VAT
    NL: 0.21, // Netherlands VAT
    IE: 0.23, // Ireland VAT
    US: 0.065, // Average US Sales Tax estimate
    CA: 0.12, // Average Canada GST/HST/QST
    NG: 0.075, // Nigeria VAT
    AU: 0.10, // Australia GST
    NZ: 0.15, // New Zealand GST
    ZA: 0.15, // South Africa VAT
};

const DEFAULT_TAX_RATE = 0.0; // Default if country code is not matched or tax doesn't apply

/**
 * Calculates estimated taxes, platform fees, and net earnings for a transaction.
 * 
 * Whop standard fees: 3% platform fee.
 * Stripe standard fees: 2.9% + $0.30 processing fee.
 */
export function estimateTransactionFinance(gross: number, countryCode: string): TaxEstimate {
    const country = countryCode.toUpperCase().trim();
    const taxRate = TAX_RATES[country] ?? DEFAULT_TAX_RATE;
    
    // Tax is estimated as portion of the gross amount: Gross * TaxRate
    const taxAmount = parseFloat((gross * taxRate).toFixed(2));
    
    // Whop + Stripe standard platform/processor fees: ~5.9% + $0.30
    const feeAmount = gross > 0 
        ? parseFloat((gross * 0.059 + 0.30).toFixed(2)) 
        : 0;

    // Net = Gross - Fees - Tax
    const netAmount = parseFloat((gross - feeAmount - taxAmount).toFixed(2));

    return {
        taxRate,
        taxAmount,
        feeAmount,
        netAmount: Math.max(0, netAmount)
    };
}

/**
 * Calculates retention cohorts based on customer signups and transactions.
 * Groups customers by signup month and checks if they had successful transactions
 * in subsequent months (indicating active/renewed subscriptions).
 */
export function calculateCohorts(
    customers: Array<{ id: string; joinedCohortMonth: Date }>,
    transactions: Array<{ customerId: string; processedAt: Date }>
): CohortRow[] {
    const cohorts: Record<string, Set<string>> = {};
    const customerCohortMap: Record<string, string> = {}; // customerId -> cohortMonthStr

    // 1. Group customers into their signup cohorts
    customers.forEach(c => {
        const monthStr = c.joinedCohortMonth.toISOString().slice(0, 7); // "YYYY-MM"
        if (!cohorts[monthStr]) {
            cohorts[monthStr] = new Set();
        }
        cohorts[monthStr].add(c.id);
        customerCohortMap[c.id] = monthStr;
    });

    const cohortList = Object.keys(cohorts).sort();
    const result: CohortRow[] = [];

    // 2. Track transaction occurrences relative to their cohort join month
    // transactionCohortActivity[cohortMonthStr][customerId] = Set of months relative to cohort (0, 1, 2...)
    const transactionCohortActivity: Record<string, Record<string, Set<number>>> = {};

    transactions.forEach(t => {
        const cohortMonthStr = customerCohortMap[t.customerId];
        if (!cohortMonthStr) return; // Transaction from a customer not in our filtered list

        const cohortDate = new Date(cohortMonthStr + "-01");
        const txDate = new Date(t.processedAt.getFullYear(), t.processedAt.getMonth(), 1);

        // Calculate difference in months
        const monthDiff = (txDate.getFullYear() - cohortDate.getFullYear()) * 12 + (txDate.getMonth() - cohortDate.getMonth());

        if (monthDiff >= 0 && monthDiff < 12) { // Track up to 12 months retention
            if (!transactionCohortActivity[cohortMonthStr]) {
                transactionCohortActivity[cohortMonthStr] = {};
            }
            if (!transactionCohortActivity[cohortMonthStr][t.customerId]) {
                transactionCohortActivity[cohortMonthStr][t.customerId] = new Set();
            }
            transactionCohortActivity[cohortMonthStr][t.customerId].add(monthDiff);
        }
    });

    // 3. Aggregate survival rate percentages for each month interval
    cohortList.forEach(cohortMonth => {
        const customerIds = cohorts[cohortMonth];
        const cohortSize = customerIds.size;
        
        if (cohortSize === 0) return;

        const monthlyRetentionCounts = new Array(12).fill(0);
        const activeCustomerSet = transactionCohortActivity[cohortMonth] || {};

        customerIds.forEach(customerId => {
            const activeMonths = activeCustomerSet[customerId] || new Set();
            
            // Month 0 is always active (they signed up and paid initial invoice)
            monthlyRetentionCounts[0]++;

            // For months 1..11, they are considered retained if they had a transaction in that relative month,
            // OR if they had a transaction in a LATER month (meaning they didn't churn yet)
            const maxActiveMonth = Math.max(-1, ...Array.from(activeMonths));
            for (let m = 1; m < 12; m++) {
                if (activeMonths.has(m) || maxActiveMonth > m) {
                    monthlyRetentionCounts[m]++;
                }
            }
        });

        // Convert counts to percentages
        const retentionPercentages = monthlyRetentionCounts.map(count => 
            parseFloat(((count / cohortSize) * 100).toFixed(1))
        );

        result.push({
            cohortMonth,
            size: cohortSize,
            retention: retentionPercentages
        });
    });

    return result;
}

interface ExportTransaction {
    whopInvoiceId: string;
    processedAt: Date;
    appName: string;
    grossAmount: number;
    feeAmount: number;
    taxAmount: number;
    netAmount: number;
    currency: string;
    countryCode: string;
}

/**
 * Compiles a clean, standardized CSV string from a transaction array.
 */
export function generateBookkeepingCSV(transactions: ExportTransaction[]): string {
    const headers = [
        'Invoice ID',
        'Processed Date',
        'App Name',
        'Gross Amount',
        'Estimated Fees (Stripe/Whop)',
        'Estimated Tax',
        'Net Income',
        'Currency',
        'Country Code'
    ];

    const rows = transactions.map(t => [
        `"${t.whopInvoiceId}"`,
        `"${t.processedAt.toISOString().slice(0, 10)}"`,
        `"${t.appName.replace(/"/g, '""')}"`,
        t.grossAmount.toFixed(2),
        t.feeAmount.toFixed(2),
        t.taxAmount.toFixed(2),
        t.netAmount.toFixed(2),
        `"${t.currency.toUpperCase()}"`,
        `"${t.countryCode.toUpperCase()}"`
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}
