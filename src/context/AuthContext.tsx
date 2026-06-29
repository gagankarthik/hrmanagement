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
  /** Roles from Cognito groups (and a `custom:role` attribute), lowercased. */
  roles: string[];
  /**
   * HR-portal access flag from `custom:hr_access`. Defaults to true unless an
   * admin explicitly set it to "false" on the Users page. The company website
   * ignores this attribute, so blocking here never affects that login.
   */
  hrAccess: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Roles for the signed-in user (empty when signed out). */
  roles: string[];
  /** False only when an admin has revoked this user's HR-portal access. */
  hrAccess: boolean;
  /** True when sign-in returned the FORCE_CHANGE_PASSWORD challenge (admin-created users). */
  newPasswordRequired: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** Completes the FORCE_CHANGE_PASSWORD challenge with the user's chosen password (and any required attributes such as name / phone_number). */
  confirmNewPassword: (newPassword: string, attributes?: Record<string, string>) => Promise<void>;
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

      // Roles come from Cognito groups (`cognito:groups` in the ID token) and,
      // as a fallback, a `custom:role` attribute. Normalize to a lowercased list.
      const session = await fetchAuthSession();
      const groupsClaim = session.tokens?.idToken?.payload?.['cognito:groups'];
      const groups = Array.isArray(groupsClaim) ? groupsClaim.map(String) : [];
      const roleAttr = (attributes as Record<string, string | undefined>)['custom:role'];
      const roles = Array.from(
        new Set([...groups, ...(roleAttr ? [roleAttr] : [])].map((r) => r.toLowerCase().trim()).filter(Boolean)),
      );
      // HR-portal access: blocked only when explicitly "false".
      const hrAccess = (attributes as Record<string, string | undefined>)['custom:hr_access'] !== 'false';

      setUser({
        username: currentUser.username,
        email: attributes.email || currentUser.signInDetails?.loginId,
        userId: currentUser.userId,
        name: attributes.name,
        roles,
        hrAccess,
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

  const handleConfirmNewPassword = async (newPassword: string, attributes?: Record<string, string>) => {
    // Cognito requires any still-missing required attributes (e.g. `name`,
    // `phone_number`) to be supplied when completing the NEW_PASSWORD_REQUIRED challenge.
    const userAttributes = Object.fromEntries(
      Object.entries(attributes || {})
        .filter(([, v]) => v && v.trim())
        .map(([k, v]) => [k, v.trim()]),
    );
    const result = await confirmSignIn({
      challengeResponse: newPassword,
      options: Object.keys(userAttributes).length ? { userAttributes } : undefined,
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
    roles: user?.roles ?? [],
    hrAccess: user?.hrAccess ?? true,
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
