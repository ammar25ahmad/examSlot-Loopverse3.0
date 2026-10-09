import { Link } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Inbox,
  MapPin,
  Sparkles,
  Trophy,
  TriangleAlert,
} from 'lucide-react';
import { PageHeader, Card, CardHeader } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { EmptyState, ErrorState, FullPageLoader } from '../../components/ui/States.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { studentApi } from '../../api/endpoints.js';
import { useAsync } from '../../hooks/useList.js';
import { formatDate, formatDateTime } from '../../utils/format.js';
import { REQUEST_STATUS_STYLE, REQUEST_TYPE_LABEL } from '../../utils/constants.js';

export default function StudentDashboard() {
  const { data, loading, error, reload } = useAsync(() => studentApi.dashboard());

  if (loading) return <FullPageLoader label="Loading your dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const payload = data?.data ?? data ?? {};
  const { student, branch, assignmentCompletion, dateSheet, upcomingExams, recentRequests, entitlements } = payload;
  const pct = assignmentCompletion.count
    ? Math.min(100, Math.round((assignmentCompletion.count / assignmentCompletion.max) * 100))
    : 0;

  return (
    <div>
      <PageHeader
        title={`Welcome, ${student.fullName.split(' ')[0]}`}
        description={`${student.program} · Semester ${student.semester} · ${student.session}`}
      />

      {(!assignmentCompletion.isComplete || entitlements.branchChange || entitlements.dateSheetChange) && (
        <div className="mb-6 space-y-3">
          {!assignmentCompletion.isComplete && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Course assignments incomplete</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  You have {assignmentCompletion.count} assigned course(s). A date sheet needs {assignmentCompletion.min}–{assignmentCompletion.max}. Please contact the examinations office.
                </p>
              </div>
            </div>
          )}
          {entitlements.branchChange && (
            <div className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-brand-800 dark:text-brand-200">Branch change approved</p>
                <p className="text-sm text-brand-700 dark:text-brand-300">You can now select a new examination branch.</p>
              </div>
              <Link to="/student/select-branch"><Button variant="secondary">Change branch</Button></Link>
            </div>
          )}
          {entitlements.dateSheetChange && (
            <div className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-brand-800 dark:text-brand-200">Date sheet change approved</p>
                <p className="text-sm text-brand-700 dark:text-brand-300">You can rebuild your locked date sheet once.</p>
              </div>
              <Link to="/student/date-sheet/build"><Button variant="secondary">Rebuild</Button></Link>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium muted">Course assignments</p>
            <BookOpen className="h-5 w-5 text-brand-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {assignmentCompletion.count}
            <span className="ml-1 text-base font-medium muted">/ {assignmentCompletion.max}</span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-night-800">
            <div className={`h-full rounded-full ${assignmentCompletion.isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs muted">
            {assignmentCompletion.isComplete ? 'Within the required 4–6 range.' : `Need ${assignmentCompletion.min}–${assignmentCompletion.max} courses.`}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium muted">Date sheet</p>
            <CalendarDays className="h-5 w-5 text-brand-500" />
          </div>
          {dateSheet.exists ? (
            <>
              <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" /> {dateSheet.totalExams}
                <span className="text-base font-medium muted">exams</span>
              </p>
              <p className="mt-1 text-xs muted">Saved {formatDateTime(dateSheet.savedAt)}</p>
              <Link to="/student/date-sheet" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
                View date sheet →
              </Link>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm muted">You haven’t created a date sheet yet.</p>
              <div className="mt-3">
                <Link to="/student/date-sheet/build">
                  <Button disabled={!assignmentCompletion.isComplete}>Build date sheet</Button>
                </Link>
              </div>
            </>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium muted">Examination branch</p>
            <MapPin className="h-5 w-5 text-brand-500" />
          </div>
          {branch ? (
            <>
              <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{branch.name}</p>
              <p className="text-sm muted">{branch.code} · {branch.city}</p>
              <p className="mt-2 text-xs muted">You will sit your exams at this branch.</p>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm muted">No branch selected yet.</p>
              <Link to="/student/select-branch" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
                Select branch →
              </Link>
            </>
          )}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Upcoming exams" description="Your next scheduled papers" icon={CalendarDays} />
          {upcomingExams.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No upcoming exams" description={dateSheet.exists ? 'All scheduled exams are in the past.' : 'Create your date sheet to see upcoming exams.'} />
          ) : (
            <div className="table-scroll px-5 pt-2">
              <table className="table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Date</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingExams.map((e) => (
                    <tr key={e._id || `${e.courseCode}-${e.examDate}`}>
                      <td>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{e.courseCode}</span>
                        <span className="ml-2 text-sm muted">{e.courseTitle}</span>
                      </td>
                      <td>
                        <span className="font-medium">{formatDate(e.examDate, 'dd MMM yyyy')}</span>
                        {e.day && <span className="ml-2 text-xs muted">{e.day}</span>}
                      </td>
                      <td className="text-sm">{e.startTime}{e.endTime ? `–${e.endTime}` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent requests"
            icon={Inbox}
            actions={
              <Link to="/student/requests" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
                New
              </Link>
            }
          />
          {recentRequests.length === 0 ? (
            <EmptyState icon={Inbox} title="No requests" description="Submit a change request when you need one." />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-night-800">
              {recentRequests.map((r) => (
                <div key={r._id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{REQUEST_TYPE_LABEL[r.type] || r.type}</p>
                    <p className="truncate text-xs muted">{formatDateTime(r.createdAt)}</p>
                  </div>
                  <span className={`chip ${REQUEST_STATUS_STYLE[r.status]}`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm muted dark:border-night-800 dark:bg-night-900">
        <Trophy className="h-4 w-4 text-amber-500" />
        Tip: confirm your branch early — seats are allocated per branch and popular slots fill fast.
      </div>
    </div>
  );
}
