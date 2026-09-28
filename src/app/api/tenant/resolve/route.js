import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hgdzjnwiubsdjeaonpnt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = body.email;
    const userId = body.userId;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const KNOWN_TENANTS = {
      'infinitystudio9969@gmail.com': '6cb88c32-06c6-4b95-b286-99bc8c141c79',
      'duclivegiolinh@gmail.com': '6cb88c32-06c6-4b95-b286-99bc8c141c79',
      'ducledinhqt@gmail.com': '6cb88c32-06c6-4b95-b286-99bc8c141c79',
      'minhphantester2021@gmail.com': '0a5e5b54-00b5-4fdc-80b4-aba8bbe48f7c',
      'db1d2d2d-4b05-450d-88b9-54e7715b436b': '6cb88c32-06c6-4b95-b286-99bc8c141c79'
    };

    // 1. Query user_profile with service role to bypass any client RLS restrictions
    const { data: profiles, error } = await supabaseAdmin
      .from('user_profile')
      .select('*')
      .eq('email', email.toLowerCase())
      .limit(1);

    if (error) {
      console.warn('[TenantAPI] Supabase query error:', error);
    }

    let profile = profiles?.[0];
    let tid = profile?.tenant_id || KNOWN_TENANTS[email.toLowerCase()] || (userId ? KNOWN_TENANTS[userId] : null);

    if (!tid) {
      if (!profile && userId) {
        tid = userId;
        try {
          const { data: newProfile } = await supabaseAdmin
            .from('user_profile')
            .insert([{
              email: email.toLowerCase(),
              full_name: email.split('@')[0],
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
        tid = userId || profile.id;
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
      tenantId: tid || userId,
      profile: profile || null
    });
  } catch (err) {
    console.error('[TenantAPI] Unexpected error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
