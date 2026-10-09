import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '../ui/Button.jsx';
import { Input, Select, Textarea } from '../ui/Field.jsx';
import { Modal } from '../ui/Modal.jsx';
import { studentsApi } from '../../api/endpoints.js';

function SectionTitle({ children }) {
  return <h3 className="mt-2 text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400 sm:col-span-2">{children}</h3>;
}

export function StudentForm({ open, onClose, editing, onSaved }) {
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
            ...editing,
            dateOfBirth: editing.dateOfBirth ? String(editing.dateOfBirth).slice(0, 10) : '',
            guardian: { ...editing.guardian },
          }
        : {
            fullName: '',
            email: '',
            phone: '',
            cnic: '',
            dateOfBirth: '',
            gender: 'male',
            address: '',
            photoUrl: '',
            registrationNumber: '',
            program: '',
            semester: 1,
            session: '',
            previousQualification: '',
            previousInstitute: '',
            marks: '',
            guardian: { name: '', cnic: '', occupation: '', contactNumber: '', emergencyContact: '' },
          }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const submit = async (values) => {
    const payload = {
      fullName: values.fullName,
      email: values.email,
      phone: values.phone,
      cnic: values.cnic,
      dateOfBirth: values.dateOfBirth ? `${values.dateOfBirth}T00:00:00.000Z` : undefined,
      gender: values.gender,
      address: values.address,
      photoUrl: values.photoUrl || '',
      registrationNumber: values.registrationNumber,
      program: values.program,
      semester: Number(values.semester),
      session: values.session,
      previousQualification: values.previousQualification,
      previousInstitute: values.previousInstitute,
      marks: values.marks,
      guardian: {
        name: values.guardian.name,
        cnic: values.guardian.cnic,
        occupation: values.guardian.occupation,
        contactNumber: values.guardian.contactNumber,
        emergencyContact: values.guardian.emergencyContact,
      },
    };
    try {
      if (editing) {
        await studentsApi.update(editing._id, payload);
        toast.success('Student updated');
        onSaved?.();
      } else {
        const res = await studentsApi.create(payload);
        const status = res.data?.setup?.emailStatus;
        if (status === 'SENT') toast.success('Student created — setup email sent.');
        else if (status === 'DISABLED') toast.warning('Student created. Email is disabled — copy the setup link.');
        else toast.success('Student created');
        onSaved?.(res.data);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Unable to save student');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={editing ? 'Edit student' : 'New student'}
      description={editing ? 'Update the student’s personal and academic record.' : 'Create an account. A setup link is emailed so the student can choose a password.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(submit)} loading={isSubmitting}>
            {editing ? 'Save changes' : 'Create student'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
        <SectionTitle>Personal information</SectionTitle>
        <Input label="Full name" required error={errors.fullName?.message} {...register('fullName', { required: 'Name is required' })} />
        <Input label="Email" type="email" required error={errors.email?.message} {...register('email', { required: 'Email is required' })} />
        <Input label="Phone" required placeholder="+92 300 0000000" error={errors.phone?.message} {...register('phone', { required: 'Phone is required' })} />
        <Input label="CNIC" required error={errors.cnic?.message} {...register('cnic', { required: 'CNIC is required' })} />
        <Input label="Date of birth" type="date" required error={errors.dateOfBirth?.message} {...register('dateOfBirth', { required: 'Date of birth is required' })} />
        <Select label="Gender" {...register('gender')}>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </Select>
        <div className="sm:col-span-2">
          <Textarea label="Address" rows={2} required error={errors.address?.message} {...register('address', { required: 'Address is required' })} />
        </div>
        <Input label="Photo URL (optional)" className="sm:col-span-2" placeholder="https://…" {...register('photoUrl')} />

        <SectionTitle>Guardian information</SectionTitle>
        <Input label="Guardian name" required error={errors.guardian?.name?.message} {...register('guardian.name', { required: 'Required' })} />
        <Input label="Guardian CNIC" required {...register('guardian.cnic', { required: 'Required' })} />
        <Input label="Occupation" required {...register('guardian.occupation', { required: 'Required' })} />
        <Input label="Contact number" required {...register('guardian.contactNumber', { required: 'Required' })} />
        <Input label="Emergency contact" required {...register('guardian.emergencyContact', { required: 'Required' })} />

        <SectionTitle>Academic information</SectionTitle>
        <Input label="Registration number" required {...register('registrationNumber', { required: 'Registration number is required' })} />
        <Input label="Program" required placeholder="e.g. BS Computer Science" {...register('program', { required: 'Program is required' })} />
        <Input label="Semester" type="number" min="1" max="16" required {...register('semester', { required: 'Required' })} />
        <Input label="Session" required placeholder="e.g. Fall 2026" {...register('session', { required: 'Session is required' })} />
        <Input label="Previous qualification" required {...register('previousQualification', { required: 'Required' })} />
        <Input label="Previous institute" required {...register('previousInstitute', { required: 'Required' })} />
        <Input label="Marks / grade" required placeholder="e.g. 85% or A+" {...register('marks', { required: 'Required' })} />
      </form>
    </Modal>
  );
}

export default StudentForm;
