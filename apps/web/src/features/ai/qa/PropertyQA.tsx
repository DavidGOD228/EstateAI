import { useAuth } from '../../auth/AuthContext';
import { PropertyQAForm } from './PropertyQAForm';
import { QALoginPrompt } from './QALoginPrompt';

export function PropertyQA({ propertyId }: { propertyId: string }) {
  const { status } = useAuth();

  if (status !== 'authenticated') {
    return <QALoginPrompt />;
  }

  return <PropertyQAForm propertyId={propertyId} />;
}
