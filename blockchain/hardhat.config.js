import { defineConfig } from 'hardhat/config';

const polygonAmoyAccounts = process.env.BLOCKCHAIN_SERVICE_PRIVATE_KEY
  ? [process.env.BLOCKCHAIN_SERVICE_PRIVATE_KEY]
  : [];

export default defineConfig({
  solidity: {
    profiles: {
      default: { version: '0.8.28' },
      production: {
        version: '0.8.28',
        settings: { optimizer: { enabled: true, runs: 200 } }
      }
    }
  },
  networks: {
    localhost: {
      type: 'http',
      url: process.env.LOCAL_RPC_URL || 'http://127.0.0.1:8545',
      chainId: 31337
    },
    polygonAmoy: {
      type: 'http',
      url: process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology',
      chainId: 80002,
      accounts: polygonAmoyAccounts
    }
  },
  test: { solidity: { timeout: 40000 } }
});
