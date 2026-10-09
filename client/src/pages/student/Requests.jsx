import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Inbox, Plus } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Select, Textarea } from '../../components/ui/Field.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { EmptyState, ErrorState, TableSkeleton } from '../../components/ui/States.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { studentApi } from '../../api/endpoints.js';
import { useList } from '../../hooks/useList.js';
import { formatDateTime } from '../../utils/format.js';
import { REQUEST_STATUS_STYLE, REQUEST_TYPE_LABEL } from '../../utils/constants.js';

const schema = z.object({
  type: z.enum(['BRANCH_CHANGE', 'DATE_SHEET_CHANGE']),
  reason: z.string().min(10, 'Please give at least 10 characters'),
});

function RequestModal({ open, onClose, onSaved }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { type: 'BRANCH_CHANGE', reason: '' } });

  const submit = async (values) => {
    try {
      await studentApi.createRequest(values);
      toast.success('Request submitted for review');
      reset();
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Unable to submit request');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New change request"
      description="Requests are reviewed by the examinations office."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit(submit)} loading={isSubmitting}>Submit request</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        <Select label="Request type" {...register('type')}>
          <option value="BRANCH_CHANGE">Branch change</option>
          <option value="DATE_SHEET_CHANGE">Date sheet change</option>
        </Select>
        <Textarea
          label="Reason"
          rows={4}
          required
          placeholder="Explain why you need this change…"
          error={errors.reason?.message}
          {...register('reason')}
        />
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs muted dark:border-night-700 dark:bg-night-800">
          Only one pending request of each type is allowed. Approving a branch change also resets your date sheet.
        </p>
      </form>
    </Modal>
  );
}

export default function StudentRequests() {
  const fetchList = (params) => studentApi.requests(params);
  const list = useList(fetchList);
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="My requests"
        description="Track branch-change and date-sheet-change requests you have submitted."
        actions={<Button icon={Plus} onClick={() => setOpen(true)}>New request</Button>}
      />

      <Card>
        {list.loading ? (
          <div className="p-5"><TableSkeleton rows={4} cols={4} /></div>
        ) : list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : list.data.length === 0 ? (
          <EmptyState icon={Inbox} title="No requests yet" description="Submit a request if you need to change your branch or date sheet." action={<Button icon={Plus} onClick={() => setOpen(true)}>New request</Button>} />
        ) : (
          <>
            <div className="table-scroll px-5 pt-2">
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Admin remark</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.map((r) => (
                    <tr key={r._id}>
                      <td><span className="font-medium">{REQUEST_TYPE_LABEL[r.type] || r.type}</span></td>
                      <td className="max-w-sm"><p className="line-clamp-2 text-sm muted">{r.reason}</p></td>
                      <td><span className={`chip ${REQUEST_STATUS_STYLE[r.status]}`}>{r.status}</span></td>
                      <td className="max-w-xs text-sm muted">{r.adminRemark || '—'}</td>
                      <td className="text-xs muted">{formatDateTime(r.createdAt)}</td>
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

      <RequestModal open={open} onClose={() => setOpen(false)} onSaved={list.reload} />
    </div>
  );
}
