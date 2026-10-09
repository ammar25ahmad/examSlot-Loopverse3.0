import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Info,
  Lock,
  Save,
  Users,
} from 'lucide-react';
import { PageHeader, Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { EmptyState, ErrorState, FullPageLoader } from '../../components/ui/States.jsx';
import { studentApi } from '../../api/endpoints.js';
import { formatDate } from '../../utils/format.js';

function toMinutes(t) {
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + m;
}
function slotRange(slot, defaultDurationMinutes) {
  const start = toMinutes(slot.startTime);
  const end = slot.endTime ? toMinutes(slot.endTime) : start + defaultDurationMinutes;
  return { date: slot.examDate, start, end, id: slot._id };
}
function overlap(a, b) {
  return a.date === b.date && a.start < b.end && b.start < a.end;
}

export default function DateSheetBuilder() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selections, setSelections] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentApi.builder();
      setData(res.data);
      const init = {};
      (res.data.currentSelections || []).forEach((item) => {
        init[String(item.course?._id || item.course)] = String(item.slot?._id || item.slot);
      });
      setSelections(init);
    } catch (err) {
      setError(err.message || 'Failed to load date sheet builder');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const courses = data?.assignments || [];
  const defaultDur = data?.defaultDurationMinutes || 180;

  const selectedSlots = useMemo(() => {
    const list = [];
    for (const course of courses) {
      const cid = String(course.course?._id || course.course);
      const slotId = selections[cid];
      if (!slotId) continue;
      const options = data?.slotsByCourse?.[cid] || [];
      const slot = options.find((s) => String(s._id) === slotId);
      if (slot) list.push({ courseId: cid, courseCode: slot.course?.code, slot });
    }
    return list;
  }, [courses, selections, data]);

  const conflicts = useMemo(() => {
    const ranges = selectedSlots.map((s) => ({ ...slotRange(s.slot, defaultDur), code: s.courseCode }));
    const found = [];
    for (let i = 0; i < ranges.length; i += 1) {
      for (let j = i + 1; j < ranges.length; j += 1) {
        if (overlap(ranges[i], ranges[j])) found.push([ranges[i].code, ranges[j].code]);
      }
    }
    return found;
  }, [selectedSlots, defaultDur]);

  const selectedCount = selectedSlots.length;
  const allSelected = selectedCount === courses.length && courses.length > 0;
  const isEditing = Boolean(data?.dateSheet) && data?.locked;
  const canSave = allSelected && conflicts.length === 0 && !saving;

  const choose = (courseId, slotId) => {
    setSelections((prev) => ({ ...prev, [courseId]: slotId }));
  };

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    const payload = courses.map((course) => {
      const cid = String(course.course?._id || course.course);
      return { course: cid, slot: selections[cid] };
    });
    try {
      if (isEditing) {
        await studentApi.updateDateSheet(payload);
        toast.success('Date sheet updated and locked');
      } else {
        await studentApi.saveDateSheet(payload);
        toast.success('Date sheet saved and locked');
      }
      navigate('/student/date-sheet');
    } catch (err) {
      toast.error(err.message || 'Unable to save date sheet');
      setSaving(false);
    }
  };

  if (loading) return <FullPageLoader label="Preparing your options…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  if (!data.hasBranch) {
    return (
      <Card>
        <EmptyState icon={AlertTriangle} title="Select a branch first" description="Your examination branch determines which slots and seats are available." action={<Link to="/student/select-branch"><Button>Select branch</Button></Link>} />
      </Card>
    );
  }

  if (!data.completion?.isComplete) {
    return (
      <Card>
        <EmptyState icon={Info} title="Assignments incomplete" description={`You need ${data.completion.min}–${data.completion.max} assigned courses to build a date sheet. You currently have ${data.completion.count}.`} />
      </Card>
    );
  }

  if (!data.canEdit) {
    return (
      <Card>
        <EmptyState icon={Lock} title="Your date sheet is locked" description="To change a saved date sheet, submit a date sheet change request and wait for approval." action={<Link to="/student/requests"><Button>Request a change</Button></Link>} />
      </Card>
    );
  }

  return (
    <div className="pb-28">
      <Link to="/student/date-sheet" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
        <ArrowLeft className="h-4 w-4" /> Back to date sheet
      </Link>

      <PageHeader
        breadcrumb={isEditing ? 'Approved change' : 'New date sheet'}
        title={isEditing ? 'Rebuild your date sheet' : 'Build your date sheet'}
        description={`Choose one exam slot for each of your ${courses.length} courses. Slots shown are for ${data.branch?.name}.`}
        actions={<Badge tone="brand">{data.universityTimezone}</Badge>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-night-800 dark:bg-night-900">
        <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> {selectedCount}/{courses.length} courses selected</span>
        <span className="text-slate-300 dark:text-night-700">|</span>
        <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-brand-500" /> Default duration {defaultDur} min</span>
        {conflicts.length > 0 && (
          <>
            <span className="text-slate-300 dark:text-night-700">|</span>
            <span className="flex items-center gap-2 font-medium text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4" /> {conflicts.length} conflict(s)
            </span>
          </>
        )}
      </div>

      <div className="space-y-4">
        {courses.map((course) => {
          const cid = String(course.course?._id || course.course);
          const options = data.slotsByCourse?.[cid] || [];
          const chosen = selections[cid];
          return (
            <Card key={cid}>
              <CardHeader
                title={`${course.course?.code} — ${course.course?.title}`}
                description={`${course.course?.creditHours} credit hours · ${course.course?.department}`}
                icon={CalendarDays}
                actions={chosen ? <Badge tone="emerald">Selected</Badge> : <Badge tone="amber">Choose a slot</Badge>}
              />
              {options.length === 0 ? (
                <p className="px-5 py-6 text-sm muted">No active exam slots have been published for this course yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2 p-5 sm:grid-cols-2">
                  {options.map((slot) => {
                    const selected = String(slot._id) === chosen;
                    const full = slot.isFull && !selected;
                    return (
                      <button
                        key={slot._id}
                        type="button"
                        disabled={full}
                        onClick={() => choose(cid, String(slot._id))}
                        className={`rounded-xl border p-3 text-left transition ${
                          selected
                            ? 'border-brand-500 bg-brand-50/70 ring-1 ring-brand-500 dark:bg-brand-500/10'
                            : full
                            ? 'cursor-not-allowed border-slate-200 opacity-60 dark:border-night-700'
                            : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50 dark:border-night-700 dark:hover:border-brand-500/40 dark:hover:bg-night-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formatDate(slot.examDate, 'EEE, dd MMM yyyy')}</span>
                          {selected ? (
                            <CheckCircle2 className="h-4 w-4 text-brand-600" />
                          ) : full ? (
                            <Badge tone="rose">Full</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 flex items-center gap-2 text-sm muted">
                          <Clock className="h-3.5 w-3.5" />
                          {slot.startTime}
                          {slot.endTime ? `–${slot.endTime}` : ' (default 3h)'}
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-xs muted">
                          <Users className="h-3.5 w-3.5" />
                          {slot.availableSeats} of {slot.capacity} seats left
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {conflicts.length > 0 && (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/30 dark:bg-rose-500/10">
          <p className="flex items-center gap-2 text-sm font-semibold text-rose-800 dark:text-rose-200">
            <AlertTriangle className="h-4 w-4" /> Time conflicts detected
          </p>
          <ul className="mt-1 list-inside list-disc text-sm text-rose-700 dark:text-rose-300">
            {conflicts.map(([a, b]) => (
              <li key={`${a}-${b}`}>{a} overlaps with {b}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-night-800 dark:bg-night-900/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p className="text-sm muted">
            {allSelected ? (conflicts.length ? 'Resolve conflicts to continue' : 'Ready to save') : `${courses.length - selectedCount} course(s) remaining`}
          </p>
          <Button icon={Save} loading={saving} disabled={!canSave} onClick={save}>
            {isEditing ? 'Update date sheet' : 'Save date sheet'}
          </Button>
        </div>
      </div>
    </div>
  );
}
