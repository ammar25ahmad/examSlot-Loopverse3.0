import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ClipboardList, Search, Settings2, UserPlus } from 'lucide-react';
import { PageHeader, Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { SearchInput } from '../../components/ui/SearchInput.jsx';
import { EmptyState, ErrorState, TableSkeleton, Spinner } from '../../components/ui/States.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { assignmentsApi, coursesApi, studentsApi } from '../../api/endpoints.js';
import { useList } from '../../hooks/useList.js';
import { useDebounce } from '../../hooks/useDebounce.js';

function StudentPicker({ selected, onSelect }) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(term);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await studentsApi.list({ search: debounced || undefined, limit: 8 });
        if (active) setResults(res.data || []);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [debounced]);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9" placeholder="Search students by name or reg. no…" value={term} onChange={(e) => setTerm(e.target.value)} />
      </div>
      <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-slate-200 dark:border-night-700">
        {loading ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : results.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm muted">No students found.</p>
        ) : (
          results.map((s) => (
            <button
              key={s._id}
              type="button"
              onClick={() => onSelect(s)}
              className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-night-800 ${
                selected?._id === s._id ? 'bg-brand-50 dark:bg-brand-500/10' : ''
              }`}
            >
              <span>
                <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">{s.fullName}</span>
                <span className="block text-xs muted">{s.registrationNumber} · {s.program}</span>
              </span>
              <UserPlus className="h-4 w-4 text-slate-400" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function ManageAssignmentsModal({ open, onClose, onSaved }) {
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setStudent(null);
      setSelected([]);
      return;
    }
    (async () => {
      setLoadingCourses(true);
      try {
        const res = await coursesApi.list({ limit: 100, status: 'active' });
        setCourses(res.data || []);
      } finally {
        setLoadingCourses(false);
      }
    })();
  }, [open]);

  const choose = async (s) => {
    setStudent(s);
    setLoadingAssigned(true);
    try {
      const res = await assignmentsApi.forStudent(s._id);
      setSelected((res.data?.assignments || []).map((a) => a.course?._id || a.course));
    } catch {
      setSelected([]);
    } finally {
      setLoadingAssigned(false);
    }
  };

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const save = async () => {
    if (!student) return toast.error('Choose a student first.');
    if (selected.length < 4 || selected.length > 6) return toast.error('Select 4 to 6 courses.');
    setSaving(true);
    try {
      await assignmentsApi.setForStudent(student._id, selected);
      toast.success(`Assignments saved for ${student.fullName}`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Unable to save assignments');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Manage course assignments"
      description="Assign between 4 and 6 courses to a student. Date sheets require a complete set."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} loading={saving} disabled={!student || selected.length < 4 || selected.length > 6}>
            Save assignments
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <p className="label">Student</p>
          {student ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50/60 px-3 py-2.5 dark:border-brand-500/40 dark:bg-brand-500/10">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{student.fullName}</p>
                <p className="text-xs muted">{student.registrationNumber}</p>
              </div>
              <button type="button" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400" onClick={() => setStudent(null)}>
                Change
              </button>
            </div>
          ) : (
            <StudentPicker selected={student} onSelect={choose} />
          )}
        </div>

        <div>
          <p className="label">
            Courses <span className="ml-1 text-xs font-normal muted">({selected.length} selected)</span>
          </p>
          {loadingCourses ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : (
            <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200 p-2 dark:border-night-700">
              {courses.map((c) => (
                <label key={c._id} className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-night-800">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" checked={selected.includes(c._id)} onChange={() => toggle(c._id)} />
                  <span>
                    <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">{c.code}</span>
                    <span className="block text-xs muted">{c.title}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
          {loadingAssigned && <p className="mt-2 text-xs muted">Loading current assignments…</p>}
        </div>
      </div>
    </Modal>
  );
}

export default function Assignments() {
  const fetchList = (params) => assignmentsApi.list(params);
  const list = useList(fetchList);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [manageOpen, setManageOpen] = useState(false);

  useEffect(() => {
    list.setFilters((f) => ({ ...f, search: debounced || undefined, page: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div>
      <PageHeader
        breadcrumb="People"
        title="Course assignments"
        description="Every student must have between 4 and 6 assigned courses before a date sheet can be created."
        actions={
          <Button icon={Settings2} onClick={() => setManageOpen(true)}>
            Manage student
          </Button>
        }
      />

      <Card>
        <div className="border-b border-slate-100 p-4 dark:border-night-800">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by student or course…" className="sm:w-80" />
        </div>

        {list.loading ? (
          <div className="p-5"><TableSkeleton rows={6} cols={4} /></div>
        ) : list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : list.data.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No assignments found" description="Assign courses to students to populate their exam options." action={<Button icon={Settings2} onClick={() => setManageOpen(true)}>Manage student</Button>} />
        ) : (
          <>
            <div className="table-scroll px-5 pt-2">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Reg. no</th>
                    <th>Course</th>
                    <th>Credit hours</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.map((a) => (
                    <tr key={a._id}>
                      <td className="font-medium text-slate-800 dark:text-slate-100">{a.student?.fullName || '—'}</td>
                      <td className="text-sm">{a.student?.registrationNumber || '—'}</td>
                      <td>
                        <span className="font-semibold">{a.course?.code}</span>
                        <span className="ml-2 text-sm muted">{a.course?.title}</span>
                      </td>
                      <td>{a.course?.creditHours}</td>
                      <td className="text-sm muted">{a.course?.department}</td>
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

      <ManageAssignmentsModal open={manageOpen} onClose={() => setManageOpen(false)} onSaved={list.reload} />
    </div>
  );
}
