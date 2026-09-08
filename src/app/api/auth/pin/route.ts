import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { hasSupabaseEnv } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServer } from '@/lib/supabase/server';

const Body = z.object({
  pin: z.string().regex(/^[0-9]{4,8}$/, 'PIN must be 4 to 8 digits'),
  deviceId: z.string().min(8).max(64),
});

/**
 * Staff PIN sign-in.
 *
 * The prototype kept PINs in app.js, which meant anyone who opened DevTools
 * owned the hub. Here the PIN never leaves the server: it is compared against
 * a bcrypt hash by a security-definer function, and on success we mint a
 * genuine Supabase session for that staff member. That matters — the session
 * is a real one, so row level security applies to the barista's iPad exactly
 * as it applies to the owner's laptop.
 */
export async function POST(request: NextRequest) {
  if (!hasSupabaseEnv() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Staff sign-in is not connected yet.' }, { status: 503 });
  }

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a 4 to 8 digit PIN.' }, { status: 400 });
  }

  const { pin, deviceId } = parsed.data;
  // Pair the client-side device id with the request IP so clearing local
  // storage does not also clear the lockout.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const deviceKey = `${deviceId}:${ip}`;

  const admin = supabaseAdmin();

  const { data, error } = await admin.rpc('verify_staff_pin', {
    p_pin: pin,
    p_device_id: deviceKey,
  });

  if (error) {
    console.error('[pin] verify failed', error.message);
    return NextResponse.json({ error: 'Could not check that PIN. Try again.' }, { status: 500 });
  }

  const result = Array.isArray(data) ? data[0] : null;

  if (result?.locked_until) {
    const seconds = Math.max(
      1,
      Math.ceil((new Date(result.locked_until).getTime() - Date.now()) / 1000),
    );
    return NextResponse.json(
      { error: `Too many wrong PINs. Try again in ${seconds}s.`, lockedForSeconds: seconds },
      { status: 429 },
    );
  }

  if (!result?.profile_id || !result.email) {
    const left = Math.max(0, 5 - (result?.fails ?? 0));
    return NextResponse.json(
      {
        error:
          left > 0 && left <= 2
            ? `PIN not recognised. ${left} ${left === 1 ? 'try' : 'tries'} left.`
            : 'PIN not recognised.',
      },
      { status: 401 },
    );
  }

  // Turn the verified identity into a real session: mint a single-use token
  // for that user, then redeem it on the server so the session cookies land
  // on this response.
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: result.email,
  });

  const tokenHash = link?.properties?.hashed_token;
  if (linkError || !tokenHash) {
    console.error('[pin] could not mint session', linkError?.message);
    return NextResponse.json({ error: 'Could not start a session. Try again.' }, { status: 500 });
  }

  const supabase = await supabaseServer();
  const { error: otpError } = await supabase.auth.verifyOtp({
    type: 'email',
    token_hash: tokenHash,
  });

  if (otpError) {
    console.error('[pin] session exchange failed', otpError.message);
    return NextResponse.json({ error: 'Could not start a session. Try again.' }, { status: 500 });
  }

  return NextResponse.json({
    name: result.display_name,
    role: result.role,
    redirect: result.role === 'kiosk' ? '/kiosk' : '/hub',
  });
}
