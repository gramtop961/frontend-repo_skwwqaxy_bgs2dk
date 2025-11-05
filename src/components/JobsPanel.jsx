import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Play, Square, Trash2, Search, Filter, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const statusColors = {
  created: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  running: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  cancelled: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
};

function Badge({ status }) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

function formatDate(ts) {
  if (!ts) return '-';
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

function ProgressModal({ open, onClose, job, baseUrl }) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const load = async () => {
    if (!job) return;
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/jobs/${job.id}/progress`);
      if (res.ok) {
        const data = await res.json();
        setProgress(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && job) {
      load();
      intervalRef.current = setInterval(load, 2000);
      return () => clearInterval(intervalRef.current);
    }
  }, [open, job, baseUrl]);

  if (!open || !job) return null;

  const pct = progress?.percentage ?? 0;
  const processed = progress?.processed ?? 0;
  const success = progress?.successful ?? 0;
  const failed = progress?.failed ?? 0;
  const active = progress?.active_workers ?? 0;
  const elapsed = progress?.elapsed_seconds ?? 0;
  const eta = progress?.eta_seconds ?? 0;
  const avg = progress?.avg_time_per_policy ?? 0;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Job Progress • {job.id}</h3>
          <button onClick={onClose} className="rounded-md px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">Close</button>
        </div>
        <div className="space-y-3">
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" style={{ width: `${pct}%` }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-3"><div className="text-gray-500">Processed</div><div className="font-medium">{processed}</div></div>
            <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-3"><div className="text-gray-500">Successful</div><div className="font-medium text-emerald-600 dark:text-emerald-400">{success}</div></div>
            <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-3"><div className="text-gray-500">Failed</div><div className="font-medium text-red-600 dark:text-red-400">{failed}</div></div>
            <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-3"><div className="text-gray-500">Active Workers</div><div className="font-medium">{active}</div></div>
            <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-3"><div className="text-gray-500">Elapsed</div><div className="font-medium">{elapsed}s</div></div>
            <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-3"><div className="text-gray-500">ETA</div><div className="font-medium">{eta}s</div></div>
            <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-3 col-span-2 sm:col-span-3"><div className="text-gray-500">Avg/Policy</div><div className="font-medium">{avg}s</div></div>
          </div>
          {loading && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="animate-spin" size={16} /> Updating...</div>}
        </div>
      </div>
    </div>
  );
}

export default function JobsPanel({ baseUrl, defaultPolicies = [] }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [creating, setCreating] = useState(false);
  const [policyInput, setPolicyInput] = useState(defaultPolicies.join('\n'));
  const [numWorkers, setNumWorkers] = useState(5);
  const [processNth, setProcessNth] = useState(false);
  const [nthInterval, setNthInterval] = useState(20);
  const [headless, setHeadless] = useState(true);
  const [progressJob, setProgressJob] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/jobs`);
      if (!res.ok) throw new Error('Failed to load jobs');
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const id = setInterval(fetchJobs, 3000);
    return () => clearInterval(id);
  }, [baseUrl]);

  const filtered = useMemo(() => {
    let list = jobs;
    if (statusFilter) list = list.filter((j) => j.status === statusFilter);
    if (query) list = list.filter((j) => String(j.id).toLowerCase().includes(query.toLowerCase()));
    return list;
  }, [jobs, statusFilter, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const exportCSV = () => {
    const headers = ['id','status','total_policies','created_at','started_at','completed_at','workers'];
    const rows = filtered.map(j => [j.id, j.status, j.total_policies, j.created_at, j.started_at, j.completed_at, j.workers]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'jobs.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const submitJob = async () => {
    const policies = policyInput
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (policies.length === 0) {
      alert('Please provide at least one policy number.');
      return;
    }
    const body = {
      policy_numbers: policies,
      num_workers: Number(numWorkers),
      process_every_nth: Boolean(processNth),
      nth_interval: Number(nthInterval),
      headless_mode: Boolean(headless),
    };
    try {
      setCreating(true);
      const res = await fetch(`${baseUrl}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to create job');
      await fetchJobs();
      alert('Job created successfully');
    } catch (e) {
      alert(e.message || 'Failed to create job');
    } finally {
      setCreating(false);
    }
  };

  const action = async (id, path, method = 'POST') => {
    try {
      const res = await fetch(`${baseUrl}/jobs/${id}/${path}`, { method });
      if (!res.ok) throw new Error('Action failed');
      await fetchJobs();
    } catch (e) {
      alert(e.message || 'Action failed');
    }
  };

  const deleteJob = async (id) => {
    try {
      const res = await fetch(`${baseUrl}/jobs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await fetchJobs();
    } catch (e) {
      alert(e.message || 'Delete failed');
    }
  };

  const downloadResults = async (id) => {
    try {
      const res = await fetch(`${baseUrl}/jobs/${id}/results`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `job_${id}_results.json`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message || 'Download failed');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div id="create" className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Create Job</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">Policy Numbers</label>
            <textarea
              className="w-full h-40 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-gray-100"
              placeholder="Enter policy numbers, separated by commas or new lines"
              value={policyInput}
              onChange={(e) => setPolicyInput(e.target.value)}
            />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-gray-600 dark:text-gray-300">Workers: {numWorkers}</label>
              </div>
              <input type="range" min={1} max={20} value={numWorkers} onChange={(e) => setNumWorkers(e.target.value)} className="w-full" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600 dark:text-gray-300">Process every Nth</label>
              <input type="checkbox" checked={processNth} onChange={(e) => setProcessNth(e.target.checked)} />
            </div>
            {processNth && (
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300">Nth Interval</label>
                <input type="number" min={1} value={nthInterval} onChange={(e) => setNthInterval(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
              </div>
            )}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600 dark:text-gray-300">Headless Mode</label>
              <input type="checkbox" checked={headless} onChange={(e) => setHeadless(e.target.checked)} />
            </div>
            <button onClick={submitJob} disabled={creating} className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 disabled:opacity-60">
              {creating && <Loader2 className="animate-spin" size={16} />} Create Job
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Jobs</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by Job ID" className="pl-7 pr-3 h-9 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
            </div>
            <div className="relative">
              <Filter className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="pl-7 pr-8 h-9 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                <option value="">All Statuses</option>
                <option value="created">Created</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button onClick={exportCSV} className="h-9 inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-700 px-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-800">
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="text-left px-3 py-2">Job ID</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Total Policies</th>
                <th className="text-left px-3 py-2">Created At</th>
                <th className="text-left px-3 py-2">Started At</th>
                <th className="text-left px-3 py-2">Completed At</th>
                <th className="text-left px-3 py-2">Workers</th>
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((j) => (
                <tr key={j.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-3 py-2 font-mono text-xs">{j.id}</td>
                  <td className="px-3 py-2"><Badge status={j.status} /></td>
                  <td className="px-3 py-2">{j.total_policies ?? '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(j.created_at)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(j.started_at)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(j.completed_at)}</td>
                  <td className="px-3 py-2">{j.workers ?? '-'}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {j.status === 'created' && (
                        <button onClick={() => action(j.id, 'start')} className="inline-flex items-center gap-1 rounded bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs">
                          <Play size={14} /> Start
                        </button>
                      )}
                      {j.status === 'running' && (
                        <button onClick={() => action(j.id, 'cancel')} className="inline-flex items-center gap-1 rounded bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 text-xs">
                          <Square size={14} /> Cancel
                        </button>
                      )}
                      <button onClick={() => setProgressJob(j)} className="inline-flex items-center gap-1 rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-xs">
                        View
                      </button>
                      <button onClick={() => setConfirmDeleteId(j.id)} className="inline-flex items-center gap-1 rounded border border-red-300 text-red-600 dark:border-red-700 px-2 py-1 text-xs">
                        <Trash2 size={14} /> Delete
                      </button>
                      {j.status === 'completed' && (
                        <button onClick={() => downloadResults(j.id)} className="inline-flex items-center gap-1 rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-xs">
                          <Download size={14} /> Results
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-3 text-sm">
          <div className="text-gray-600 dark:text-gray-300">{filtered.length} jobs</div>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="inline-flex items-center gap-1 rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 disabled:opacity-50">
              <ChevronLeft size={16} /> Prev
            </button>
            <div>Page {page} / {totalPages}</div>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="inline-flex items-center gap-1 rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 disabled:opacity-50">
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {progressJob && (
        <ProgressModal open={!!progressJob} onClose={() => setProgressJob(null)} job={progressJob} baseUrl={baseUrl} />
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="text-lg font-semibold mb-2">Delete Job</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">Are you sure you want to delete job {confirmDeleteId}? This action cannot be undone.</div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setConfirmDeleteId(null)} className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm">Cancel</button>
              <button onClick={() => { deleteJob(confirmDeleteId); setConfirmDeleteId(null); }} className="rounded-md bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed bottom-4 right-4 inline-flex items-center gap-2 rounded-md bg-gray-900 text-white px-3 py-2 text-sm shadow-lg">
          <Loader2 className="animate-spin" size={16} /> Refreshing jobs...
        </div>
      )}
    </div>
  );
}
