import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, first_name, last_name, phone, role, type, branch_ids, avatar_url } = body;

    if (!email || !first_name) {
      return NextResponse.json({ error: 'Email và Tên là bắt buộc' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    // Use SUPABASE_SERVICE_ROLE_KEY if set, otherwise fallback to publishable key (though admin API requires service role)
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const requestUrl = new URL(request.url);
    const redirectToUrl = `${requestUrl.origin}/auth/setup-password`;

    // 1. Invite user through Supabase Auth Admin API
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectToUrl,
      data: {
        full_name: `${last_name} ${first_name}`.trim(),
        first_name,
        last_name
      }
    });

    if (inviteError) {
      console.error('Error inviting user via Auth:', inviteError);
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    const authUser = inviteData?.user;

    // 2. Create UserProfile entry in database
    const fullName = `${last_name} ${first_name}`.trim();
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profile')
      .upsert({
        email: email.toLowerCase(),
        full_name: fullName,
        first_name,
        last_name,
        phone,
        role,
        type,
        status: 'pending',
        branch_ids,
        avatar_url
      }, { onConflict: 'email' })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating UserProfile entry:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: authUser, profile: profileData });
  } catch (e) {
    console.error('Invite API route exception:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
