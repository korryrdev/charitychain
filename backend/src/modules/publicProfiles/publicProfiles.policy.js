export function publicVisibilityFilter() {
  return {
    publicListed: true,
    aliasReviewStatus: { in: ['APPROVED', 'PENDING_REVIEW', 'REJECTED'] }
  };
}
