import { Link } from 'react-router-dom';
import {
  Building2,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Inbox,
  TrendingUp,
  Users,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PageHeader, Card, CardHeader } from '../../components/ui/Card.jsx';
import { StatCard } from '../../components/ui/SearchInput.jsx';
import { EmptyState, ErrorState, FullPageLoader } from '../../components/ui/States.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { adminApi } from '../../api/endpoints.js';
import { useAsync } from '../../hooks/useList.js';
import { formatDateTime, initials, titleCase } from '../../utils/format.js';
import { AUDIT_LABEL, REQUEST_TYPE_LABEL } from '../../utils/constants.js';

const COLORS = ['#4f46e5', '#cbd5e1'];
const COLORS2 = ['#10b981', '#f59e0b'];
const COLORS3 = ['#6366f1', '#f59e0b'];

function DonutCard({ title, description, data, colors }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <Card>
      <CardHeader title={title} description={description} icon={TrendingUp} />
      <div className="h-56 px-3 py-4">
        {total === 0 ? (
          <div className="flex h-full items-center justify-center text-sm muted">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={72} paddingAngle={3}>
                {data.map((entry, i) => (
                  <Cell key={entry.name} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data, loading, error, reload } = useAsync(() => adminApi.dashboard());

  if (loading) return <FullPageLoader label="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const payload = data?.data ?? data ?? {};
  const { metrics, charts, recentActivity, pendingRequests, isEmpty } = payload;

  return (
    <div>
      <PageHeader
        breadcrumb="Overview"
        title="Administration dashboard"
        description="Monitor students, branches, exam slots and pending change requests at a glance."
      />

      {isEmpty ? (
        <Card>
          <EmptyState
            icon={GraduationCap}
            title="Your workspace is ready"
            description="Start by creating branches and courses, then add students and publish exam slots."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link to="/admin/branches" className="btn-primary">
                  <Building2 className="h-4 w-4" /> Add a branch
                </Link>
                <Link to="/admin/courses" className="btn-secondary">
                  <BookOpen className="h-4 w-4" /> Add a course
                </Link>
              </div>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total students" value={metrics.totalStudents} icon={Users} hint="All registered accounts" />
            <StatCard label="Active branches" value={metrics.activeBranches} icon={Building2} tone="emerald" />
            <StatCard label="Active courses" value={metrics.activeCourses} icon={BookOpen} tone="amber" />
            <StatCard label="Active exam slots" value={metrics.totalExamSlots} icon={CalendarClock} tone="rose" />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Completed date sheets" value={metrics.completedSheets} icon={CheckCircle2} tone="emerald" hint={`${metrics.totalStudents - metrics.completedSheets} pending`} />
            <StatCard label="Incomplete assignments" value={metrics.incompleteAssignments} icon={ClipboardList} tone="amber" hint="Students not at 4–6 courses" />
            <StatCard label="Pending requests" value={metrics.pendingRequests} icon={Inbox} tone="rose" hint="Awaiting review" />
            <StatCard label="Date sheet readiness" value={`${metrics.totalStudents ? Math.round((metrics.completedSheets / metrics.totalStudents) * 100) : 0}%`} icon={TrendingUp} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <DonutCard title="Date sheet completion" description="Saved vs. pending" data={charts.dateSheetCompletion} colors={COLORS} />
            <DonutCard title="Assignment readiness" description="Within the 4–6 course rule" data={charts.assignmentReadiness} colors={COLORS2} />
            <DonutCard title="Pending requests by type" description="Awaiting admin action" data={charts.pendingByType} colors={COLORS3} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Recent activity" description="Latest actions across the console" icon={ClipboardList} />
              <div className="divide-y divide-slate-100 dark:divide-night-800">
                {recentActivity.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm muted">No activity recorded yet.</p>
                ) : (
                  recentActivity.map((log) => (
                    <div key={log._id} className="flex items-start gap-3 px-5 py-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                        {initials(log.actor?.name || 'System')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                          {AUDIT_LABEL[log.action] || titleCase(log.action)}
                        </p>
                        <p className="truncate text-xs muted">
                          {log.actor?.name ? `${log.actor.name} · ` : ''}
                          {formatDateTime(log.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Requests awaiting review"
                description="Oldest first"
                icon={Inbox}
                actions={
                  <Link to="/admin/requests" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
                    View all
                  </Link>
                }
              />
              <div className="divide-y divide-slate-100 dark:divide-night-800">
                {pendingRequests.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm muted">No pending requests. You’re all caught up.</p>
                ) : (
                  pendingRequests.map((req) => (
                    <Link
                      key={req._id}
                      to="/admin/requests"
                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-night-800/60"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                          {req.student?.fullName || 'Student'}
                        </p>
                        <p className="truncate text-xs muted">{req.student?.registrationNumber}</p>
                      </div>
                      <Badge tone="brand">{REQUEST_TYPE_LABEL[req.type] || req.type}</Badge>
                    </Link>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
