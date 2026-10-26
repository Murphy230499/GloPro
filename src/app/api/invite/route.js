import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, first_name, last_name, phone, role, type, branch_ids, avatar_url } = body;

    if (!email || !first_name) {
      return NextResponse.json({ error: 'Email và Tên là bắt buộc' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hgdzjnwiubsdjeaonpnt.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Caller Authorization & Tenant Extraction
    const authHeader = request.headers.get('authorization');
    let callerTenantId = null;
    let isAuthorized = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (user && !error) {
          const { data: profile } = await supabaseAdmin
            .from('user_profile')
            .select('tenant_id, role')
            .eq('id', user.id)
            .maybeSingle();

          const userRole = profile?.role || user.user_metadata?.role;
          callerTenantId = profile?.tenant_id || user.user_metadata?.tenant_id;
          
          if (userRole === 'owner' || userRole === 'manager' || userRole === 'admin') {
            isAuthorized = true;
          }
        }
      } catch (_) {}
    }

    const isDev = process.env.NODE_ENV === 'development';
    if (!isAuthorized && isDev) {
      isAuthorized = true;
      callerTenantId = '57e50365-d351-4acf-a967-c6c0fc62eed9';
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Chỉ có Chủ Salon hoặc Quản lý mới có quyền mời nhân viên' }, { status: 403 });
    }

    const requestUrl = new URL(request.url);
    const redirectToUrl = `${requestUrl.origin}/auth/setup-password`;

    // 1. Invite user through Supabase Auth Admin API
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectToUrl,
      data: {
        full_name: `${last_name} ${first_name}`.trim(),
        first_name,
        last_name,
        tenant_id: callerTenantId,
        role: role || 'staff'
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
        role: role || 'staff',
        type: type || 'staff',
        status: 'pending',
        branch_ids,
        avatar_url,
        tenant_id: callerTenantId
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
