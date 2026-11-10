export function toPublicProfile(profile) {
  const response = {
    id: profile.id,
    displayName: profile.displayNameMode === 'REAL_NAME' ? profile.user.name : profile.publicAlias
  };
  if (profile.showRecognitionTier) response.recognitionTier = profile.recognitionTier;
  if (profile.showContributionTotal)
    response.totalContribution = profile.totalContribution.toString();
  return Object.freeze(response);
}
