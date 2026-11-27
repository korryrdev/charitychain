import fs from 'node:fs/promises';
import path from 'node:path';
import { artifacts } from 'hardhat';

const CONTRACT_NAMES = [
  'CharityChainAccess',
  'EvidenceRegistry',
  'SignatoryRegistry',
  'DonationLedger',
  'CaseWorkflow',
  'PeriodAnchor',
  'ChainlinkFxAndAutomation'
];

export async function exportAbis() {
  const targetDir = path.resolve(import.meta.dirname, '../../shared/abis');
  await fs.mkdir(targetDir, { recursive: true });

  for (const contractName of CONTRACT_NAMES) {
    const artifact = await artifacts.readArtifact(contractName);
    const outPath = path.join(targetDir, `${contractName}.json`);
    await fs.writeFile(
      outPath,
      `${JSON.stringify({ contractName, abi: artifact.abi }, null, 2)}\n`,
      'utf8'
    );
  }

  return targetDir;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const dir = await exportAbis();
  console.log(`Exported ${CONTRACT_NAMES.length} contract ABIs to ${dir}`);
}
