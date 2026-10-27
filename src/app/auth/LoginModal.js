'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import intlTelInput from 'intl-tel-input';
import 'intl-tel-input/styles';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconCircleCheck,
  IconClock,
  IconCreditCard,
  IconEye,
  IconEyeOff,
  IconGift,
  IconKey,
  IconLogin,
  IconMail,
  IconRefresh,
  IconShieldCheck,
  IconSparkles,
  IconUser,
  IconUserPlus,
  IconX,
} from '@tabler/icons-react';


const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
).replace(/\/+$/, '');

const CUSTOMER_LOGIN_URL =
  process.env.NEXT_PUBLIC_CUSTOMER_LOGIN_URL ||
  `${API_BASE_URL}/customer/login`;

const CUSTOMER_REGISTER_URL =
  process.env.NEXT_PUBLIC_CUSTOMER_REGISTER_URL ||
  `${API_BASE_URL}/customer/register`;

const SEND_OTP_URL =
  process.env.NEXT_PUBLIC_FORGOT_PASSWORD_SEND_OTP_URL ||
  `${API_BASE_URL}/forgot-password/send-otp`;

const VERIFY_OTP_URL =
  process.env.NEXT_PUBLIC_FORGOT_PASSWORD_VERIFY_OTP_URL ||
  `${API_BASE_URL}/forgot-password/verify-otp`;

const RESET_PASSWORD_URL =
  process.env.NEXT_PUBLIC_FORGOT_PASSWORD_RESET_URL ||
  `${API_BASE_URL}/forgot-password/reset-password`;

function getApiError(data, fallback) {
  if (data?.errors) {
    const errors = Object.values(data.errors).flat();
    if (errors.length) return errors.join(' ');
  }

  return data?.message || data?.error || fallback;
}

function InputIcon({ children }) {
  return (
    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
      {children}
    </span>
  );
}

function PasswordField({
  value,
  onChange,
  placeholder,
  show,
  setShow,
  autoComplete,
  minLength = 6,
}) {
  return (
    <div className="relative">
      <InputIcon>
        <IconShieldCheck size={17} />
      </InputIcon>

      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        className="h-[50px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-11 pr-12 text-sm font-semibold text-[var(--foreground)] outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--accent-light)]"
      />

      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-[var(--accent-light)] hover:text-[var(--primary-dark)]"
      >
        {show ? <IconEyeOff size={17} /> : <IconEye size={17} />}
      </button>
    </div>
  );
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;

    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const success = toast.type === 'success';
  const error = toast.type === 'error';

  return (
    <div className="fixed right-4 top-5 z-[10001] w-[calc(100%-32px)] max-w-[390px]">
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        <div
          className="h-1"
          style={{
            background: success
              ? 'var(--success)'
              : error
                ? 'var(--danger)'
                : 'var(--primary)',
          }}
        />

        <div className="flex items-start gap-3 p-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: success
                ? '#dcfce7'
                : error
                  ? '#fee2e2'
                  : 'var(--accent-light)',
              color: success
                ? 'var(--success)'
                : error
                  ? 'var(--danger)'
                  : 'var(--primary-dark)',
            }}
          >
            {success ? (
              <IconCircleCheck size={21} />
            ) : error ? (
              <IconAlertCircle size={21} />
            ) : (
              <IconSparkles size={21} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold text-[var(--foreground)]">
              {success
                ? 'Success'
                : error
                  ? 'Something went wrong'
                  : 'Tranzift'}
            </div>

            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              {toast.message}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close notification"
            className="rounded-lg p-1 text-slate-400 hover:bg-[var(--surface-hover)]"
          >
            <IconX size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}

function OtpInput({ otp, setOtp, otpRefs }) {
  const handleChange = (index, value) => {
    const digits = value.replace(/\D/g, '');

    if (!digits) {
      setOtp((previous) => {
        const updated = [...previous];
        updated[index] = '';
        return updated;
      });
      return;
    }

    if (digits.length > 1) {
      const pasted = digits.slice(0, 6).split('');

      setOtp((previous) => {
        const updated = [...previous];

        pasted.forEach((digit, offset) => {
          if (index + offset < 6) {
            updated[index + offset] = digit;
          }
        });

        return updated;
      });

      otpRefs.current[Math.min(index + digits.length, 5)]?.focus();
      return;
    }

    setOtp((previous) => {
      const updated = [...previous];
      updated[index] = digits;
      return updated;
    });

    if (index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (event, index) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }

    if (event.key === 'ArrowRight' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();

    const digits = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);

    if (!digits) return;

    setOtp(Array.from({ length: 6 }, (_, index) => digits[index] || ''));
    otpRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            otpRefs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={6}
          value={digit}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onPaste={handlePaste}
          aria-label={`OTP digit ${index + 1}`}
          className="h-12 w-10 rounded-xl border border-[var(--border)] bg-[var(--background)] text-center text-lg font-black text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--accent-light)] sm:h-14 sm:w-12"
        />
      ))}
    </div>
  );
}

