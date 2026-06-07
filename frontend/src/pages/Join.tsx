import { Link } from 'react-router-dom';
import ApplicationForm from '@/components/ApplicationForm';

export default function Join() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <h1 className="heading-section">Join the community</h1>
      <p className="body-lg mt-4">
        Apply to join Padel Nomads. We review each application to keep the community exclusive.
      </p>

      <div className="mt-10">
        <ApplicationForm />
      </div>

      <div className="mt-10 flex flex-wrap gap-6">
        <Link to="/login" className="btn-secondary">Already a member? Log in</Link>
      </div>
    </div>
  );
}
