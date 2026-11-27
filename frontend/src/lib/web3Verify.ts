import Web3 from 'web3';
import donationLedgerArtifact from '@charitychain/shared/abis/DonationLedger.json';
import periodAnchorArtifact from '@charitychain/shared/abis/PeriodAnchor.json';
import evidenceRegistryArtifact from '@charitychain/shared/abis/EvidenceRegistry.json';
import signatoryRegistryArtifact from '@charitychain/shared/abis/SignatoryRegistry.json';

export type OnChainVerifyStatus =
  | 'VERIFIED'
  | 'MISMATCH'
  | 'NOT_ANCHORED'
  | 'NOT_CONFIGURED'
  | 'RPC_ERROR';

export interface OnChainVerifyResult {
  status: OnChainVerifyStatus;
  message: string;
  contractAddress?: string;
  rpcUrl?: string;
  onChainHash?: string;
  recordedAt?: string;
  latestVersion?: number;
}

const ZERO_BYTES32 = `0x${'00'.repeat(32)}`;
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

function extractAbi(artifact: { abi?: unknown[] } | unknown[]): any[] {
  return Array.isArray(artifact) ? artifact : (artifact.abi as any[]) || [];
}

function getRpcUrl(overrideRpcUrl?: string): string {
  return (overrideRpcUrl ?? import.meta.env?.VITE_RPC_URL ?? '').trim();
}

function isValidContract(address?: string): address is string {
  return Boolean(address && ADDRESS_REGEX.test(address.trim()) && !/^0x0+$/.test(address.trim()));
}

export function createReadOnlyWeb3(rpcUrl: string): Web3 {
  return new Web3(rpcUrl);
}

export function computeDonationId(lotId: string): string {
  return Web3.utils.keccak256(`malkia:v1:donation:${lotId.trim().toLowerCase()}`);
}

export interface Web3VerifyOptions {
  rpcUrl?: string;
  contractAddress?: string;
  web3Factory?: (rpcUrl: string) => Web3;
}

export async function verifyDonationOnChain(
  { lotId, recordHash }: { lotId?: string; recordHash: string },
  options: Web3VerifyOptions = {}
): Promise<OnChainVerifyResult> {
  const rpcUrl = getRpcUrl(options.rpcUrl);
  const contractAddress = (
    options.contractAddress ??
    import.meta.env?.VITE_DONATION_LEDGER_ADDRESS ??
    ''
  ).trim();

  if (!rpcUrl || !isValidContract(contractAddress)) {
    return {
      status: 'NOT_CONFIGURED',
      message: 'On-chain RPC URL or DonationLedger contract address is not configured in this environment.',
    };
  }
  if (!lotId) {
    return {
      status: 'RPC_ERROR',
      message: 'Donation lot identifier is missing for on-chain lookup.',
      contractAddress,
      rpcUrl,
    };
  }

  try {
    const web3 = (options.web3Factory ?? createReadOnlyWeb3)(rpcUrl);
    const contract = new web3.eth.Contract(extractAbi(donationLedgerArtifact), contractAddress);
    const donationId = computeDonationId(lotId);
    const recorded = Boolean(await contract.methods.isRecorded(donationId).call());

    if (!recorded) {
      return {
        status: 'NOT_ANCHORED',
        message: 'This donation lot has not been anchored on DonationLedger yet.',
        contractAddress,
        rpcUrl,
      };
    }

    const [onChainHashRaw, recordedAtRaw] = await Promise.all([
      contract.methods.recordHashOf(donationId).call(),
      contract.methods.recordedAtOf(donationId).call(),
    ]);
    const onChainHash = String(onChainHashRaw || '');
    const recordedAtSec = Number(recordedAtRaw || 0);
    const recordedAt = recordedAtSec > 0 ? new Date(recordedAtSec * 1000).toISOString() : undefined;

    if (onChainHash.toLowerCase() === recordHash.trim().toLowerCase()) {
      return {
        status: 'VERIFIED',
        message: 'Verified on DonationLedger: on-chain recordHash matches the database proof.',
        contractAddress,
        rpcUrl,
        onChainHash,
        recordedAt,
      };
    }

    return {
      status: 'MISMATCH',
      message: 'On-chain DonationLedger recordHash does not match the database recordHash.',
      contractAddress,
      rpcUrl,
      onChainHash,
      recordedAt,
    };
  } catch (error) {
    return {
      status: 'RPC_ERROR',
      message: error instanceof Error ? error.message : 'Unable to query DonationLedger RPC.',
      contractAddress,
      rpcUrl,
    };
  }
}

