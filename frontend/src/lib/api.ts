import type {
  DonationTrace,
  CaseRecord,
  ForensicAlert,
  TransparencyStats,
  NeedCategory,
  RecognitionEntry,
  DonorClaimProfile,
  DisplayMode,
  BankDeposit,
  QuarterlyReport,
} from '@/types';

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const sessionStr = localStorage.getItem('charitychain_session');
  let token: string | undefined;
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      token = session.token;
    } catch {
      // ignore parse error
    }
  }

  const claimToken = localStorage.getItem('charitychain_claim_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(claimToken && !token ? { Authorization: `Bearer ${claimToken}` } : {}),
    ...((options?.headers as Record<string, string>) || {}),
  };

  const res = await fetch(url, {
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
        donorDisplayMode: data.donorDisplayMode || 'ALIAS',
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

  // Cases Queue
  getCases: async (params?: { subGroupId?: string; state?: string }): Promise<CaseRecord[]> => {
    const qs = new URLSearchParams();
    if (params?.subGroupId) qs.append('subGroupId', params.subGroupId);
    if (params?.state) qs.append('state', params.state);
    const query = qs.toString() ? `?${qs.toString()}` : '';

    const data = await fetchApi<{ items: any[] }>(`/api/v1/cases${query}`);
    return (data.items || []).map((c: any) => ({
      id: c.id,
      caseNumber: c.caseNumber,
      subGroupId: c.subGroupId,
      subGroupName: c.subGroup?.name || 'General Subgroup',
      needCategory: c.needCategory,
      requestedAmountMinor: Number(c.requestedAmountMinor || 0),
      approvedAmountMinor: c.approvedAmountMinor ? Number(c.approvedAmountMinor) : undefined,
      disbursedAmountMinor: c.disbursedAmountMinor ? Number(c.disbursedAmountMinor) : undefined,
      state: c.status,
      justification: c.studentPii?.justification || 'Emergency student aid request',
      signatorySignatures: (c.events || [])
        .filter((e: any) => e.toState === 'AUTHORIZED')
        .flatMap((e: any) =>
          (e.payload?.signatures || []).map((s: any) => ({
            signer: s.signer,
            signedAt: e.createdAt,
          }))
        ),
      submitterId: c.createdByUserId || 'rep-1',
      evidenceCid: c.events?.find((e: any) => e.payload?.evidenceCid)?.payload?.evidenceCid,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  },

  // Create Case
  createCase: async (payload: {
    subGroupId?: string;
    subGroupName?: string;
    needCategory: NeedCategory;
    requestedAmountMinor: number;
    justification: string;
  }): Promise<CaseRecord> => {
    let subGroupId = payload.subGroupId;
    if (!subGroupId) {
      // Find an existing subgroup or use fallback
      try {
        const existingCases = await fetchApi<{ items: any[] }>('/api/v1/cases?pageSize=1');
        if (existingCases.items?.[0]?.subGroupId) {
          subGroupId = existingCases.items[0].subGroupId;
        }
      } catch {
        // ignore
      }
    }

    const data = await fetchApi<{ case: any }>('/api/v1/cases', {
      method: 'POST',
      body: JSON.stringify({
        subGroupId: subGroupId || '00000000-0000-0000-0000-000000000001',
        needCategory: payload.needCategory,
        requestedAmountMinor: payload.requestedAmountMinor,
        studentPii: {
          studentName: 'Student Applicant',
          registrationNumber: `REG-${Math.floor(1000 + Math.random() * 9000)}`,
          phone: '254700000000',
          justification: payload.justification,
        },
      }),
    });

    const c = data.case;
    return {
      id: c.id,
      caseNumber: c.caseNumber,
      subGroupId: c.subGroupId,
      subGroupName: payload.subGroupName || 'General Subgroup',
      needCategory: c.needCategory,
      requestedAmountMinor: Number(c.requestedAmountMinor || 0),
      state: c.status,
      justification: payload.justification,
      signatorySignatures: [],
      submitterId: c.createdByUserId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  },

  // Committee Decisions
  approveCase: async (caseId: string, approvedAmountMinor: number, approverId: string): Promise<CaseRecord> => {
    const data = await fetchApi<{ case: any }>(`/api/v1/cases/${caseId}/decision`, {
      method: 'POST',
      body: JSON.stringify({
        decision: 'APPROVED',
        approvedAmountMinor,
        notes: `Approved by committee member ${approverId}`,
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
      approvedAmountMinor: Number(c.approvedAmountMinor || approvedAmountMinor),
      state: c.status,
      justification: 'Approved',
      signatorySignatures: [],
      submitterId: c.createdByUserId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  },

  rejectCase: async (caseId: string, reason: string): Promise<CaseRecord> => {
    const data = await fetchApi<{ case: any }>(`/api/v1/cases/${caseId}/decision`, {
      method: 'POST',
      body: JSON.stringify({
        decision: 'REJECTED',
        notes: reason,
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
      state: c.status,
      justification: reason,
      signatorySignatures: [],
      submitterId: c.createdByUserId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  },

  // Signatory Sign Action (EIP-712 Release)
  signReleaseAuthorization: async (caseId: string, signerAddress: string): Promise<CaseRecord> => {
    const dummySignature = '0x' + '22'.repeat(65);
    const data = await fetchApi<{ case: any }>(`/api/v1/cases/${caseId}/authorize`, {
      method: 'POST',
      body: JSON.stringify({
        signatures: [
          {
            signer: signerAddress,
            signature: dummySignature,
          },
        ],
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
      state: c.status,
      justification: 'Authorized',
      signatorySignatures: [{ signer: signerAddress, signedAt: new Date().toISOString() }],
      submitterId: c.createdByUserId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  },

  // Record Disbursement
  recordDisbursement: async (
    caseId: string,
    amountMinor: number,
    methodRef: string,
    evidenceCid: string
  ): Promise<CaseRecord> => {
    const data = await fetchApi<{ case: any }>(`/api/v1/cases/${caseId}/disburse`, {
      method: 'POST',
      body: JSON.stringify({
        amountMinor,
        method: 'MPESA',
        reference: methodRef,
        evidenceCid,
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
      disbursedAmountMinor: Number(c.disbursedAmountMinor || amountMinor),
      state: c.status,
      justification: 'Disbursed',
      signatorySignatures: [],
      submitterId: c.createdByUserId,
      evidenceCid,
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

    // Try claiming first if donorIdentity is provided
    let token = localStorage.getItem('charitychain_claim_token');
    if (donorIdentity || !token) {
      const claimRes = await fetchApi<{ token: string; donorRef: string }>('/api/v1/public/donor/claim', {
        method: 'POST',
        body: JSON.stringify({
          receiptCode: normalized,
          donorIdentity: donorIdentity || 'anonymous@donor.test',
        }),
      });
      token = claimRes.token;
      localStorage.setItem('charitychain_claim_token', token);
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
    const token = localStorage.getItem('charitychain_claim_token');
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
      body: JSON.stringify({ earmark }),
    });
  },

  // Fund Flow Graph
  getFundFlowGraph: async (): Promise<{ nodes: any[]; edges: any[] }> => {
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

  // Thank-You Certificate
  getCertificate: async (receiptCode: string): Promise<any> => {
    return fetchApi(`/api/v1/public/certificate/${encodeURIComponent(receiptCode)}`);
  },
};
