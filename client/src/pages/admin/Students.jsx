import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, Mail, Plus, Send, Power, Users } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Select } from '../../components/ui/Field.jsx';
import { SearchInput } from '../../components/ui/SearchInput.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import { EmptyState, ErrorState, TableSkeleton } from '../../components/ui/States.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { StudentForm } from '../../components/admin/StudentForm.jsx';
import { studentsApi } from '../../api/endpoints.js';
import { useList } from '../../hooks/useList.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { formatDate, initials } from '../../utils/format.js';
import { ACCOUNT_STATUS_LABEL, ACCOUNT_STATUS_STYLE } from '../../utils/constants.js';

export default function Students() {
  const fetchList = (params) => studentsApi.list(params);
  const list = useList(fetchList);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    list.setFilters((f) => ({ ...f, search: debounced || undefined, page: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const toggleActive = async (student) => {
    try {
      await studentsApi.setStatus(student._id, !student.isActive);
      toast.success(student.isActive ? 'Student deactivated' : 'Student activated');
      list.reload();
    } catch (err) {
      toast.error(err.message || 'Unable to change status');
    }
  };

  const resend = async (student) => {
    try {
      const res = await studentsApi.resendSetup(student._id);
      const status = res.data?.emailStatus;
      if (status === 'SENT') toast.success('Setup email resent.');
      else if (status === 'DISABLED') toast.warning('Email disabled — no message sent.');
      else toast.error('Setup email could not be delivered.');
    } catch (err) {
      toast.error(err.message || 'Unable to resend setup email');
    }
  };

  return (
    <div>
      <PageHeader
        breadcrumb="People"
        title="Students"
        description="Manage student accounts, programs and setup status."
        actions={
          <Button icon={Plus} onClick={() => setFormOpen(true)}>
            New student
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-night-800 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or registration number…" className="sm:w-80" />
          <div className="flex gap-2">
            <Select
              className="w-44"
              value={list.filters.accountStatus || ''}
              onChange={(e) => list.setFilters((f) => ({ ...f, accountStatus: e.target.value || undefined, page: 1 }))}
            >
              <option value="">All statuses</option>
              <option value="PENDING_SETUP">Pending setup</option>
              <option value="ACTIVE">Active</option>
              <option value="DISABLED">Disabled</option>
            </Select>
            <Select
              className="w-36"
              value={list.filters.status || ''}
              onChange={(e) => list.setFilters((f) => ({ ...f, status: e.target.value || undefined, page: 1 }))}
            >
              <option value="">All</option>
              <option value="active">Enabled</option>
              <option value="inactive">Disabled</option>
            </Select>
          </div>
        </div>

        {list.loading ? (
          <div className="p-5">
            <TableSkeleton rows={6} cols={5} />
          </div>
        ) : list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : list.data.length === 0 ? (
          <EmptyState icon={Users} title="No students found" description="Add students or adjust your filters." action={<Button icon={Plus} onClick={() => setFormOpen(true)}>New student</Button>} />
        ) : (
          <>
            <div className="table-scroll px-5 pt-2">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Reg. no</th>
                    <th>Program</th>
                    <th>Semester</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.map((s) => (
                    <tr key={s._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                            {initials(s.fullName)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800 dark:text-slate-100">{s.fullName}</p>
                            <p className="truncate text-xs muted">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm">{s.registrationNumber}</td>
                      <td className="text-sm">{s.program}</td>
                      <td>{s.semester}</td>
                      <td>
                        <StatusBadge
                          label={ACCOUNT_STATUS_LABEL[s.accountStatus] || s.accountStatus}
                          className={ACCOUNT_STATUS_STYLE[s.accountStatus]}
                        />
                        {!s.isActive && <span className="ml-1 text-[11px] font-semibold text-rose-500">disabled</span>}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/admin/students/${s._id}`} className="btn-ghost px-2 py-1.5" title="View">
                            <Eye className="h-4 w-4" />
                          </Link>
                          {s.accountStatus === 'PENDING_SETUP' && (
                            <button type="button" className="btn-ghost px-2 py-1.5" onClick={() => resend(s)} title="Resend setup email">
                              <Send className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            className={`btn-ghost px-2 py-1.5 ${s.isActive ? 'text-rose-600' : 'text-emerald-600'}`}
                            onClick={() => toggleActive(s)}
                            title={s.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <Power className="h-4 w-4" />
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

      <StudentForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={list.reload} />
    </div>
  );
}