export async function verifyReportOnChain(
  {
    year,
    quarter,
    version,
    reportHash,
  }: { year: number; quarter: number; version: number; reportHash: string },
  options: Web3VerifyOptions = {}
): Promise<OnChainVerifyResult> {
  const rpcUrl = getRpcUrl(options.rpcUrl);
  const contractAddress = (
    options.contractAddress ??
    import.meta.env?.VITE_PERIOD_ANCHOR_ADDRESS ??
    ''
  ).trim();

  if (!rpcUrl || !isValidContract(contractAddress)) {
    return {
      status: 'NOT_CONFIGURED',
      message: 'On-chain RPC URL or PeriodAnchor contract address is not configured in this environment.',
    };
  }

  try {
    const web3 = (options.web3Factory ?? createReadOnlyWeb3)(rpcUrl);
    const contract = new web3.eth.Contract(extractAbi(periodAnchorArtifact), contractAddress);
    const [onChainHashRaw, latestVerRaw] = await Promise.all([
      contract.methods.reportHash(year, quarter, version).call(),
      contract.methods.latestReportVersion(year, quarter).call(),
    ]);
    const onChainHash = String(onChainHashRaw || ZERO_BYTES32);
    const latestVersion = Number(latestVerRaw || 0);

    if (onChainHash.toLowerCase() === ZERO_BYTES32) {
      return {
        status: 'NOT_ANCHORED',
        message: `Q${quarter} ${year} v${version} is not anchored on PeriodAnchor yet.`,
        contractAddress,
        rpcUrl,
        onChainHash,
        latestVersion,
      };
    }

    if (onChainHash.toLowerCase() === reportHash.trim().toLowerCase()) {
      return {
        status: 'VERIFIED',
        message: `Verified on PeriodAnchor: Q${quarter} ${year} v${version} reportHash matches on-chain storage.`,
        contractAddress,
        rpcUrl,
        onChainHash,
        latestVersion,
      };
    }

    return {
      status: 'MISMATCH',
      message: 'On-chain PeriodAnchor reportHash does not match this report.',
      contractAddress,
      rpcUrl,
      onChainHash,
      latestVersion,
    };
  } catch (error) {
    return {
      status: 'RPC_ERROR',
      message: error instanceof Error ? error.message : 'Unable to query PeriodAnchor RPC.',
      contractAddress,
      rpcUrl,
    };
  }
}

export async function verifyEvidenceCommitmentOnChain(
  { commitment }: { commitment: string },
  options: Web3VerifyOptions = {}
): Promise<OnChainVerifyResult> {
  const rpcUrl = getRpcUrl(options.rpcUrl);
  const contractAddress = (
    options.contractAddress ??
    import.meta.env?.VITE_EVIDENCE_REGISTRY_ADDRESS ??
    ''
  ).trim();

  if (!rpcUrl || !isValidContract(contractAddress)) {
    return {
      status: 'NOT_CONFIGURED',
      message: 'On-chain RPC URL or EvidenceRegistry contract address is not configured in this environment.',
    };
  }
  if (!/^0x[a-fA-F0-9]{64}$/.test(commitment.trim())) {
    return {
      status: 'RPC_ERROR',
      message: 'Enter a valid 32-byte commitment hash (0x followed by 64 hex characters).',
      contractAddress,
      rpcUrl,
    };
  }

  try {
    const web3 = (options.web3Factory ?? createReadOnlyWeb3)(rpcUrl);
    const contract = new web3.eth.Contract(extractAbi(evidenceRegistryArtifact), contractAddress);
    const anchored = Boolean(await contract.methods.isAnchored(commitment.trim()).call());
    if (!anchored) {
      return {
        status: 'NOT_ANCHORED',
        message: 'Commitment hash is not anchored on EvidenceRegistry.',
        contractAddress,
        rpcUrl,
      };
    }
    return {
      status: 'VERIFIED',
      message: 'Verified on EvidenceRegistry: commitment exists in immutable contract storage.',
      contractAddress,
      rpcUrl,
      onChainHash: commitment.trim(),
    };
  } catch (error) {
    return {
      status: 'RPC_ERROR',
      message: error instanceof Error ? error.message : 'Unable to query EvidenceRegistry RPC.',
      contractAddress,
      rpcUrl,
    };
  }
}

export async function fetchRegisteredSignatories(
  options: Web3VerifyOptions = {}
): Promise<{ configured: boolean; signatories: string[]; error?: string }> {
  const rpcUrl = getRpcUrl(options.rpcUrl);
  const contractAddress = (
    options.contractAddress ??
    import.meta.env?.VITE_SIGNATORY_REGISTRY_ADDRESS ??
    ''
  ).trim();

  if (!rpcUrl || !isValidContract(contractAddress)) {
    return { configured: false, signatories: [] };
  }

  try {
    const web3 = (options.web3Factory ?? createReadOnlyWeb3)(rpcUrl);
    const contract = new web3.eth.Contract(extractAbi(signatoryRegistryArtifact), contractAddress);
    const signatories = ((await contract.methods.getSignatories().call()) as string[]) || [];
    return { configured: true, signatories };
  } catch (error) {
    return {
      configured: true,
      signatories: [],
      error: error instanceof Error ? error.message : 'Unable to query SignatoryRegistry.',
    };
  }
}
