import { useEffect, useMemo, useState } from 'react';
import { Activity, Moon, Sun, Settings } from 'lucide-react';

const defaultBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export default function HeaderBar({ baseUrl, setBaseUrl, healthStatus, onToggleDark }) {
  const [tempUrl, setTempUrl] = useState(baseUrl || defaultBase);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    setTempUrl(baseUrl);
  }, [baseUrl]);

  const statusColor = useMemo(() => {
    switch (healthStatus) {
      case 'healthy':
        return 'text-emerald-500';
      case 'degraded':
        return 'text-amber-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  }, [healthStatus]);

  const handleApply = () => {
    setBaseUrl(tempUrl.trim());
    localStorage.setItem('api_base_url', tempUrl.trim());
  };

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    onToggleDark(next);
  };

  return (
    <header className="sticky top-0 z-20 w-full border-b border-gray-200/60 dark:border-gray-800/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">PC</div>
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Policy Copilot</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Automation Dashboard</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <Activity className={`${statusColor}`} size={18} />
            <span className="text-sm text-gray-600 dark:text-gray-300">{healthStatus ? healthStatus : 'checking...'}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">API</div>
            <input
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              className="w-56 sm:w-72 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="http://localhost:8000"
              aria-label="API Base URL"
            />
            <button
              onClick={handleApply}
              className="inline-flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 transition-colors"
            >
              <Settings size={14} /> Apply
            </button>
          </div>

          <button
            onClick={toggleTheme}
            className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
