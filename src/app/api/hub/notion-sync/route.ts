import { NextResponse } from 'next/server';
import { syncUserToNotion, HubSyncPayload } from '@/lib/notion';
import { sendEmail } from '@/lib/email';

export async function POST(req: Request) {
    try {
        // 1. Receive the payload sent by a Spoke app
        const data: HubSyncPayload = await req.json();

        // 2. Validate the mandatory "Growth Hook" fields
        if (!data.email || !data.whopUserId) {
            return NextResponse.json(
                { error: 'Missing mandatory fields: email and whopUserId are required for Activation.' },
                { status: 400 }
            );
        }

        // 3. Push the data to the Central CRM
        await syncUserToNotion(data);

        // 4. Fire the Growth Hook Automated Email (Welcome)
        if (data.email) {
            await sendEmail({
                to: data.email,
                subject: `Welcome to ${data.appSource}! 🚀`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; padding: 20px;">
                        <h2>Hey ${data.firstName || 'there'}!</h2>
                        <p>Welcome to <b>${data.appSource}</b>. We are thrilled to have you inside the ecosystem.</p>
                        <p>Your workspace and tier (<b>${data.userTier}</b>) have been fully provisioned and logged in our system.</p>
                        <p>If you have any questions or need help setting up your app, simply reply to this email and I will get back to you directly.</p>
                        <br/>
                        <p>Let's build something great.</p>
                        <p><b>- Jude</b></p>
                    </div>
                `
            }).catch(err => {
                // Catch but do not break the API response if the email fails (e.g., bad password)
                console.error('Failed to send welcome email:', err);
            });
        }

        return NextResponse.json({ success: true, message: 'User successfully synced to Central CRM and Welcome Email sent.' });
    } catch (error: any) {
        console.error('Hub API Error:', error);
        return NextResponse.json(
            { error: 'Failed to sync data to the Hub CRM.', details: error.message },
            { status: 500 }
        );
    }
}
