import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Building2 } from 'lucide-react';
import { useRegisterMutation } from '../../features/auth/authApi';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const schema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Must include uppercase, lowercase, number, and special character'),
  phone: z.string().optional(),
});

const Field = ({ label, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
    {children}
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
  </div>
);

const RegisterPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [register, { isLoading }] = useRegisterMutation();

  const { register: reg, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const inputClass = (hasError) => cn(
    'w-full px-3 py-2.5 bg-white/5 border rounded-lg text-white placeholder:text-slate-500 text-sm',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
    hasError ? 'border-red-500' : 'border-white/10'
  );

  const onSubmit = async (data) => {
    try {
      await register(data).unwrap();
      toast.success('Account created! Please verify your email.');
      navigate('/login');
    } catch (err) {
      toast.error(err?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Create your account</h2>
        <p className="text-slate-400 mt-1 text-sm">Start your 14-day free trial</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Company Name" error={errors.companyName?.message}>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input {...reg('companyName')} placeholder="Acme Corp" className={cn(inputClass(errors.companyName), 'pl-9')} />
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name" error={errors.firstName?.message}>
            <input {...reg('firstName')} placeholder="John" className={inputClass(errors.firstName)} />
          </Field>
          <Field label="Last Name" error={errors.lastName?.message}>
            <input {...reg('lastName')} placeholder="Doe" className={inputClass(errors.lastName)} />
          </Field>
        </div>

        <Field label="Work Email" error={errors.email?.message}>
          <input {...reg('email')} type="email" placeholder="john@company.com" className={inputClass(errors.email)} />
        </Field>

        <Field label="Phone (optional)" error={errors.phone?.message}>
          <input {...reg('phone')} type="tel" placeholder="+91 98765 43210" className={inputClass(errors.phone)} />
        </Field>

        <Field label="Password" error={errors.password?.message}>
          <div className="relative">
            <input
              {...reg('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Min 8 chars, uppercase, number, symbol"
              className={cn(inputClass(errors.password), 'pr-10')}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <motion.button
          type="submit"
          disabled={isLoading}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm mt-2"
        >
          {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</> : 'Create free account'}
        </motion.button>

        <p className="text-xs text-slate-500 text-center">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>

      <p className="text-center text-sm text-slate-400 mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Sign in</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
