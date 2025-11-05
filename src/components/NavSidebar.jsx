import { useMemo } from 'react';
import { Home, List, PlusCircle, Gauge } from 'lucide-react';

export default function NavSidebar({ current, setCurrent }) {
  const items = useMemo(() => ([
    { key: 'dashboard', label: 'Dashboard', icon: Home },
    { key: 'jobs', label: 'Jobs', icon: List },
    { key: 'create', label: 'Create Job', icon: PlusCircle },
    { key: 'resources', label: 'System Resources', icon: Gauge },
  ]), []);

  return (
    <aside className="hidden md:block md:w-64 border-r border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-950">
      <nav className="p-4 space-y-1">
        {items.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setCurrent(key)}
            className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              current === key
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
