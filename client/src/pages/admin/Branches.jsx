import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Building2, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import { Modal, ConfirmDialog } from '../../components/ui/Modal.jsx';
import { SearchInput } from '../../components/ui/SearchInput.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { EmptyState, ErrorState, TableSkeleton } from '../../components/ui/States.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { branchesApi } from '../../api/endpoints.js';
import { useList } from '../../hooks/useList.js';
import { useDebounce } from '../../hooks/useDebounce.js';

function BranchForm({ open, onClose, editing, onSaved }) {
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
        ? { ...editing, isActive: String(editing.isActive), seatCapacity: editing.seatCapacity }
        : { name: '', code: '', city: '', address: '', contactNumber: '', seatCapacity: 60, isActive: 'true' }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const submit = async (values) => {
    const payload = {
      name: values.name,
      code: values.code,
      city: values.city,
      address: values.address,
      contactNumber: values.contactNumber,
      seatCapacity: values.seatCapacity ? Number(values.seatCapacity) : undefined,
      isActive: values.isActive === 'true',
    };
    try {
      if (editing) {
        await branchesApi.update(editing._id, payload);
        toast.success('Branch updated');
      } else {
        await branchesApi.create(payload);
        toast.success('Branch created');
      }
      reset();
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Unable to save branch');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit branch' : 'New branch'}
      description="Examination branches where students take their exams."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(submit)} loading={isSubmitting}>
            {editing ? 'Save changes' : 'Create branch'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
        <Input label="Branch name" required error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
        <Input label="Code" required placeholder="e.g. KHI" error={errors.code?.message} {...register('code', { required: 'Code is required' })} />
        <Input label="City" required error={errors.city?.message} {...register('city', { required: 'City is required' })} />
        <Input label="Contact number" required placeholder="+92 300 0000000" error={errors.contactNumber?.message} {...register('contactNumber', { required: 'Contact is required' })} />
        <div className="sm:col-span-2">
          <Input label="Address" required error={errors.address?.message} {...register('address', { required: 'Address is required' })} />
        </div>
        <Input label="Seat capacity" type="number" min="1" placeholder="60" hint="Default seats per exam slot for this branch." {...register('seatCapacity')} />
        <Select label="Status" {...register('isActive')}>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
      </form>
    </Modal>
  );
}

export default function Branches() {
  const fetchList = (params) => branchesApi.list(params);
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

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (branch) => {
    setEditing(branch);
    setFormOpen(true);
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await branchesApi.remove(confirm._id);
      toast.success('Branch deleted');
      setConfirm(null);
      list.reload();
    } catch (err) {
      toast.error(err.message || 'Unable to delete branch');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (branch) => {
    try {
      await branchesApi.update(branch._id, { isActive: !branch.isActive });
      toast.success(branch.isActive ? 'Branch deactivated' : 'Branch activated');
      list.reload();
    } catch (err) {
      toast.error(err.message || 'Unable to change status');
    }
  };

  return (
    <div>
      <PageHeader
        breadcrumb="Setup"
        title="Branches"
        description="Manage the virtual university’s examination branches and their seat capacity."
        actions={
          <Button icon={Plus} onClick={openCreate}>
            New branch
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-night-800 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, code or city…" className="sm:w-80" />
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
          <EmptyState icon={Building2} title="No branches yet" description="Create your first examination branch to get started." action={<Button icon={Plus} onClick={openCreate}>New branch</Button>} />
        ) : (
          <>
            <div className="table-scroll px-5 pt-2">
              <table className="table">
                <thead>
                  <tr>
                    <th>Branch</th>
                    <th>City</th>
                    <th>Contact</th>
                    <th>Seat capacity</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.map((b) => (
                    <tr key={b._id}>
                      <td>
                        <p className="font-medium text-slate-800 dark:text-slate-100">{b.name}</p>
                        <p className="text-xs muted">{b.code}</p>
                      </td>
                      <td>{b.city}</td>
                      <td className="text-sm muted">{b.contactNumber}</td>
                      <td>{b.seatCapacity}</td>
                      <td>
                        <Badge tone={b.isActive ? 'emerald' : 'slate'}>{b.isActive ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" className="btn-ghost px-2 py-1.5" onClick={() => openEdit(b)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" className="btn-ghost px-2 py-1.5" onClick={() => toggleActive(b)} title={b.isActive ? 'Deactivate' : 'Activate'}>
                            <Power className="h-4 w-4" />
                          </button>
                          <button type="button" className="btn-ghost px-2 py-1.5 text-rose-600" onClick={() => setConfirm(b)} title="Delete">
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

      <BranchForm
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={list.reload}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={doDelete}
        loading={busy}
        title="Delete branch?"
        description={confirm ? `${confirm.name} (${confirm.code}) will be permanently removed.` : ''}
        confirmLabel="Delete"
      />
    </div>
  );
}
