import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';

function base64url(buffer: Buffer) {
    return buffer.toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function generateRandomString(length: number) {
    return base64url(crypto.randomBytes(length));
}

function sha256(str: string) {
    return base64url(crypto.createHash('sha256').update(str).digest());
}

/**
 * Initiates the Whop OAuth PKCE Flow.
 * Redirects the developer/business owner to Whop to grant access permissions.
 */
export async function GET() {
    try {
        const clientId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
        const redirectUri = process.env.NEXT_PUBLIC_WHOP_REDIRECT_URI;

        if (!clientId || !redirectUri) {
            return NextResponse.json(
                { error: 'OAuth configuration variables are missing. Please set NEXT_PUBLIC_WHOP_APP_ID and NEXT_PUBLIC_WHOP_REDIRECT_URI in env.' },
                { status: 500 }
            );
        }

        const codeVerifier = generateRandomString(32);
        const state = generateRandomString(16);
        const nonce = generateRandomString(16);
        const codeChallenge = sha256(codeVerifier);

        const cookieStore = await cookies();

        // Save codeVerifier and state in secure HTTP-only cookies
        cookieStore.set('whop_oauth_verifier', codeVerifier, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 300, // Valid for 5 minutes
            path: '/'
        });

        cookieStore.set('whop_oauth_state', state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 300, // Valid for 5 minutes
            path: '/'
        });

        // Request broad developer scopes to manage app instances, payments, and subscriptions
        const scopes = 'openid profile email';
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: scopes,
            state: state,
            nonce: nonce,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256'
        });

        return NextResponse.redirect(`https://api.whop.com/oauth/authorize?${params.toString()}`);
    } catch (error: any) {
        console.error('Error starting Whop OAuth:', error);
        return NextResponse.json({ error: 'OAuth initialization failed', details: error.message }, { status: 500 });
    }
}
