import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useForgotPasswordMutation } from '../../features/auth/authApi';
import toast from 'react-hot-toast';

const schema = z.object({ email: z.string().email('Invalid email address') });

const ForgotPasswordPage = () => {
  const [sent, setSent] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await forgotPassword(data).unwrap();
      setSent(true);
    } catch (err) {
      toast.error(err?.data?.message || 'Something went wrong.');
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
        <p className="text-slate-400 text-sm mb-6">
          If an account exists with that email, we've sent a password reset link.
        </p>
        <Link to="/login" className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center justify-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Reset password</h2>
        <p className="text-slate-400 mt-1 text-sm">Enter your email to receive a reset link</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              {...register('email')}
              type="email"
              placeholder="you@company.com"
              className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
        >
          {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : 'Send reset link'}
        </button>
      </form>

      <Link to="/login" className="flex items-center justify-center gap-2 text-slate-400 hover:text-slate-200 text-sm mt-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>
    </div>
  );
};

export default ForgotPasswordPage;
