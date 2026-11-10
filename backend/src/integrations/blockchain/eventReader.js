'use strict';

export function createEventReader(contract) {
  return { async evidenceAnchored(transactionHash) { return contract.getPastEvents('EvidenceAnchored', { fromBlock: 0, toBlock: 'latest', filter: { transactionHash } }); } };
}
