'use client';

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { supabase } from "@/lib/supabaseAuth";

export default function SetupPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check if the user is authenticated via the invitation email redirection
    const checkSession = async () => {
      try {
        const { data: { session: activeSession } } = await supabase.auth.getSession();
        setSession(activeSession);
        if (!activeSession) {
          setError("Yêu cầu mã mời không hợp lệ hoặc đã hết hạn.");
        }
      } catch (err) {
        console.error("Error getting session:", err);
        setError("Đã xảy ra lỗi khi xác thực mã mời.");
      } finally {
        setVerifying(false);
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (password.length < 6) {
      return setError("Mật khẩu phải chứa ít nhất 6 ký tự.");
    }
    if (password !== confirmPassword) {
      return setError("Mật khẩu xác nhận không khớp.");
    }

    setLoading(true);
    try {
      // 1. Update the user password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      // 2. Activate the UserProfile status in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { error: profileError } = await supabase
          .from('user_profile')
          .update({ status: 'active' })
          .eq('email', user.email.toLowerCase());
        
        if (profileError) {
          console.error("Error updating user profile status:", profileError);
          // Non-blocking warning: still proceed since authentication password was successfully set
        }
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err) {
      setError(err.message || "Không thể đặt mật khẩu mới.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <AuthLayout title="Đang kiểm tra lời mời..." subtitle="Vui lòng đợi trong giây lát">
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout title="Cài đặt thành công!" subtitle="Chào mừng bạn đến với hệ thống GloPro">
        <div className="flex flex-col items-center py-6 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-bounce" />
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Mật khẩu đã được thiết lập thành công. Hệ thống sẽ tự động đăng nhập và chuyển bạn về trang chủ trong giây lát...
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Thiết lập mật khẩu"
      subtitle="Định dạng mật khẩu của bạn để kích hoạt tài khoản GloPro"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="password">Mật khẩu mới</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="password"
              type="password"
              required
              disabled={!session || loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-10 h-12 bg-white rounded-xl border border-slate-200"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Nhập lại mật khẩu mới</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="confirmPassword"
              type="password"
              required
              disabled={!session || loading}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-10 h-12 bg-white rounded-xl border border-slate-200"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={!session || loading}
          className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5 mt-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Kích hoạt tài khoản"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
