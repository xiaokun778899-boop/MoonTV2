/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { AlertCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

// 仅保留版本号常量，移除 UpdateStatus 和检查函数
import { CURRENT_VERSION } from '@/lib/version';

import { useSite } from '@/components/SiteProvider';
import { ThemeToggle } from '@/components/ThemeToggle';

// 纯展示用的版本显示组件
function VersionDisplay() {
  return (
    <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-xs text-gray-400 dark:text-zinc-600 select-none'>
      <span className='font-mono'>v{CURRENT_VERSION}</span>
    </div>
  );
}

function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shouldAskUsername, setShouldAskUsername] = useState(false);
  const [enableRegister, setEnableRegister] = useState(false);
  const { siteName } = useSite();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const config = (window as any).RUNTIME_CONFIG || {};
      const storageType = config.STORAGE_TYPE;
      setShouldAskUsername(storageType && storageType !== 'localstorage');
      setEnableRegister(Boolean(config.ENABLE_REGISTER));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!password || (shouldAskUsername && !username)) return;

    try {
      setLoading(true);
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          ...(shouldAskUsername ? { username } : {}),
        }),
      });

      if (res.ok) {
        const redirect = searchParams.get('redirect') || '/';
        router.replace(redirect);
      } else if (res.status === 401) {
        setError('密码错误');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? '服务器错误');
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError(null);
    if (!password || !username) return;

    try {
      setLoading(true);
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const redirect = searchParams.get('redirect') || '/';
        router.replace(redirect);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? '服务器错误');
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-slate-50 dark:bg-zinc-950'>
      <div className='absolute top-4 right-4'>
        <ThemeToggle />
      </div>
      
      {/* 装饰性背景 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500/10 rounded-full blur-[120px]" />

      <div className='relative z-10 w-full max-w-md rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl shadow-2xl p-10 border border-white/20 dark:border-zinc-800'>
        <h1 className='text-green-600 tracking-tight text-center text-3xl font-extrabold mb-8 drop-shadow-sm'>
          {siteName}
        </h1>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {shouldAskUsername && (
            <div>
              <input
                id='username'
                type='text'
                autoComplete='username'
                className='block w-full rounded-xl border-0 py-3 px-4 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 placeholder:text-gray-500 focus:ring-2 focus:ring-green-500 bg-white/50 dark:bg-zinc-800/50'
                placeholder='用户名'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          )}

          <div>
            <input
              id='password'
              type='password'
              autoComplete='current-password'
              className='block w-full rounded-xl border-0 py-3 px-4 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 placeholder:text-gray-500 focus:ring-2 focus:ring-green-500 bg-white/50 dark:bg-zinc-800/50'
              placeholder='访问密码'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className='flex gap-4'>
            {shouldAskUsername && enableRegister && (
              <button
                type='button'
                onClick={handleRegister}
                disabled={!password || !username || loading}
                className='flex-1 justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800 py-3 text-base font-semibold text-zinc-900 dark:text-zinc-100 transition-all hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50'
              >
                {loading ? '...' : '注册'}
              </button>
            )}
            <button
              type='submit'
              disabled={!password || loading || (shouldAskUsername && !username)}
              className='flex-1 justify-center rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 py-3 text-base font-semibold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50'
            >
              {loading ? '处理中...' : '登录'}
            </button>
          </div>
        </form>
      </div>

      <VersionDisplay />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">加载中...</div>}>
      <LoginPageClient />
    </Suspense>
  );
}
