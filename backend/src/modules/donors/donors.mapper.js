export function toDonorProfile(profile) {
  return Object.freeze({
    id: profile.id,
    userId: profile.userId,
    publicAlias: profile.publicAlias,
    pendingAlias: profile.pendingAlias,
    aliasReviewStatus: profile.aliasReviewStatus,
    displayNameMode: profile.displayNameMode,
    publicListed: profile.publicListed,
    showContributionTotal: profile.showContributionTotal,
    showRecognitionTier: profile.showRecognitionTier,
    moneyContribution: profile.moneyContribution.toString(),
    goodsContribution: profile.goodsContribution.toString(),
    totalContribution: profile.totalContribution.toString(),
    recognitionTier: profile.recognitionTier,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt
  });
}
