import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { artifacts, network } from 'hardhat';
import { Web3 } from 'web3';

describe('G01: Core Smart Contracts (PRD Section 9 & Chainlink)', () => {
  it('DonationLedger: records donation once and rejects duplicate donationId', async () => {
    const conn = await network.connect();
    const web3 = new Web3(conn.provider);
    const [admin, relayer] = await web3.eth.getAccounts();

    const artifact = await artifacts.readArtifact('DonationLedger');
    const contract = new web3.eth.Contract(artifact.abi);

    const deployed = await contract
      .deploy({
        data: artifact.bytecode,
        arguments: [admin, relayer]
      })
      .send({ from: admin, gas: '4000000' });

    const donationId = '0x' + '11'.repeat(32);
    const sourceRefHash = '0x' + '22'.repeat(32);
    const donorRef = '0x' + '33'.repeat(32);
    const evidenceHash = '0x' + '00'.repeat(32);

    const donationData = {
      sourceRefHash,
      donorRef,
      amountMinor: 50000,
      currency: web3.utils.utf8ToHex('KES'),
      channel: 0,
      recordedAt: 1762780000,
      evidenceCid: '',
      evidenceHash
    };

    await deployed.methods.recordDonation(donationId, donationData).send({
      from: relayer,
      gas: '500000'
    });

    assert.equal(await deployed.methods.isRecorded(donationId).call(), true);
    assert.equal(Number(await deployed.methods.recordedAtOf(donationId).call()), 1762780000);

    await assert.rejects(async () => {
      await deployed.methods.recordDonation(donationId, donationData).send({
        from: relayer,
        gas: '500000'
      });
    });
  });

  it('PeriodAnchor: anchors daily Merkle root and versioned quarterly reports', async () => {
    const conn = await network.connect();
    const web3 = new Web3(conn.provider);
    const [admin, relayer] = await web3.eth.getAccounts();

    const artifact = await artifacts.readArtifact('PeriodAnchor');
    const contract = new web3.eth.Contract(artifact.abi);

    const deployed = await contract
      .deploy({
        data: artifact.bytecode,
        arguments: [admin, relayer]
      })
      .send({ from: admin, gas: '4000000' });

    const day = 20261110;
    const root = '0x' + '44'.repeat(32);

    await deployed.methods.anchorDaily(day, root).send({ from: relayer, gas: '500000' });

    assert.equal(await deployed.methods.isDayAnchored(day).call(), true);
    assert.equal(await deployed.methods.dailyRoot(day).call(), root);

    const reportHash = '0x' + '55'.repeat(32);
    await deployed.methods
      .anchorReport(2026, 4, reportHash, root)
      .send({ from: relayer, gas: '500000' });

    const v1 = await deployed.methods.latestReportVersion(2026, 4).call();
    assert.equal(Number(v1), 1);
    assert.equal(await deployed.methods.reportHash(2026, 4, 1).call(), reportHash);
  });

  it('SignatoryRegistry: tracks committee signatories and count', async () => {
    const conn = await network.connect();
    const web3 = new Web3(conn.provider);
    const [admin, sig1, sig2, sig3] = await web3.eth.getAccounts();

    const artifact = await artifacts.readArtifact('SignatoryRegistry');
    const contract = new web3.eth.Contract(artifact.abi);

    const deployed = await contract
      .deploy({
        data: artifact.bytecode,
        arguments: [admin, [sig1, sig2, sig3]]
      })
      .send({ from: admin, gas: '4000000' });

    assert.equal(Number(await deployed.methods.signatoryCount().call()), 3);
    assert.equal(await deployed.methods.isSignatory(sig1).call(), true);
    assert.equal(await deployed.methods.isSignatory(admin).call(), false);
  });

  it('CaseWorkflow: enforces 2-of-3 EIP-712 release authorization and blocks duplicate signers', async () => {
    const conn = await network.connect();
    const web3 = new Web3(conn.provider);
    const [admin, relayer, sig1, sig2, sig3] = await web3.eth.getAccounts();

    const regArtifact = await artifacts.readArtifact('SignatoryRegistry');
    const registry = await new web3.eth.Contract(regArtifact.abi)
      .deploy({ data: regArtifact.bytecode, arguments: [admin, [sig1, sig2, sig3]] })
      .send({ from: admin, gas: '4000000' });

    const wfArtifact = await artifacts.readArtifact('CaseWorkflow');
    const workflow = await new web3.eth.Contract(wfArtifact.abi)
      .deploy({
        data: wfArtifact.bytecode,
        arguments: [admin, relayer, registry.options.address]
      })
      .send({ from: admin, gas: '5000000' });

    const caseId = '0x' + '66'.repeat(32);
    const subGroupId = '0x' + '77'.repeat(32);
    const caseHash = '0x' + '88'.repeat(32);
    const decisionHash = '0x' + '99'.repeat(32);

    await workflow.methods
      .submitCase(caseId, subGroupId, caseHash, web3.utils.utf8ToHex('FEE'), 350000)
      .send({ from: relayer, gas: '600000' });

    // CaseState.APPROVED = 2
    await workflow.methods
      .recordDecision(caseId, 2, 350000, decisionHash)
      .send({ from: relayer, gas: '400000' });

    const latestBlock = await web3.eth.getBlock('latest');
    const chainId = Number(await web3.eth.getChainId());
    const deadline = Number(latestBlock.timestamp) + 3600;

    const typedData = {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' }
        ],
        ReleaseAuthorization: [
          { name: 'caseId', type: 'bytes32' },
          { name: 'amountMinor', type: 'uint64' },
          { name: 'nonce', type: 'uint64' },
          { name: 'deadline', type: 'uint64' }
        ]
      },
      primaryType: 'ReleaseAuthorization',
      domain: {
        name: 'CharityChain CaseWorkflow',
        version: '1',
        chainId,
        verifyingContract: workflow.options.address
      },
      message: {
        caseId,
        amountMinor: 350000,
        nonce: 0,
        deadline
      }
    };

    const sig1Hex = await conn.provider.request({
      method: 'eth_signTypedData_v4',
      params: [sig1, JSON.stringify(typedData)]
    });
    const sig2Hex = await conn.provider.request({
      method: 'eth_signTypedData_v4',
      params: [sig2, JSON.stringify(typedData)]
    });

    // Reject duplicate signer
    await assert.rejects(async () => {
      await workflow.methods
        .authorizeRelease(caseId, 350000, 0, deadline, [sig1Hex, sig1Hex])
        .send({ from: relayer, gas: '500000' });
    });

    // Accept 2 distinct registered signatories -> AUTHORIZED (state 4)
    await workflow.methods
      .authorizeRelease(caseId, 350000, 0, deadline, [sig1Hex, sig2Hex])
      .send({ from: relayer, gas: '500000' });

    const updated = await workflow.methods.getCase(caseId).call();
    assert.equal(Number(updated.state), 4);
    assert.equal(Number(updated.nonce), 1);
  });

  it('ChainlinkFxAndAutomation: converts USD/KES via Data Feed, rejects stale feeds, and executes daily Automation upkeep', async () => {
    const conn = await network.connect();
    const web3 = new Web3(conn.provider);
    const [admin, relayer, forwarder] = await web3.eth.getAccounts();

    const paArtifact = await artifacts.readArtifact('PeriodAnchor');
    const periodAnchor = await new web3.eth.Contract(paArtifact.abi)
      .deploy({ data: paArtifact.bytecode, arguments: [admin, relayer] })
      .send({ from: admin, gas: '4000000' });

    const feedArtifact = await artifacts.readArtifact('MockChainlinkAggregator');
    const mockFeed = await new web3.eth.Contract(feedArtifact.abi)
      .deploy({ data: feedArtifact.bytecode, arguments: [8, '12950000000', 'USD / KES'] })
      .send({ from: admin, gas: '2000000' });

    const clArtifact = await artifacts.readArtifact('ChainlinkFxAndAutomation');
    const cl = await new web3.eth.Contract(clArtifact.abi)
      .deploy({
        data: clArtifact.bytecode,
        arguments: [
          admin,
          relayer,
          periodAnchor.options.address,
          mockFeed.options.address,
          '12950000000'
        ]
      })
      .send({ from: admin, gas: '4000000' });

    const relayerRole = await periodAnchor.methods.RELAYER_ROLE().call();
    await periodAnchor.methods
      .grantRole(relayerRole, cl.options.address)
      .send({ from: admin, gas: '200000' });

    // $10.00 (1000 cents) at 129.50 KES/USD => 129500 KES minor (KES 1,295.00)
    const kesMinor = await cl.methods.convertUsdCentsToKesMinor(1000).call();
    assert.equal(Number(kesMinor), 129500);

    // Stale feed check (> maxStalenessSeconds) must revert
    const latestBlock = await web3.eth.getBlock('latest');
    const staleTimestamp = Math.max(1, Number(latestBlock.timestamp) - 7200);
    await mockFeed.methods
      .updateAnswer('12950000000', staleTimestamp)
      .send({ from: admin, gas: '200000' });
    await assert.rejects(async () => {
      await cl.methods.convertUsdCentsToKesMinor(1000).call();
    });

    // Chainlink Automation daily Merkle root upkeep
    const day = 20261125;
    const root = '0x' + 'aa'.repeat(32);
    await cl.methods.stageDailyRoot(day, root).send({ from: relayer, gas: '300000' });

    const upkeep = await cl.methods.checkUpkeep('0x').call();
    assert.equal(upkeep.upkeepNeeded, true);

    await cl.methods
      .performUpkeep(upkeep.performData)
      .send({ from: forwarder, gas: '400000' });

    assert.equal(await periodAnchor.methods.isDayAnchored(day).call(), true);
    assert.equal(await periodAnchor.methods.dailyRoot(day).call(), root);

    const afterUpkeep = await cl.methods.checkUpkeep('0x').call();
    assert.equal(afterUpkeep.upkeepNeeded, false);
  });
});
