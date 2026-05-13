import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, Shield, Camera, Loader2, Check } from 'lucide-react';
import { useGetMeQuery, useUpdateProfileMutation, useChangePasswordMutation } from '../../features/auth/authApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { getInitials } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [updateProfile, { isLoading: updatingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: changingPassword }] = useChangePasswordMutation();

  const [profileForm, setProfileForm] = useState({
    firstName: '', lastName: '', email: '', phone: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  useEffect(() => {
    dispatch(setPageTitle('My Profile'));
    dispatch(setBreadcrumbs([{ label: 'Settings', href: '/settings' }, { label: 'Profile' }]));
  }, [dispatch]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(profileForm).unwrap();
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    try {
      await changePassword(passwordForm).unwrap();
      toast.success('Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to change password.');
    }
  };

  return (
    <div className="page-container max-w-4xl mx-auto">
      <h1 className="section-title">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="card-base p-6 text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-4 overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-primary">
                    {getInitials(user?.firstName, user?.lastName)}
                  </span>
                )}
              </div>
              <button className="absolute bottom-4 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center border-2 border-card hover:bg-primary/90 transition-colors">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <h2 className="text-lg font-bold text-foreground">{user?.firstName} {user?.lastName}</h2>
            <p className="text-sm text-muted-foreground capitalize">{user?.roleType?.replace(/_/g, ' ')}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="badge-info text-[10px]">{user?.tenantName || 'MSME ERP'}</span>
              <span className="badge-success text-[10px]">Active</span>
            </div>
          </div>

          <div className="card-base p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              Security Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">MFA Status</span>
                <span className={cn('font-medium', user?.mfaEnabled ? 'text-green-500' : 'text-orange-500')}>
                  {user?.mfaEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Last Login</span>
                <span className="text-foreground">{new Date(user?.lastLogin).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* General Info */}
          <div className="card-base p-6">
            <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
              <User className="h-4 w-4" />
              General Information
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-base mb-1.5 block">First Name</label>
                  <input
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm(f => ({ ...f, firstName: e.target.value }))}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="label-base mb-1.5 block">Last Name</label>
                  <input
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm(f => ({ ...f, lastName: e.target.value }))}
                    className="input-base"
                  />
                </div>
              </div>
              <div>
                <label className="label-base mb-1.5 block">Email Address</label>
                <input
                  type="email"
                  value={profileForm.email}
                  disabled
                  className="input-base opacity-60 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="label-base mb-1.5 block">Phone Number</label>
                <input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                  className="input-base"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={updatingProfile} className="btn-primary flex items-center gap-2">
                  {updatingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Update Profile
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="card-base p-6">
            <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Change Password
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="label-base mb-1.5 block">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                  className="input-base"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-base mb-1.5 block">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="label-base mb-1.5 block">Confirm Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    className="input-base"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={changingPassword} className="btn-primary flex items-center gap-2">
                  {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
