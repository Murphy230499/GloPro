'use client';

import React, { useState } from "react";
import Link from 'next/link';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, Facebook } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { loginWithGoogleSupabase, loginWithFacebookSupabase } from "@/lib/supabaseAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Email hoặc mật khẩu không chính xác.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogleSupabase();
    } catch (err) {
      try {
        base44.auth.loginWithProvider("google", "/");
      } catch (e) {
        setError(err.message || "Đăng nhập Google thất bại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFacebook = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithFacebookSupabase();
    } catch (err) {
      try {
        base44.auth.loginWithProvider("facebook", "/");
      } catch (e) {
        setError(err.message || "Đăng nhập Facebook thất bại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Chào mừng trở lại!"
      subtitle="Đăng nhập để quản lý hệ thống Salon & Spa GloPro"
      footer={
        <>
          Bạn chưa có tài khoản?{" "}
          <Link href="/register" className="text-pink-600 font-bold hover:underline">
            Tạo tài khoản ngay
          </Link>
        </>
      }
    >
      {/* OAuth Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Button
          type="button"
          variant="outline"
          className="h-12 text-xs font-semibold bg-white hover:bg-slate-50 border-slate-200 text-slate-700 transition-all shadow-xs rounded-xl"
          onClick={handleGoogle}
        >
          <GoogleIcon className="w-4 h-4 mr-2" />
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 text-xs font-semibold bg-white hover:bg-slate-50 border-slate-200 text-slate-700 transition-all shadow-xs rounded-xl"
          onClick={handleFacebook}
        >
          <Facebook className="w-4 h-4 mr-2 text-[#1877F2] fill-[#1877F2]" />
          Facebook
        </Button>
      </div>

      {/* Separator */}
      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
          <span className="bg-white px-3 text-slate-400 rounded-full border border-slate-100">hoặc email</span>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5 text-left">
          <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Địa chỉ Email</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="admin@glopro.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 bg-slate-50/80 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-pink-500 focus:bg-white focus:ring-pink-500/20 text-xs font-medium rounded-xl transition-all"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold text-slate-700">Mật khẩu</Label>
            <Link href="/forgot-password" className="text-xs text-pink-600 font-semibold hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 bg-slate-50/80 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-pink-500 focus:bg-white focus:ring-pink-500/20 text-xs font-medium rounded-xl transition-all"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 font-bold text-sm bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-500/20 rounded-xl transition-all"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang đăng nhập...
            </>
          ) : (
            "Đăng Nhập Ngay"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
