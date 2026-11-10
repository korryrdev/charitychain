import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { network, artifacts } from 'hardhat';
import { Web3 } from 'web3';

describe('G01: Core Smart Contracts (PRD Section 9)', () => {
  it('DonationLedger: records donation once and rejects duplicate donationId', async () => {
    const conn = await network.connect();
    const web3 = new Web3(conn.provider);
    const [admin, relayer] = await web3.eth.getAccounts();

    const artifact = await artifacts.readArtifact('DonationLedger');
    const contract = new web3.eth.Contract(artifact.abi);

    const deployed = await contract
      .deploy({
        data: artifact.bytecode,
        arguments: [admin, relayer],
      })
      .send({ from: admin, gas: '4000000' });

    const donationId = '0x' + '11'.repeat(32);
    const sourceRefHash = '0x' + '22'.repeat(32);
    const donorRef = '0x' + '33'.repeat(32);
    const evidenceHash = '0x' + '00'.repeat(32);

    const donationData = {
      sourceRefHash,
      donorRef,
      amountMinor: 50000, // KES 500.00
      currency: web3.utils.utf8ToHex('KES'),
      channel: 0, // MPESA
      recordedAt: 1762780000,
      evidenceCid: '',
      evidenceHash,
    };

    // Record donation using relayer account
    await deployed.methods.recordDonation(donationId, donationData).send({
      from: relayer,
      gas: '500000',
    });

    const isRecorded = await deployed.methods.isRecorded(donationId).call();
    assert.equal(isRecorded, true);

    const recordedAt = await deployed.methods.recordedAtOf(donationId).call();
    assert.equal(Number(recordedAt), 1762780000);

    // Duplicate write must revert
    await assert.rejects(async () => {
      await deployed.methods.recordDonation(donationId, donationData).send({
        from: relayer,
        gas: '500000',
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
        arguments: [admin, relayer],
      })
      .send({ from: admin, gas: '4000000' });

    const day = 20261110;
    const root = '0x' + '44'.repeat(32);

    await deployed.methods.anchorDaily(day, root).send({ from: relayer, gas: '500000' });

    assert.equal(await deployed.methods.isDayAnchored(day).call(), true);
    assert.equal(await deployed.methods.dailyRoot(day).call(), root);

    // Quarter report anchoring
    const reportHash = '0x' + '55'.repeat(32);
    await deployed.methods.anchorReport(2026, 4, reportHash, root).send({ from: relayer, gas: '500000' });

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
        arguments: [admin, [sig1, sig2, sig3]],
      })
      .send({ from: admin, gas: '4000000' });

    const count = await deployed.methods.signatoryCount().call();
    assert.equal(Number(count), 3);

    assert.equal(await deployed.methods.isSignatory(sig1).call(), true);
    assert.equal(await deployed.methods.isSignatory(admin).call(), false);
  });

  it('CaseWorkflow: submits case and checks initial SUBMITTED state', async () => {
    const conn = await network.connect();
    const web3 = new Web3(conn.provider);
    const [admin, relayer, sig1, sig2, sig3] = await web3.eth.getAccounts();

    const regArtifact = await artifacts.readArtifact('SignatoryRegistry');
    const registryContract = new web3.eth.Contract(regArtifact.abi);
    const registry = await registryContract
      .deploy({
        data: regArtifact.bytecode,
        arguments: [admin, [sig1, sig2, sig3]],
      })
      .send({ from: admin, gas: '4000000' });

    const wfArtifact = await artifacts.readArtifact('CaseWorkflow');
    const wfContract = new web3.eth.Contract(wfArtifact.abi);
    const workflow = await wfContract
      .deploy({
        data: wfArtifact.bytecode,
        arguments: [admin, relayer, registry.options.address],
      })
      .send({ from: admin, gas: '5000000' });

    const caseId = '0x' + '66'.repeat(32);
    const subGroupId = '0x' + '77'.repeat(32);
    const caseHash = '0x' + '88'.repeat(32);

    await workflow.methods
      .submitCase(
        caseId,
        subGroupId,
        caseHash,
        web3.utils.utf8ToHex('FEE'),
        350000 // KES 3,500.00
      )
      .send({ from: relayer, gas: '600000' });

    const caseData = await workflow.methods.getCase(caseId).call();
    assert.equal(caseData.caseId, caseId);
    assert.equal(Number(caseData.state), 0); // SUBMITTED
    assert.equal(Number(caseData.requestedAmountMinor), 350000);
  });
});
