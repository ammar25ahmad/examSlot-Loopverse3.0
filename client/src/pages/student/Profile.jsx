import { BookOpen, GraduationCap, MapPin, Phone, User, Users } from 'lucide-react';
import { PageHeader, Card, CardHeader } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { ErrorState, FullPageLoader } from '../../components/ui/States.jsx';
import { studentApi } from '../../api/endpoints.js';
import { useAsync } from '../../hooks/useList.js';
import { formatDate } from '../../utils/format.js';
import { ACCOUNT_STATUS_LABEL, ACCOUNT_STATUS_STYLE, GENDER_LABEL } from '../../utils/constants.js';

function Row({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-100">{value || '—'}</dd>
    </div>
  );
}

export default function Profile() {
  const { data, loading, error, reload } = useAsync(() => studentApi.profile());
  if (loading) return <FullPageLoader label="Loading your profile…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const s = data?.data;
  if (!s) return null;

  return (
    <div>
      <PageHeader title="My profile" description="Your registered information on file with the examinations office." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <div className="flex items-center gap-4">
            {s.photoUrl ? (
              <img src={s.photoUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
            ) : (
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-100 text-lg font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                <User className="h-7 w-7" />
              </span>
            )}
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{s.fullName}</p>
              <p className="text-sm muted">{s.registrationNumber}</p>
              <Badge className={`mt-1 ${ACCOUNT_STATUS_STYLE[s.accountStatus]}`}>
                {ACCOUNT_STATUS_LABEL[s.accountStatus] || s.accountStatus}
              </Badge>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <p className="flex items-center gap-2 text-sm muted"><GraduationCap className="h-4 w-4" /> {s.program}</p>
            <p className="flex items-center gap-2 text-sm muted"><BookOpen className="h-4 w-4" /> Semester {s.semester} · {s.session}</p>
            <p className="flex items-center gap-2 text-sm muted"><MapPin className="h-4 w-4" /> {s.selectedBranch ? `${s.selectedBranch.name} (${s.selectedBranch.code})` : 'No branch selected'}</p>
            <p className="flex items-center gap-2 text-sm muted"><Phone className="h-4 w-4" /> {s.phone}</p>
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Personal information" icon={User} />
            <dl className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              <Row label="Full name" value={s.fullName} />
              <Row label="Email" value={s.email} />
              <Row label="Phone" value={s.phone} />
              <Row label="CNIC" value={s.cnic} />
              <Row label="Date of birth" value={s.dateOfBirth ? formatDate(s.dateOfBirth) : '—'} />
              <Row label="Gender" value={GENDER_LABEL[s.gender] || s.gender} />
              <div className="sm:col-span-2 lg:col-span-3">
                <Row label="Address" value={s.address} />
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Guardian information" icon={Users} />
            <dl className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              <Row label="Name" value={s.guardian?.name} />
              <Row label="CNIC" value={s.guardian?.cnic} />
              <Row label="Occupation" value={s.guardian?.occupation} />
              <Row label="Contact" value={s.guardian?.contactNumber} />
              <Row label="Emergency" value={s.guardian?.emergencyContact} />
            </dl>
          </Card>

          <Card>
            <CardHeader title="Academic information" icon={GraduationCap} />
            <dl className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              <Row label="Registration no." value={s.registrationNumber} />
              <Row label="Program" value={s.program} />
              <Row label="Semester" value={s.semester} />
              <Row label="Session" value={s.session} />
              <Row label="Previous qualification" value={s.previousQualification} />
              <Row label="Previous institute" value={s.previousInstitute} />
              <Row label="Marks" value={s.marks} />
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
