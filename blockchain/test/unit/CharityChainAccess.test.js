import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { network, artifacts } from 'hardhat';
import { Web3 } from 'web3';

describe('CharityChainAccess', () => {
  it('assigns the administrator role at deployment', async () => {
    const conn = await network.connect();
    const web3 = new Web3(conn.provider);
    const [administrator] = await web3.eth.getAccounts();
    const artifact = await artifacts.readArtifact('CharityChainAccess');
    const contract = new web3.eth.Contract(artifact.abi);

    const deployed = await contract
      .deploy({
        data: artifact.bytecode,
        arguments: [administrator]
      })
      .send({ from: administrator, gas: '3000000' });

    const role = await deployed.methods.DEFAULT_ADMIN_ROLE().call();
    const hasRole = await deployed.methods.hasRole(role, administrator).call();
    assert.equal(hasRole, true);
  });
});