export default function LoginModal({
  open,
  mode: initialMode = 'login',
  setMode: onModeChange,
  onClose,
  onAuthSuccess,
  onToast,
}) {
  const phoneInputRef = useRef(null);
  const otpRefs = useRef([]);
  const requestLock = useRef(false);

  const [mode, setModeState] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmationPassword, setShowConfirmationPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [forgotStep, setForgotStep] = useState(1);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resetComplete, setResetComplete] = useState(false);

  const isForgot = mode === 'forgot';
  const isRegister = mode === 'register';
  const isLogin = mode === 'login';

  const closeToast = useCallback(() => setToast(null), []);

  const notify = useCallback(
    (type, message) => {
      setToast({ type, message });
      onToast?.(type, message);
    },
    [onToast]
  );

  const resetRecovery = useCallback(() => {
    setForgotStep(1);
    setOtp(['', '', '', '', '', '']);
    setResetToken('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setResendCooldown(0);
    setResetComplete(false);
    otpRefs.current = [];
  }, []);

  const setMode = useCallback(
    (nextMode) => {
      if (loading || !['login', 'register', 'forgot'].includes(nextMode)) {
        return;
      }

      setModeState(nextMode);
      onModeChange?.(nextMode);
      setPassword('');
      setPasswordConfirmation('');
      setShowPassword(false);
      setShowConfirmationPassword(false);

      if (nextMode !== 'forgot') resetRecovery();
    },
    [loading, onModeChange, resetRecovery]
  );

  useEffect(() => {
    if (!open) return;

    setModeState(initialMode);
    setName('');
    setEmail('');
    setPassword('');
    setPasswordConfirmation('');
    setShowPassword(false);
    setShowConfirmationPassword(false);
    setLoading(false);
    setToast(null);
    resetRecovery();
  }, [open, initialMode, resetRecovery]);

  useEffect(() => {
    if (!open || mode !== 'register' || !phoneInputRef.current) {
      return undefined;
    }

    const input = phoneInputRef.current;
    let instance;

    try {
      intlTelInput.getInstance(input)?.destroy();

      instance = intlTelInput(input, {
        initialCountry: 'in',
        separateDialCode: true,
        nationalMode: true,
        formatOnDisplay: true,
        autoPlaceholder: 'polite',
        preferredCountries: ['in', 'ae', 'us', 'gb'],
        loadUtils: () => import('intl-tel-input/utils'),
      });

      Promise.resolve(instance.promise).catch((error) => {
        console.error('Phone utilities failed to load:', error);
      });
    } catch (error) {
      console.error('Phone input initialization failed:', error);
    }

    return () => {
      intlTelInput.getInstance(input)?.destroy();
    };
  }, [open, mode]);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;

    const timer = setTimeout(() => {
      setResendCooldown((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!open || !isForgot || forgotStep !== 2) return undefined;

    const timer = setTimeout(() => otpRefs.current[0]?.focus(), 100);
    return () => clearTimeout(timer);
  }, [open, isForgot, forgotStep]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) onClose?.();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, loading, onClose]);

  const recoveryRequest = async (url, payload) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(getApiError(data, 'Request failed. Please try again.'));
    }

    return data;
  };

  const openForgotPassword = () => {
    if (loading) return;
    resetRecovery();
    setMode('forgot');
  };

  const sendOtp = async () => {
    if (requestLock.current) return;

    const cleanEmail = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      notify('error', 'Please enter a valid email address.');
      return;
    }

    requestLock.current = true;
    setLoading(true);

    try {
      const data = await recoveryRequest(SEND_OTP_URL, {
        email: cleanEmail,
      });

      setEmail(cleanEmail);
      setOtp(['', '', '', '', '', '']);
      setForgotStep(2);
      setResendCooldown(30);

      notify(
        'success',
        data?.message || 'Verification code sent to your email.'
      );
    } catch (error) {
      notify('error', error?.message || 'Unable to send OTP.');
    } finally {
      requestLock.current = false;
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (requestLock.current) return;

    const code = otp.join('');

    if (code.length !== 6) {
      notify('error', 'Please enter the complete 6-digit OTP.');
      return;
    }

    requestLock.current = true;
    setLoading(true);

    try {
      const data = await recoveryRequest(VERIFY_OTP_URL, {
        email: email.trim(),
        otp: code,
      });

      const token =
        data?.reset_token ?? data?.data?.reset_token ?? data?.token ?? null;

      if (!token) {
        throw new Error('The server did not return a reset token.');
      }

      setResetToken(token);
      setForgotStep(3);
      notify('success', data?.message || 'OTP verified successfully.');
    } catch (error) {
      notify('error', error?.message || 'OTP verification failed.');
    } finally {
      requestLock.current = false;
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (requestLock.current) return;

    if (newPassword.length < 8) {
      notify('error', 'Password must contain at least 8 characters.');
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      notify('error', 'Include at least one uppercase letter.');
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      notify('error', 'Include at least one lowercase letter.');
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      notify('error', 'Include at least one number.');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      notify('error', 'Include at least one special character.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      notify('error', 'Your passwords do not match.');
      return;
    }

    if (!resetToken) {
      notify(
        'error',
        'Your reset session has expired. Please verify OTP again.'
      );
      return;
    }

    requestLock.current = true;
    setLoading(true);

    try {
      const data = await recoveryRequest(RESET_PASSWORD_URL, {
        email: email.trim(),
        reset_token: resetToken,
        password: newPassword,
        password_confirmation: confirmNewPassword,
      });

      setResetComplete(true);
      setResetToken('');
      setNewPassword('');
      setConfirmNewPassword('');

      notify('success', data?.message || 'Password reset successfully.');
    } catch (error) {
      notify('error', error?.message || 'Unable to reset password.');
    } finally {
      requestLock.current = false;
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading || requestLock.current) return;

    requestLock.current = true;
    setLoading(true);

    try {
      const cleanEmail = email.trim();

      if (!cleanEmail) {
        throw new Error('Please enter your email address.');
      }

      if (!password) {
        throw new Error('Please enter your password.');
      }

      let payload = {
        email: cleanEmail,
        password,
      };

      if (isRegister) {
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }

        if (password.length < 6) {
          throw new Error('Password must contain at least 6 characters.');
        }

        if (password !== passwordConfirmation) {
          throw new Error('Passwords do not match.');
        }

        const input = phoneInputRef.current;
        const phone = input ? intlTelInput.getInstance(input) : null;

        if (!input || !phone) {
          throw new Error('Phone input is not ready. Please try again.');
        }

        await phone.promise;

        if (!input.value.trim()) {
          throw new Error('Please enter your mobile number.');
        }

        if (
          typeof phone.isValidNumber === 'function' &&
          !phone.isValidNumber()
        ) {
          throw new Error('Please enter a valid mobile number.');
        }

        const phoneNumber = phone.getNumber();
        const country = phone.getSelectedCountryData();

        if (!phoneNumber || !country?.dialCode) {
          throw new Error(
            'Please select a country and enter your mobile number.'
          );
        }

        payload = {
          name: name.trim(),
          email: cleanEmail,
          mobile: phoneNumber,
          country_code: `+${country.dialCode}`,
          password,
          password_confirmation: passwordConfirmation,
        };
      }

      const response = await fetch(
        isRegister ? CUSTOMER_REGISTER_URL : CUSTOMER_LOGIN_URL,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          cache: 'no-store',
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getApiError(
            data,
            isRegister
              ? 'Unable to create your account. Please try again.'
              : 'Invalid email or password. Please try again.'
          )
        );
      }

      const responseData = data?.data ?? data;

      const token =
        responseData?.token ??
        responseData?.access_token ??
        responseData?.accessToken ??
        data?.token ??
        data?.access_token ??
        null;

      const user =
        responseData?.user ??
        responseData?.customer ??
        data?.user ??
        data?.customer ??
        null;

      if (!token || !user) {
        console.error('Authentication API response:', data);

        throw new Error(
          'Login succeeded, but the API did not return both a customer and an authentication token. Please check the API response.'
        );
      }

      if (typeof onAuthSuccess !== 'function') {
        throw new Error(
          'Authentication context callback is missing. Please check LoginModal integration.'
        );
      }

      const authenticated = await Promise.resolve(
        onAuthSuccess({
          token,
          user,
          data,
        })
      );
      if (authenticated !== true) {
        throw new Error(
          'Unable to initialize your login session. Please try again.'
        );
      }

      notify(
        'success',
        isRegister
          ? 'Your account has been created successfully. Welcome to Tranzift!'
          : 'Welcome back! You are successfully signed in.'
      );

      onClose?.();

      if (authenticated === false) {
        throw new Error('Unable to save your login session. Please try again.');
      }

      notify(
        'success',
        isRegister
          ? 'Your account has been created successfully. Welcome to Tranzift!'
          : 'Welcome back! You are successfully signed in.'
      );

      onClose?.();
    } catch (error) {
      console.error('Customer authentication failed:', error);

      notify(
        'error',
        error?.message || 'Something went wrong. Please try again.'
      );
    } finally {
      requestLock.current = false;
      setLoading(false);
    }
  };

  const returnToLogin = () => {
    if (loading) return;

    setPassword('');
    setPasswordConfirmation('');
    setNewPassword('');
    setConfirmNewPassword('');
    setResetComplete(false);
    resetRecovery();
    setMode('login');
  };

  const handleForgotBack = () => {
    if (loading) return;

    if (forgotStep === 1) {
      setMode('login');
    } else if (forgotStep === 2) {
      setForgotStep(1);
      setOtp(['', '', '', '', '', '']);
    } else {
      setForgotStep(2);
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  if (!open) return null;

  return (
    <>
      <Toast toast={toast} onClose={closeToast} />

      <style jsx global>{`
        .gift-card-phone-wrap .iti {
          width: 100%;
          height: 100%;
        }

        .gift-card-phone-wrap .iti input {
          width: 100%;
          height: 50px;
          border: 0;
          outline: none;
          background: transparent;
          padding-left: 96px;
          padding-right: 12px;
          font-size: 13px;
          font-weight: 600;
          color: var(--foreground);
        }

        .gift-card-phone-wrap .iti input::placeholder {
          color: #94a3b8;
        }

        .gift-card-phone-wrap .iti__country-container {
          height: 100%;
        }

        .gift-card-phone-wrap .iti__selected-country {
          height: 100%;
          padding: 0 9px 0 12px;
        }

        .gift-card-phone-wrap .iti__selected-dial-code {
          font-size: 12px;
          font-weight: 700;
          color: var(--foreground);
        }

        .gift-card-phone-wrap .iti__country-list {
          z-index: 10000;
          max-width: min(320px, calc(100vw - 48px));
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: var(--ve-shadow);
        }
        .auth-modal-scroll::-webkit-scrollbar {
          width: 5px;
        }

        .auth-modal-scroll::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 20px;
        }

        @keyframes auth-modal-enter {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .auth-modal-enter {
          animation: auth-modal-enter 0.22s ease-out;
        }
      `}</style>

      <div
        className="fixed inset-0 z-[9000] flex items-center justify-center overflow-y-auto bg-[rgba(13,27,42,0.78)] p-3 backdrop-blur-md sm:p-5"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !loading) onClose?.();
        }}
      >
        <div
          className={`auth-modal-enter relative my-auto grid w-full overflow-hidden rounded-[28px] bg-[var(--surface)] shadow-[0_35px_100px_rgba(13,27,42,0.32)] ${
            isForgot
              ? 'max-w-[430px] grid-cols-1'
              : 'max-w-[940px] lg:grid-cols-[0.9fr_1.1fr]'
          }`}
        >
          <button
            type="button"
            onClick={() => !loading && onClose?.()}
            aria-label="Close modal"
            className={`absolute right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full transition ${
              isForgot
                ? 'border border-[var(--border)] bg-white text-[var(--muted)] hover:bg-[var(--accent-light)] hover:text-[var(--primary-dark)]'
                : 'bg-white/15 text-white backdrop-blur-md hover:bg-white hover:text-[var(--primary-dark)]'
            }`}
          >
            <IconX size={18} />
          </button>

          {!isForgot && (
            <div className="relative hidden min-h-[620px] overflow-hidden bg-[var(--ve-dark)] p-8 lg:block">
              <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--primary)]/20 blur-3xl" />
              <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-[var(--primary-light)]/15 blur-3xl" />

              <div className="relative z-10 flex h-full flex-col">
                <Link href="/" className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)] text-[var(--ve-dark)]">
                    <IconGift size={25} />
                  </span>

                  <span>
                    <span className="block text-base font-black text-white">
                      Tranzift
                    </span>
                    <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--primary-light)]">
                      Digital Gift Cards
                    </span>
                  </span>
                </Link>

                <div className="mt-16">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--primary-light)]">
                    <IconSparkles size={14} />
                    Instant Digital Gifting
                  </div>

                  <h2 className="max-w-[390px] text-[38px] font-black leading-tight tracking-[-0.04em] text-white">
                    Gift something
                    <span className="block text-[var(--primary-light)]">
                      they&apos;ll love.
                    </span>
                  </h2>

                  <p className="mt-5 max-w-[380px] text-[13px] font-medium leading-6 text-slate-300">
                    Discover digital gift cards from popular brands and send
                    thoughtful gifts instantly, anytime and anywhere.
                  </p>
                </div>

                <div className="mt-auto">
                  <div className="w-[235px] rotate-[-4deg] rounded-[22px] border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--ve-dark)]">
                        <IconCreditCard size={19} />
                      </span>

                      <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--primary-light)]">
                        Digital
                      </span>
                    </div>

                    <div className="mt-6 text-[22px] font-black text-white">
                      ₹1,000
                    </div>

                    <div className="mt-1 text-[10px] font-medium text-slate-300">
                      Send instantly via email
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-3 gap-2">
                    {[
                      {
                        icon: IconClock,
                        title: 'Instant',
                        subtitle: 'Delivery',
                      },
                      {
                        icon: IconShieldCheck,
                        title: 'Secure',
                        subtitle: 'Accounts',
                      },
                      { icon: IconGift, title: '100+', subtitle: 'Gift Cards' },
                    ].map((item) => {
                      const ItemIcon = item.icon;

                      return (
                        <div
                          key={item.title}
                          className="rounded-2xl border border-white/10 bg-white/5 p-3"
                        >
                          <ItemIcon
                            size={17}
                            className="text-[var(--primary-light)]"
                          />
                          <div className="mt-2 text-[10px] font-bold text-white">
                            {item.title}
                          </div>
                          <div className="text-[9px] text-slate-300">
                            {item.subtitle}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            className={`auth-modal-scroll overflow-y-auto bg-[var(--surface)] ${
              isForgot
                ? 'max-h-[92vh] px-5 py-6 sm:px-8 sm:py-7'
                : 'max-h-[92vh] px-5 py-7 sm:px-8 sm:py-9 lg:px-10'
            }`}
          >
            {isForgot ? (
              <div className="mx-auto w-full max-w-[360px]">
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-light)] text-[var(--primary-dark)]">
                    {resetComplete ? (
                      <IconCheck size={22} />
                    ) : forgotStep === 1 ? (
                      <IconMail size={22} />
                    ) : forgotStep === 2 ? (
                      <IconKey size={22} />
                    ) : (
                      <IconShieldCheck size={22} />
                    )}
                  </span>

                  <div className="min-w-0 pr-7">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--primary-dark)]">
                      {resetComplete
                        ? 'Completed'
                        : `Password Recovery · ${forgotStep}/3`}
                    </div>

                    <h3 className="mt-1 text-xl font-black tracking-tight text-[var(--foreground)]">
                      {resetComplete
                        ? 'Password updated'
                        : forgotStep === 1
                          ? 'Forgot password?'
                          : forgotStep === 2
                            ? 'Verify your email'
                            : 'Create new password'}
                    </h3>
                  </div>
                </div>

                {resetComplete ? (
                  <div className="py-3 text-center">
                    <div className="mx-auto mb-4 flex h-[68px] w-[68px] items-center justify-center rounded-[22px] bg-emerald-50 text-emerald-600">
                      <IconCircleCheck size={36} />
                    </div>

                    <h4 className="text-lg font-black text-[var(--foreground)]">
                      You&apos;re all set!
                    </h4>

                    <p className="mx-auto mt-2 max-w-[280px] text-xs leading-5 text-[var(--muted)]">
                      Your password has been changed. Sign in using your new
                      password.
                    </p>

                    <button
                      type="button"
                      onClick={returnToLogin}
                      className="mt-6 flex h-[49px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary-dark)] text-xs font-black text-white transition hover:opacity-90"
                    >
                      <IconLogin size={17} />
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-6 flex gap-1.5">
                      {[1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className={`h-1.5 flex-1 rounded-full transition ${
                            forgotStep >= step
                              ? 'bg-[var(--primary)]'
                              : 'bg-[var(--border)]'
                          }`}
                        />
                      ))}
                    </div>

                    {forgotStep === 1 && (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          sendOtp();
                        }}
                        className="space-y-4"
                      >
                        <p className="mb-5 text-xs leading-5 text-[var(--muted)]">
                          Enter your registered email. We&apos;ll send you a
                          one-time verification code.
                        </p>

                        <div>
                          <label
                            htmlFor="forgot-email"
                            className="mb-2 block text-[11px] font-extrabold text-[var(--muted)]"
                          >
                            Email Address
                          </label>

                          <div className="relative">
                            <InputIcon>
                              <IconMail size={17} />
                            </InputIcon>

                            <input
                              id="forgot-email"
                              type="email"
                              value={email}
                              onChange={(event) => setEmail(event.target.value)}
                              placeholder="you@example.com"
                              autoComplete="email"
                              required
                              autoFocus
                              className="h-[50px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-11 pr-4 text-sm font-semibold text-[var(--foreground)] outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--accent-light)]"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="group flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary-dark)] text-xs font-black text-white shadow-[0_10px_22px_rgba(87,8,142,0.18)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {loading ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              Sending OTP...
                            </>
                          ) : (
                            <>
                              Send Verification Code
                              <IconArrowRight
                                size={17}
                                className="transition-transform group-hover:translate-x-1"
                              />
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setMode('login')}
                          disabled={loading}
                          className="flex h-10 w-full items-center justify-center gap-2 text-xs font-extrabold text-[var(--muted)] transition hover:text-[var(--primary-dark)] disabled:opacity-50"
                        >
                          <IconArrowLeft size={15} />
                          Back to Sign In
                        </button>
                      </form>
                    )}

                    {forgotStep === 2 && (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          verifyOtp();
                        }}
                        className="space-y-5"
                      >
                        <div className="mb-5 text-center">
                          <p className="text-xs leading-5 text-[var(--muted)]">
                            Enter the 6-digit code sent to
                          </p>

                          <p className="mt-1 break-all text-xs font-extrabold text-[var(--foreground)]">
                            {email}
                          </p>
                        </div>

                        <OtpInput otp={otp} setOtp={setOtp} otpRefs={otpRefs} />

                        <button
                          type="submit"
                          disabled={loading || otp.join('').length !== 6}
                          className="group flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary-dark)] text-xs font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {loading ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              Verify Code
                              <IconArrowRight
                                size={17}
                                className="transition-transform group-hover:translate-x-1"
                              />
                            </>
                          )}
                        </button>

                        <div className="flex flex-col items-center gap-3">
                          <button
                            type="button"
                            onClick={sendOtp}
                            disabled={loading || resendCooldown > 0}
                            className="flex items-center gap-2 text-xs font-extrabold text-[var(--primary-dark)] transition hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <IconRefresh size={15} />
                            {resendCooldown > 0
                              ? `Resend code in ${resendCooldown}s`
                              : 'Resend verification code'}
                          </button>

                          <button
                            type="button"
                            onClick={handleForgotBack}
                            disabled={loading}
                            className="text-[11px] font-bold text-[var(--muted)] transition hover:text-[var(--primary-dark)]"
                          >
                            Change email address
                          </button>
                        </div>
                      </form>
                    )}

                    {forgotStep === 3 && (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          resetPassword();
                        }}
                        className="space-y-4"
                      >
                        <p className="mb-5 text-xs leading-5 text-[var(--muted)]">
                          Set a strong password to secure your account.
                        </p>

                        <div>
                          <label className="mb-2 block text-[11px] font-extrabold text-[var(--muted)]">
                            New Password
                          </label>

                          <PasswordField
                            value={newPassword}
                            onChange={(event) =>
                              setNewPassword(event.target.value)
                            }
                            placeholder="Enter new password"
                            show={showNewPassword}
                            setShow={setShowNewPassword}
                            autoComplete="new-password"
                            minLength={8}
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-[11px] font-extrabold text-[var(--muted)]">
                            Confirm New Password
                          </label>

                          <PasswordField
                            value={confirmNewPassword}
                            onChange={(event) =>
                              setConfirmNewPassword(event.target.value)
                            }
                            placeholder="Confirm new password"
                            show={showConfirmNewPassword}
                            setShow={setShowConfirmNewPassword}
                            autoComplete="new-password"
                            minLength={8}
                          />
                        </div>

                        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
                          <p className="mb-2 text-[10px] font-extrabold text-[var(--foreground)]">
                            Password requirements
                          </p>

                          <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                            {[
                              {
                                label: '8+ characters',
                                valid: newPassword.length >= 8,
                              },
                              {
                                label: 'Uppercase letter',
                                valid: /[A-Z]/.test(newPassword),
                              },
                              {
                                label: 'Lowercase letter',
                                valid: /[a-z]/.test(newPassword),
                              },
                              {
                                label: 'At least one number',
                                valid: /[0-9]/.test(newPassword),
                              },
                              {
                                label: 'Special character',
                                valid: /[^A-Za-z0-9]/.test(newPassword),
                              },
                              {
                                label: 'Passwords match',
                                valid:
                                  newPassword.length > 0 &&
                                  newPassword === confirmNewPassword,
                              },
                            ].map((rule) => (
                              <div
                                key={rule.label}
                                className={`flex items-center gap-1.5 text-[9px] font-semibold ${
                                  rule.valid
                                    ? 'text-emerald-600'
                                    : 'text-[var(--muted)]'
                                }`}
                              >
                                <IconCheck size={12} />
                                {rule.label}
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="group flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary-dark)] text-xs font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {loading ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              Updating Password...
                            </>
                          ) : (
                            <>
                              Reset Password
                              <IconCheck size={17} />
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleForgotBack}
                          disabled={loading}
                          className="flex h-9 w-full items-center justify-center gap-2 text-xs font-extrabold text-[var(--muted)] transition hover:text-[var(--primary-dark)] disabled:opacity-50"
                        >
                          <IconArrowLeft size={15} />
                          Back to OTP
                        </button>
                      </form>
                    )}
                  </>
                )}

                <div className="mt-6 flex items-center justify-center gap-2 border-t border-[var(--border)] pt-4 text-[10px] font-bold text-[var(--muted)]">
                  <IconShieldCheck
                    size={14}
                    className="text-[var(--success)]"
                  />
                  Secure password recovery
                </div>
              </div>
            ) : (
              <>
                <div className="mb-7">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-light)] text-[var(--primary-dark)] lg:hidden">
                    {isLogin ? (
                      <IconLogin size={21} />
                    ) : (
                      <IconUserPlus size={21} />
                    )}
                  </div>

                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--primary-dark)]">
                    {isLogin ? 'Welcome Back' : 'Join Us'}
                  </div>

                  <h3 className="mt-2 text-2xl font-black tracking-tight text-[var(--foreground)] sm:text-[27px]">
                    {isLogin
                      ? 'Sign in to your account'
                      : 'Create your gift account'}
                  </h3>

                  <p className="mt-2 max-w-[430px] text-xs font-medium leading-5 text-[var(--muted)]">
                    {isLogin
                      ? 'Access your gift cards, orders, wishlist and exclusive offers.'
                      : 'Save your details and make your next digital gift even faster.'}
                  </p>
                </div>

                <div className="mb-7 flex rounded-[15px] bg-[var(--background)] p-1">
                  {[
                    { value: 'login', label: 'Sign In', icon: IconLogin },
                    {
                      value: 'register',
                      label: 'Create Account',
                      icon: IconUserPlus,
                    },
                  ].map((item) => {
                    const ItemIcon = item.icon;
                    const active = mode === item.value;

                    return (
                      <button
                        type="button"
                        key={item.value}
                        onClick={() => setMode(item.value)}
                        disabled={loading}
                        className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-xs font-extrabold transition ${
                          active
                            ? 'bg-[var(--primary-dark)] text-white shadow-md'
                            : 'text-[var(--muted)] hover:text-[var(--primary-dark)]'
                        }`}
                      >
                        <ItemIcon size={16} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {isRegister && (
                    <div>
                      <label className="mb-2 block text-[11px] font-extrabold text-[var(--muted)]">
                        Full Name
                      </label>

                      <div className="relative">
                        <InputIcon>
                          <IconUser size={17} />
                        </InputIcon>

                        <input
                          type="text"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          placeholder="Enter your full name"
                          autoComplete="name"
                          required
                          className="h-[50px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-11 pr-4 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--accent-light)]"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="customer-auth-email"
                      className="mb-2 block text-[11px] font-extrabold text-[var(--muted)]"
                    >
                      Email Address
                    </label>

                    <div className="relative">
                      <InputIcon>
                        <IconMail size={17} />
                      </InputIcon>

                      <input
                        id="customer-auth-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="Enter your email"
                        autoComplete="email"
                        required
                        className="h-[50px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-11 pr-4 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--accent-light)]"
                      />
                    </div>
                  </div>

                  {isRegister && (
                    <div>
                      <label className="mb-2 block text-[11px] font-extrabold text-[var(--muted)]">
                        Mobile Number
                      </label>

                      <div className="gift-card-phone-wrap relative h-[50px] rounded-xl border border-[var(--border)] bg-[var(--background)] transition focus-within:border-[var(--primary)] focus-within:bg-white focus-within:ring-4 focus-within:ring-[var(--accent-light)]">
                        <input
                          ref={phoneInputRef}
                          type="tel"
                          placeholder="Enter mobile number"
                          autoComplete="tel"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-[11px] font-extrabold text-[var(--muted)]">
                      Password
                    </label>

                    <PasswordField
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      show={showPassword}
                      setShow={setShowPassword}
                      autoComplete={
                        isLogin ? 'current-password' : 'new-password'
                      }
                    />
                  </div>

                  {isRegister && (
                    <div>
                      <label className="mb-2 block text-[11px] font-extrabold text-[var(--muted)]">
                        Confirm Password
                      </label>

                      <PasswordField
                        value={passwordConfirmation}
                        onChange={(event) =>
                          setPasswordConfirmation(event.target.value)
                        }
                        placeholder="Confirm your password"
                        show={showConfirmationPassword}
                        setShow={setShowConfirmationPassword}
                        autoComplete="new-password"
                      />
                    </div>
                  )}

                  {isLogin && (
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <label className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-[var(--muted)]">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 accent-[var(--primary)]"
                        />
                        Remember me
                      </label>

                      <button
                        type="button"
                        onClick={openForgotPassword}
                        disabled={loading}
                        className="text-[11px] font-extrabold text-[var(--primary-dark)] transition hover:opacity-75"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="group mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary-dark)] text-xs font-black text-white shadow-[0_12px_25px_rgba(13,27,42,0.15)] transition hover:bg-[var(--ve-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Please wait...
                      </>
                    ) : (
                      <>
                        {isLogin ? 'Sign In Securely' : 'Create My Account'}
                        <IconArrowRight
                          size={17}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-[var(--border)]" />

                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
                    Secure &amp; Private
                  </span>

                  <div className="h-px flex-1 bg-[var(--border)]" />
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-[10px] font-bold text-[var(--muted)]">
                  <span className="flex items-center gap-1.5">
                    <IconShieldCheck
                      size={14}
                      className="text-[var(--success)]"
                    />
                    Secure
                  </span>

                  <span className="flex items-center gap-1.5">
                    <IconCreditCard
                      size={14}
                      className="text-[var(--primary-dark)]"
                    />
                    Safe Payments
                  </span>

                  <span className="flex items-center gap-1.5">
                    <IconGift
                      size={14}
                      className="text-[var(--primary-dark)]"
                    />
                    Digital Gifts
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
