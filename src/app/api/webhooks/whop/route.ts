import { NextResponse } from 'next/server';
import { WhopAPI } from '@whop-apps/sdk';

/**
 * Global Webhook Receiver for the Central Hub
 * 
 * This route listens for events triggered by Whop (e.g., 'membership.went_valid', 'membership.went_invalid')
 * across all your Spoke apps, allowing you to trigger automated DMs or Notion updates.
 */
export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        const headers = {
            'whop-signature': req.headers.get('whop-signature') || '',
        };

        // Replace 'whsec_XXXXX' with your actual Webhook Secret from the Whop Developer Dashboard
        const WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET;

        if (!WEBHOOK_SECRET) {
            console.warn('Webhook secret is missing. Cannot verify Whop signature.');
            // In a strict production environment, you might return 400 here.
        }

        // You can parse the payload to extract user details
        const payload = JSON.parse(rawBody);
        const eventType = payload.action;

        console.log(`[Hub API] Received Whop Webhook Event: ${eventType}`, payload);

        // TODO: Connect these events to the Notion CRM sync logic 
        // Example: if (eventType === 'membership.went_invalid') { updateNotionTiertoBasic() }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Webhook processing failed:', error);
        return NextResponse.json({ error: 'Webhook processing failed', details: error.message }, { status: 500 });
    }
}
