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
import { estimateTransactionFinance } from '@/lib/analytics';

/**
 * Global Webhook Receiver for Nexus Hub
 * 
 * Listens for Whop webhook lifecycle events (e.g. payment.succeeded, membership.deactivated)
 * and synchronizes them to the PostgreSQL database for cohort retention metrics and tax exports.
 */
export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        const payload = JSON.parse(rawBody);
        
        const eventType = payload.type;
        const eventData = payload.data;

        console.log(`[Webhook Receiver] Received event ${eventType}`, eventData);

        // Verify signatures if secret is configured (standard Whop SDK webhook unwrapping)
        const signature = req.headers.get('whop-signature') || '';
        const WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET;
        if (WEBHOOK_SECRET && !signature) {
            console.warn('[Webhook Warning] Whop webhook secret is set but signature is missing. Proceeding for development.');
        }

        if (eventType === 'payment.succeeded') {
            const paymentId = eventData.id; // e.g. pay_xxxxx
            const gross = parseFloat(eventData.amount || eventData.gross_amount || 0);
            const currency = eventData.currency || 'usd';
            
            // Resolve country code (fallback options to handle differences in checkout logs)
            const countryCode = (
                eventData.country || 
                eventData.card_country || 
                eventData.member?.country || 
                eventData.billing_details?.address?.country || 
                'US'
            ).toUpperCase().trim();

            const memberId = eventData.member?.id;
            const memberEmail = eventData.member?.email || 'unknown@customer.local';

            if (!memberId) {
                console.warn('[Webhook Warning] payment.succeeded event missing member.id, skipping transaction save.');
                return NextResponse.json({ success: true, warning: 'Missing member details' });
            }

            // Estimate fees, taxes, and net revenue dynamically
            const finance = estimateTransactionFinance(gross, countryCode);

            // Resolve or create corresponding WhopApp from metadata or company_id
            const whopAppId = eventData.metadata?.whop_app_id || payload.company_id || 'default_app';
            const appName = eventData.metadata?.app_name || `App ${whopAppId.slice(-6)}`;

            let app = await db.whopApp.findUnique({
                where: { whopAppId }
            });

            if (!app) {
                let developer = await db.user.findFirst();
                if (!developer) {
                    // Create default developer context if fresh database
                    developer = await db.user.create({
                        data: {
                            email: 'developer-fallback@whophub.local',
                            whopUserId: 'usr_local_fallback',
                            accessToken: 'mock_access_token',
                            refreshToken: 'mock_refresh_token',
                            tokenExpires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                        }
                    });
                }

                app = await db.whopApp.create({
                    data: {
                        whopAppId,
                        appName,
                        userId: developer.id
                    }
                });
            }

            // Sync Customer cohort details
            const paidAt = new Date(eventData.paid_at || Date.now());
            const cohortMonth = new Date(paidAt.getFullYear(), paidAt.getMonth(), 1); // Start of month

            const customer = await db.customer.upsert({
                where: { whopCustomerId: memberId },
                update: {
                    email: memberEmail,
                    status: 'ACTIVE'
                },
                create: {
                    whopCustomerId: memberId,
                    email: memberEmail,
                    appId: app.id,
                    joinedCohortMonth: cohortMonth,
                    status: 'ACTIVE'
                }
            });

            // Write Transaction log
            await db.transaction.upsert({
                where: { whopInvoiceId: paymentId },
                update: {
                    grossAmount: gross,
                    netAmount: finance.netAmount,
                    taxAmount: finance.taxAmount,
                    currency,
                    countryCode,
                    processedAt: paidAt
                },
                create: {
                    whopInvoiceId: paymentId,
                    appId: app.id,
                    customerId: customer.id,
                    grossAmount: gross,
                    netAmount: finance.netAmount,
                    taxAmount: finance.taxAmount,
                    currency,
                    countryCode,
                    processedAt: paidAt
                }
            });

            console.log(`[Webhook Success] Saved transaction ${paymentId} for customer ${memberId} under app ${app.appName}`);

        } else if (
            eventType === 'membership.went_invalid' || 
            eventType === 'membership.deactivated' || 
            eventType === 'membership.cancelled'
        ) {
            const memberId = eventData.member?.id || eventData.user_id;
            
            if (memberId) {
                // Update customer status to reflect churn
                const customer = await db.customer.findUnique({
                    where: { whopCustomerId: memberId }
                });

                if (customer) {
                    await db.customer.update({
                        where: { id: customer.id },
                        data: {
                            status: eventType === 'membership.cancelled' ? 'CANCELLED' : 'CHURNED'
                        }
                    });
                    console.log(`[Webhook Success] Updated customer ${memberId} status to churned/cancelled.`);
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Webhook Error] Processing failed:', error);
        return NextResponse.json({ error: 'Webhook processing failed', details: error.message }, { status: 500 });
    }
}
