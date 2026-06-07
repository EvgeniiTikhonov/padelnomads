import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PADEL_LEVELS,
  PREFERRED_SIDES,
  GENDER_OPTIONS,
  REFERRAL_SOURCES,
} from '@/lib/applicationFields';
import { actions } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { Field } from './ui';

type Values = {
  name: string;
  phoneNumber: string;
  email: string;
  level: string;
  preferredSide: string;
  gender: string;
  referralSource: string;
};

const EMPTY: Values = {
  name: '',
  phoneNumber: '',
  email: '',
  level: '',
  preferredSide: '',
  gender: '',
  referralSource: '',
};

export default function ApplicationForm() {
  const navigate = useNavigate();
  const { loginAs } = useAuth();
  const [values, setValues] = useState<Values>(EMPTY);
  const [proofName, setProofName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const set = (k: keyof Values, v: string) => setValues((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!values.name || !values.level || !values.preferredSide || !values.phoneNumber) {
      setError('Please complete all required fields.');
      return;
    }
    const application = actions.submitApplication({
      name: values.name,
      phoneNumber: values.phoneNumber,
      email: values.email || undefined,
      level: values.level,
      preferredSide: values.preferredSide,
      gender: values.gender || undefined,
      referralSource: values.referralSource || undefined,
      proofOfSkillFileUrl: proofName || undefined,
    });
    setSubmitted(true);
    // Make the demo flow seamless: keep the new applicant id for "check status".
    sessionStorage.setItem('lastApplicantUserId', application.userId ?? '');
  };

  if (submitted) {
    return (
      <div className="border border-brand-black/10 bg-white p-8 sm:p-10">
        <h2 className="heading-sub">Application received</h2>
        <p className="body-lg mt-4">
          Thank you, {values.name.split(' ')[0]}. We review every application to keep the community
          curated. You will be notified once a decision is made.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <button
            className="btn-primary"
            onClick={() => {
              const id = sessionStorage.getItem('lastApplicantUserId');
              if (id) loginAs(id);
              navigate('/status');
            }}
          >
            Check application status
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-brand-black/10 bg-white p-8 sm:p-10">
      <div className="space-y-8">
        <Field label="Full name" required>
          <input
            className="form-control"
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Your name"
          />
        </Field>

        <Field label="Phone number" required hint="We use this to add you to games and verify members.">
          <input
            className="form-control"
            type="tel"
            value={values.phoneNumber}
            onChange={(e) => set('phoneNumber', e.target.value)}
            placeholder="+971 50 000 0000"
          />
        </Field>

        <Field label="Email" hint="Optional. For updates and notifications.">
          <input
            className="form-control"
            type="email"
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Skill level" required hint="Select the level that best matches your experience.">
          <select className="form-control" value={values.level} onChange={(e) => set('level', e.target.value)}>
            <option value="">Select…</option>
            {PADEL_LEVELS.map((o) => (
              <option key={o.value} value={o.label}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Preferred side" required>
          <select
            className="form-control"
            value={values.preferredSide}
            onChange={(e) => set('preferredSide', e.target.value)}
          >
            <option value="">Select…</option>
            {PREFERRED_SIDES.map((o) => (
              <option key={o.value} value={o.label}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Gender" hint="Optional. Helps us balance games and events.">
          <select className="form-control" value={values.gender} onChange={(e) => set('gender', e.target.value)}>
            <option value="">Select…</option>
            {GENDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.label}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="How did you hear about us?">
          <select
            className="form-control"
            value={values.referralSource}
            onChange={(e) => set('referralSource', e.target.value)}
          >
            <option value="">Select…</option>
            {REFERRAL_SOURCES.map((o) => (
              <option key={o.value} value={o.label}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Proof of skill"
          hint="Optional. Upload a screenshot, ranking, or match result (JPEG, PNG, WebP, or PDF)."
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="form-control file:mr-4 file:border-0 file:bg-brand-black file:px-4 file:py-2 file:font-heading file:text-xs file:uppercase file:text-brand-white"
            onChange={(e) => setProofName(e.target.files?.[0]?.name ?? null)}
          />
        </Field>
      </div>

      {error && (
        <p className="mt-6 font-body text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="mt-10">
        <button type="submit" className="btn-primary">
          Submit application
        </button>
      </div>
    </form>
  );
}
