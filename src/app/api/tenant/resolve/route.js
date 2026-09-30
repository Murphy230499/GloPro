import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hgdzjnwiubsdjeaonpnt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export async function POST(request) {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    let verifiedUserId = null;
    let verifiedEmail = null;

    // 1. Authenticate caller via JWT token in Authorization header if present
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (!userError && userData?.user) {
        verifiedUserId = userData.user.id;
        verifiedEmail = userData.user.email?.toLowerCase();
      }
    }

    // 2. Fallback to request body if no token provided (client initial handshake)
    const body = await request.json().catch(() => ({}));
    const targetEmail = verifiedEmail || body.email?.toLowerCase();
    const targetUserId = verifiedUserId || body.userId;

    if (!targetEmail && !targetUserId) {
      return NextResponse.json({ error: 'Valid session or user identifier required' }, { status: 400 });
    }

    // 3. Query user_profile
    let query = supabaseAdmin.from('user_profile').select('*');
    if (targetUserId) {
      query = query.or(`id.eq.${targetUserId},email.eq.${targetEmail || ''}`);
    } else {
      query = query.eq('email', targetEmail);
    }

    const { data: profiles, error } = await query.limit(1);
    if (error) {
      console.warn('[TenantAPI] Supabase query error:', error);
    }

    let profile = profiles?.[0];
    let tid = profile?.tenant_id;

    // 4. Auto-provision profile/tenant for brand new salon owners
    if (!tid) {
      if (!profile && targetUserId && targetEmail) {
        tid = targetUserId;
        try {
          const { data: newProfile } = await supabaseAdmin
            .from('user_profile')
            .insert([{
              id: targetUserId,
              email: targetEmail,
              full_name: targetEmail.split('@')[0],
              role: 'owner',
              status: 'active',
              type: 'Employee',
              tenant_id: tid
            }])
            .select()
            .single();
          profile = newProfile;
        } catch (e) {
          console.warn('[TenantAPI] Profile create fallback:', e);
        }
      } else if (profile && !profile.tenant_id) {
        tid = targetUserId || profile.id;
        try {
          await supabaseAdmin
            .from('user_profile')
            .update({ tenant_id: tid })
            .eq('id', profile.id);
        } catch (e) {
          console.warn('[TenantAPI] Update tenant_id warning:', e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      tenantId: tid || targetUserId,
      profile: profile || null
    });
  } catch (err) {
    console.error('[TenantAPI] Unexpected error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
