import fs from 'node:fs/promises';
import path from 'node:path';
import { artifacts, network } from 'hardhat';
import { Web3 } from 'web3';
import { exportAbis } from './exportAbis.js';

const DEFAULT_FALLBACK_KES_PER_USD_SCALED = '12950000000'; // 129.50 KES/USD (8 decimals)

async function deployContract(web3, from, contractName, args = []) {
  const artifact = await artifacts.readArtifact(contractName);
  const contract = new web3.eth.Contract(artifact.abi);
  return contract
    .deploy({ data: artifact.bytecode, arguments: args })
    .send({ from, gas: '5000000' });
}

export async function deployAll() {
  const connection = await network.connect();
  const web3 = new Web3(connection.provider);
  const accounts = await web3.eth.getAccounts();
  if (accounts.length === 0) {
    throw new Error('No deployer account available on the selected network.');
  }

  const admin = accounts[0];
  const relayer = accounts[1] ?? admin;
  const sig1 = accounts[2] ?? admin;
  const sig2 = accounts[3] ?? relayer;
  const sig3 = accounts[4] ?? admin;
  const uniqueSignatories = [...new Set([sig1, sig2, sig3])];
  while (uniqueSignatories.length < 3) {
    uniqueSignatories.push(web3.eth.accounts.create().address);
  }

  const evidenceRegistry = await deployContract(web3, admin, 'EvidenceRegistry', [admin]);
  const signatoryRegistry = await deployContract(web3, admin, 'SignatoryRegistry', [
    admin,
    uniqueSignatories
  ]);
  const donationLedger = await deployContract(web3, admin, 'DonationLedger', [admin, relayer]);
  const caseWorkflow = await deployContract(web3, admin, 'CaseWorkflow', [
    admin,
    relayer,
    signatoryRegistry.options.address
  ]);
  const periodAnchor = await deployContract(web3, admin, 'PeriodAnchor', [admin, relayer]);

  let feedAddress = process.env.CHAINLINK_USD_KES_FEED || '0x0000000000000000000000000000000000000000';
  if (
    feedAddress === '0x0000000000000000000000000000000000000000' &&
    connection.networkName !== 'polygonAmoy'
  ) {
    const mockFeed = await deployContract(web3, admin, 'MockChainlinkAggregator', [
      8,
      DEFAULT_FALLBACK_KES_PER_USD_SCALED,
      'USD / KES Mock Chainlink Feed'
    ]);
    feedAddress = mockFeed.options.address;
  }

  const chainlinkAutomation = await deployContract(web3, admin, 'ChainlinkFxAndAutomation', [
    admin,
    relayer,
    periodAnchor.options.address,
    feedAddress,
    DEFAULT_FALLBACK_KES_PER_USD_SCALED
  ]);

  const relayerRole = await periodAnchor.methods.RELAYER_ROLE().call();
  await periodAnchor.methods
    .grantRole(relayerRole, chainlinkAutomation.options.address)
    .send({ from: admin, gas: '200000' });

  const addresses = {
    network: connection.networkName || 'localhost',
    chainId: Number(await web3.eth.getChainId()),
    admin,
    relayer,
    signatories: uniqueSignatories,
    EvidenceRegistry: evidenceRegistry.options.address,
    SignatoryRegistry: signatoryRegistry.options.address,
    DonationLedger: donationLedger.options.address,
    CaseWorkflow: caseWorkflow.options.address,
    PeriodAnchor: periodAnchor.options.address,
    ChainlinkFxAndAutomation: chainlinkAutomation.options.address,
    ChainlinkUsdKesFeed: feedAddress
  };

  const folderName =
    addresses.chainId === 80002
      ? 'polygon-amoy'
      : addresses.chainId === 137
        ? 'polygon-mainnet'
        : 'localhost';
  const outPath = path.resolve(import.meta.dirname, `../deployments/${folderName}/addresses.json`);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(addresses, null, 2)}\n`, 'utf8');

  await exportAbis();
  return addresses;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const result = await deployAll();
  console.log(JSON.stringify(result, null, 2));
}
