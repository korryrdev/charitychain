import { Web3 } from 'web3';

export const DOMAIN_DONATION_V1 = '0x380b31d3f6b995e439475b0533feb329dcf8d46c63268ef1539d8bc150c39f20';
export const DOMAIN_CASE_V1 = '0x061ba715bc50d2e060da0a96ec332a625a575d561ddf8ac59a8bbb3759c675bb';
export const RELEASE_AUTH_TYPE = 'ReleaseAuthorization(bytes32 caseId,uint64 amountMinor,uint64 nonce,uint64 deadline)';
export const RELEASE_AUTH_TYPEHASH = '0x51395a7908f7e40ceeb99ab96b3b0d137d6cd6f5e431de44a8d60de550fda838';
export const EIP712_DOMAIN_TYPE = 'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)';
export const EIP712_DOMAIN_TYPEHASH = '0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f';

export type EntityKind = 'donation' | 'case' | 'disbursement' | 'report';

export function idOf(web3: Web3, kind: EntityKind, uuid: string): string {
  return web3.utils.keccak256(`malkia:v1:${kind}:${uuid.toLowerCase()}`);
}

export interface DonationRecordInput {
  donationId: string;
  sourceRefHash: string;
  donorRef: string;
  amountMinor: bigint | number;
  currency: string;
  channel: 0 | 1 | 2;
  recordedAt: bigint | number;
  evidenceHash?: string;
}

export function hashDonation(web3: Web3, d: DonationRecordInput): string {
  const evidenceHash = d.evidenceHash || '0x' + '00'.repeat(32);
  const encoded = web3.eth.abi.encodeParameters(
    ['bytes32', 'bytes32', 'bytes32', 'bytes32', 'uint64', 'bytes3', 'uint8', 'uint64', 'bytes32'],
    [
      DOMAIN_DONATION_V1,
      d.donationId,
      d.sourceRefHash,
      d.donorRef,
      d.amountMinor.toString(),
      web3.utils.utf8ToHex(d.currency),
      d.channel,
      d.recordedAt.toString(),
      evidenceHash
    ]
  );
  return web3.utils.keccak256(encoded);
}

export interface CaseRecordInput {
  caseId: string;
  subGroupId: string;
  needCategory: string;
  requestedAmountMinor: bigint | number;
  createdAt: bigint | number;
}

export function hashCase(web3: Web3, c: CaseRecordInput): string {
  const encoded = web3.eth.abi.encodeParameters(
    ['bytes32', 'bytes32', 'bytes32', 'bytes3', 'uint64', 'uint64'],
    [
      DOMAIN_CASE_V1,
      c.caseId,
      c.subGroupId,
      web3.utils.utf8ToHex(c.needCategory),
      c.requestedAmountMinor.toString(),
      c.createdAt.toString()
    ]
  );
  return web3.utils.keccak256(encoded);
}

export function canonicalJson(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJson).join(',') + ']';
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map((key) => JSON.stringify(key) + ':' + canonicalJson((obj as Record<string, unknown>)[key]));
  return '{' + pairs.join(',') + '}';
}

export function hashAuditEntry(web3: Web3, prevHash: string, entryData: object): string {
  const jsonHex = web3.utils.utf8ToHex(canonicalJson(entryData));
  const packed = web3.utils.encodePacked(
    { value: prevHash, type: 'bytes32' },
    { value: jsonHex, type: 'bytes' }
  );
  return web3.utils.keccak256(packed!);
}

export function hashMerklePair(web3: Web3, a: string, b: string): string {
  const aNorm = a.toLowerCase();
  const bNorm = b.toLowerCase();
  const sorted = aNorm <= bNorm ? aNorm + bNorm.slice(2) : bNorm + aNorm.slice(2);
  return web3.utils.keccak256(sorted);
}

export function computeDailyMerkleRoot(web3: Web3, entryHashes: string[], yyyymmdd: string): string {
  if (entryHashes.length === 0) {
    return web3.utils.keccak256(`malkia:v1:empty-day:${yyyymmdd}`);
  }
  let currentLevel = [...entryHashes];
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        nextLevel.push(hashMerklePair(web3, currentLevel[i], currentLevel[i + 1]));
      } else {
        nextLevel.push(currentLevel[i]);
      }
    }
    currentLevel = nextLevel;
  }
  return currentLevel[0];
}

export function hashReport(web3: Web3, reportData: object): string {
  return web3.utils.keccak256(canonicalJson(reportData));
}
