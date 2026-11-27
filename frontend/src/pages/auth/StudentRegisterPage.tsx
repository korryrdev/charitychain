import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, CircleAlert } from 'lucide-react';
import { AuthField } from '../../features/authentication/components/AuthField';
import { AuthPortalNav } from '../../features/authentication/components/AuthPortalNav';
import { AuthShell } from '../../features/authentication/components/AuthShell';
import { useAuth } from '../../features/authentication/hooks/useAuth';
import { useCountdown } from '../../features/authentication/hooks/useCountdown';
import {
  MUST_SCHOOLS,
  OTHER_PROGRAMME_VALUE,
  findMustProgramme,
  findMustSchool,
} from '../../features/authentication/mustCatalog';
import { passwordStrength } from '../../features/authentication/passwordStrength';
import { PORTALS } from '../../features/authentication/portals';
import {
  validatePortalEmail,
  validateStudentRegistration,
} from '../../features/authentication/validation/auth.schema';
import { getErrorMessage, getRetryAfterSeconds, isRateLimited } from '../../services/errorMapper';

export function StudentRegisterPage() {
  const config = PORTALS.student;
  const navigate = useNavigate();
  const { registerStudent } = useAuth();
  const cooldown = useCountdown();

  const [values, setValues] = useState({
    name: '',
    email: '',
    registrationNumber: '',
    school: '',
    programme: '',
    customProgramme: '',
    customDurationYears: '4',
    yearOfStudy: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const selectedSchool = findMustSchool(values.school);
  const isOtherProgramme = values.programme === OTHER_PROGRAMME_VALUE;
  const selectedProgramme =
    selectedSchool && !isOtherProgramme
      ? findMustProgramme(selectedSchool.code, values.programme)
      : null;

  const degrees = selectedSchool?.programmes.filter((item) => item.level === 'DEGREE') ?? [];
  const diplomas = selectedSchool?.programmes.filter((item) => item.level === 'DIPLOMA') ?? [];

  const maxYears = selectedProgramme
    ? selectedProgramme.durationYears
    : isOtherProgramme
      ? Number(values.customDurationYears) || 4
      : 0;
  const yearOptions = Array.from({ length: maxYears }, (_, index) => index + 1);

  const emailValue = values.email.trim();
  const emailValid = Boolean(emailValue) && !validatePortalEmail(emailValue, 'STUDENT');
  const strength = passwordStrength(values.password);
  const passwordsMatch = Boolean(values.confirmPassword) && values.confirmPassword === values.password;

  const clearError = (field: string) => {
    if (!errors[field]) return;
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSchoolChange = (school: string) => {
    setValues((current) => ({
      ...current,
      school,
      programme: '',
      customProgramme: '',
      yearOfStudy: '',
    }));
    clearError('school');
  };

  const handleProgrammeChange = (programme: string) => {
    const nextProgramme =
      selectedSchool && programme !== OTHER_PROGRAMME_VALUE
        ? findMustProgramme(selectedSchool.code, programme)
        : null;
    const nextMax = nextProgramme
      ? nextProgramme.durationYears
      : programme === OTHER_PROGRAMME_VALUE
        ? Number(values.customDurationYears) || 4
        : 0;
    setValues((current) => ({
      ...current,
      programme,
      ...(programme !== OTHER_PROGRAMME_VALUE ? { customProgramme: '' } : {}),
      yearOfStudy:
        current.yearOfStudy && Number(current.yearOfStudy) <= nextMax ? current.yearOfStudy : '',
    }));
    clearError('programme');
  };

  const handleCustomDurationChange = (customDurationYears: string) => {
    const nextMax = Number(customDurationYears) || 4;
    setValues((current) => ({
      ...current,
      customDurationYears,
      yearOfStudy:
        current.yearOfStudy && Number(current.yearOfStudy) <= nextMax ? current.yearOfStudy : '',
    }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cooldown.active) return;

    const nextErrors = validateStudentRegistration(values);
    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      const target =
        document.getElementById(firstInvalid) ??
        document.querySelector<HTMLElement>(`[name="${firstInvalid}"]`);
      target?.focus();
      return;
    }

    setPending(true);
    setFormError(null);
    try {
      const normalizedEmail = values.email.trim().toLowerCase();
      const normalizedRegistrationNumber = values.registrationNumber.trim().toUpperCase();
      const submittedProgramme = isOtherProgramme
        ? values.customProgramme.trim()
        : selectedProgramme?.name ?? values.programme.trim();

      await registerStudent({
        name: values.name.trim(),
        email: normalizedEmail,
        password: values.password,
        registrationNumber: normalizedRegistrationNumber,
        school: selectedSchool?.name ?? values.school.trim(),
        programme: submittedProgramme,
        yearOfStudy: Number(values.yearOfStudy),
      });
      navigate(config.checkEmailPath, {
        replace: true,
        state: { email: normalizedEmail },
      });
    } catch (cause: unknown) {
      if (isRateLimited(cause)) {
        const seconds = getRetryAfterSeconds(cause) ?? 60;
        cooldown.start(seconds);
        setFormError(`Too many registration attempts. Please try again in ${seconds} seconds.`);
      } else {
        setFormError(getErrorMessage(cause, 'Unable to create student account.'));
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthShell portal="student">
      <form className="cc-form" noValidate onSubmit={submit}>
        <header className="cc-form__header">
          <p className="cc-eyebrow">{config.kicker}</p>
          <h1>{config.registerTitle}</h1>
          <p>{config.registerSubtitle}</p>
        </header>

        <AuthPortalNav mode="register" active="student" />

        <div className="cc-form__panel">
          {formError && (
            <div className="cc-notice cc-notice--danger" role="alert">
              <CircleAlert size={20} strokeWidth={1.75} aria-hidden="true" />
              <div>
                <strong>Unable to create student account</strong>
                <p>{formError}</p>
              </div>
            </div>
          )}

          <fieldset className="cc-fieldset">
            <legend className="cc-fieldset__legend">Your identity</legend>

            <AuthField
              id="name"
              label="Full name"
              autoComplete="name"
              enterKeyHint="next"
              value={values.name}
              onChange={(name) => {
                setValues((current) => ({ ...current, name }));
                clearError('name');
              }}
              error={errors.name}
            />

            <AuthField
              id="email"
              label="Student email address"
              type="email"
              autoComplete="email"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="next"
              placeholder={config.emailPlaceholder}
              hint={config.emailHint}
              value={values.email}
              onChange={(email) => {
                setValues((current) => ({ ...current, email }));
                clearError('email');
              }}
              error={errors.email}
              valid={emailValid}
            />

            <AuthField
              id="registrationNumber"
              label="University registration number"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              enterKeyHint="next"
              uppercase
              placeholder="CTxxx/xxxxxx/yy"
              hint="Format: CTxxx/xxxxxx/yy"
              value={values.registrationNumber}
              onChange={(registrationNumber) => {
                setValues((current) => ({ ...current, registrationNumber }));
                clearError('registrationNumber');
              }}
              error={errors.registrationNumber}
            />
          </fieldset>

          <fieldset className="cc-fieldset">
            <legend className="cc-fieldset__legend">Academic profile</legend>

            <div className="cc-field">
              <label className="cc-field__label" htmlFor="school">
                School
              </label>
              <div className={`cc-field__control${errors.school ? ' is-invalid' : ''}`}>
                <select
                  id="school"
                  name="school"
                  className="cc-input cc-select"
                  value={values.school}
                  aria-invalid={errors.school ? 'true' : undefined}
                  aria-describedby={errors.school ? 'school-error' : undefined}
                  onChange={(event) => handleSchoolChange(event.target.value)}
                >
                  <option value="">Select your school…</option>
                  {MUST_SCHOOLS.map((school) => (
                    <option key={school.code} value={school.name}>
                      {school.name} ({school.code})
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} strokeWidth={1.75} className="cc-select__chevron" aria-hidden="true" />
              </div>
              {errors.school && (
                <p className="cc-field__error" id="school-error" role="alert">
                  <CircleAlert size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span>{errors.school}</span>
                </p>
              )}
            </div>

            <div className="cc-field">
              <label className="cc-field__label" htmlFor="programme">
                Programme
              </label>
              <div className={`cc-field__control${errors.programme ? ' is-invalid' : ''}`}>
                <select
                  id="programme"
                  name="programme"
                  className="cc-input cc-select"
                  value={values.programme}
                  disabled={!selectedSchool}
                  aria-invalid={errors.programme ? 'true' : undefined}
                  aria-describedby={errors.programme ? 'programme-error' : undefined}
                  onChange={(event) => handleProgrammeChange(event.target.value)}
                >
                  <option value="">
                    {selectedSchool ? 'Select your programme…' : 'Select a school first'}
                  </option>
                  {degrees.length > 0 && (
                    <optgroup label="Undergraduate Degrees">
                      {degrees.map((programme) => (
                        <option key={programme.code} value={programme.name}>
                          {programme.name} ({programme.durationYears} yrs)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {diplomas.length > 0 && (
                    <optgroup label="Diplomas (3 years)">
                      {diplomas.map((programme) => (
                        <option key={programme.code} value={programme.name}>
                          {programme.name} ({programme.durationYears} yrs)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {selectedSchool && (
                    <option value={OTHER_PROGRAMME_VALUE}>Other programme (specify)</option>
                  )}
                </select>
                <ChevronDown size={18} strokeWidth={1.75} className="cc-select__chevron" aria-hidden="true" />
              </div>
              {errors.programme && (
                <p className="cc-field__error" id="programme-error" role="alert">
                  <CircleAlert size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span>{errors.programme}</span>
                </p>
              )}
            </div>

            {isOtherProgramme && (
              <>
                <AuthField
                  id="customProgramme"
                  label="Programme name"
                  placeholder="e.g. BSc. in Actuarial Science"
                  value={values.customProgramme}
                  onChange={(customProgramme) => {
                    setValues((current) => ({ ...current, customProgramme }));
                    clearError('customProgramme');
                  }}
                  error={errors.customProgramme}
                />
                <div className="cc-field">
                  <label className="cc-field__label" htmlFor="customDurationYears">
                    Programme length
                  </label>
                  <div className="cc-field__control">
                    <select
                      id="customDurationYears"
                      name="customDurationYears"
                      className="cc-input cc-select"
                      value={values.customDurationYears}
                      onChange={(event) => handleCustomDurationChange(event.target.value)}
                    >
                      <option value="3">3 years (Diploma)</option>
                      <option value="4">4 years (Degree)</option>
                      <option value="5">5 years (Degree)</option>
                    </select>
                    <ChevronDown size={18} strokeWidth={1.75} className="cc-select__chevron" aria-hidden="true" />
                  </div>
                </div>
              </>
            )}

            <fieldset
              className="cc-field"
              style={{ border: 0, padding: 0, marginInline: 0 }}
              aria-describedby={errors.yearOfStudy ? 'yearOfStudy-error' : undefined}
            >
              <legend className="cc-field__label" style={{ marginBottom: 6 }}>
                Year of study
              </legend>
              {!values.programme ? (
                <p className="cc-field__hint">Select a programme above to choose your year of study.</p>
              ) : (
                <div className="cc-year-pills">
                  {yearOptions.map((year) => {
                    const value = String(year);
                    const checked = values.yearOfStudy === value;
                    return (
                      <label
                        key={year}
                        className={`cc-year-pill${checked ? ' is-selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="yearOfStudy"
                          value={value}
                          checked={checked}
                          className="cc-sr-only"
                          onChange={() => {
                            setValues((current) => ({ ...current, yearOfStudy: value }));
                            clearError('yearOfStudy');
                          }}
                        />
                        <span>Year {year}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              {errors.yearOfStudy && (
                <p className="cc-field__error" id="yearOfStudy-error" role="alert">
                  <CircleAlert size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span>{errors.yearOfStudy}</span>
                </p>
              )}
            </fieldset>
          </fieldset>

          <fieldset className="cc-fieldset">
            <legend className="cc-fieldset__legend">Account security</legend>

            <AuthField
              id="password"
              label="Password"
              type="password"
              autoComplete="new-password"
              enterKeyHint="next"
              hint="At least 12 characters."
              value={values.password}
              onChange={(password) => {
                setValues((current) => ({ ...current, password }));
                clearError('password');
              }}
              error={errors.password}
            >
              {values.password && (
                <div className="cc-strength" data-level={strength.level}>
                  <div className="cc-strength__bar" role="presentation">
                    <span style={{ width: `${strength.percent}%` }} />
                  </div>
                  <span className="cc-strength__label" aria-live="polite">
                    Strength: {strength.label}
                    {strength.needed ? ` (${strength.needed} more character${strength.needed === 1 ? '' : 's'})` : ''}
                  </span>
                </div>
              )}
            </AuthField>

            <AuthField
              id="confirmPassword"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              enterKeyHint="done"
              value={values.confirmPassword}
              onChange={(confirmPassword) => {
                setValues((current) => ({ ...current, confirmPassword }));
                clearError('confirmPassword');
              }}
              error={errors.confirmPassword}
              hint={passwordsMatch ? 'Passwords match.' : undefined}
            />
          </fieldset>

          <button
            type="submit"
            className="cc-btn cc-btn--primary cc-btn--lg cc-btn--block"
            disabled={pending || cooldown.active}
            aria-busy={pending || undefined}
          >
            {pending && <span className="cc-spinner" aria-hidden="true" />}
            {cooldown.active
              ? `Try again in ${cooldown.remaining}s`
              : pending
                ? 'Creating account…'
                : 'Create student account'}
          </button>
        </div>

        <p className="cc-form__alt">
          Already have a student account?{' '}
          <Link className="cc-link" to="/student/auth/login">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
