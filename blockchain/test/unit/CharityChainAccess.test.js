import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { network } from 'hardhat';

describe('CharityChainAccess', () => {
  it('assigns the administrator role at deployment', async () => {
    const { viem } = await network.connect();
    const [administrator] = await viem.getWalletClients();
    const contract = await viem.deployContract('CharityChainAccess', [administrator.account.address]);
    const role = await contract.read.DEFAULT_ADMIN_ROLE();
    const hasRole = await contract.read.hasRole([role, administrator.account.address]);
    assert.equal(hasRole, true);
  });
});
