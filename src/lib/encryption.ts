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

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard IV length for GCM

/**
 * Encrypts clear text using AES-256-GCM.
 * Requires ENCRYPTION_KEY env variable to be 64 hex characters.
 */
export function encryptToken(text: string): string {
    const keyString = process.env.ENCRYPTION_KEY;
    if (!keyString) {
        throw new Error('ENCRYPTION_KEY environment variable is missing.');
    }
    
    const key = Buffer.from(keyString, 'hex');
    if (key.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters).');
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    // Return combined payload iv:authTag:encryptedContent
    return `${iv.toString('hex')}:${authTag.toString()}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM encrypted text.
 */
export function decryptToken(encryptedText: string): string {
    const keyString = process.env.ENCRYPTION_KEY;
    if (!keyString) {
        throw new Error('ENCRYPTION_KEY environment variable is missing.');
    }

    const key = Buffer.from(keyString, 'hex');
    if (key.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters).');
    }

    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted format. Expected iv:authTag:encryptedContent');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
