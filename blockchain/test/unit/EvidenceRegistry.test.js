import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { artifacts, network } from 'hardhat';
import { Web3 } from 'web3';

describe('EvidenceRegistry', () => {
  it('anchors sequential evidence commitments and rejects duplicates or invalid writers', async () => {
    const conn = await network.connect();
    const web3 = new Web3(conn.provider);
    const [administrator, unauthorized] = await web3.eth.getAccounts();
    const artifact = await artifacts.readArtifact('EvidenceRegistry');
    const contract = new web3.eth.Contract(artifact.abi);

    const deployed = await contract
      .deploy({ data: artifact.bytecode, arguments: [administrator] })
      .send({ from: administrator, gas: '3000000' });

    const subjectKey = web3.utils.keccak256('subject:receipt-1');
    const zero = `0x${'00'.repeat(32)}`;
    const c1 = web3.utils.keccak256('evidence:1');
    const c2 = web3.utils.keccak256('evidence:2');

    await deployed.methods.anchor(c1, subjectKey, zero).send({ from: administrator, gas: '300000' });
    assert.equal(await deployed.methods.isAnchored(c1).call(), true);
    assert.equal(await deployed.methods.latestCommitment(subjectKey).call(), c1);

    await deployed.methods.anchor(c2, subjectKey, c1).send({ from: administrator, gas: '300000' });
    assert.equal(await deployed.methods.latestCommitment(subjectKey).call(), c2);

    await assert.rejects(async () => {
      await deployed.methods.anchor(c1, subjectKey, c2).send({ from: administrator, gas: '300000' });
    });

    await assert.rejects(async () => {
      await deployed.methods
        .anchor(web3.utils.keccak256('evidence:3'), subjectKey, c2)
        .send({ from: unauthorized, gas: '300000' });
    });
  });
});
