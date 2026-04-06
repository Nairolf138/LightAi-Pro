import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { runtimeClient } from '../lib/runtimeClient';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type PasswordPolicyEvaluation = {
  isValid: boolean;
  checks: Array<{ id: string; label: string; passed: boolean }>;
};

const CREDENTIALS_VAULT_KEY = 'auth:credentials';

function evaluatePasswordPolicy(password: string, email: string): PasswordPolicyEvaluation {
  const emailLocalPart = email.split('@')[0]?.toLowerCase() ?? '';
  const checks = [
    { id: 'length', label: 'At least 12 characters', passed: password.length >= 12 },
    { id: 'upper', label: 'At least one uppercase letter', passed: /[A-Z]/.test(password) },
    { id: 'lower', label: 'At least one lowercase letter', passed: /[a-z]/.test(password) },
    { id: 'number', label: 'At least one number', passed: /\d/.test(password) },
    { id: 'symbol', label: 'At least one symbol', passed: /[^A-Za-z0-9]/.test(password) },
    { id: 'spaces', label: 'No spaces', passed: !/\s/.test(password) },
    {
      id: 'email',
      label: 'Must not contain your email name',
      passed: emailLocalPart.length < 3 || !password.toLowerCase().includes(emailLocalPart)
    }
  ];

  return {
    checks,
    isValid: checks.every((check) => check.passed)
  };
}

function mapAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Unknown authentication error.';
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials')) {
    return 'Incorrect email or password. Verify your credentials and try again.';
  }

  if (lower.includes('email not confirmed')) {
    return 'Your email is not confirmed yet. Check your inbox then retry.';
  }

  if (lower.includes('already registered')) {
    return 'This email is already registered. Switch to Sign In or reset the password.';
  }

  if (lower.includes('rate limit')) {
    return 'Too many attempts detected. Wait a minute before trying again.';
  }

  return message;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberSecurely, setRememberSecurely] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const passwordPolicy = useMemo(() => evaluatePasswordPolicy(password, email), [password, email]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isCancelled = false;
    runtimeClient
      .vaultGetSecret({ key: CREDENTIALS_VAULT_KEY })
      .then((payload) => {
        if (!payload || isCancelled) {
          return;
        }
        const parsed = JSON.parse(payload) as { email?: string; password?: string };
        if (parsed.email && parsed.password) {
          setEmail(parsed.email);
          setPassword(parsed.password);
          setRememberSecurely(true);
        }
      })
      .catch(() => {
        setRememberSecurely(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const persistCredentials = async (): Promise<void> => {
    if (rememberSecurely) {
      await runtimeClient.vaultSetSecret({
        key: CREDENTIALS_VAULT_KEY,
        value: JSON.stringify({ email, password })
      });
      return;
    }

    await runtimeClient.vaultDeleteSecret({ key: CREDENTIALS_VAULT_KEY });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isLogin && !passwordPolicy.isValid) {
      setFormError('Password policy is not satisfied. Review all requirements before creating the account.');
      return;
    }

    if (failedAttempts >= 5) {
      setFormError('Temporarily blocked after repeated failures. Wait 60 seconds before retrying.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        await persistCredentials();
        toast.success('Successfully logged in.');
      } else {
        const { error: signUpError, data } = await supabase.auth.signUp({
          email,
          password
        });
        if (signUpError) throw signUpError;

        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: data.user.id, username }]);

          if (profileError) throw profileError;
        }

        await persistCredentials();
        toast.success('Account created. Confirm your email before first login if required.');
      }
      setFailedAttempts(0);
      onClose();
    } catch (error) {
      setFailedAttempts((value) => value + 1);
      const explicitError = mapAuthError(error);
      setFormError(explicitError);
      toast.error(explicitError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-lg flex items-center justify-center z-50">
      <div className="bg-gray-900 p-8 rounded-xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6 gradient-text">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>

          {!isLogin && (
            <div className="rounded-lg border border-gray-700 p-3 text-xs text-gray-300 space-y-1">
              <p className="font-semibold text-gray-200">Password requirements:</p>
              <ul className="space-y-1">
                {passwordPolicy.checks.map((check) => (
                  <li key={check.id} className={check.passed ? 'text-green-400' : 'text-gray-400'}>
                    {check.passed ? '✓' : '•'} {check.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={rememberSecurely}
              onChange={(e) => setRememberSecurely(e.target.checked)}
            />
            Remember credentials in secure local vault
          </label>

          {formError && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-300">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 text-black font-semibold py-2 rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-400">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setFormError(null);
            }}
            className="text-yellow-400 hover:text-yellow-300"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
