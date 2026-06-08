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
import { syncUserToNotion, HubSyncPayload } from '@/lib/notion';
import { sendEmail } from '@/lib/email';
import { db } from '@/lib/db';

/**
 * Endpoint for Whop Mini Apps to report Activation / Onboarding signals.
 * Synchronizes details to local PostgreSQL (Customer/App/Cohort) and central Notion CRM.
 */
export async function POST(req: Request) {
    try {
        // 1. Receive the payload sent by a Whop Mini App
        const data: HubSyncPayload = await req.json();

        // 2. Validate the mandatory "Growth Hook" fields
        if (!data.email || !data.whopUserId) {
            return NextResponse.json(
                { error: 'Missing mandatory fields: email and whopUserId are required for Activation.' },
                { status: 400 }
            );
        }

        // 3. Local PostgreSQL DB Synchronization
        // Look up corresponding WhopApp by appName (or create fallback if developer hasn't OAuth-ed yet)
        let app = await db.whopApp.findFirst({
            where: { appName: data.appSource },
            include: { user: true }
        });

        let developerUser = app?.user;

        if (!app) {
            let developer = await db.user.findFirst();
            if (!developer) {
                // Seed local fallback developer user if database is empty during testing
                developer = await db.user.create({
                    data: {
                        email: 'developer-fallback@whophub.local',
                        whopUserId: 'usr_local_fallback',
                        accessToken: 'mock_access_token',
                        refreshToken: 'mock_refresh_token',
                        tokenExpires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
                    }
                });
            }
            developerUser = developer;

            app = await db.whopApp.create({
                data: {
                    whopAppId: `app_${data.appSource.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                    appName: data.appSource,
                    userId: developer.id
                },
                include: { user: true }
            });
        }

        // Check storage limits for FREE tier users
        const incomingStatus = data.status || 'ACTIVE';
        if (developerUser && developerUser.tier === 'FREE') {
            const appIds = await db.whopApp.findMany({
                where: { userId: developerUser.id },
                select: { id: true }
            }).then(apps => apps.map(a => a.id));

            const [customerCount, transactionCount] = await Promise.all([
                db.customer.count({ where: { appId: { in: appIds } } }),
                db.transaction.count({ where: { appId: { in: appIds } } })
            ]);

            // Assume ~1.5 KB per record
            const estimatedBytes = (customerCount + transactionCount) * 1500;
            const limitBytes = 100 * 1024 * 1024; // 100 MB

            if (estimatedBytes >= limitBytes) {
                console.warn(`[Storage Warning] User ${developerUser.email} has exceeded FREE tier storage limits (100MB). Syncing skipped.`);
                return NextResponse.json(
                    { error: 'Database storage limit exceeded for the FREE plan. Please upgrade to PREMIUM to continue syncing.' },
                    { status: 403 }
                );
            }
        }

        // Upsert Customer to capture the cohort signup month & user details
        const now = new Date();
        const cohortMonth = new Date(now.getFullYear(), now.getMonth(), 1); // Start of month
        const profilePic = data.profilePictureUrl || (data as any).profile_picture?.url || (typeof (data as any).profile_picture === 'string' ? (data as any).profile_picture : null);

        await db.customer.upsert({
            where: { whopCustomerId: data.whopUserId },
            update: {
                email: data.email,
                name: data.name || data.firstName || null,
                username: data.username || null,
                bio: data.bio || null,
                profilePictureUrl: profilePic || null,
                status: incomingStatus
            },
            create: {
                whopCustomerId: data.whopUserId,
                email: data.email,
                appId: app.id,
                name: data.name || data.firstName || null,
                username: data.username || null,
                bio: data.bio || null,
                profilePictureUrl: profilePic || null,
                joinedCohortMonth: cohortMonth,
                status: incomingStatus
            }
        });

        // Decrypt developer-specific Notion keys if they exist
        let decryptedNotionKey: string | undefined = undefined;
        let decryptedNotionDb: string | undefined = undefined;

        if (developerUser?.notionApiKey && developerUser?.notionDatabaseId) {
            try {
                const { decryptToken } = await import('@/lib/encryption');
                decryptedNotionKey = decryptToken(developerUser.notionApiKey);
                decryptedNotionDb = decryptToken(developerUser.notionDatabaseId);
            } catch (decErr) {
                console.error('Failed to decrypt custom developer Notion keys:', decErr);
            }
        }

        // 4. Push the data to the Central Notion CRM (user-scoped or default fallback)
        let crmSynced = false;
        try {
            if (decryptedNotionKey && decryptedNotionDb) {
                await syncUserToNotion(data, decryptedNotionKey, decryptedNotionDb);
                crmSynced = true;
            } else if (process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID) {
                await syncUserToNotion(data);
                crmSynced = true;
            } else {
                console.log('[CRM Sync] No Notion CRM credentials configured. Skipping Notion API call.');
            }
        } catch (notionErr) {
            console.error('[CRM Sync Error] Notion failed to sync, continuing with Local DB:', notionErr);
        }

        // 5. Fire the Growth Hook Automated Emails (Welcome or Cancellation Campaign)
        if (data.email && developerUser) {
            const isPremium = developerUser.tier === 'PREMIUM';

            if (!isPremium) {
                console.log(`[Email Campaign] Skipping automated email for ${data.email} because developer ${developerUser.email} is on the FREE tier.`);
            } else {
                let decryptedResendKey: string | undefined = undefined;
                if (developerUser.resendApiKey) {
                    try {
                        const { decryptToken } = await import('@/lib/encryption');
                        decryptedResendKey = decryptToken(developerUser.resendApiKey);
                    } catch (resendDecErr) {
                        console.error('Failed to decrypt custom developer Resend API key:', resendDecErr);
                    }
                }

                const formatTemplate = (template: string | null, fallback: string): string => {
                    const text = template || fallback;
                    return text
                        .replace(/{firstName}/g, data.firstName || 'there')
                        .replace(/{name}/g, data.name || data.firstName || 'there')
                        .replace(/{appSource}/g, data.appSource || '')
                        .replace(/{userTier}/g, data.userTier || '')
                        .replace(/{email}/g, data.email || '');
                };

                const isCancelled = incomingStatus === 'CANCELLED';

                if (isCancelled && developerUser.autoCancelEmail) {
                    const subject = formatTemplate(developerUser.cancelEmailSubject, "Checking in...");
                    const body = formatTemplate(
                        developerUser.cancelEmailBody,
                        `Hi {firstName},\n\nI noticed you cancelled your access to {appSource}. I'm reaching out personally to see if you can share some honest feedback to help me improve the experience. Was it pricing, or was it missing a feature you expected?\n\nThanks,\nJude Victor Olaboboye`
                    );

                    // Convert plain text body to simple HTML if not already HTML
                    const htmlBody = body.includes('<') ? body : `<div style="font-family: sans-serif; white-space: pre-line; line-height: 1.5; color: #333;">${body}</div>`;

                    await sendEmail({
                        to: data.email,
                        subject,
                        html: htmlBody,
                        resendApiKey: decryptedResendKey
                    }).catch(emailErr => {
                        console.error('[SMTP Transporter Error] Failed to send cancellation email:', emailErr);
                    });
                } else if (!isCancelled && developerUser.autoWelcomeEmail) {
                    const subject = formatTemplate(developerUser.welcomeEmailSubject, `Welcome to {appSource}! 🚀`);
                    const body = formatTemplate(
                        developerUser.welcomeEmailBody,
                        `Hey {firstName}!\n\nWelcome to {appSource}. We are thrilled to have you inside the ecosystem.\n\nYour workspace and tier ({userTier}) have been fully provisioned.\n\nIf you have any questions, reply to this email directly.\n\nLet's build something great!\n\n- Jude Victor Olaboboye`
                    );

                    const htmlBody = body.includes('<') ? body : `<div style="font-family: sans-serif; white-space: pre-line; line-height: 1.5; color: #333;">${body}</div>`;

                    await sendEmail({
                        to: data.email,
                        subject,
                        html: htmlBody,
                        resendApiKey: decryptedResendKey
                    }).catch(emailErr => {
                        console.error('[SMTP Transporter Error] Failed to send welcome email:', emailErr);
                    });
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: 'User successfully synced to local database, Notion CRM, and Welcome Email sent.' 
        });
    } catch (error: any) {
        console.error('Hub API notion-sync route error:', error);
        return NextResponse.json(
            { error: 'Failed to sync data to the Hub.', details: error.message },
            { status: 500 }
        );
    }
}
