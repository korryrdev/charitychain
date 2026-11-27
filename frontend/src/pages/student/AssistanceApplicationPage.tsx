import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Info,
  Wallet,
} from 'lucide-react';
import { applicationsApi } from '../../features/assistanceApplications/services/applications.api';
import {
  MAX_REASON_LENGTH,
  MAX_UNVERIFIED_TUITION_AMOUNT,
  MAX_UPKEEP_AMOUNT,
  MIN_REASON_LENGTH,
  parseRequestedAmount,
  validateApplication,
} from '../../features/assistanceApplications/validation/application.schema';
import { studentRecordsApi } from '../../features/studentVetting/services/vetting.api';
import { getErrorMessage } from '../../services/errorMapper';

type SupportType = 'TUITION' | 'UPKEEP';

function buildAmountPresets(
  type: SupportType,
  outstandingBalance: number | null
): Array<{ label: string; value: string }> {
  if (type === 'UPKEEP') {
    return [3000, 5000, 10000, MAX_UPKEEP_AMOUNT].map((amount) => ({
      label: `KES ${amount.toLocaleString()}`,
      value: String(amount),
    }));
  }
  if (outstandingBalance !== null && outstandingBalance > 0) {
    const candidates = [
      { label: '25%', value: Math.max(1, Math.round(outstandingBalance * 0.25)) },
      { label: '50%', value: Math.max(1, Math.round(outstandingBalance * 0.5)) },
      { label: 'Full balance', value: Math.round(outstandingBalance) },
    ];
    const seen = new Set<number>();
    return candidates
      .filter(({ value }) => {
        if (value <= 0 || seen.has(value)) return false;
        seen.add(value);
        return true;
      })
      .map(({ label, value }) => ({
        label: `${label} (KES ${value.toLocaleString()})`,
        value: String(value),
      }));
  }
  return [5000, 10000, 20000, 30000].map((amount) => ({
    label: `KES ${amount.toLocaleString()}`,
    value: String(amount),
  }));
}

