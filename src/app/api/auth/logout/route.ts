import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Log out handler. Clears session cookies and redirects to the landing page.
 */
export async function GET() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('whop_session_user_id');
        cookieStore.delete('whop_oauth_verifier');
        cookieStore.delete('whop_oauth_state');

        // Redirect to homepage to show the landing page
        return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_WHOP_REDIRECT_URI || 'https://hub-api-taupe.vercel.app'));
    } catch (error: any) {
        console.error('Logout failed:', error);
        return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
    }
}
