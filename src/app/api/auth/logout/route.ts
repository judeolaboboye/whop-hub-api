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
