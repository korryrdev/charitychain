import type {
  BankDeposit,
  BankReconciliationReport,
  BenfordAnalysisResponse,
  CaseRecord,
  DisplayMode,
  DonationTrace,
  DonorClaimProfile,
  ForensicAlert,
  ForensicRuleConfig,
  NeedCategory,
  QuarterlyReport,
  RecognitionEntry,
  TransparencyStats,
  UploadedCaseEvidence,
} from '@/types';

const API_BASE = (import.meta.env?.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, '');
const CLAIM_SESSION_KEY = 'charitychain_claim_session';

function resolveApiUrl(url: string): string {
  if (url.startsWith('/api/v1')) {
    return `${API_BASE}${url.slice('/api/v1'.length)}`;
  }
  return url;
}

export function getCertificateSvgUrl(receiptCode: string): string {
  return `${API_BASE}/public/certificate/${encodeURIComponent(receiptCode)}?format=svg`;
}

function readStoredClaimSession(): { receiptCode: string; token: string } | null {
  try {
    const raw = localStorage.getItem(CLAIM_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.receiptCode && parsed?.token) return parsed;
    }
    const legacy = localStorage.getItem('charitychain_claim_token');
    if (legacy) {
      localStorage.removeItem('charitychain_claim_token');
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

function writeStoredClaimSession(receiptCode: string, token: string): void {
  try {
    localStorage.setItem(CLAIM_SESSION_KEY, JSON.stringify({ receiptCode, token }));
  } catch {
    // ignore storage errors
  }
}

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const claimSession = url.startsWith('/api/v1/public/donor/') ? readStoredClaimSession() : null;
  const csrfMatch = typeof document !== 'undefined' ? document.cookie.match(/(?:^|; )charitychain_csrf=([^;]*)/) : null;
  const csrfToken = csrfMatch ? decodeURIComponent(csrfMatch[1]) : undefined;
  const requestId = globalThis.crypto?.randomUUID?.() || `req-${Date.now()}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
    ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    ...(claimSession?.token ? { Authorization: `Bearer ${claimSession.token}` } : {}),
    ...((options?.headers as Record<string, string>) || {}),
  };

  const res = await fetch(resolveApiUrl(url), {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    let errorMsg = res.statusText;
    try {
      const errJson = await res.json();
      errorMsg = errJson.message || errJson.error?.message || errorMsg;
    } catch {
      // ignore json error
    }
    throw new Error(errorMsg);
  }

  return (await res.json()) as T;
}

export const api = {
  // Public Trace
  getDonationTrace: async (receiptCode: string): Promise<DonationTrace | null> => {
    try {
      const data = await fetchApi<any>(`/api/v1/public/trace/${encodeURIComponent(receiptCode.trim().toUpperCase())}`);
      if (!data) return null;

      return {
        id: data.receiptCode,
        lotId: data.lotId || undefined,
        receiptCode: data.receiptCode,
        sourceRef: data.recordHash || data.receiptCode,
        channel: data.channel || 'MPESA',
        amountMinor: Number(data.amountMinor || 0),
        currency: data.currency || 'KES',
        recordedAt: data.recordedAt || new Date().toISOString(),
        status: data.status || 'POOLED',
        earmark: data.earmark || undefined,
        txHash: data.txHash || undefined,
        blockNumber: data.blockNumber ? Number(data.blockNumber) : undefined,
        recordHash: data.recordHash || '0x' + '00'.repeat(32),
        donorDisplayMode: data.donorDisplayMode || 'ANONYMOUS',
        donorAlias: data.donorAlias || undefined,
        donorBadge: data.donorBadge || undefined,
        allocations: (data.allocations || []).map((a: any) => ({
          id: a.id,
          caseId: a.id,
          caseNumber: a.caseNumber,
          caseCategory: a.caseCategory,
          amountMinor: Number(a.amountMinor || 0),
          allocatedAt: a.allocatedAt,
        })),
      };
    } catch {
      return null;
    }
  },

  // Public Stats
  getTransparencyStats: async (): Promise<TransparencyStats> => {
    try {
      const data = await fetchApi<any>('/api/v1/public/stats');
      return {
        totalInflowMinor: Number(data.totalInflowMinor || 0),
        totalOutflowMinor: Number(data.totalOutflowMinor || 0),
        activePoolBalanceMinor: Number(data.activePoolBalanceMinor || 0),
        totalBeneficiariesHelped: data.totalBeneficiariesHelped || 0,
        totalDonationsCount: data.totalDonationsCount || 0,
        totalCasesDisbursed: data.totalCasesDisbursed || 0,
        openAlertsCount: data.openAlertsCount || 0,
        categoryBreakdown: (data.categoryBreakdown || []).map((c: any) => ({
          category: c.category,
          amountMinor: Number(c.amountMinor || 0),
          count: c.count || 0,
        })),
        channelBreakdown: (data.channelBreakdown || []).map((ch: any) => ({
          channel: ch.channel,
          amountMinor: Number(ch.amountMinor || 0),
          count: ch.count || 0,
        })),
      };
    } catch {
      return {
        totalInflowMinor: 0,
        totalOutflowMinor: 0,
        activePoolBalanceMinor: 0,
        totalBeneficiariesHelped: 0,
        totalDonationsCount: 0,
        totalCasesDisbursed: 0,
        openAlertsCount: 0,
        categoryBreakdown: [],
        channelBreakdown: [],
      };
    }
  },

  // Subgroups
  getSubgroups: async (): Promise<{ id: string; code: string; name: string }[]> => {
    try {
      const data = await fetchApi<{ items: any[] }>('/api/v1/cases/subgroups');
      return (data.items || []).map((s: any) => ({
        id: s.id,
        code: s.code,
        name: s.name,
      }));
    } catch {
      return [];
    }
  },

  // Cases Queue
  getCases: async (params?: { subGroupId?: string; state?: string }): Promise<CaseRecord[]> => {
    const qs = new URLSearchParams();
    if (params?.subGroupId) qs.append('subGroupId', params.subGroupId);
    if (params?.state) qs.append('state', params.state);
    const query = qs.toString() ? `?${qs.toString()}` : '';

    const data = await fetchApi<{ items: any[] }>(`/api/v1/cases${query}`);
    return (data.items || []).map((c: any) => {
      const sigEvents = (c.events || []).filter(
        (e: any) =>
          (e.toState === 'APPROVED' && e.payload?.signer) ||
          (e.toState === 'AUTHORIZED' && Array.isArray(e.payload?.signatures))
      );
      const collected: { signer: string; signedAt: string }[] = [];
      for (const e of sigEvents) {
        if (e.toState === 'APPROVED' && e.payload?.signer) {
          collected.push({ signer: e.payload.signer, signedAt: e.createdAt });
        } else if (e.toState === 'AUTHORIZED' && Array.isArray(e.payload?.signatures)) {
          const signers = Array.isArray(e.payload.signers) ? e.payload.signers : [];
          e.payload.signatures.forEach((sig: any, idx: number) => {
            const addr =
              typeof sig === 'string'
                ? signers[idx] || `Signatory #${idx + 1} (${sig.slice(0, 10)}...)`
                : sig.signer;
            if (addr && !collected.some((item) => item.signer.toLowerCase() === addr.toLowerCase())) {
              collected.push({ signer: addr, signedAt: e.createdAt });
            }
          });
        }
      }

      return {
        id: c.id,
        caseNumber: c.caseNumber,
        subGroupId: c.subGroupId,
        subGroupName: c.subGroup?.name || 'General Subgroup',
        needCategory: c.needCategory,
        requestedAmountMinor: Number(c.requestedAmountMinor || 0),
        approvedAmountMinor: c.approvedAmountMinor ? Number(c.approvedAmountMinor) : undefined,
        disbursedAmountMinor: c.disbursedAmountMinor ? Number(c.disbursedAmountMinor) : undefined,
        state: c.state || c.status,
        justification: c.justification || c.studentPii?.justification || 'Emergency student aid request',
        signatorySignatures: collected,
        submitterId: c.createdByUserId || 'rep-1',
        evidenceCid: c.events?.find((e: any) => e.payload?.evidenceCid)?.payload?.evidenceCid,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });
  },

  // Create Case
  createCase: async (payload: {
    subGroupId?: string;
    subGroupName?: string;
    studentName?: string;
    studentRegNo?: string;
    studentPhone?: string;
    needCategory: NeedCategory;
    requestedAmountMinor: number;
    justification: string;
    hasConsent?: boolean;
  }): Promise<CaseRecord> => {
    let subGroupId = payload.subGroupId;
    if (!subGroupId) {
      try {
        const subgroups = await api.getSubgroups();
        if (subgroups[0]?.id) subGroupId = subgroups[0].id;
      } catch {
        // ignore
      }
    }

    const data = await fetchApi<{ case: any }>('/api/v1/cases', {
      method: 'POST',
      body: JSON.stringify({
        subGroupId: subGroupId || '00000000-0000-0000-0000-000000000001',
        studentName: payload.studentName || 'Student Applicant',
        studentRegNo: (payload.studentRegNo || '').trim().toUpperCase(),
        studentPhone: payload.studentPhone || '254700000000',
        needCategory: payload.needCategory,
        requestedAmount: (payload.requestedAmountMinor / 100).toFixed(2),
        justification: payload.justification,
        hasConsent: payload.hasConsent ?? true,
      }),
    });

    const c = data.case;
    await fetchApi(`/api/v1/cases/${c.id}/submit`, { method: 'POST' }).catch(() => {});

    return {
      id: c.id,
      caseNumber: c.caseNumber,
      subGroupId: c.subGroupId,
      subGroupName: payload.subGroupName || 'General Subgroup',
      needCategory: c.needCategory,
      requestedAmountMinor: Number(c.requestedAmountMinor || 0),
      state: 'SUBMITTED',
      justification: payload.justification,
      signatorySignatures: [],
      submitterId: c.createdByUserId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  },

  // Committee Decisions
  decideCase: async (
    caseId: string,
    payload: {
      decision: 'APPROVED' | 'REJECTED' | 'NEEDS_INFO' | 'UNDER_REVIEW';
      approvedAmountMinor?: number;
      notes?: string;
    }
  ): Promise<CaseRecord> => {
    const data = await fetchApi<{ case: any }>(`/api/v1/cases/${caseId}/decision`, {
      method: 'POST',
      body: JSON.stringify({
        decision: payload.decision,
        ...(payload.decision === 'APPROVED' && payload.approvedAmountMinor
          ? { approvedAmount: (payload.approvedAmountMinor / 100).toFixed(2) }
          : {}),
        ...(payload.notes?.trim() ? { notes: payload.notes.trim() } : {}),
      }),
    });
    const c = data.case;
    return {
      id: c.id,
      caseNumber: c.caseNumber,
      subGroupId: c.subGroupId,
      subGroupName: 'General Subgroup',
      needCategory: c.needCategory,
      requestedAmountMinor: Number(c.requestedAmountMinor || 0),
      approvedAmountMinor: c.approvedAmountMinor ? Number(c.approvedAmountMinor) : undefined,
      state: c.state || c.status,
      justification: payload.notes?.trim() || c.justification || payload.decision,
      signatorySignatures: [],
      submitterId: c.createdByUserId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  },

  approveCase: async (caseId: string, approvedAmountMinor: number, approverId: string): Promise<CaseRecord> => {
    return api.decideCase(caseId, {
      decision: 'APPROVED',
      approvedAmountMinor,
      notes: `Approved by committee member ${approverId}`,
    });
  },

  rejectCase: async (caseId: string, reason: string): Promise<CaseRecord> => {
    return api.decideCase(caseId, {
      decision: 'REJECTED',
      notes: reason,
    });
  },

  // Signatory Sign Action (EIP-712 2-of-3 Release — real Web3.js signature only)
  signReleaseAuthorization: async (
    caseId: string,
    payload: {
      signer: string;
      signature: string;
      amountMinor: number;
      nonce?: number;
      deadline?: number;
      chainId?: number;
      verifyingContract?: string;
      signMethod?: 'METAMASK_EIP712';
    }
  ): Promise<CaseRecord> => {
    const body = {
      signer: payload.signer,
      signature: payload.signature,
      amountMinor: payload.amountMinor,
      nonce: payload.nonce ?? 0,
      deadline: payload.deadline ?? Math.floor(Date.now() / 1000) + 7 * 86400,
      ...(payload.chainId ? { chainId: payload.chainId } : {}),
      ...(payload.verifyingContract ? { verifyingContract: payload.verifyingContract } : {}),
      signMethod: payload.signMethod ?? 'METAMASK_EIP712',
    };

    const data = await fetchApi<{ case: any }>(`/api/v1/cases/${caseId}/authorize`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const c = data.case;
    return {
      id: c.id,
      caseNumber: c.caseNumber,
      subGroupId: c.subGroupId,
      subGroupName: 'General Subgroup',
      needCategory: c.needCategory,
      requestedAmountMinor: Number(c.requestedAmountMinor || 0),
      approvedAmountMinor: c.approvedAmountMinor ? Number(c.approvedAmountMinor) : undefined,
      state: c.state || c.status,
      justification: c.justification || 'Authorized',
      signatorySignatures: [{ signer: body.signer, signedAt: new Date().toISOString() }],
      submitterId: c.createdByUserId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  },

  // Upload & Encrypt Receipt Evidence to IPFS
  uploadCaseEvidence: async (
    caseId: string,
    payload: {
      filename: string;
      mimeType: string;
      base64Content: string;
      notes?: string;
    }
  ): Promise<UploadedCaseEvidence> => {
    return fetchApi<UploadedCaseEvidence>(`/api/v1/cases/${caseId}/evidence`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Record Disbursement
  recordDisbursement: async (
    caseId: string,
    payload: {
      amountMinor: number;
      method: 'MPESA' | 'BANK' | 'CASH' | 'DIRECT_INSTITUTION' | 'ITEMS';
      methodReference: string;
      evidenceCid: string;
      evidenceHash?: string;
      notes?: string;
    }
  ): Promise<CaseRecord> => {
    const data = await fetchApi<{ case: any }>(`/api/v1/cases/${caseId}/disburse`, {
      method: 'POST',
      body: JSON.stringify({
        amount: (payload.amountMinor / 100).toFixed(2),
        method: payload.method,
        methodReference: payload.methodReference,
        evidenceCid: payload.evidenceCid,
        ...(payload.evidenceHash ? { evidenceHash: payload.evidenceHash } : {}),
        ...(payload.notes ? { notes: payload.notes } : {}),
      }),
    });
    const c = data.case;
    return {
      id: c.id,
      caseNumber: c.caseNumber,
      subGroupId: c.subGroupId,
      subGroupName: 'General Subgroup',
      needCategory: c.needCategory,
      requestedAmountMinor: Number(c.requestedAmountMinor || 0),
      approvedAmountMinor: c.approvedAmountMinor ? Number(c.approvedAmountMinor) : undefined,
      disbursedAmountMinor: Number(c.disbursedAmountMinor || payload.amountMinor),
      state: c.state || c.status,
      justification: 'Disbursed',
      signatorySignatures: [],
      submitterId: c.createdByUserId,
      evidenceCid: payload.evidenceCid,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  },

  // Forensic Alerts
  getForensicAlerts: async (): Promise<ForensicAlert[]> => {
    const data = await fetchApi<{ items: any[] }>('/api/v1/alerts');
    return (data.items || []).map((a: any) => ({
      id: a.id,
      ruleId: a.ruleId,
      ruleTitle: `Rule ${a.ruleId}`,
      severity: a.severity,
      riskScore: a.riskScore || 50,
      why: a.description || 'Forensic rule alert',
      subjectKind: a.entityType ? (a.entityType.toLowerCase() as any) : 'system',
      subjectId: a.entityId || a.id,
      status: a.status,
      createdAt: a.createdAt,
      resolvedAt: a.events?.[0]?.createdAt,
      resolutionNote: a.events?.[0]?.notes,
    }));
  },

  // Resolve Alert
  resolveAlert: async (alertId: string, note: string): Promise<void> => {
    await fetchApi(`/api/v1/alerts/${alertId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({
        notes: note,
        status: 'RESOLVED',
      }),
    });
  },

  runForensicScan: async (): Promise<{
    rulesRun: number;
    alertsGeneratedCount: number;
    alerts: any[];
  }> => {
    return fetchApi('/api/v1/alerts/scan', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  getAlertRules: async (): Promise<ForensicRuleConfig[]> => {
    const data = await fetchApi<{ items: ForensicRuleConfig[] }>('/api/v1/alerts/rules');
    return data.items || [];
  },

  updateAlertRule: async (
    ruleId: string,
    payload: { isEnabled?: boolean; thresholdParams?: Record<string, any> }
  ): Promise<ForensicRuleConfig> => {
    const data = await fetchApi<{ rule: ForensicRuleConfig }>(`/api/v1/alerts/rules/${encodeURIComponent(ruleId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return data.rule;
  },

  getBenfordAnalysis: async (): Promise<BenfordAnalysisResponse> => {
    return fetchApi<BenfordAnalysisResponse>('/api/v1/alerts/benford');
  },

  getInKindItems: async (): Promise<any[]> => {
    try {
      const data = await fetchApi<{ items: any[] }>('/api/v1/donations/items');
      return (data.items || []).map((i: any) => ({
        id: i.id,
        receiptCode: i.receiptCode,
        category: i.earmark || 'PHARMACY',
        quantity: Number(i.totalAmountMinor || 0),
        remainingQuantity: Number(i.remainingAmountMinor ?? i.totalAmountMinor ?? 0),
        condition: 'Good / Checked',
        donorLabel: i.donorRef ? `Donor ${i.donorRef.slice(0, 10)}...` : 'Hospital Drop-off',
        loggedAt: i.createdAt || new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  },

  registerInKindItem: async (item: {
    receiptCode?: string;
    category: string;
    itemName?: string;
    quantity: number;
    condition?: 'NEW' | 'GOOD' | 'FAIR' | 'USABLE';
    donorLabel?: string;
  }): Promise<any> => {
    return fetchApi('/api/v1/donations/items', {
      method: 'POST',
      body: JSON.stringify({
        category: item.category,
        itemName: item.itemName || item.category,
        quantity: item.quantity,
        condition: item.condition || 'GOOD',
        donorLabel: item.donorLabel || 'Hospital Walk-in Donor',
      }),
    });
  },

  // Issue In-Kind Stock to Case
  issueInKindStock: async (receiptCodeOrItemId: string, caseNumberOrId: string, quantity: number): Promise<void> => {
    await fetchApi('/api/v1/donations/items/issue', {
      method: 'POST',
      body: JSON.stringify({
        itemId: receiptCodeOrItemId,
        caseId: caseNumberOrId,
        quantity,
      }),
    });
  },

  // Recognition Wall (FR-DON-12)
  getRecognitionWall: async (): Promise<{ entries: RecognitionEntry[]; anonymousCount: number }> => {
    const data = await fetchApi<{
      donors: any[];
      anonymousDonorsCount: number | null;
      anonymousThresholdMet: boolean;
    }>('/api/v1/public/recognition');

    const entries: RecognitionEntry[] = (data.donors || []).map((d: any) => ({
      id: d.id,
      displayName: d.displayName,
      displayMode: d.displayMode,
      tier: d.badge || 'BRONZE',
      awardedMonth: `${d.year}`,
      isConsistentGiver: d.badge === 'CONSISTENT',
    }));

    return {
      entries,
      anonymousCount: data.anonymousDonorsCount || 0,
    };
  },

  // Report recognition name
  reportRecognitionName: async (entryPreferenceId: string, reason: string): Promise<void> => {
    await fetchApi(`/api/v1/public/recognition/${entryPreferenceId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Donor Claim Profile (FR-DON-11)
  getDonorClaimProfile: async (receiptCode: string, donorIdentity?: string): Promise<DonorClaimProfile> => {
    const normalized = receiptCode.trim().toUpperCase();
    const cleanIdentity = donorIdentity?.trim();
    const existing = readStoredClaimSession();
    let token = existing?.receiptCode === normalized ? existing.token : undefined;

    if (cleanIdentity || !token) {
      if (!cleanIdentity) {
        throw new Error('Enter the phone number, email, or bank reference used when making this donation.');
      }
      const claimRes = await fetchApi<{ token: string; donorRef: string }>('/api/v1/public/donor/claim', {
        method: 'POST',
        body: JSON.stringify({
          receiptCode: normalized,
          donorIdentity: cleanIdentity,
        }),
      });
      token = claimRes.token;
      writeStoredClaimSession(normalized, token);
    }

    const data = await fetchApi<any>(`/api/v1/public/donor/me?token=${encodeURIComponent(token)}`);
    const badges = data.badges || [];
    const activeTier = badges[0]?.tier || 'BRONZE';

    return {
      receiptCode: normalized,
      donorRef: data.donorRef,
      cumulativeMinor: Number(data.totalDonatedMinor || 0),
      activeTier,
      nextTier: activeTier === 'BRONZE' ? 'SILVER' : activeTier === 'SILVER' ? 'GOLD' : 'PATRON',
      nextTierThresholdMinor: 1000000,
      consecutiveMonthsCount: data.lots?.length || 1,
      isConsistentGiver: badges.some((b: any) => b.tier === 'CONSISTENT'),
      displayMode: data.preference?.displayMode || 'ANONYMOUS',
      displayName: data.preference?.publicAlias || data.preference?.confirmedName || '',
    };
  },

  // Update Donor Display Preferences (FR-DON-05, FR-DON-06)
  updateDonorPreferences: async (
    receiptCode: string,
    displayMode: DisplayMode,
    displayName: string
  ): Promise<void> => {
    const claimSession = readStoredClaimSession();
    const token =
      claimSession?.receiptCode === receiptCode.trim().toUpperCase() ? claimSession.token : undefined;
    if (!token) {
      throw new Error('Claim your receipt before updating display preferences.');
    }
    await fetchApi('/api/v1/public/donor/preferences', {
      method: 'PATCH',
      body: JSON.stringify({
        token,
        displayMode,
        publicAlias: displayMode === 'ALIAS' ? displayName : undefined,
        confirmedName: displayMode === 'NAMED' ? displayName : undefined,
        consentVersion: 'v1.0',
      }),
    });
  },

  // Bank Deposits Maker-Checker
  getBankDeposits: async (status?: string): Promise<BankDeposit[]> => {
    const qs = status ? `?status=${status}` : '';
    const data = await fetchApi<{ items: any[] }>(`/api/v1/donations/bank${qs}`);
    return (data.items || []).map((d: any) => ({
      id: d.id,
      depositReference: d.depositReference,
      donorRef: d.donorRef,
      amountMinor: Number(d.amountMinor || 0),
      currency: d.currency || 'KES',
      status: d.status,
      enteredByUserId: d.enteredByUserId,
      verifiedByUserId: d.verifiedByUserId || undefined,
      createdAt: d.createdAt,
      verifiedAt: d.verifiedAt || undefined,
    }));
  },

  createBankDeposit: async (deposit: {
    depositReference: string;
    donorIdentity: string;
    amount: number;
    currency?: string;
    fxRate?: number;
    earmark?: NeedCategory;
  }): Promise<any> => {
    return fetchApi('/api/v1/donations/bank', {
      method: 'POST',
      body: JSON.stringify(deposit),
    });
  },

  verifyBankDeposit: async (id: string, earmark?: NeedCategory): Promise<any> => {
    return fetchApi(`/api/v1/donations/bank/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify(earmark ? { earmark } : {}),
    });
  },

  importBankStatementCsv: async (
    csv: string
  ): Promise<{ importedCount: number; lines: any[] }> => {
    return fetchApi('/api/v1/donations/bank/statements/import', {
      method: 'POST',
      body: JSON.stringify({ csv }),
    });
  },

  reconcileBankStatements: async (windowDays = 7): Promise<BankReconciliationReport> => {
    return fetchApi<BankReconciliationReport>(
      `/api/v1/donations/bank/reconciliation?windowDays=${encodeURIComponent(String(windowDays))}`
    );
  },

  // Fund Flow Graph
  getFundFlowGraph: async (): Promise<{
    nodes: any[];
    edges: any[];
    summary?: {
      totalLotsCount: number;
      totalInflowMinor: number;
      totalAllocationsCount: number;
      totalDisbursedMinor: number;
      openAlertsCount: number;
    };
  }> => {
    return fetchApi('/api/v1/alerts/graph');
  },

  // Quarterly Reports
  getQuarterlyReports: async (): Promise<QuarterlyReport[]> => {
    try {
      const data = await fetchApi<{ items: any[] }>('/api/v1/public/reports');
      return (data.items || []).map((r: any) => ({
        id: r.id,
        year: r.year,
        quarter: r.quarter,
        version: r.version || 1,
        reportHash: r.reportHash,
        periodRoot: r.periodRoot,
        canonicalJson: r.canonicalJson,
        createdAt: r.createdAt,
      }));
    } catch {
      return [];
    }
  },

  generateQuarterlyReport: async (year: number, quarter: number): Promise<QuarterlyReport> => {
    const data = await fetchApi<{ report: any }>('/api/v1/reports/quarterly', {
      method: 'POST',
      body: JSON.stringify({ year, quarter }),
    });
    return {
      id: data.report.id,
      year: data.report.year,
      quarter: data.report.quarter,
      version: data.report.version || 1,
      reportHash: data.report.reportHash,
      periodRoot: data.report.periodRoot,
      canonicalJson: data.report.canonicalJson,
      createdAt: data.report.createdAt,
    };
  },

  getReportPdfUrl: (reportId: string): string =>
    resolveApiUrl(`/api/v1/public/reports/${encodeURIComponent(reportId)}/pdf`),

  // Donor Registration & Auth
  register: async (data: { name: string; email: string; password: string }): Promise<{
    user: any;
    token?: string;
    role?: string;
    requiresVerification?: boolean;
    developmentVerificationToken?: string;
  }> => {
    return fetchApi('/api/v1/public/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login: async (data: { email: string; password: string }): Promise<{
    user: any;
    role?: string;
    roles?: string[];
    permissions?: string[];
    session?: any;
    requiresMfa?: boolean;
    twoFactorRedirect?: boolean;
    mfaVerified?: boolean;
  }> => {
    return fetchApi('/api/v1/public/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Donor Portal Dashboard
  getDonorPortalDashboard: async (): Promise<{
    donorRef: string;
    user: { id: string; name: string; email: string };
    profile: {
      id: string;
      publicAlias: string;
      displayNameMode: string;
      publicListed: boolean;
      showContributionTotal: boolean;
      showRecognitionTier: boolean;
      recognitionTier: string;
    };
    summary: {
      totalDonatedMinor: string;
      totalAllocatedMinor: string;
      totalRemainingMinor: string;
      lotsCount: number;
      casesSupportedCount: number;
    };
    lots: Array<{
      id: string;
      receiptCode: string;
      channel: string;
      currency: string;
      totalAmountMinor: string;
      remainingAmountMinor: string;
      isExhausted: boolean;
      earmark?: string;
      createdAt: string;
      allocations: Array<{
        id: string;
        amountMinor: string;
        allocatedAt: string;
        caseNumber: string;
        needCategory: string;
        state: string;
        justification: string;
      }>;
    }>;
    badges: Array<{
      id: string;
      tier: string;
      academicYear: string;
      awardedAt: string;
    }>;
    nextTier: {
      tier: string;
      targetMinor: number;
      remainingMinor: number;
      progressPercent: number;
    } | null;
    settings: {
      displayMode: string;
      publicAlias: string;
      confirmedName: string;
      publicListed: boolean;
      showContributionTotal: boolean;
      showRecognitionTier: boolean;
    };
  }> => {
    return fetchApi('/api/v1/donor/dashboard');
  },

  claimReceiptToAccount: async (receiptCode: string, donorIdentity?: string): Promise<{
    success: boolean;
    message: string;
    receiptCode: string;
    lotAmountMinor: string;
    currency: string;
  }> => {
    return fetchApi('/api/v1/donor/claim', {
      method: 'POST',
      body: JSON.stringify({
        receiptCode,
        ...(donorIdentity?.trim() ? { donorIdentity: donorIdentity.trim() } : {}),
      }),
    });
  },

  updateDonorPortalSettings: async (settings: {
    displayMode?: string;
    publicAlias?: string;
    publicListed?: boolean;
    showContributionTotal?: boolean;
    showRecognitionTier?: boolean;
  }): Promise<{
    success: boolean;
    profile: any;
    settings: any;
  }> => {
    return fetchApi('/api/v1/donor/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  },

  // Thank-You Certificate
  getCertificate: async (receiptCode: string): Promise<any> => {
    return fetchApi(`/api/v1/public/certificate/${encodeURIComponent(receiptCode)}`);
  },
};
