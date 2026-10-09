import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Building2, CheckCircle2, MapPin, Phone, Users } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { EmptyState, ErrorState, FullPageLoader } from '../../components/ui/States.jsx';
import { studentApi } from '../../api/endpoints.js';
import { useAsync } from '../../hooks/useList.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function SelectBranch() {
  const { data, loading, error, reload } = useAsync(() => studentApi.branches());
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [picked, setPicked] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const branches = data?.data || [];

  const doSelect = async () => {
    setBusy(true);
    try {
      const res = await studentApi.selectBranch(picked._id);
      await refresh();
      toast.success('Exam branch confirmed');
      if (res.data?.dateSheetReset) {
        toast.warning('Your previous date sheet was reset because you changed branch.');
      }
      navigate('/student', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Unable to select branch');
      setBusy(false);
      setConfirm(false);
    }
  };

  if (loading) return <FullPageLoader label="Loading branches…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const isChange = Boolean(user?.selectedBranch);

  return (
    <div>
      <PageHeader
        breadcrumb={isChange ? 'Branch change' : 'Onboarding'}
        title={isChange ? 'Choose your new branch' : 'Choose your examination branch'}
        description={
          isChange
            ? 'You have approval to change your branch. Selecting a new one resets your existing date sheet.'
            : 'This is a one-time choice. You will sit your exams at the branch you select.'
        }
      />

      {branches.length === 0 ? (
        <Card>
          <EmptyState icon={Building2} title="No branches available" description="The exams office has not published any branches yet. Please check back later." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((b) => {
            const selected = picked?._id === b._id;
            return (
              <button
                key={b._id}
                type="button"
                onClick={() => setPicked(b)}
                className={`card p-5 text-left transition ${
                  selected ? 'ring-2 ring-brand-500' : 'hover:-translate-y-0.5 hover:shadow-pop'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`grid h-11 w-11 place-items-center rounded-xl ${selected ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300'}`}>
                    <Building2 className="h-5 w-5" />
                  </span>
                  {selected && <CheckCircle2 className="h-5 w-5 text-brand-600" />}
                </div>
                <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">{b.name}</h3>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">{b.code}</p>
                <div className="mt-3 space-y-1.5 text-sm muted">
                  <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {b.city}</p>
                  <p className="flex items-start gap-2"><span className="mt-0.5">📍</span> {b.address}</p>
                  <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {b.contactNumber}</p>
                  <p className="flex items-center gap-2"><Users className="h-4 w-4" /> {b.seatCapacity} seats per slot</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {picked && (
        <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50/70 p-5 dark:border-brand-500/40 dark:bg-brand-500/10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-700 dark:text-slate-200">
            Confirm <span className="font-semibold">{picked.name} ({picked.code})</span> as your examination branch?
          </p>
          <Button onClick={() => setConfirm(true)}>Confirm branch</Button>
        </div>
      )}

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={doSelect}
        loading={busy}
        title={isChange ? 'Confirm branch change?' : 'Confirm branch selection?'}
        description={isChange ? 'Your existing date sheet will be reset and seats released.' : 'This choice can only be changed later via an approved request.'}
        confirmLabel={isChange ? 'Change branch' : 'Confirm'}
        confirmVariant="primary"
      />
    </div>
  );
}
