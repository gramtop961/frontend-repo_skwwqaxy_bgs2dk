import { useEffect, useMemo, useRef, useState } from 'react';

function StatCard({ title, value, subtitle, color }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
      <div className={`mt-1 text-2xl font-semibold ${color || 'text-gray-900 dark:text-gray-100'}`}>{value}</div>
      {subtitle && <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>}
    </div>
  );
}

function ResourceGauge({ label, percent, colorFrom, colorTo }) {
  const pct = Math.min(100, Math.max(0, percent || 0));
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-600 dark:text-gray-300">{label}</div>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{pct.toFixed(0)}%</div>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: `linear-gradient(to right, ${colorFrom}, ${colorTo})` }}
        />
      </div>
    </div>
  );
}

export default function DashboardView({ baseUrl }) {
  const [summary, setSummary] = useState({ total: 0, running: 0, completed: 0, failed: 0 });
  const [resources, setResources] = useState({ cpu: 0, memory: 0, disk: 0 });
  const intervalRef = useRef(null);

  const loadData = async () => {
    try {
      const [jobsRes, resRes] = await Promise.all([
        fetch(`${baseUrl}/jobs`).then((r) => r.ok ? r.json() : Promise.reject(r)),
        fetch(`${baseUrl}/system/resources`).then((r) => r.ok ? r.json() : Promise.reject(r)),
      ]);

      const stats = jobsRes || [];
      const total = stats.length;
      const running = stats.filter((j) => j.status === 'running').length;
      const completed = stats.filter((j) => j.status === 'completed').length;
      const failed = stats.filter((j) => j.status === 'failed').length;

      setSummary({ total, running, completed, failed });
      setResources({
        cpu: resRes?.cpu || 0,
        memory: resRes?.memory || 0,
        disk: resRes?.disk || 0,
      });
    } catch (e) {
      // silent fail to avoid UI spam; components calling can show toast
    }
  };

  useEffect(() => {
    loadData();
    intervalRef.current = setInterval(loadData, 5000);
    return () => clearInterval(intervalRef.current);
  }, [baseUrl]);

  const cards = useMemo(() => ([
    { title: 'Total Jobs', value: summary.total, color: 'text-gray-900 dark:text-gray-100' },
    { title: 'Running Jobs', value: summary.running, color: 'text-blue-600 dark:text-blue-400' },
    { title: 'Completed Jobs', value: summary.completed, color: 'text-emerald-600 dark:text-emerald-400' },
    { title: 'Failed Jobs', value: summary.failed, color: 'text-red-600 dark:text-red-400' },
  ]), [summary]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <StatCard key={c.title} title={c.title} value={c.value} color={c.color} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResourceGauge label="CPU Usage" percent={resources.cpu} colorFrom="#60a5fa" colorTo="#2563eb" />
        <ResourceGauge label="Memory Usage" percent={resources.memory} colorFrom="#34d399" colorTo="#059669" />
        <ResourceGauge label="Disk Usage" percent={resources.disk} colorFrom="#f472b6" colorTo="#db2777" />
      </div>
    </div>
  );
}
