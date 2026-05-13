import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Shield, Loader2 } from 'lucide-react';
import { useVerifyMFAMutation } from '../../features/auth/authApi';
import { setCredentials } from '../../features/auth/authSlice';
import toast from 'react-hot-toast';

const MFAPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const mfaToken = useSelector((state) => state.auth.mfaToken);
  const mfaMethod = useSelector((state) => state.auth.mfaMethod);
  const [verifyMFA, { isLoading }] = useVerifyMFAMutation();
  const [code, setCode] = React.useState(['', '', '', '', '', '']);
  const inputs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) inputs.current[index + 1]?.focus();
    if (newCode.every((d) => d !== '')) handleVerify(newCode.join(''));
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (fullCode) => {
    try {
      const result = await verifyMFA({ mfaToken, code: fullCode }).unwrap();
      dispatch(setCredentials({ user: result.data.user, accessToken: result.data.accessToken }));
      toast.success('Verified successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.data?.message || 'Invalid code. Please try again.');
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    }
  };

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Shield className="h-8 w-8 text-blue-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Two-factor authentication</h2>
      <p className="text-slate-400 text-sm mb-8">
        {mfaMethod === 'totp'
          ? 'Enter the 6-digit code from your authenticator app'
          : `Enter the 6-digit code sent to your ${mfaMethod}`}
      </p>

      <div className="flex justify-center gap-3 mb-8">
        {code.map((digit, i) => (
          <motion.input
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            whileFocus={{ scale: 1.05 }}
            className="w-12 h-14 text-center text-xl font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Verifying...</span>
        </div>
      )}

      <p className="text-slate-500 text-xs mt-4">
        Having trouble?{' '}
        <button className="text-blue-400 hover:text-blue-300">Use a backup code</button>
      </p>
    </div>
  );
};

export default MFAPage;
