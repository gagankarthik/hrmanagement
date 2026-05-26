'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  confirmSignIn,
  resetPassword,
  confirmResetPassword,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
} from 'aws-amplify/auth';
import { configureAmplify } from '@/config/amplify';

if (typeof window !== 'undefined') {
  configureAmplify();
}

interface User {
  username: string;
  email?: string;
  userId: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** True when sign-in returned the FORCE_CHANGE_PASSWORD challenge (admin-created users). */
  newPasswordRequired: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** Completes the FORCE_CHANGE_PASSWORD challenge with the user's chosen password (and required attributes such as name). */
  confirmNewPassword: (newPassword: string, name?: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmResetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newPasswordRequired, setNewPasswordRequired] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();

      setUser({
        username: currentUser.username,
        email: attributes.email || currentUser.signInDetails?.loginId,
        userId: currentUser.userId,
        name: attributes.name,
      });
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleSignIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await signIn({ username: email, password });
      if (result.isSignedIn) {
        setNewPasswordRequired(false);
        await checkAuth();
        return;
      }
      const step = result.nextStep?.signInStep;
      if (step === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        // Admin-created (Cognito console) users land here — they must set a new password.
        setNewPasswordRequired(true);
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
      if (step === 'CONFIRM_SIGN_UP') {
        throw new Error('Please confirm your email first');
      }
      throw new Error('Additional verification is required to sign in. Please contact your administrator.');
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const handleConfirmNewPassword = async (newPassword: string, name?: string) => {
    // Cognito requires any still-missing required attributes (e.g. `name`) to be
    // supplied when completing the NEW_PASSWORD_REQUIRED challenge.
    const result = await confirmSignIn({
      challengeResponse: newPassword,
      options: name && name.trim() ? { userAttributes: { name: name.trim() } } : undefined,
    });
    if (result.isSignedIn) {
      setNewPasswordRequired(false);
      await checkAuth();
    }
  };

  const handleSignUp = async (email: string, password: string, name: string) => {
    await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name,
        },
      },
    });
  };

  const handleConfirmSignUp = async (email: string, code: string) => {
    await confirmSignUp({
      username: email,
      confirmationCode: code,
    });
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  const handleResetPassword = async (email: string) => {
    await resetPassword({ username: email });
  };

  const handleConfirmResetPassword = async (email: string, code: string, newPassword: string) => {
    await confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    });
  };

  const refreshSession = async () => {
    await checkAuth();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    newPasswordRequired,
    signIn: handleSignIn,
    confirmNewPassword: handleConfirmNewPassword,
    signUp: handleSignUp,
    confirmSignUp: handleConfirmSignUp,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    confirmResetPassword: handleConfirmResetPassword,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
