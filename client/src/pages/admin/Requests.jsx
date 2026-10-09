import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, Inbox, X } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Select, Textarea } from '../../components/ui/Field.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { SearchInput } from '../../components/ui/SearchInput.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { EmptyState, ErrorState, TableSkeleton } from '../../components/ui/States.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { adminApi } from '../../api/endpoints.js';
import { useList } from '../../hooks/useList.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { formatDateTime } from '../../utils/format.js';
import { REQUEST_STATUS_STYLE, REQUEST_TYPE_LABEL } from '../../utils/constants.js';

function ReviewModal({ request, onClose, onDone }) {
  const [status, setStatus] = useState('APPROVED');
  const [remark, setRemark] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (request) {
      setStatus('APPROVED');
      setRemark('');
    }
  }, [request]);

  const submit = async () => {
    setBusy(true);
    try {
      await adminApi.reviewRequest(request._id, { status, adminRemark: remark });
      toast.success(`Request ${status === 'APPROVED' ? 'approved' : 'rejected'}`);
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Unable to review request');
    } finally {
      setBusy(false);
    }
  };

  if (!request) return null;

  return (
    <Modal
      open={Boolean(request)}
      onClose={onClose}
      title="Review change request"
      description={`${request.student?.fullName || 'Student'} · ${REQUEST_TYPE_LABEL[request.type] || request.type}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button
            variant={status === 'APPROVED' ? 'success' : 'danger'}
            icon={status === 'APPROVED' ? Check : X}
            loading={busy}
            onClick={submit}
          >
            {status === 'APPROVED' ? 'Approve request' : 'Reject request'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-night-700 dark:bg-night-800">
          <p className="text-xs font-semibold uppercase tracking-wide muted">Student reason</p>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{request.reason}</p>
          <p className="mt-2 text-xs muted">Submitted {formatDateTime(request.createdAt)}</p>
        </div>

        <Select label="Decision" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="APPROVED">Approve — grant entitlement</option>
          <option value="REJECTED">Reject</option>
        </Select>

        <Textarea label="Admin remark (optional)" rows={3} value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Explain your decision for the student record…" />

        <p className="text-xs muted">
          Approving grants a one-time entitlement. A branch change also resets any existing date sheet.
        </p>
      </div>
    </Modal>
  );
}

export default function Requests() {
  const fetchList = (params) => adminApi.requests(params);
  const list = useList(fetchList);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [active, setActive] = useState(null);

  useEffect(() => {
    list.setFilters((f) => ({ ...f, search: debounced || undefined, page: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div>
      <PageHeader
        breadcrumb="Workflow"
        title="Change requests"
        description="Review branch-change and date-sheet-change requests from students."
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-night-800 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by student…" className="sm:w-72" />
          <div className="flex gap-2">
            <Select
              className="w-40"
              value={list.filters.type || ''}
              onChange={(e) => list.setFilters((f) => ({ ...f, type: e.target.value || undefined, page: 1 }))}
            >
              <option value="">All types</option>
              <option value="BRANCH_CHANGE">Branch change</option>
              <option value="DATE_SHEET_CHANGE">Date sheet change</option>
            </Select>
            <Select
              className="w-36"
              value={list.filters.status || ''}
              onChange={(e) => list.setFilters((f) => ({ ...f, status: e.target.value || undefined, page: 1 }))}
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </Select>
          </div>
        </div>

        {list.loading ? (
          <div className="p-5"><TableSkeleton rows={5} cols={5} /></div>
        ) : list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : list.data.length === 0 ? (
          <EmptyState icon={Inbox} title="No requests" description="Change requests submitted by students will appear here." />
        ) : (
          <>
            <div className="table-scroll px-5 pt-2">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Type</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <p className="font-medium text-slate-800 dark:text-slate-100">{r.student?.fullName || '—'}</p>
                        <p className="text-xs muted">{r.student?.registrationNumber}</p>
                      </td>
                      <td><Badge tone="brand">{REQUEST_TYPE_LABEL[r.type] || r.type}</Badge></td>
                      <td className="max-w-xs">
                        <p className="line-clamp-2 text-sm muted">{r.reason}</p>
                      </td>
                      <td>
                        <span className={`chip ${REQUEST_STATUS_STYLE[r.status]}`}>{r.status}</span>
                      </td>
                      <td className="text-xs muted">{formatDateTime(r.createdAt)}</td>
                      <td className="text-right">
                        {r.status === 'PENDING' ? (
                          <Button variant="secondary" onClick={() => setActive(r)}>Review</Button>
                        ) : (
                          <span className="text-xs muted">{r.reviewedBy?.name || 'Reviewed'}</span>
                        )}
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

      <ReviewModal request={active} onClose={() => setActive(null)} onDone={list.reload} />
    </div>
  );
}
