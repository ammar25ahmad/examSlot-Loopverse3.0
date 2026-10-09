import { useState } from 'react';
import { ScrollText } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui/Card.jsx';
import { Select } from '../../components/ui/Field.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { EmptyState, ErrorState, TableSkeleton } from '../../components/ui/States.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { adminApi } from '../../api/endpoints.js';
import { useList } from '../../hooks/useList.js';
import { formatDateTime, initials, titleCase } from '../../utils/format.js';
import { AUDIT_LABEL } from '../../utils/constants.js';

const ACTIONS = ['ADMIN_LOGIN', 'STUDENT_CREATED', 'STUDENT_UPDATED', 'BRANCH_CREATED', 'BRANCH_UPDATED', 'COURSE_CREATED', 'COURSE_UPDATED', 'SLOT_CREATED', 'SLOT_UPDATED', 'ASSIGNMENT_UPDATED', 'REQUEST_REVIEWED', 'SETUP_EMAIL_RESENT'];

export default function AuditLogs() {
  const fetchList = (params) => adminApi.auditLogs(params);
  const list = useList(fetchList);

  return (
    <div>
      <PageHeader
        breadcrumb="Governance"
        title="Audit logs"
        description="An immutable trail of every administrative action taken in the console."
      />

      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-night-800">
          <p className="text-sm muted">Newest first</p>
          <Select
            className="w-56"
            value={list.filters.action || ''}
            onChange={(e) => list.setFilters((f) => ({ ...f, action: e.target.value || undefined, page: 1 }))}
          >
            <option value="">All actions</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>{AUDIT_LABEL[a] || titleCase(a)}</option>
            ))}
          </Select>
        </div>

        {list.loading ? (
          <div className="p-5"><TableSkeleton rows={8} cols={4} /></div>
        ) : list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : list.data.length === 0 ? (
          <EmptyState icon={ScrollText} title="No audit entries" description="Administrative actions will be recorded here." />
        ) : (
          <>
            <div className="table-scroll px-5 pt-2">
              <table className="table">
                <thead>
                  <tr>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Description</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.map((log) => (
                    <tr key={log._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 dark:bg-night-800 dark:text-slate-300">
                            {initials(log.actor?.name || 'System')}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{log.actor?.name || 'System'}</p>
                            <p className="text-xs muted">{log.actorEmail || log.actor?.email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td><Badge tone="brand">{AUDIT_LABEL[log.action] || titleCase(log.action)}</Badge></td>
                      <td className="text-sm muted">{log.description}</td>
                      <td className="text-xs muted">{formatDateTime(log.createdAt)}</td>
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
    </div>
  );
}
