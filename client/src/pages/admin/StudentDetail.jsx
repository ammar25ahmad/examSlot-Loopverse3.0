import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Mail,
  Pencil,
  Power,
  Save,
  Send,
  ShieldAlert,
  User,
  Users,
} from 'lucide-react';
import { PageHeader, Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge, Badge } from '../../components/ui/Badge.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { EmptyState, ErrorState, FullPageLoader } from '../../components/ui/States.jsx';
import { StudentForm } from '../../components/admin/StudentForm.jsx';
import { assignmentsApi, coursesApi, studentsApi } from '../../api/endpoints.js';
import { formatDate } from '../../utils/format.js';
import { ACCOUNT_STATUS_LABEL, ACCOUNT_STATUS_STYLE, GENDER_LABEL } from '../../utils/constants.js';

function InfoRow({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-100">{value || '—'}</dd>
    </div>
  );
}

export default function StudentDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingAssign, setSavingAssign] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, c, a] = await Promise.all([
        studentsApi.get(studentId),
        coursesApi.list({ limit: 100, status: 'active' }),
        assignmentsApi.forStudent(studentId),
      ]);
      setStudent(s.data);
      setCourses(c.data || []);
      setSelected((a.data?.assignments || []).map((x) => x.course?._id || x.course));
    } catch (err) {
      setError(err.message || 'Failed to load student');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleCourse = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const saveAssignments = async () => {
    if (selected.length < 4 || selected.length > 6) {
      toast.error('Assign between 4 and 6 courses.');
      return;
    }
    setSavingAssign(true);
    try {
      await assignmentsApi.setForStudent(studentId, selected);
      toast.success('Assignments saved');
      load();
    } catch (err) {
      toast.error(err.message || 'Unable to save assignments');
    } finally {
      setSavingAssign(false);
    }
  };

  const resend = async () => {
    try {
      const res = await studentsApi.resendSetup(studentId);
      const status = res.data?.emailStatus;
      if (status === 'SENT') toast.success('Setup email resent.');
      else if (status === 'DISABLED') toast.warning('Email disabled — no message sent.');
      else toast.error('Setup email could not be delivered.');
      load();
    } catch (err) {
      toast.error(err.message || 'Unable to resend setup email');
    }
  };

  const toggleActive = async () => {
    try {
      await studentsApi.setStatus(studentId, !student.isActive);
      toast.success(student.isActive ? 'Student deactivated' : 'Student activated');
      load();
    } catch (err) {
      toast.error(err.message || 'Unable to change status');
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await studentsApi.remove(studentId);
      toast.success('Student removed');
      navigate('/admin/students');
    } catch (err) {
      toast.error(err.message || 'Unable to delete student');
      setBusy(false);
    }
  };

  const initialsText = useMemo(() => (student ? student.fullName.split(' ').slice(0, 2).map((p) => p[0]).join('') : ''), [student]);

  if (loading) return <FullPageLoader label="Loading student…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!student) return null;

  const isComplete = selected.length >= 4 && selected.length <= 6;

  return (
    <div>
      <Link to="/admin/students" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
        <ArrowLeft className="h-4 w-4" /> Back to students
      </Link>

      <PageHeader
        title={student.fullName}
        description={`${student.registrationNumber} · ${student.program}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {student.accountStatus === 'PENDING_SETUP' && (
              <Button variant="secondary" icon={Send} onClick={resend}>
                Resend setup
              </Button>
            )}
            <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button variant={student.isActive ? 'danger' : 'success'} icon={Power} onClick={toggleActive}>
              {student.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <div className="flex items-center gap-4">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
            ) : (
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-100 text-lg font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                {initialsText}
              </span>
            )}
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{student.fullName}</p>
              <StatusBadge
                label={ACCOUNT_STATUS_LABEL[student.accountStatus] || student.accountStatus}
                className={ACCOUNT_STATUS_STYLE[student.accountStatus]}
              />
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow label="Email" value={student.email} />
            <InfoRow label="Phone" value={student.phone} />
            <InfoRow label="CNIC" value={student.cnic} />
            <InfoRow label="Date of birth" value={student.dateOfBirth ? formatDate(student.dateOfBirth) : '—'} />
            <InfoRow label="Gender" value={GENDER_LABEL[student.gender] || student.gender} />
            <InfoRow label="Session" value={student.session} />
            <InfoRow label="Semester" value={student.semester} />
            <InfoRow label="Account" value={student.isActive ? 'Enabled' : 'Disabled'} />
          </dl>

          <div className="mt-5 border-t border-slate-100 pt-4 dark:border-night-800">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide muted">
              <Users className="h-3.5 w-3.5" /> Guardian
            </p>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoRow label="Name" value={student.guardian?.name} />
              <InfoRow label="CNIC" value={student.guardian?.cnic} />
              <InfoRow label="Occupation" value={student.guardian?.occupation} />
              <InfoRow label="Contact" value={student.guardian?.contactNumber} />
              <InfoRow label="Emergency" value={student.guardian?.emergencyContact} />
            </dl>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4 dark:border-night-800">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide muted">
              <BookOpen className="h-3.5 w-3.5" /> Prior education
            </p>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoRow label="Qualification" value={student.previousQualification} />
              <InfoRow label="Institute" value={student.previousInstitute} />
              <InfoRow label="Marks" value={student.marks} />
            </dl>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4 dark:border-night-800">
            <button type="button" onClick={() => setConfirmDelete(true)} className="text-xs font-semibold text-rose-600 hover:underline">
              Delete student record
            </button>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Exam branch & date sheet"
            icon={CalendarCheck}
          />
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <InfoRow label="Selected branch" value={student.selectedBranch?.name || 'Not selected'} />
            <InfoRow label="Date sheet" value={student.dateSheetLocked ? 'Locked' : 'Not created'} />
            <div className="sm:col-span-2 flex flex-wrap gap-2">
              {student.dateSheetChangeEntitlement && <Badge tone="amber">Date sheet change approved</Badge>}
              {student.branchChangeEntitlement && <Badge tone="amber">Branch change approved</Badge>}
              {!student.dateSheetChangeEntitlement && !student.branchChangeEntitlement && (
                <span className="text-xs muted">No approved change entitlements.</span>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-night-800">
            <CardHeader
              title="Course assignments"
              description={`Select 4–6 courses. Currently ${selected.length} selected.`}
              icon={ClipboardList}
              actions={
                <div className="flex items-center gap-2">
                  {isComplete ? (
                    <span className="chip bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Valid
                    </span>
                  ) : (
                    <span className="chip bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                      <ShieldAlert className="h-3.5 w-3.5" /> Needs 4–6
                    </span>
                  )}
                  <Button icon={Save} loading={savingAssign} onClick={saveAssignments} disabled={!isComplete}>
                    Save
                  </Button>
                </div>
              }
            />
            <div className="p-5">
              {courses.length === 0 ? (
                <EmptyState icon={BookOpen} title="No active courses" description="Create courses first to assign them to students." />
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {courses.map((c) => {
                    const checked = selected.includes(c._id);
                    return (
                      <label
                        key={c._id}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                          checked
                            ? 'border-brand-400 bg-brand-50/60 dark:border-brand-500/50 dark:bg-brand-500/10'
                            : 'border-slate-200 hover:border-slate-300 dark:border-night-700 dark:hover:border-night-600'
                        }`}
                      >
                        <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" checked={checked} onChange={() => toggleCourse(c._id)} />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{c.code}</span>
                          <span className="block truncate text-xs muted">{c.title}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <StudentForm open={editOpen} editing={student} onClose={() => setEditOpen(false)} onSaved={load} />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={doDelete}
        loading={busy}
        title="Delete student?"
        description={`${student.fullName} (${student.registrationNumber}) will be permanently removed if they have no dependencies.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
