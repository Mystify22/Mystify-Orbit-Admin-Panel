import React, { useState, useRef, useEffect } from 'react';
import {
  Smartphone,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useUploads } from '../../context/UploadContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { addToast } = useUploads();

  // Step state: 'mobile' | 'otp'
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');

  // Input states
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timer for OTP resend countdown
  const [resendCountdown, setResendCountdown] = useState(30);
  const canResend = resendCountdown === 0 && !isResending;

  // Focus refs for the 6 OTP input boxes
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Format mobile number (digits only, max 10)
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(raw);
    if (errorMessage) setErrorMessage(null);
  };

  // Handle Send OTP (First time from mobile screen)
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (mobileNumber.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await authService.sendOtp(mobileNumber);
      setStep('otp');
      setResendCountdown(30);
      setOtpDigits(['', '', '', '', '', '']);
      addToast('success', 'OTP Sent', response.message);

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP. Try again.';
      setErrorMessage(msg);
      addToast('error', 'Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend OTP (Calls send-otp API again from OTP screen)
  const handleResendOtp = async () => {
    if (!mobileNumber || isResending) return;

    setIsResending(true);
    setErrorMessage(null);

    try {
      const response = await authService.sendOtp(mobileNumber);
      setResendCountdown(30);
      setOtpDigits(['', '', '', '', '', '']);
      addToast('success', 'OTP Resent', response.message || 'New OTP sent successfully.');

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend OTP. Please try again.';
      setErrorMessage(msg);
      addToast('error', 'Resend Failed', msg);
    } finally {
      setIsResending(false);
    }
  };

  // Resend Countdown Timer
  useEffect(() => {
    if (step !== 'otp' || resendCountdown <= 0) return;

    const timer = setTimeout(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [step, resendCountdown]);

  // Handle individual OTP digit change
  const handleOtpDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pastedDigits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newDigits = [...otpDigits];
      pastedDigits.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pastedDigits.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      if (errorMessage) setErrorMessage(null);
      return;
    }

    const cleanChar = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = cleanChar;
    setOtpDigits(newDigits);
    if (errorMessage) setErrorMessage(null);

    if (cleanChar && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace and Navigation in OTP fields
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit OTP.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await authService.verifyOtp(mobileNumber, fullOtp);
      if (response.success && response.user) {
        addToast('success', 'Logged in', 'Verification successful.');
        login(response.user);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid OTP code entered.';
      setErrorMessage(msg);
      addToast('error', 'Verification Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const formattedMobileDisplay = mobileNumber
    ? `+91 ${mobileNumber.slice(0, 5)} ${mobileNumber.slice(5)}`
    : '+91';

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#faf8f8',
        backgroundImage: `
          radial-gradient(at 0% 0%, rgba(220, 38, 38, 0.08) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(220, 38, 38, 0.06) 0px, transparent 50%)
        `,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Main Login Card */}
      <div
        className="red-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '36px 32px',
          position: 'relative',
          zIndex: 10,
          boxShadow: '0 20px 40px -10px rgba(220, 38, 38, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)',
          border: '1.5px solid var(--border-card)',
          animation: 'scaleUp 0.35s ease-out',
        }}
      >
        {/* Brand Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 16px auto',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(220, 38, 38, 0.35)',
              fontWeight: 900,
              fontSize: '1.75rem',
              letterSpacing: '-0.03em',
            }}
          >
            M
          </div>

          <h1
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: '6px',
            }}
          >
            Mystify Orbit
          </h1>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            {step === 'mobile'
              ? 'Enter your mobile number to receive a verification OTP'
              : 'Enter the 6-digit OTP sent to your phone'}
          </p>
        </div>

        {/* Step Progress */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '26px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--primary-red)',
            }}
          >
            <span
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-red)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
              }}
            >
              1
            </span>
            <span>Phone</span>
          </div>

          <div
            style={{
              width: '40px',
              height: '2px',
              backgroundColor: step === 'otp' ? 'var(--primary-red)' : 'var(--border-card)',
              transition: 'background-color 0.3s ease',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: step === 'otp' ? 'var(--primary-red)' : 'var(--text-muted)',
            }}
          >
            <span
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                backgroundColor: step === 'otp' ? 'var(--primary-red)' : 'var(--bg-subtle)',
                border: `1.5px solid ${step === 'otp' ? 'var(--primary-red)' : 'var(--border-card)'}`,
                color: step === 'otp' ? '#fff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
              }}
            >
              2
            </span>
            <span>OTP</span>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1.5px solid #fca5a5',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.825rem', color: '#b91c1c', fontWeight: 600, lineHeight: 1.35 }}>
              {errorMessage}
            </p>
          </div>
        )}

        {/* STEP 1: PHONE NUMBER ENTRY */}
        {step === 'mobile' && (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">
                <Smartphone size={16} color="var(--primary-red)" />
                <span>Mobile Number</span>
              </label>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-card)',
                  backgroundColor: '#ffffff',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                {/* Country Code Prefix */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '12px 14px',
                    backgroundColor: 'var(--primary-red-subtle)',
                    borderRight: '1.5px solid var(--border-card)',
                    color: 'var(--primary-red)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    userSelect: 'none',
                  }}
                >
                  <span>🇮🇳</span>
                  <span>+91</span>
                </div>

                {/* Input for 10-digit number */}
                <input
                  type="tel"
                  autoFocus
                  placeholder="Enter 10-digit number"
                  value={mobileNumber}
                  onChange={handleMobileChange}
                  maxLength={10}
                  style={{
                    flex: 1,
                    border: 'none',
                    padding: '12px 14px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontFamily: 'var(--font-sans)',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  marginTop: '4px',
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {mobileNumber.length}/10 digits
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || mobileNumber.length < 10}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '0.95rem',
                fontWeight: 700,
                marginTop: '4px',
              }}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="spin-animation" />
                  <span>Sending OTP...</span>
                </>
              ) : (
                <>
                  <span>Send OTP</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Target Phone Display & Edit Option */}
            <div
              style={{
                backgroundColor: 'var(--primary-red-subtle)',
                border: '1.5px solid var(--primary-red-soft)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={16} color="var(--primary-red)" />
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formattedMobileDisplay}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep('mobile');
                  setErrorMessage(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-red)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  textDecoration: 'underline',
                }}
              >
                Change
              </button>
            </div>

            {/* OTP Input Boxes (6 Digits) */}
            <div className="form-group">
              <label className="form-label" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <KeyRound size={16} color="var(--primary-red)" />
                  <span>Enter 6-Digit OTP</span>
                </div>
              </label>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: '8px',
                  marginTop: '4px',
                }}
              >
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    style={{
                      width: '100%',
                      height: '52px',
                      textAlign: 'center',
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${digit ? 'var(--primary-red)' : 'var(--border-card)'}`,
                      backgroundColor: digit ? 'var(--primary-red-subtle)' : '#ffffff',
                      color: 'var(--primary-red)',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxShadow: digit ? '0 0 0 2px var(--primary-red-glow)' : 'none',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--primary-red)';
                      e.target.style.boxShadow = '0 0 0 3.5px var(--primary-red-glow)';
                      e.target.select();
                    }}
                    onBlur={(e) => {
                      if (!digit) {
                        e.target.style.borderColor = 'var(--border-card)';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  />
                ))}
              </div>

            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isLoading || otpDigits.join('').length !== 6}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '0.95rem',
                fontWeight: 700,
              }}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="spin-animation" />
                  <span>Verifying OTP...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Verify OTP</span>
                </>
              )}
            </button>

            {/* Resend OTP & Back actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '6px',
                borderTop: '1px solid var(--border-light)',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setStep('mobile');
                  setErrorMessage(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <div style={{ fontSize: '0.8rem' }}>
                {isResending ? (
                  <span
                    style={{
                      color: 'var(--primary-red)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <RefreshCw size={12} className="spin-animation" />
                    <span>Resending OTP...</span>
                  </span>
                ) : canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-red)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <RefreshCw size={12} />
                    <span>Resend OTP</span>
                  </button>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>
                    Resend OTP in <strong style={{ color: 'var(--primary-red)' }}>{resendCountdown}s</strong>
                  </span>
                )}
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Footer Branding */}
      <footer
        style={{
          marginTop: '24px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
        }}
      >
        <p>© {new Date().getFullYear()} Mystify Orbit. All rights reserved.</p>
      </footer>
    </div>
  );
};
