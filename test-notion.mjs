import { Client } from '@notionhq/client';

const notion = new Client({
    auth: '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',
});

const DATABASE_ID = '31a7e430a0a680dabd67ceea8d3caf27';

async function testSync() {
    console.log('Testing Notion Database Connection...');
    try {
        const response = await notion.pages.create({
            parent: { database_id: DATABASE_ID },
            properties: {
                "App_Source": {
                    title: [
                        { text: { content: 'Hub API Test App' } }
                    ],
                },
                "App_User's_FirstName": {
                    rich_text: [
                        { text: { content: 'Jude Test' } }
                    ],
                },
                User_Tier: {
                    select: { name: 'Trial' },
                },
                Email: {
                    email: 'test@whop.com',
                },
                "Whop_User_ID ": {
                    rich_text: [
                        { text: { content: 'user_whop_123456' } }
                    ],
                },
                "Niche/Category": {
                    rich_text: [
                        { text: { content: 'Gym / Fitness' } }
                    ],
                },
                "User's_App_Usage&Log": {
                    url: 'https://sandbox.whop.com/logs/testing',
                },
                Last_Activity: {
                    date: { start: new Date().toISOString() },
                },
            },
        });
        console.log('✅ SUCCESS! Record inserted perfectly.');
        console.log('Record ID:', response.id);
    } catch (error) {
        console.error('❌ FAILED:');
        console.error(error.body || error.message);
    }
}

testSync();
