import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hgdzjnwiubsdjeaonpnt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const KNOWN_TENANT_MAP = {
  'dev_user_admin': '57e50365-d351-4acf-a967-c6c0fc62eed9',
  'admin@glopro.salon': '57e50365-d351-4acf-a967-c6c0fc62eed9',
  'infinitystudio9969@gmail.com': '6cb88c32-06c6-4b95-b286-99bc8c141c79',
  'duclivegiolinh@gmail.com': '6cb88c32-06c6-4b95-b286-99bc8c141c79',
  'ducledinhqt@gmail.com': '6cb88c32-06c6-4b95-b286-99bc8c141c79',
  'minhphantester2021@gmail.com': '0a5e5b54-00b5-4fdc-80b4-aba8bbe48f7c',
};

export async function POST(request) {
  try {
    const { email, userId, fullName } = await request.json();

    if (!userId && !email) {
      return NextResponse.json({ error: 'Missing userId and email' }, { status: 400 });
    }

    const cleanEmail = String(email || '').toLowerCase().trim();

    let knownTid = null;
    if (cleanEmail && KNOWN_TENANT_MAP[cleanEmail]) {
      knownTid = KNOWN_TENANT_MAP[cleanEmail];
    } else if (userId && KNOWN_TENANT_MAP[userId]) {
      knownTid = KNOWN_TENANT_MAP[userId];
    }

    // 2. Query user_profile
    let query = supabaseAdmin.from('user_profile').select('*');
    if (userId && cleanEmail) {
      query = query.or(`id.eq.${userId},email.eq.${cleanEmail}`);
    } else if (userId) {
      query = query.eq('id', userId);
    } else {
      query = query.eq('email', cleanEmail);
    }

    const { data: profiles, error: queryError } = await query.limit(1);
    let profile = profiles?.[0];

    let tid = knownTid || null;

    if (profile) {
      if (!tid) {
        tid = profile.tenant_id;
      }
      if (!tid) {
        // Assign new tenant_id = userId for the owner
        tid = userId || profile.id;
        await supabaseAdmin.from('user_profile').update({ tenant_id: tid }).eq('id', profile.id);
      }
    } else if (userId) {
      // 3. New User Registration: Auto create isolated tenant and profile
      tid = userId;
      const newProfile = {
        id: userId,
        email: cleanEmail,
        full_name: fullName || cleanEmail.split('@')[0],
        role: 'owner',
        status: 'active',
        type: 'Employee',
        tenant_id: tid
      };

      const { data: createdProf, error: insErr } = await supabaseAdmin
        .from('user_profile')
        .insert([newProfile])
        .select()
        .single();

      if (!insErr) {
        profile = createdProf;
      }

      // Check and auto-create default branch for new salon
      const { data: existingBranches } = await supabaseAdmin
        .from('branch')
        .select('id')
        .eq('tenant_id', tid);

      if (!existingBranches || existingBranches.length === 0) {
        await supabaseAdmin.from('branch').insert([{
          name: 'Chi nhánh chính',
          phone: '',
          address: '',
          is_active: true,
          tenant_id: tid
        }]);
      }
    }

    return NextResponse.json({
      tenantId: tid,
      profile: profile || null
    });
  } catch (err) {
    console.error('[API /api/tenant/resolve] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
