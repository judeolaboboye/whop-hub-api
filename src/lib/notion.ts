import { Client } from '@notionhq/client';

// Initialize the Notion Client
// Ensure NOTION_API_KEY is defined in your .env.local file.
export const notion = new Client({
    auth: process.env.NOTION_API_KEY,
});

// The ID of the central "App Users Database" (Jude Special)
export const DATABASE_ID = process.env.NOTION_DATABASE_ID || '';

/**
 * Standardizes how Whop Mini Apps send data to the Hub so it maps cleanly to the CRM.
 */
export interface HubSyncPayload {
    appSource: string; // The Whop App the user installed
    userTier: 'Trial' | 'Paid' | 'Commission-based';
    nicheCategory: string; // The vertical of their Whop community
    firstName: string;
    email: string; // Required for the Growth Hook activation
    whopUserId: string;
    appUsageLogUrl?: string; // Optional deep link to logs
}

/**
 * Inserts or updates a user record in the Central Notion CRM.
 */
export async function syncUserToNotion(payload: HubSyncPayload) {
    if (!DATABASE_ID) {
        throw new Error('Notion Database ID is missing. Please set NOTION_DATABASE_ID in .env.local');
    }

    try {
        const response = await notion.pages.create({
            parent: { database_id: DATABASE_ID },
            properties: {
                "App_Source": {
                    title: [
                        {
                            text: { content: payload.appSource },
                        },
                    ],
                },
                "App_User's_FirstName": {
                    rich_text: [
                        { text: { content: payload.firstName } }
                    ],
                },
                User_Tier: {
                    select: { name: payload.userTier },
                },
                Email: {
                    email: payload.email,
                },
                "Whop_User_ID ": {
                    rich_text: [
                        { text: { content: payload.whopUserId } }
                    ],
                },
                "Niche/Category": {
                    rich_text: [
                        { text: { content: payload.nicheCategory } }
                    ],
                },
                "User's_App_Usage&Log": {
                    url: payload.appUsageLogUrl || null,
                },
                Last_Activity: {
                    date: { start: new Date().toISOString() },
                },
            },
        });

        return response;
    } catch (error) {
        console.error('Error syncing user to Notion CRM:', error);
        throw error;
    }
}
