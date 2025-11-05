import { useEffect, useMemo, useState } from 'react';
import HeaderBar from './components/HeaderBar';
import NavSidebar from './components/NavSidebar';
import DashboardView from './components/DashboardView';
import JobsPanel from './components/JobsPanel';

const defaultBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const seedPolicies = [
  '421200502410000001','421200502410000002','421200502410000003','421200502410000006','421200502410000007','421200502410000008','421200502410000012','421200502410000013','421200502410000032','421200502410000033','421200502410000034','421200502410000035','421200502410000036','421200502410000037','421200502410000038','421200502410000039','421200502410000040','421200502410000041','421200502410000042','421200502410000043','421200502410000044','421200502410000045','421200502410000046','421200502410000047','421200502410000048','421200502410000049','421200502410000050','421200502410000051','421200502410000052','421200502410000053','421200502410000054','421200502410000055'
];

export default function App() {
  const [current, setCurrent] = useState('dashboard');
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem('api_base_url') || defaultBase);
  const [health, setHealth] = useState('');

  const checkHealth = async () => {
    try {
      const res = await fetch(`${baseUrl}/health`);
      if (!res.ok) throw new Error('down');
      const data = await res.json().catch(() => ({}));
      setHealth(data?.status || 'healthy');
    } catch (e) {
      setHealth('down');
    }
  };

  useEffect(() => {
    checkHealth();
    const id = setInterval(checkHealth, 5000);
    return () => clearInterval(id);
  }, [baseUrl]);

  const onToggleDark = (enabled) => {
    const root = document.documentElement;
    if (enabled) root.classList.add('dark'); else root.classList.remove('dark');
    localStorage.setItem('theme', enabled ? 'dark' : 'light');
  };

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') document.documentElement.classList.add('dark');
  }, []);

  const mainView = useMemo(() => {
    if (current === 'jobs' || current === 'create') {
      return <JobsPanel baseUrl={baseUrl} defaultPolicies={seedPolicies} />;
    }
    // 'dashboard' & 'resources' share same overview component with resources displayed
    return <DashboardView baseUrl={baseUrl} />;
  }, [current, baseUrl]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <HeaderBar baseUrl={baseUrl} setBaseUrl={setBaseUrl} healthStatus={health} onToggleDark={onToggleDark} />
      <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-[16rem_1fr]">
        <NavSidebar current={current} setCurrent={setCurrent} />
        <main className="min-h-[calc(100vh-4rem)]">{mainView}</main>
      </div>
    </div>
  );
}
