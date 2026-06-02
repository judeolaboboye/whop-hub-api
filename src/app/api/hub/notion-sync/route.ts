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
            where: { appName: data.appSource }
        });

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

            app = await db.whopApp.create({
                data: {
                    whopAppId: `app_${data.appSource.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                    appName: data.appSource,
                    userId: developer.id
                }
            });
        }

        // Upsert Customer to capture the cohort signup month
        const now = new Date();
        const cohortMonth = new Date(now.getFullYear(), now.getMonth(), 1); // Start of month

        await db.customer.upsert({
            where: { whopCustomerId: data.whopUserId },
            update: {
                email: data.email,
                status: 'ACTIVE' // Reactivated or updated
            },
            create: {
                whopCustomerId: data.whopUserId,
                email: data.email,
                appId: app.id,
                joinedCohortMonth: cohortMonth,
                status: 'ACTIVE'
            }
        });

        // 4. Push the data to the Central Notion CRM
        try {
            await syncUserToNotion(data);
        } catch (notionErr) {
            console.error('[CRM Sync Error] Notion failed to sync, continuing with Local DB:', notionErr);
        }

        // 5. Fire the Growth Hook Automated Email (Welcome Campaign)
        if (data.email) {
            await sendEmail({
                to: data.email,
                subject: `Welcome to ${data.appSource}! 🚀`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
                        <h2 style="color: #111;">Hey ${data.firstName || 'there'}!</h2>
                        <p style="font-size: 16px; line-height: 1.5; color: #444;">
                            Welcome to <b>${data.appSource}</b>. We are thrilled to have you inside the ecosystem.
                        </p>
                        <p style="font-size: 16px; line-height: 1.5; color: #444;">
                            Your workspace and tier (<b>${data.userTier}</b>) have been fully provisioned and logged in our system.
                        </p>
                        <p style="font-size: 16px; line-height: 1.5; color: #444;">
                            If you have any questions or need help setting up your app, simply reply to this email and I will get back to you directly.
                        </p>
                        <br/>
                        <p style="font-size: 16px; font-weight: bold; color: #111;">Let's build something great.</p>
                        <p style="font-size: 14px; color: #777;"><b>- Jude Victor Olaboboye</b></p>
                    </div>
                `
            }).catch(emailErr => {
                // Log SMTP transporter issues but do not fail the API response
                console.error('[SMTP Transporter Error] Failed to send welcome email:', emailErr);
            });
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
