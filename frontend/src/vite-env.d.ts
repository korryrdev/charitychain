/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_RPC_URL?: string;
  readonly VITE_CHAIN_ID?: string;
  readonly VITE_DONATION_LEDGER_ADDRESS?: string;
  readonly VITE_PERIOD_ANCHOR_ADDRESS?: string;
  readonly VITE_CASE_WORKFLOW_ADDRESS?: string;
  readonly VITE_EVIDENCE_REGISTRY_ADDRESS?: string;
  readonly VITE_SIGNATORY_REGISTRY_ADDRESS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
