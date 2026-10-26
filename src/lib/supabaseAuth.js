import { supabase } from '@/lib/supabaseClient';
import { clearActiveTenant } from '@/lib/tenantManager';

/** Đăng nhập bằng email/password */
export async function loginViaEmailPassword(email, password) {
  clearActiveTenant();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** Đăng ký tài khoản mới bằng email/password */
export async function registerWithEmail(email, password) {
  clearActiveTenant();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

/** Xác thực OTP email (Supabase dùng verifyOtp type=email) */
export async function verifyOtp(email, token) {
  clearActiveTenant();
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
  return data;
}

/** Gửi lại OTP email */
export async function resendOtp(email) {
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw error;
}

/** Gửi email đặt lại mật khẩu */
export async function resetPasswordRequest(email) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });
  if (error) throw error;
}

/** Đặt lại mật khẩu mới (sau khi user click link trong email) */
export async function resetPassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/** Cập nhật thông tin user (full_name, phone, avatar_url) */
export async function updateMe(fields) {
  let sessionUser = null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    sessionUser = session?.user;
  } catch (_) {}

  let devUser = null;
  if (!sessionUser && typeof window !== 'undefined') {
    const devStr = localStorage.getItem('gp_dev_auth_user');
    if (devStr) {
      try { devUser = JSON.parse(devStr); } catch (_) {}
    }
  }

  const userId = sessionUser?.id || devUser?.id;
  const email = sessionUser?.email || devUser?.email;

  // 1. Gọi API server để cập nhật trực tiếp vào public.user_profile và auth.users
  try {
    const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/user/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        email,
        fullName: fields.full_name,
        phone: fields.phone,
        avatarUrl: fields.avatar_url
      })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.profile && typeof window !== 'undefined') {
        sessionStorage.setItem('gp_active_profile', JSON.stringify(json.profile));
        localStorage.setItem('gp_user_profile', JSON.stringify(json.profile));
      }
    }
  } catch (apiErr) {
    console.warn('[updateMe] API update warning:', apiErr);
  }

  // 2. Đồng bộ client Supabase auth metadata nếu đang đăng nhập
  if (sessionUser) {
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: fields.full_name,
          phone: fields.phone,
          avatar_url: fields.avatar_url,
        },
      });
    } catch (_) {}
  }

  // 3. Nếu đang ở chế độ dev user, cập nhật ngay vào gp_dev_auth_user
  if (devUser && typeof window !== 'undefined') {
    const updatedDev = { ...devUser, ...fields };
    localStorage.setItem('gp_dev_auth_user', JSON.stringify(updatedDev));
  }

  // 4. Lưu cache cục bộ để truy cập tức thì
  if (typeof window !== 'undefined') {
    let existing = {};
    try {
      const c = localStorage.getItem('gp_user_profile');
      if (c) existing = JSON.parse(c);
    } catch (_) {}
    const merged = { ...existing, id: userId, email, ...fields };
    localStorage.setItem('gp_user_profile', JSON.stringify(merged));
    sessionStorage.setItem('gp_active_profile', JSON.stringify(merged));
  }

  return { id: userId, email, ...fields };
}

/** Lấy thông tin user hiện tại */
export async function getMe() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  const u = session.user;
  return {
    id: u.id,
    email: u.email,
    full_name: u.user_metadata?.full_name || u.user_metadata?.name || u.email,
    avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture,
    phone: u.user_metadata?.phone,
    role: u.user_metadata?.role || u.app_metadata?.role,
    provider: u.app_metadata?.provider,
  };
}

/** Đăng xuất */
export async function logoutSupabase() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Supabase logout error:', error);
}

/** OAuth Google */
export async function loginWithGoogleSupabase(redirectPath) {
  clearActiveTenant();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const target = redirectPath || searchParams?.get('redirect') || '/';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}${target}`,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });
  if (error) throw error;
  return data;
}

/** OAuth Facebook */
export async function loginWithFacebookSupabase(redirectPath) {
  clearActiveTenant();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const target = redirectPath || searchParams?.get('redirect') || '/';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: { redirectTo: `${origin}${target}` },
  });
  if (error) throw error;
  return data;
}
