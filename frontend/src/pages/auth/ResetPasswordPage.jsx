import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useResetPasswordMutation } from '../../features/auth/authApi';
import toast from 'react-hot-toast';

const schema = z.object({
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Must include uppercase, lowercase, number, and special character'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    const token = searchParams.get('token');
    if (!token) { toast.error('Invalid reset link.'); return; }
    try {
      await resetPassword({ token, password: data.password }).unwrap();
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err?.data?.message || 'Reset failed. The link may have expired.');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Set new password</h2>
        <p className="text-slate-400 mt-1 text-sm">Choose a strong password for your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {[
          { name: 'password', label: 'New Password', placeholder: 'Min 8 chars...' },
          { name: 'confirmPassword', label: 'Confirm Password', placeholder: 'Repeat password' },
        ].map(({ name, label, placeholder }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
            <div className="relative">
              <input
                {...register(name)}
                type={showPassword ? 'text' : 'password'}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 pr-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors[name] && <p className="text-red-400 text-xs mt-1">{errors[name].message}</p>}
          </div>
        ))}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
        >
          {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Resetting...</> : 'Reset password'}
        </button>
      </form>

      <Link to="/login" className="block text-center text-slate-400 hover:text-slate-200 text-sm mt-6 transition-colors">
        Back to login
      </Link>
    </div>
  );
};

export default ResetPasswordPage;