export function AssistanceApplicationPage() {
  const navigate = useNavigate();
  const baseId = useId();
  const amountId = `${baseId}-amount`;
  const amountHintId = `${baseId}-amount-hint`;
  const amountErrorId = `${baseId}-amount-error`;
  const reasonId = `${baseId}-reason`;
  const reasonHintId = `${baseId}-reason-hint`;
  const reasonErrorId = `${baseId}-reason-error`;
  const formHeadingId = `${baseId}-heading`;

  const amountInputRef = useRef<HTMLInputElement>(null);
  const reasonInputRef = useRef<HTMLTextAreaElement>(null);
  const serverErrorRef = useRef<HTMLDivElement>(null);
  const announceTimerRef = useRef<number | null>(null);

  const [record, setRecord] = useState<Record<string, any> | null>(null);
  const [applications, setApplications] = useState<Array<Record<string, any>>>([]);
  const [loadingRecord, setLoadingRecord] = useState(true);
  const [values, setValues] = useState<{
    type: SupportType;
    requestedAmount: string;
    reason: string;
  }>({ type: 'TUITION', requestedAmount: '', reason: '' });
  const [touched, setTouched] = useState<{ requestedAmount: boolean; reason: boolean }>({
    requestedAmount: false,
    reason: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [announcement, setAnnouncement] = useState('');
  const [pending, setPending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.allSettled([studentRecordsApi.mine(), applicationsApi.mine({ pageSize: 20 })]).then(
      ([recordResult, appsResult]) => {
        if (!active) return;
        if (recordResult.status === 'fulfilled') {
          setRecord(recordResult.value.record ?? null);
        } else {
          setServerError(
            getErrorMessage(recordResult.reason, 'Unable to load university record.')
          );
        }
        if (appsResult.status === 'fulfilled') {
          setApplications(appsResult.value.items ?? []);
        }
        setLoadingRecord(false);
      }
    );
    return () => {
      active = false;
      if (announceTimerRef.current !== null) {
        window.clearTimeout(announceTimerRef.current);
      }
    };
  }, []);

  const financial = useMemo(
    () =>
      (record?.financialRecords as Array<Record<string, any>> | undefined)?.find(
        (item) => item.semester?.active
      ) ?? record?.financialRecords?.[0],
    [record]
  );

  const activeSemester = financial?.semester ?? record?.activeSemester ?? null;
  const outstandingBalance =
    financial?.outstandingBalance !== undefined && financial?.outstandingBalance !== null
      ? Number(financial.outstandingBalance)
      : null;

  const semesterApplications = useMemo(() => {
    if (!activeSemester?.code) return applications;
    return applications.filter((item) => item.semester?.code === activeSemester.code);
  }, [applications, activeSemester]);

  const existingByType = useMemo(() => {
    const map: Partial<Record<SupportType, Record<string, any>>> = {};
    for (const item of semesterApplications) {
      if (item.type === 'TUITION' && !map.TUITION) map.TUITION = item;
      if (item.type === 'UPKEEP' && !map.UPKEEP) map.UPKEEP = item;
    }
    return map;
  }, [semesterApplications]);

  const activeExisting = existingByType[values.type] ?? null;
  const amountPresets = useMemo(
    () => buildAmountPresets(values.type, outstandingBalance),
    [values.type, outstandingBalance]
  );

  const scheduleAnnouncement = (message: string) => {
    if (announceTimerRef.current !== null) {
      window.clearTimeout(announceTimerRef.current);
    }
    setAnnouncement('');
    announceTimerRef.current = window.setTimeout(() => {
      setAnnouncement(message);
    }, 300);
  };

  const clearAnnouncement = () => {
    if (announceTimerRef.current !== null) {
      window.clearTimeout(announceTimerRef.current);
      announceTimerRef.current = null;
    }
    setAnnouncement('');
  };

  const handleTypeChange = (nextType: SupportType) => {
    const nextValues = { ...values, type: nextType };
    setValues(nextValues);
    if (errors.requestedAmount) {
      const revalidated = validateApplication(nextValues, {
        outstandingBalance: financial?.outstandingBalance,
      });
      setErrors((prev) => {
        const next = { ...prev };
        if (revalidated.requestedAmount) {
          next.requestedAmount = revalidated.requestedAmount;
        } else {
          delete next.requestedAmount;
        }
        return next;
      });
    }
  };

  const handleAmountChange = (raw: string) => {
    const nextValues = { ...values, requestedAmount: raw };
    setValues(nextValues);
    if (errors.requestedAmount) {
      const nextErrors = validateApplication(nextValues, {
        outstandingBalance: financial?.outstandingBalance,
      });
      if (!nextErrors.requestedAmount) {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated.requestedAmount;
          return updated;
        });
        clearAnnouncement();
      }
    }
  };

  const handleAmountBlur = () => {
    if (!touched.requestedAmount && !values.requestedAmount.trim()) return;
    setTouched((prev) => ({ ...prev, requestedAmount: true }));
    const nextErrors = validateApplication(values, {
      outstandingBalance: financial?.outstandingBalance,
    });
    if (nextErrors.requestedAmount) {
      setErrors((prev) => ({ ...prev, requestedAmount: nextErrors.requestedAmount }));
      scheduleAnnouncement(`Requested amount: ${nextErrors.requestedAmount}`);
    } else {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.requestedAmount;
        return updated;
      });
    }
  };

  const handleReasonChange = (raw: string) => {
    const nextValues = { ...values, reason: raw };
    setValues(nextValues);
    if (errors.reason) {
      const nextErrors = validateApplication(nextValues, {
        outstandingBalance: financial?.outstandingBalance,
      });
      if (!nextErrors.reason) {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated.reason;
          return updated;
        });
        clearAnnouncement();
      }
    }
  };

  const handleReasonBlur = () => {
    if (!touched.reason && !values.reason.trim()) return;
    setTouched((prev) => ({ ...prev, reason: true }));
    const nextErrors = validateApplication(values, {
      outstandingBalance: financial?.outstandingBalance,
    });
    if (nextErrors.reason) {
      setErrors((prev) => ({ ...prev, reason: nextErrors.reason }));
      scheduleAnnouncement(`Support justification: ${nextErrors.reason}`);
    } else {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.reason;
        return updated;
      });
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (activeExisting) return;
    const nextErrors = validateApplication(values, {
      outstandingBalance: financial?.outstandingBalance,
    });
    setErrors(nextErrors);
    setTouched({ requestedAmount: true, reason: true });
    if (Object.keys(nextErrors).length) {
      if (nextErrors.requestedAmount) {
        amountInputRef.current?.focus();
      } else if (nextErrors.reason) {
        reasonInputRef.current?.focus();
      }
      return;
    }

    setPending(true);
    setServerError(null);
    clearAnnouncement();
    try {
      const requestedAmount = parseRequestedAmount(values.requestedAmount);
      const { application } = await applicationsApi.create({
        type: values.type,
        requestedAmount,
        reason: values.reason.trim(),
        ...(activeSemester?.code ? { semesterCode: activeSemester.code } : {}),
      });
      await applicationsApi.submit(application.id);
      navigate(`/student/applications/${application.id}`);
    } catch (cause: unknown) {
      setServerError(getErrorMessage(cause, 'Unable to submit application.'));
      window.setTimeout(() => serverErrorRef.current?.focus(), 0);
    } finally {
      setPending(false);
    }
  };

  const trimmedReasonLength = values.reason.trim().length;
  const reasonRequirementMet = trimmedReasonLength >= MIN_REASON_LENGTH;
  const parsedAmount = parseRequestedAmount(values.requestedAmount);
  const amountDescribedBy = errors.requestedAmount
    ? `${amountHintId} ${amountErrorId}`
    : amountHintId;
  const reasonDescribedBy = errors.reason ? `${reasonHintId} ${reasonErrorId}` : reasonHintId;

  const amountHintText =
    values.type === 'UPKEEP'
      ? `Upkeep support is capped at KES ${MAX_UPKEEP_AMOUNT.toLocaleString()} per semester.`
      : outstandingBalance !== null
        ? `Maximum eligible amount: KES ${outstandingBalance.toLocaleString()} based on your recorded balance.`
        : `Without a synced university fee statement, tuition requests up to KES ${MAX_UNVERIFIED_TUITION_AMOUNT.toLocaleString()} are accepted for manual review.`;

  return (
    <main className="portal-page application-page">
      <p className="section-kicker">Assistance request</p>
      <h1 id={formHeadingId}>Request tuition or upkeep support.</h1>
      <p className="portal-page__lead">
        No document upload is needed. Your request is checked against your student profile and routed for Need Index and committee review.
      </p>

      <div className="cc-sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      <div className="cc-assist-layout">
        <section className="cc-assist-card" aria-labelledby={formHeadingId}>
          {serverError && (
            <div
              ref={serverErrorRef}
              className="cc-notice cc-notice--danger"
              role="alert"
              tabIndex={-1}
            >
              <AlertCircle size={20} aria-hidden="true" />
              <div>
                <strong>Request could not be submitted</strong>
                <p>{serverError}</p>
              </div>
            </div>
          )}

          <form
            className="cc-assist-form"
            aria-labelledby={formHeadingId}
            onSubmit={submit}
            noValidate
          >
            <fieldset className="cc-assist-fieldset">
              <legend>Support type</legend>
              <div className="cc-radio-grid">
                <label className="cc-radio-card" htmlFor={`${baseId}-type-tuition`}>
                  <input
                    id={`${baseId}-type-tuition`}
                    type="radio"
                    name="type"
                    value="TUITION"
                    checked={values.type === 'TUITION'}
                    onChange={() => handleTypeChange('TUITION')}
                  />
                  <span className="cc-radio-card__control" aria-hidden="true" />
                  <span className="cc-radio-card__content">
                    <span className="cc-radio-card__head">
                      <GraduationCap size={18} aria-hidden="true" />
                      <strong>Tuition fee assistance</strong>
                    </span>
                    <span className="cc-radio-card__meta">
                      {outstandingBalance !== null
                        ? `Applied to semester fee balance (up to KES ${outstandingBalance.toLocaleString()})`
                        : `Applied directly to semester tuition (up to KES ${MAX_UNVERIFIED_TUITION_AMOUNT.toLocaleString()})`}
                    </span>
                    {existingByType.TUITION && (
                      <span className="cc-radio-card__badge">
                        Already submitted · {existingByType.TUITION.status.replaceAll('_', ' ')}
                      </span>
                    )}
                  </span>
                </label>

                <label className="cc-radio-card" htmlFor={`${baseId}-type-upkeep`}>
                  <input
                    id={`${baseId}-type-upkeep`}
                    type="radio"
                    name="type"
                    value="UPKEEP"
                    checked={values.type === 'UPKEEP'}
                    onChange={() => handleTypeChange('UPKEEP')}
                  />
                  <span className="cc-radio-card__control" aria-hidden="true" />
                  <span className="cc-radio-card__content">
                    <span className="cc-radio-card__head">
                      <Wallet size={18} aria-hidden="true" />
                      <strong>Upkeep assistance</strong>
                    </span>
                    <span className="cc-radio-card__meta">
                      Food, transport &amp; semester essentials · up to KES{' '}
                      {MAX_UPKEEP_AMOUNT.toLocaleString()}
                    </span>
                    {existingByType.UPKEEP && (
                      <span className="cc-radio-card__badge">
                        Already submitted · {existingByType.UPKEEP.status.replaceAll('_', ' ')}
                      </span>
                    )}
                  </span>
                </label>
              </div>
            </fieldset>

            {activeExisting && (
              <div className="cc-notice cc-notice--warning" role="status">
                <Info size={20} aria-hidden="true" />
                <div>
                  <strong>
                    You already have a{' '}
                    {values.type === 'TUITION' ? 'tuition' : 'upkeep'} request for this semester
                  </strong>
                  <p>
                    Reference {activeExisting.reference} is currently{' '}
                    {activeExisting.status.replaceAll('_', ' ')}. Only one request of each type
                    is allowed per active semester.
                  </p>
                  <div className="cc-notice__actions">
                    <Link
                      className="cc-textlink"
                      to={`/student/applications/${activeExisting.id}`}
                    >
                      View existing request <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="cc-assist-field">
              <label htmlFor={amountId}>
                Requested amount (KES) <span aria-hidden="true">*</span>
              </label>
              <div
                className={`cc-money-input${errors.requestedAmount ? ' is-invalid' : ''}`}
              >
                <span className="cc-money-input__prefix" aria-hidden="true">
                  KES
                </span>
                <input
                  ref={amountInputRef}
                  id={amountId}
                  name="requestedAmount"
                  type="text"
                  inputMode="numeric"
                  enterKeyHint="next"
                  autoComplete="off"
                  required
                  placeholder={values.type === 'UPKEEP' ? 'e.g. 5000' : 'e.g. 15000'}
                  value={values.requestedAmount}
                  aria-invalid={errors.requestedAmount ? 'true' : 'false'}
                  aria-describedby={amountDescribedBy}
                  onChange={(event) => handleAmountChange(event.target.value)}
                  onBlur={handleAmountBlur}
                />
              </div>

              {amountPresets.length > 0 && (
                <div className="cc-amount-chips" role="group" aria-label="Quick amount options">
                  {amountPresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className={`cc-amount-chip${values.requestedAmount.trim() === preset.value ? ' is-selected' : ''}`}
                      onClick={() => {
                        handleAmountChange(preset.value);
                        setErrors((prev) => {
                          const updated = { ...prev };
                          delete updated.requestedAmount;
                          return updated;
                        });
                        clearAnnouncement();
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}

              <p id={amountHintId} className="cc-field__hint">
                {amountHintText}
              </p>
              {errors.requestedAmount && (
                <p id={amountErrorId} className="cc-field__error">
                  <AlertCircle size={15} aria-hidden="true" />
                  <span>{errors.requestedAmount}</span>
                </p>
              )}
            </div>

            <div className="cc-assist-field">
              <label htmlFor={reasonId}>
                Why is support needed now? <span aria-hidden="true">*</span>
              </label>
              <textarea
                ref={reasonInputRef}
                id={reasonId}
                name="reason"
                className={`cc-assist-textarea${errors.reason ? ' is-invalid' : ''}`}
                rows={5}
                required
                minLength={MIN_REASON_LENGTH}
                maxLength={MAX_REASON_LENGTH}
                value={values.reason}
                aria-invalid={errors.reason ? 'true' : 'false'}
                aria-describedby={reasonDescribedBy}
                placeholder="Describe your immediate financial situation and how this support will help you continue studying this semester."
                onChange={(event) => handleReasonChange(event.target.value)}
                onBlur={handleReasonBlur}
              />
              <div className="cc-field__meta">
                <p id={reasonHintId} className="cc-field__hint">
                  Include specific context such as fee deadlines, household income disruption, or essential semester costs (minimum 20 characters).
                </p>
                <span
                  className={`cc-char-count${reasonRequirementMet ? ' cc-char-count--met' : ''}`}
                >
                  {reasonRequirementMet && <CheckCircle2 size={14} aria-hidden="true" />}
                  {reasonRequirementMet
                    ? `${trimmedReasonLength.toLocaleString()} / ${MAX_REASON_LENGTH.toLocaleString()}`
                    : `${trimmedReasonLength} / ${MIN_REASON_LENGTH} min`}
                </span>
              </div>
              {errors.reason && (
                <p id={reasonErrorId} className="cc-field__error">
                  <AlertCircle size={15} aria-hidden="true" />
                  <span>{errors.reason}</span>
                </p>
              )}
            </div>

            <p className="cc-assist-disclosure">
              Submitting creates a traceable request and locks your current semester snapshot for review. One request of each support type is allowed per active semester.
            </p>

            <button
              className="cc-btn cc-btn--primary cc-btn--lg cc-btn--block"
              type="submit"
              disabled={pending || loadingRecord || !record || Boolean(activeExisting)}
            >
              {pending && <span className="cc-spinner" aria-hidden="true" />}
              {pending
                ? 'Submitting…'
                : Number.isFinite(parsedAmount) && parsedAmount > 0
                  ? `Submit for vetting · KES ${parsedAmount.toLocaleString()}`
                  : 'Submit for vetting'}
            </button>
          </form>
        </section>

        <aside className="cc-assist-aside" aria-label="Request summary and guidance">
          <section className="cc-assist-info-card">
            <div className="cc-assist-info-card__head">
              <h2>Semester snapshot</h2>
              {activeSemester && (
                <span className="cc-semester-pill">
                  <Calendar size={14} aria-hidden="true" />
                  <span>
                    {activeSemester.name} · {activeSemester.academicYear}
                  </span>
                </span>
              )}
            </div>

            {record?.student ? (
              <dl className="cc-assist-summary-list">
                <div>
                  <dt>Student</dt>
                  <dd>{record.student.fullName}</dd>
                </div>
                <div>
                  <dt>Registration number</dt>
                  <dd>{record.student.registrationNumber}</dd>
                </div>
                <div>
                  <dt>Programme</dt>
                  <dd>
                    {record.student.programme} (Year {record.student.yearOfStudy})
                  </dd>
                </div>
                <div>
                  <dt>School</dt>
                  <dd>{record.student.school}</dd>
                </div>
              </dl>
            ) : loadingRecord ? (
              <p className="cc-muted">Loading your student profile…</p>
            ) : (
              <p className="cc-muted">Student profile unavailable.</p>
            )}

            {financial ? (
              <div className="cc-balance-panel">
                <span>Recorded outstanding fee balance</span>
                <strong>KES {Number(financial.outstandingBalance).toLocaleString()}</strong>
                <div className="cc-balance-panel__rows">
                  <span>Invoiced: KES {Number(financial.invoicedAmount).toLocaleString()}</span>
                  <span>Paid: KES {Number(financial.paidAmount).toLocaleString()}</span>
                  <span>Aid: KES {Number(financial.aidAmount).toLocaleString()}</span>
                </div>
              </div>
            ) : record ? (
              <div className="cc-assist-sync-note">
                <Info size={18} aria-hidden="true" />
                <div>
                  <strong>Institutional fee statement not synced yet</strong>
                  <p>
                    You can still submit your request now. Because no university fee record is linked yet, it will be routed directly to manual committee verification.
                  </p>
                </div>
              </div>
            ) : null}
          </section>

          <section className="cc-assist-info-card">
            <h2>What happens next</h2>
            <ol className="cc-assist-steps">
              <li>
                <span>1</span>
                <div>
                  <strong>Traceable request created</strong>
                  <p>You receive an application reference and timestamped audit trail immediately.</p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>Need Index &amp; committee check</strong>
                  <p>Automated policy checks run, or the committee verifies details manually if records are pending.</p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>Live tracking in Applications</strong>
                  <p>Follow vetting status, committee decisions, and disbursement updates in one place.</p>
                </div>
              </li>
            </ol>
          </section>

          {semesterApplications.length > 0 && (
            <section className="cc-assist-info-card">
              <h2>This semester’s requests</h2>
              <div className="cc-assist-existing-list">
                {semesterApplications.map((item) => (
                  <Link key={item.id} to={`/student/applications/${item.id}`}>
                    <div>
                      <strong>{item.type === 'TUITION' ? 'Tuition support' : 'Upkeep support'}</strong>
                      <span>
                        {item.reference} · KES {Number(item.requestedAmount).toLocaleString()}
                      </span>
                    </div>
                    <small>{item.status.replaceAll('_', ' ')}</small>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
