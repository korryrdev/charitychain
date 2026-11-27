import { TierBadge } from '../../recognitionTiers/components/TierBadge';
import type { DonorPublicProfile } from './PublicIdentityForm';

export interface PublicProfilePreviewProps {
  profile?: DonorPublicProfile | null;
  userName?: string | null;
}

export function PublicProfilePreview({ profile, userName }: PublicProfilePreviewProps) {
  const name = profile?.displayNameMode === 'REAL_NAME' ? userName : profile?.publicAlias;
  return (
    <aside className="public-profile-preview">
      <p className="section-kicker">Public preview</p>
      <strong>{profile?.publicListed ? (name || 'Your public identity') : 'Not publicly listed'}</strong>
      {profile?.showRecognitionTier && <TierBadge tier={profile?.recognitionTier} />}
      <p>
        {profile?.publicListed
          ? 'This is the information that may appear in public recognition.'
          : 'Your profile is hidden from public recognition.'}
      </p>
    </aside>
  );
}
