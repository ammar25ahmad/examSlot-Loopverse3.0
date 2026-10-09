import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { CalendarClock, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import { Modal, ConfirmDialog } from '../../components/ui/Modal.jsx';
import { SearchInput } from '../../components/ui/SearchInput.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { EmptyState, ErrorState, TableSkeleton } from '../../components/ui/States.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { coursesApi, examSlotsApi } from '../../api/endpoints.js';
import { useList } from '../../hooks/useList.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { formatDate } from '../../utils/format.js';

function SlotForm({ open, onClose, editing, courses, onSaved }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            course: editing.course?._id || editing.course,
            examDate: String(editing.examDate).slice(0, 10),
            startTime: editing.startTime,
            endTime: editing.endTime || '',
            isActive: String(editing.isActive),
          }
        : { course: courses[0]?._id || '', examDate: '', startTime: '09:00', endTime: '12:00', isActive: 'true' }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const submit = async (values) => {
    const payload = {
      course: values.course,
      examDate: values.examDate,
      startTime: values.startTime,
      endTime: values.endTime || '',
      isActive: values.isActive === 'true',
    };
    try {
      if (editing) {
        await examSlotsApi.update(editing._id, payload);
        toast.success('Exam slot updated');
      } else {
        await examSlotsApi.create(payload);
        toast.success('Exam slot created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Unable to save exam slot');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit exam slot' : 'New exam slot'}
      description="A slot is a specific date and time window for one course exam."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit(submit)} loading={isSubmitting}>{editing ? 'Save changes' : 'Create slot'}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2">
          <Select label="Course" required error={errors.course?.message} {...register('course', { required: 'Course is required' })}>
            <option value="">Select a course…</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.code} — {c.title}</option>
            ))}
          </Select>
        </div>
        <Input label="Exam date" type="date" required error={errors.examDate?.message} {...register('examDate', { required: 'Date is required' })} />
        <Select label="Status" {...register('isActive')}>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
        <Input label="Start time" type="time" required error={errors.startTime?.message} {...register('startTime', { required: 'Start time is required' })} />
        <Input label="End time" type="time" hint="Leave blank to use the default 3-hour duration." {...register('endTime')} />
      </form>
    </Modal>
  );
}

export default function ExamSlots() {
  const fetchList = (params) => examSlotsApi.list(params);
  const list = useList(fetchList);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await coursesApi.list({ limit: 100, status: 'active' });
        setCourses(res.data || []);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    list.setFilters((f) => ({ ...f, search: debounced || undefined, page: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const doDelete = async () => {
    setBusy(true);
    try {
      await examSlotsApi.remove(confirm._id);
      toast.success('Exam slot deleted');
      setConfirm(null);
      list.reload();
    } catch (err) {
      toast.error(err.message || 'Unable to delete exam slot');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (slot) => {
    try {
      await examSlotsApi.update(slot._id, { isActive: !slot.isActive });
      toast.success(slot.isActive ? 'Slot deactivated' : 'Slot activated');
      list.reload();
    } catch (err) {
      toast.error(err.message || 'Unable to change status');
    }
  };

  return (
    <div>
      <PageHeader
        breadcrumb="Scheduling"
        title="Exam slots"
        description="Publish the exam date and time options students choose from."
        actions={<Button icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>New exam slot</Button>}
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-night-800 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by course…" className="sm:w-72" />
          <div className="flex flex-wrap gap-2">
            <Select
              className="w-40"
              value={list.filters.courseId || ''}
              onChange={(e) => list.setFilters((f) => ({ ...f, courseId: e.target.value || undefined, page: 1 }))}
            >
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.code}</option>
              ))}
            </Select>
            <Input
              type="date"
              className="w-40"
              value={list.filters.from || ''}
              onChange={(e) => list.setFilters((f) => ({ ...f, from: e.target.value || undefined, page: 1 }))}
            />
            <Select
              className="w-32"
              value={list.filters.status || ''}
              onChange={(e) => list.setFilters((f) => ({ ...f, status: e.target.value || undefined, page: 1 }))}
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </div>

        {list.loading ? (
          <div className="p-5"><TableSkeleton rows={6} cols={5} /></div>
        ) : list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : list.data.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No exam slots" description="Publish exam date and time options for your courses." action={<Button icon={Plus} onClick={() => setFormOpen(true)}>New exam slot</Button>} />
        ) : (
          <>
            <div className="table-scroll px-5 pt-2">
              <table className="table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.map((s) => (
                    <tr key={s._id}>
                      <td>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{s.course?.code}</span>
                        <span className="ml-2 text-sm muted">{s.course?.title}</span>
                      </td>
                      <td>
                        <span className="font-medium">{formatDate(s.examDate, 'dd MMM yyyy')}</span>
                        {s.day && <span className="ml-2 text-xs muted">{s.day}</span>}
                      </td>
                      <td className="text-sm">{s.startTime}{s.endTime ? `–${s.endTime}` : ' (default 3h)'}</td>
                      <td><Badge tone={s.isActive ? 'emerald' : 'slate'}>{s.isActive ? 'Active' : 'Inactive'}</Badge></td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" className="btn-ghost px-2 py-1.5" onClick={() => { setEditing(s); setFormOpen(true); }} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" className="btn-ghost px-2 py-1.5" onClick={async () => {
                            try {
                              await examSlotsApi.update(s._id, { isActive: !s.isActive });
                              toast.success(s.isActive ? 'Slot deactivated' : 'Slot activated');
                              list.reload();
                            } catch (err) { toast.error(err.message || 'Unable to change status'); }
                          }} title={s.isActive ? 'Deactivate' : 'Activate'}>
                            <Power className="h-4 w-4" />
                          </button>
                          <button type="button" className="btn-ghost px-2 py-1.5 text-rose-600" onClick={() => setConfirm(s)} title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={list.pagination.page}
              totalPages={list.pagination.totalPages}
              totalItems={list.pagination.totalItems}
              limit={list.filters.limit}
              onPageChange={list.setPage}
              onLimitChange={list.setLimit}
            />
          </>
        )}
      </Card>

      <SlotForm open={formOpen} editing={editing} courses={courses} onClose={() => setFormOpen(false)} onSaved={list.reload} />

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          setBusy(true);
          try {
            await examSlotsApi.remove(confirm._id);
            toast.success('Exam slot deleted');
            setConfirm(null);
            list.reload();
          } catch (err) {
            toast.error(err.message || 'Unable to delete slot');
          } finally {
            setBusy(false);
          }
        }}
        loading={busy}
        title="Delete exam slot?"
        description={confirm ? `${confirm.course?.code} on ${formatDate(confirm.examDate)} will be permanently removed.` : ''}
        confirmLabel="Delete"
      />
    </div>
  );
}
