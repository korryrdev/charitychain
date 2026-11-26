import { useState, type FormEvent } from 'react';
import { Button } from '../../../components/common/Button';
import { FormField } from '../../../components/forms/FormField';
import { validatePublicIdentity } from '../validation/publicIdentity.schema';

export interface DonorPublicProfile {
  publicAlias?: string | null;
  displayNameMode?: string | null;
  publicListed?: boolean;
  showContributionTotal?: boolean;
  showRecognitionTier?: boolean;
  recognitionTier?: string | null;
}

export type DonorPublicProfilePatch = {
  displayNameMode?: string;
  publicListed?: boolean;
  showContributionTotal?: boolean;
  showRecognitionTier?: boolean;
};

export interface PublicIdentityFormProps {
  profile?: DonorPublicProfile | null;
  onAlias: (alias: string) => void | Promise<void>;
  onSettings: (settings: DonorPublicProfilePatch) => void | Promise<void>;
  pending?: boolean;
}

export function PublicIdentityForm({ profile, onAlias, onSettings, pending = false }: PublicIdentityFormProps) {
  const [alias, setAlias] = useState(profile?.publicAlias ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submitAlias = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = validatePublicIdentity({ publicAlias: alias });
    setErrors(next);
    if (!Object.keys(next).length) await onAlias(alias.trim());
  };

  const change = <K extends keyof DonorPublicProfilePatch>(key: K, value: DonorPublicProfilePatch[K]) =>
    onSettings({ [key]: value });

  return (
    <div className="public-identity-form">
      <form onSubmit={submitAlias} noValidate>
        <FormField
          id="public-alias"
          label="Public alias"
          hint="Used by default on public recognition."
          error={errors.publicAlias}
        >
          <input id="public-alias" value={alias} onChange={(event) => setAlias(event.target.value)} />
        </FormField>
        <Button type="submit" loading={pending}>
          Change alias / anonymous name
        </Button>
      </form>
      <fieldset>
        <legend>Public visibility</legend>
        <label>
          <input
            type="radio"
            checked={profile?.displayNameMode !== 'REAL_NAME'}
            onChange={() => change('displayNameMode', 'ALIAS')}
          />{' '}
          Show my alias
        </label>
        <label>
          <input
            type="radio"
            checked={profile?.displayNameMode === 'REAL_NAME'}
            onChange={() => change('displayNameMode', 'REAL_NAME')}
          />{' '}
          Show my real name
        </label>
        <label>
          <input
            type="checkbox"
            checked={Boolean(profile?.publicListed)}
            onChange={(event) => change('publicListed', event.target.checked)}
          />{' '}
          Include me in public recognition
        </label>
        <label>
          <input
            type="checkbox"
            checked={Boolean(profile?.showContributionTotal)}
            onChange={(event) => change('showContributionTotal', event.target.checked)}
          />{' '}
          Show my contribution total
        </label>
        <label>
          <input
            type="checkbox"
            checked={Boolean(profile?.showRecognitionTier)}
            onChange={(event) => change('showRecognitionTier', event.target.checked)}
          />{' '}
          Show my recognition tier
        </label>
      </fieldset>
    </div>
  );
}
