import nodemailer from 'nodemailer';

/**
 * Global Email Sender for the Central Hub
 * Uses your personal Gmail account via an App Password.
 */
export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        // Your standard Gmail address (e.g., judeolaboboye@gmail.com)
        user: process.env.GMAIL_USER,
        // The 16-character App Password generated in your Google Account Security settings
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

export interface SendEmailPayload {
    to: string;
    subject: string;
    html: string; // The HTML body of the email
}

/**
 * Sends an email using the configured Gmail transporter.
 */
export async function sendEmail({ to, subject, html }: SendEmailPayload) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        throw new Error('Gmail credentials are missing in your environment variables.');
    }

    try {
        const info = await transporter.sendMail({
            from: `"Jude's Whop Apps" <${process.env.GMAIL_USER}>`,
            to,
            subject,
            html,
        });

        console.log(`[Email Sent] Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[Email Error] Failed to send email:', error);
        throw error;
    }
}
