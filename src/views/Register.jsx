'use client';

import React, { useState } from "react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, Facebook } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import {
  registerWithEmail,
  verifyOtp,
  resendOtp,
  loginWithGoogleSupabase,
  loginWithFacebookSupabase,
} from "@/lib/supabaseAuth";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setLoading(true);
    try {
      await registerWithEmail(email, password);
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      await verifyOtp(email, otpCode);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Mã xác thực không hợp lệ.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await resendOtp(email);
      toast({
        title: "Đã gửi lại mã",
        description: "Vui lòng kiểm tra hộp thư email của bạn.",
      });
    } catch (err) {
      setError(err.message || "Không thể gửi lại mã.");
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogleSupabase();
    } catch (err) {
      setError(err.message || "Đăng nhập Google thất bại.");
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
      setError(err.message || "Đăng nhập Facebook thất bại.");
    } finally {
      setLoading(false);
    }
  };

  if (showOtp) {
    return (
      <AuthLayout
        title="Xác thực Email"
        subtitle={`Chúng tôi đã gửi mã xác nhận đến ${email}`}
      >
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
            {error}
          </div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} className="border-slate-300 text-slate-800 font-bold" />
              <InputOTPSlot index={1} className="border-slate-300 text-slate-800 font-bold" />
              <InputOTPSlot index={2} className="border-slate-300 text-slate-800 font-bold" />
              <InputOTPSlot index={3} className="border-slate-300 text-slate-800 font-bold" />
              <InputOTPSlot index={4} className="border-slate-300 text-slate-800 font-bold" />
              <InputOTPSlot index={5} className="border-slate-300 text-slate-800 font-bold" />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          className="w-full h-12 font-bold text-sm bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl shadow-lg shadow-pink-500/20"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang xác thực...
            </>
          ) : (
            "Xác Nhận & Hoàn Tất"
          )}
        </Button>
        <p className="text-center text-xs font-medium text-slate-500 mt-4">
          Chưa nhận được mã?{" "}
          <button
            type="button"
            onClick={handleResend}
            className="text-pink-600 font-bold hover:underline"
          >
            Gửi lại mã
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Tạo tài khoản mới"
      subtitle="Bắt đầu quản lý Salon & Spa của bạn cùng GloPro"
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-pink-600 font-bold hover:underline">
            Đăng nhập ngay
          </Link>
        </>
      }
    >
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

      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
          <span className="bg-white px-3 text-slate-400 rounded-full border border-slate-100">hoặc email</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Địa chỉ Email</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 bg-slate-50/80 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-pink-500 focus:bg-white text-xs font-medium rounded-xl transition-all"
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold text-slate-700">Mật khẩu</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 bg-slate-50/80 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-pink-500 focus:bg-white text-xs font-medium rounded-xl transition-all"
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700">Xác nhận mật khẩu</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12 bg-slate-50/80 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-pink-500 focus:bg-white text-xs font-medium rounded-xl transition-all"
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
              Đang tạo tài khoản...
            </>
          ) : (
            "Tạo Tài Khoản Ngay"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
