import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { BookOpen, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import { Modal, ConfirmDialog } from '../../components/ui/Modal.jsx';
import { SearchInput } from '../../components/ui/SearchInput.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { EmptyState, ErrorState, TableSkeleton } from '../../components/ui/States.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { coursesApi } from '../../api/endpoints.js';
import { useList } from '../../hooks/useList.js';
import { useDebounce } from '../../hooks/useDebounce.js';

function CourseForm({ open, onClose, editing, onSaved }) {
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
        ? { ...editing, isActive: String(editing.isActive) }
        : { code: '', title: '', creditHours: 3, department: '', isActive: 'true' }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const submit = async (values) => {
    const payload = {
      code: values.code,
      title: values.title,
      creditHours: Number(values.creditHours),
      department: values.department,
      isActive: values.isActive === 'true',
    };
    try {
      if (editing) {
        await coursesApi.update(editing._id, payload);
        toast.success('Course updated');
      } else {
        await coursesApi.create(payload);
        toast.success('Course created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Unable to save course');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit course' : 'New course'}
      description="Courses offered for examination this session."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(submit)} loading={isSubmitting}>
            {editing ? 'Save changes' : 'Create course'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
        <Input label="Course code" required placeholder="e.g. CS201" error={errors.code?.message} {...register('code', { required: 'Code is required' })} />
        <Input label="Credit hours" type="number" min="1" max="12" required error={errors.creditHours?.message} {...register('creditHours', { required: 'Required' })} />
        <div className="sm:col-span-2">
          <Input label="Title" required error={errors.title?.message} {...register('title', { required: 'Title is required' })} />
        </div>
        <Input label="Department" required error={errors.department?.message} {...register('department', { required: 'Department is required' })} />
        <Select label="Status" {...register('isActive')}>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
      </form>
    </Modal>
  );
}

export default function Courses() {
  const fetchList = (params) => coursesApi.list(params);
  const list = useList(fetchList);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    list.setFilters((f) => ({ ...f, search: debounced || undefined, page: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const doDelete = async () => {
    setBusy(true);
    try {
      await coursesApi.remove(confirm._id);
      toast.success('Course deleted');
      setConfirm(null);
      list.reload();
    } catch (err) {
      toast.error(err.message || 'Unable to delete course');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (course) => {
    try {
      await coursesApi.update(course._id, { isActive: !course.isActive });
      toast.success(course.isActive ? 'Course deactivated' : 'Course activated');
      list.reload();
    } catch (err) {
      toast.error(err.message || 'Unable to change status');
    }
  };

  return (
    <div>
      <PageHeader
        breadcrumb="Setup"
        title="Courses"
        description="The catalogue of courses available for exam slot scheduling."
        actions={
          <Button icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>
            New course
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-night-800 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by code, title or department…" className="sm:w-80" />
          <Select
            className="sm:w-40"
            value={list.filters.status || ''}
            onChange={(e) => list.setFilters((f) => ({ ...f, status: e.target.value || undefined, page: 1 }))}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>

        {list.loading ? (
          <div className="p-5">
            <TableSkeleton rows={5} cols={5} />
          </div>
        ) : list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : list.data.length === 0 ? (
          <EmptyState icon={BookOpen} title="No courses yet" description="Add courses so you can schedule exam slots and assign students." action={<Button icon={Plus} onClick={() => setFormOpen(true)}>New course</Button>} />
        ) : (
          <>
            <div className="table-scroll px-5 pt-2">
              <table className="table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Title</th>
                    <th>Department</th>
                    <th>Credit hours</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.map((c) => (
                    <tr key={c._id}>
                      <td className="font-semibold text-slate-800 dark:text-slate-100">{c.code}</td>
                      <td>{c.title}</td>
                      <td className="text-sm muted">{c.department}</td>
                      <td>{c.creditHours}</td>
                      <td>
                        <Badge tone={c.isActive ? 'emerald' : 'slate'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" className="btn-ghost px-2 py-1.5" onClick={() => { setEditing(c); setFormOpen(true); }} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" className="btn-ghost px-2 py-1.5" onClick={() => toggleActive(c)} title={c.isActive ? 'Deactivate' : 'Activate'}>
                            <Power className="h-4 w-4" />
                          </button>
                          <button type="button" className="btn-ghost px-2 py-1.5 text-rose-600" onClick={() => setConfirm(c)} title="Delete">
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

      <CourseForm open={formOpen} editing={editing} onClose={() => setFormOpen(false)} onSaved={list.reload} />

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={doDelete}
        loading={busy}
        title="Delete course?"
        description={confirm ? `${confirm.code} — ${confirm.title} will be permanently removed.` : ''}
        confirmLabel="Delete"
      />
    </div>
  );
}
