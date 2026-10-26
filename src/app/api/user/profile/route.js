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

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, email, fullName, phone, avatarUrl } = body;

    if (!userId && !email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 });
    }

    const cleanEmail = String(email || '').toLowerCase().trim();

    // 1. Check existing user_profile
    let query = supabaseAdmin.from('user_profile').select('*');
    if (userId && cleanEmail) {
      query = query.or(`id.eq.${userId},email.eq.${cleanEmail}`);
    } else if (userId) {
      query = query.eq('id', userId);
    } else {
      query = query.eq('email', cleanEmail);
    }

    const { data: existingProfiles, error: fetchErr } = await query.limit(1);
    let profile = existingProfiles?.[0];

    const updatePayload = {
      updated_at: new Date().toISOString()
    };
    if (fullName !== undefined) updatePayload.full_name = fullName;
    if (phone !== undefined) updatePayload.phone = phone;
    if (avatarUrl !== undefined) updatePayload.avatar_url = avatarUrl;

    if (profile) {
      // 2. Update existing profile
      const { data: updated, error: updErr } = await supabaseAdmin
        .from('user_profile')
        .update(updatePayload)
        .eq('id', profile.id)
        .select()
        .single();

      if (updErr) {
        console.error('[API /api/user/profile] Error updating profile:', updErr);
        return NextResponse.json({ error: updErr.message }, { status: 500 });
      }
      profile = updated;
    } else {
      // 3. Create profile if not exists
      const newProfile = {
        id: userId || crypto.randomUUID(),
        email: cleanEmail,
        full_name: fullName || cleanEmail.split('@')[0],
        phone: phone || '',
        avatar_url: avatarUrl || '',
        role: 'owner',
        status: 'active',
        type: 'Employee',
        tenant_id: userId || crypto.randomUUID()
      };

      const { data: created, error: insErr } = await supabaseAdmin
        .from('user_profile')
        .insert([newProfile])
        .select()
        .single();

      if (insErr) {
        console.error('[API /api/user/profile] Error inserting profile:', insErr);
        return NextResponse.json({ error: insErr.message }, { status: 500 });
      }
      profile = created;
    }

    // 4. Update Supabase Auth user_metadata if userId provided
    if (userId && userId.length === 36) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            full_name: fullName,
            name: fullName,
            phone: phone,
            avatar_url: avatarUrl
          }
        });
      } catch (authErr) {
        console.warn('[API /api/user/profile] Warning updating auth user_metadata:', authErr);
      }
    }

    return NextResponse.json({
      success: true,
      profile
    });
  } catch (err) {
    console.error('[API /api/user/profile] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
