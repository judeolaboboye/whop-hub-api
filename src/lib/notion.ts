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
    name?: string;
    username?: string;
    bio?: string;
    profilePictureUrl?: string;
    status?: string;
}

/**
 * Inserts or updates a user record in the Central Notion CRM.
 */
export async function syncUserToNotion(
    payload: HubSyncPayload,
    customApiKey?: string,
    customDatabaseId?: string
) {
    const apiKey = customApiKey || process.env.NOTION_API_KEY;
    const databaseId = customDatabaseId || DATABASE_ID;

    if (!apiKey) {
        throw new Error('Notion API Key is missing.');
    }
    if (!databaseId) {
        throw new Error('Notion Database ID is missing.');
    }

    const activeClient = customApiKey ? new Client({ auth: apiKey }) : notion;

    try {
        const response = await activeClient.pages.create({
            parent: { database_id: databaseId },
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
                        { text: { content: payload.firstName || '' } }
                    ],
                },
                User_Tier: {
                    select: { name: payload.userTier || 'Trial' },
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
                        { text: { content: payload.nicheCategory || 'General' } }
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
