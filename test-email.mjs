import { config } from 'dotenv';
import nodemailer from 'nodemailer';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function run() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || user === 'judeolaboboye@gmail.com' && pass === 'your_16_character_app_password_here') {
        console.error('❌ Error: You need to set a real GMAIL_APP_PASSWORD in your .env.local file');
        process.exit(1);
    }

    console.log(`Sending test email using ${user}...`);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: user,
            pass: pass,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: `"Jude's Automation Test" <${user}>`,
            to: user, // Send to yourself as a test!
            subject: "Test Email from your Hub API 🚀",
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>It worked!</h2>
          <p>Your Gmail automation using Nodemailer from your Next.js Hub API is successfully configured.</p>
          <p>You can now use this to send automated marketing campaigns and welcome emails!</p>
        </div>
      `,
        });

        console.log(`✅ Success! Test email sent. Message ID: ${info.messageId}`);
        console.log('Check your inbox!');
    } catch (error) {
        console.error('❌ Failed to send email:', error);
    }
}

run();
