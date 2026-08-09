import { supabase } from '@/lib/supabaseClient';

/** Đăng nhập bằng email/password */
export async function loginViaEmailPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** Đăng ký tài khoản mới bằng email/password */
export async function registerWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

/** Xác thực OTP email (Supabase dùng verifyOtp type=email) */
export async function verifyOtp(email, token) {
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
  const { data, error } = await supabase.auth.updateUser({
    data: {
      full_name: fields.full_name,
      phone: fields.phone,
      avatar_url: fields.avatar_url,
    },
  });
  if (error) throw error;
  
  // Also update the public user_profile table if it exists
  if (data?.user?.email) {
    const { data: profiles } = await supabase
      .from('user_profile')
      .select('*')
      .eq('email', data.user.email);
      
    if (profiles && profiles.length > 0) {
      await supabase
        .from('user_profile')
        .update({
          full_name: fields.full_name,
          phone: fields.phone,
          avatar_url: fields.avatar_url
        })
        .eq('id', profiles[0].id);
    }
  }
  
  // Force a session refresh to update the local JWT with the new user_metadata
  await supabase.auth.refreshSession();
  
  return data?.user;
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
export async function loginWithGoogleSupabase() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/`,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });
  if (error) throw error;
  return data;
}

/** OAuth Facebook */
export async function loginWithFacebookSupabase() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: { redirectTo: `${origin}/` },
  });
  if (error) throw error;
  return data;
}
