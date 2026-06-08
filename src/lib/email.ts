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

import nodemailer from 'nodemailer';

/**
 * Global Email Sender for Nexus Hub
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
    resendApiKey?: string | null;
}

/**
 * Sends an email using the developer's Resend API Key if available, or falls back to Gmail SMTP.
 */
export async function sendEmail({ to, subject, html, resendApiKey }: SendEmailPayload) {
    if (resendApiKey && resendApiKey.trim() !== '') {
        try {
            console.log(`[Email] Sending via Resend API to ${to}...`);
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendApiKey.trim()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: 'onboarding@resend.dev',
                    to,
                    subject,
                    html,
                }),
            });

            if (!response.ok) {
                const errData = await response.text();
                throw new Error(`Resend API failed: ${response.statusText} - ${errData}`);
            }

            const data = await response.json();
            console.log(`[Email Sent] Resend ID: ${data.id}`);
            return { success: true, messageId: data.id };
        } catch (error) {
            console.error('[Email Error] Resend API failed, trying Gmail fallback if configured...', error);
        }
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        throw new Error('No valid Resend API Key or Gmail fallback credentials configured.');
    }

    try {
        const info = await transporter.sendMail({
            from: `"Jude's Whop Apps" <${process.env.GMAIL_USER}>`,
            to,
            subject,
            html,
        });

        console.log(`[Email Sent] Gmail Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[Email Error] Gmail fallback failed:', error);
        throw error;
    }
}
