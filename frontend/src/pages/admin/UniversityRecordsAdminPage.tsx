import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/services/errorMapper';
import type { AdminStudentRecord } from '@/types';
import { GraduationCap, Search } from 'lucide-react';

export function UniversityRecordsAdminPage() {
  const [students, setStudents] = useState<AdminStudentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .listStudents({
        ...(statusFilter ? { academicStatus: statusFilter } : {}),
        pageSize: 100,
      })
      .then((res) => {
        if (!active) return;
        setStudents(res.items ?? []);
        setTotal(res.total ?? (res.items ?? []).length);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(getErrorMessage(err, 'Failed to load MUST student registry records.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.registrationNumber.toLowerCase().includes(q) ||
        s.fullName.toLowerCase().includes(q) ||
        s.programme.toLowerCase().includes(q)
    );
  }, [students, search]);

  return (
    <main className="portal-page admin-page space-y-6">
      <header className="space-y-2">
        <p className="section-kicker">University student registry</p>
        <h1>Verified MUST student records.</h1>
        <p className="portal-page__lead">
          Live student registry records indexed by university registration number (`CTxxx/xxxxxx/yy`) used for account claiming, objective vetting, and need-based disbursements.
        </p>
      </header>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by CTxxx/xxxxxx/yy, name, or programme…"
            aria-label="Search student records"
            className="w-full h-9 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-8 pr-3 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="student-status-filter" className="text-xs font-semibold">
            Status:
          </label>
          <select
            id="student-status-filter"
            value={statusFilter}
            onChange={(e) => {
              setLoading(true);
              setStatusFilter(e.target.value);
            }}
            className="h-9 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DEFERRED">DEFERRED</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200">
          {error}
        </div>
      )}

      <section className="portal-card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            Registered students ({filtered.length} of {total})
          </h2>
        </div>

        {loading ? (
          <p className="text-xs text-zinc-500">Loading university student records…</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-zinc-500">No student records match your current filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <th className="py-2 pr-3">Registration No.</th>
                  <th className="py-2 pr-3">Full Name</th>
                  <th className="py-2 pr-3">Programme</th>
                  <th className="py-2 pr-3">Year</th>
                  <th className="py-2 pr-3">Academic Status</th>
                  <th className="py-2">Portal Link</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => (
                  <tr key={student.id} className="border-b border-zinc-100 dark:border-zinc-800/70">
                    <td className="py-2.5 pr-3 font-mono font-semibold">{student.registrationNumber}</td>
                    <td className="py-2.5 pr-3">{student.fullName}</td>
                    <td className="py-2.5 pr-3">{student.programme}</td>
                    <td className="py-2.5 pr-3">Year {student.yearOfStudy}</td>
                    <td className="py-2.5 pr-3">{student.academicStatus}</td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          student.linked
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {student.linked ? 'Linked account' : 'Unclaimed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
