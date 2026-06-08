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

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { encryptToken } from '@/lib/encryption';

interface WhopTokens {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
}

interface WhopUserInfo {
    sub: string; // User ID (e.g. user_xxxxx)
    email: string;
    name?: string;
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
            console.error('[OAuth Callback Error] Whop returned error:', error, errorDescription);
            return NextResponse.json({ error: `OAuth returned error: ${error} - ${errorDescription || ''}` }, { status: 400 });
        }

        if (!code || !state) {
            return NextResponse.json({ error: 'Authorization code or state query parameter is missing.' }, { status: 400 });
        }

        const cookieStore = await cookies();
        const storedState = cookieStore.get('whop_oauth_state')?.value;
        const codeVerifier = cookieStore.get('whop_oauth_verifier')?.value;

        // Clean up OAuth initialization cookies immediately
        cookieStore.delete('whop_oauth_state');
        cookieStore.delete('whop_oauth_verifier');

        if (!storedState || state !== storedState) {
            console.error('[OAuth State Mismatch] Possible CSRF attack detected.');
            return NextResponse.json({ error: 'CSRF security validation failed: invalid state.' }, { status: 403 });
        }

        if (!codeVerifier) {
            console.error('[OAuth PKCE Error] Code verifier is missing from cookies.');
            return NextResponse.json({ error: 'PKCE session has expired. Please initiate sign in again.' }, { status: 400 });
        }

        const clientId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
        const clientSecret = process.env.WHOP_CLIENT_SECRET;
        const redirectUri = process.env.NEXT_PUBLIC_WHOP_REDIRECT_URI;

        if (!clientId || !clientSecret || !redirectUri) {
            return NextResponse.json({ error: 'OAuth credentials or redirect URI is missing in server environment.' }, { status: 500 });
        }

        // 1. Exchange OAuth code for tokens
        const tokenResponse = await fetch('https://api.whop.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id: clientId,
                client_secret: clientSecret,
                code_verifier: codeVerifier
            })
        });

        if (!tokenResponse.ok) {
            const tokenErr = await tokenResponse.json().catch(() => ({}));
            console.error('[OAuth Token Exchange Error] Whop token endpoint failed:', tokenResponse.status, tokenErr);
            return NextResponse.json({ error: `Token exchange failed: ${tokenErr.error_description || tokenResponse.status}` }, { status: 400 });
        }

        const tokens: WhopTokens = await tokenResponse.json();

        // 2. Fetch User Profile using Access Token
        const userinfoResponse = await fetch('https://api.whop.com/oauth/userinfo', {
            headers: { 'Authorization': `Bearer ${tokens.access_token}` }
        });

        if (!userinfoResponse.ok) {
            console.error('[OAuth Userinfo Error] Whop userinfo endpoint failed:', userinfoResponse.status);
            return NextResponse.json({ error: 'Failed to retrieve user profile from Whop.' }, { status: 400 });
        }

        const userInfo: WhopUserInfo = await userinfoResponse.json();

        // 3. Encrypt access and refresh tokens
        const encryptedAccessToken = encryptToken(tokens.access_token);
        const encryptedRefreshToken = encryptToken(tokens.refresh_token);
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

        // 4. Save user profile & encrypted keys into PostgreSQL database
        const isAdmin = userInfo.email === 'judeolaboboye@gmail.com' || (process.env.ADMIN_EMAIL && userInfo.email === process.env.ADMIN_EMAIL);

        const user = await db.user.upsert({
            where: { whopUserId: userInfo.sub },
            update: {
                email: userInfo.email,
                accessToken: encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
                tokenExpires: expiresAt,
                ...(isAdmin ? { tier: 'PREMIUM' } : {})
            },
            create: {
                email: userInfo.email,
                whopUserId: userInfo.sub,
                accessToken: encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
                tokenExpires: expiresAt,
                tier: isAdmin ? 'PREMIUM' : 'FREE'
            }
        });

        // 5. Establish secure session cookie for dashboard authorization
        cookieStore.set('whop_session_user_id', user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days session
            path: '/'
        });

        // 6. Redirect to the core management dashboard
        const dashboardUrl = new URL('/dashboard', req.url);
        return NextResponse.redirect(dashboardUrl);
    } catch (error: any) {
        console.error('OAuth Callback processing failed:', error);
        return NextResponse.json({ error: 'OAuth Callback processing failed', details: error.message }, { status: 500 });
    }
}
