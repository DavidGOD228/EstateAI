import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { ProfileCard } from '../features/profile/ProfileCard';
import { Button } from '../shared/components/Button';
import { Spinner } from '../shared/components/Spinner';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);

  if (!user) {
    return (
      <div className="flex justify-center py-24" aria-busy="true">
        <Spinner size="lg" label="Loading your profile" />
      </div>
    );
  }

  async function handleLogout() {
    setPending(true);
    try {
      await logout();
    } finally {
      navigate('/');
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-8 sm:py-12">
      <ProfileCard user={user} />
      <Button
        type="button"
        variant="danger"
        loading={pending}
        disabled={pending}
        aria-busy={pending}
        onClick={handleLogout}
        className="w-full"
      >
        Log out
      </Button>
    </div>
  );
}
