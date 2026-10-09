import { Link } from 'react-router-dom';
import { CalendarDays, Download, Lock, Pencil, Printer, Send } from 'lucide-react';
import { PageHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { EmptyState, ErrorState, FullPageLoader } from '../../components/ui/States.jsx';
import { studentApi } from '../../api/endpoints.js';
import { useAsync } from '../../hooks/useList.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDate, formatDateTime } from '../../utils/format.js';

export default function DateSheet() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => studentApi.dateSheet());
  const sheet = data?.data;

  if (loading) return <FullPageLoader label="Loading your date sheet…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  if (!sheet) {
    return (
      <div>
        <PageHeader title="My date sheet" description="Your confirmed examination timetable." />
        <div className="card">
          <EmptyState
            icon={CalendarDays}
            title="No date sheet yet"
            description="Build your date sheet by choosing one exam slot for each of your assigned courses."
            action={
              <Link to="/student/date-sheet/build">
                <Button>Build date sheet</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const branch = sheet.branch;
  return (
    <div>
      <div className="no-print">
        <PageHeader
          title="My date sheet"
          description={`Version ${sheet.version} · ${sheet.totalExams} exams · saved ${formatDateTime(sheet.savedAt)}`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" icon={Printer} onClick={() => window.print()}>
                Print
              </Button>
              <a href={studentApi.pdfUrl()} target="_blank" rel="noreferrer">
                <Button variant="secondary" icon={Download}>
                  Download PDF
                </Button>
              </a>
              <Link to="/student/date-sheet/build">
                <Button icon={Pencil}>Edit / rebuild</Button>
              </Link>
              <Link to="/student/requests">
                <Button variant="secondary" icon={Send}>
                  Request change
                </Button>
              </Link>
            </div>
          }
        />

        {sheet.locked && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-night-800 dark:bg-night-900">
            <Lock className="mt-0.5 h-4 w-4 text-slate-400" />
            <p className="muted">
              Your date sheet is locked. To change it, submit a change request. If an admin has approved a change, use
              “Edit / rebuild”.
            </p>
          </div>
        )}
      </div>

      <div className="print-area card overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 p-6 dark:border-night-800 dark:bg-night-800">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">ExamSlot · Virtual University</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Examination Date Sheet</h2>
              <p className="text-sm muted">{branch?.name} ({branch?.code}) · {branch?.city}</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold text-slate-900 dark:text-white">{user?.fullName || ''}</p>
              <p className="muted">{user?.registrationNumber}</p>
              <p className="muted">{user?.program}</p>
            </div>
          </div>
        </div>

        <div className="table-scroll px-6 pt-2">
          <table className="table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>Course code</th>
                <th>Course title</th>
                <th>Date</th>
                <th>Day</th>
                <th>Start</th>
                <th>End</th>
              </tr>
            </thead>
            <tbody>
              {sheet.items.map((item, idx) => (
                <tr key={item._id || `${item.courseCode}-${idx}`}>
                  <td className="text-slate-400">{idx + 1}</td>
                  <td className="font-semibold text-slate-800 dark:text-slate-100">{item.courseCode}</td>
                  <td>{item.courseTitle}</td>
                  <td className="whitespace-nowrap">{formatDate(item.examDate, 'dd MMM yyyy')}</td>
                  <td>{item.day || formatDate(item.examDate, 'EEEE')}</td>
                  <td>{item.startTime}</td>
                  <td>{item.endTime || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 text-xs muted dark:border-night-800">
          <p>Please arrive at least 30 minutes before each exam with your university ID card.</p>
          <Badge tone={sheet.locked ? 'slate' : 'amber'}>{sheet.locked ? 'Locked record' : 'Unlocked'}</Badge>
        </div>
      </div>
    </div>
  );
}
