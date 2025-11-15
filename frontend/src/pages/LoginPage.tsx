import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from 'lucide-react';
import "./LoginPage.css";
import SooruAILogo from "../SooruAI.svg";
import { API_URL } from "../config";

const backendURL = `${API_URL}/auth`;

const RequiredIndicator = {
  color: "#ff0000",
  marginLeft: "3px",
  fontSize: "0.8em",
};

// OTP Verification Modal
interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (emailOtp: string) => void;
  email: string;
  loading: boolean;
  error: string;
  onResendOTP: () => void;
}

const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  email,
  loading,
  error,
  onResendOTP
}) => {
  const [emailOtp, setEmailOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [resendLoading, setResendLoading] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });

  // Sync with theme changes
  useEffect(() => {
    const checkTheme = () => {
      const savedTheme = localStorage.getItem("theme");
      setIsDarkMode(savedTheme === "dark");
    };

    checkTheme();
    window.addEventListener("storage", checkTheme);
    const interval = setInterval(checkTheme, 100);

    return () => {
      window.removeEventListener("storage", checkTheme);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isOpen && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVerify(emailOtp);
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await onResendOTP();
      setTimeLeft(300);
      setEmailOtp("");
    } catch (error) {
      console.error('Resend failed:', error);
    } finally {
      setResendLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="otp-modal-overlay" onClick={onClose}>
      <div className={`otp-modal-container ${isDarkMode ? 'otp-dark-theme' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="otp-modal-header">
          <h2 className="otp-modal-title">Verify Your Email</h2>
          <button className="otp-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="otp-modal-content">
          <p className="otp-modal-description">
            We've sent a verification code to your email address. Please enter the code to complete registration.
          </p>

          <div className="otp-contact-info">
            <div className="otp-contact-item">
              <span className="otp-icon">📧</span>
              <span className="otp-contact-text">{email}</span>
            </div>
          </div>

          {error && <div className="otp-error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="otp-form">
            <div className="otp-input-group">
              <label className="otp-input-label">Email Verification Code</label>
              <input
                type="text"
                className="otp-code-input"
                placeholder="0000"
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                required
              />
            </div>

            <div className="otp-timer-section">
              <span className="otp-timer">Time remaining: {formatTime(timeLeft)}</span>
            </div>

            <div className="otp-button-group">
              <button
                type="button"
                className="otp-resend-btn"
                onClick={handleResend}
                disabled={timeLeft > 0 || loading || resendLoading}
              >
                {resendLoading ? <span className="spinner"></span> : "Resend Code"}
              </button>
              <button
                type="submit"
                className="otp-verify-btn"
                disabled={loading || !emailOtp || emailOtp.length !== 4}
              >
                {loading ? <span className="spinner"></span> : "Verify Email"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Forgot Password Modal
interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ 
  isOpen, 
  onClose,
  onSuccess 
}) => {
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });

  // Sync with theme changes
  useEffect(() => {
    const checkTheme = () => {
      const savedTheme = localStorage.getItem("theme");
      setIsDarkMode(savedTheme === "dark");
    };

    checkTheme();
    window.addEventListener("storage", checkTheme);
    const interval = setInterval(checkTheme, 100);

    return () => {
      window.removeEventListener("storage", checkTheme);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  // Reset modal state when closing
  const handleClose = () => {
    setStep('email');
    setEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
    setTimeLeft(0);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!email || !email.includes('@')) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${backendURL}/send-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type:"forgot-password",
          email
         }),
      });
      
      if (response.ok) {
        setSuccess("OTP sent successfully to your email!");
        setStep('reset');
        setTimeLeft(300); // 5 minutes countdown
      } else {
        const data = await response.json();
        setError(data.error || data.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (otp.length !== 4) {
      setError("Please enter a valid 4-digit OTP.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${backendURL}/password/reset/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Password reset successfully!");
        setTimeout(() => {
          handleClose();
          onSuccess("Password reset successfully! Please log in with your new password.");
        }, 2000);
      } else {
        if (data.new_password) {
          const passwordErrors = Array.isArray(data.new_password)
            ? data.new_password
            : [data.new_password];
          const messages: string[] = [];

          if (passwordErrors.some((err: string) => err.includes("too short"))) {
            messages.push("be at least 8 characters long");
          }
          if (passwordErrors.some((err: string) => err.includes("too common"))) {
            messages.push("not be too common");
          }
          if (passwordErrors.some((err: string) => err.includes("entirely numeric"))) {
            messages.push("not be entirely numeric");
          }

          if (messages.length > 0) {
            setError(`Your password must ${messages.join(", ")}.`);
          } else {
            setError(passwordErrors[0]);
          }
        } else if (data.confirm_password) {
          setError(Array.isArray(data.confirm_password) ? data.confirm_password[0] : data.confirm_password);
        } else if (data.email) {
          setError(Array.isArray(data.email) ? data.email[0] : data.email);
        } else if (data.otp) {
          setError(Array.isArray(data.otp) ? data.otp[0] : data.otp);
        } else if (data.error) {
          setError(data.error);
        } else if (data.detail) {
          setError(data.detail);
        } else if (data.message) {
          setError(data.message);
        } else {
          setError("Failed to reset password. Please try again.");
        }
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${backendURL}/send-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type:"forgot-password",
          email 
        }),
      });
      
      if (response.ok) {
        setSuccess("New OTP sent successfully!");
        setTimeLeft(300);
        setOtp("");
      } else {
        const data = await response.json();
        setError(data.error || data.message || "Failed to resend OTP. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="forgot-modal-overlay" onClick={handleClose}>
      <div className={`forgot-modal-container ${isDarkMode ? 'forgot-dark-theme' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="forgot-modal-header">
          <h2 className="forgot-modal-title">Reset Password</h2>
          <button className="forgot-close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="forgot-modal-content">
          {success && <div className="forgot-success-message">{success}</div>}
          {error && <div className="forgot-error-message">{error}</div>}

          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="forgot-form">
              <p className="forgot-modal-description">
                Enter your email address and we'll send you a verification code to reset your password.
              </p>
              
              <div className="forgot-form-group">
                <label className="forgot-form-label">Email Address</label>
                <input
                  type="email"
                  className="forgot-form-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="forgot-button-group">
                <button type="button" className="forgot-cancel-btn" onClick={handleClose}>
                  Cancel
                </button>
                <button type="submit" className="forgot-send-btn" disabled={loading}>
                  {loading ? <span className="spinner"></span> : "Send OTP"}
                </button>
              </div>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="forgot-form">
              <p className="forgot-modal-description">
                We've sent a verification code to {email}. Enter the code and your new password below.
              </p>

              <div className="forgot-form-group">
                <label className="forgot-form-label">Verification Code</label>
                <input
                  type="text"
                  className="forgot-otp-input"
                  placeholder="0000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  required
                />
              </div>

              <div className="forgot-form-group">
                <label className="forgot-form-label">New Password</label>
                <div className="input-wrapper">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="forgot-form-input"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowNewPassword(!showNewPassword)} 
                    className="password-toggle-btn"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <small className="password-hint">
                  Password must be at least 8 characters long and not too common
                </small>
              </div>

              <div className="forgot-form-group">
                <label className="forgot-form-label">Confirm Password</label>
                <div className="input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="forgot-form-input"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    className="password-toggle-btn"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {timeLeft > 0 && (
                <div className="forgot-timer">
                  <span>Resend available in: {formatTime(timeLeft)}</span>
                </div>
              )}

              <div className="forgot-button-group">
                <button
                  type="button"
                  className="forgot-resend-btn"
                  onClick={handleResendOTP}
                  disabled={timeLeft > 0 || loading}
                >
                  {loading ? <span className="spinner"></span> : "Resend OTP"}
                </button>
                <button 
                  type="submit" 
                  className="forgot-reset-btn" 
                  disabled={loading || !otp || otp.length !== 4 || newPassword !== confirmPassword}
                >
                  {loading ? <span className="spinner"></span> : "Reset Password"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

interface LoginFormProps {
  onRegisterClick: () => void;
  successMessage: string;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onRegisterClick,
  successMessage,
}) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

  try {
    const response = await fetch(`${backendURL}/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      const accessToken = data.access;
      const refreshToken = data.refresh;

      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);

      // Start both fetches in parallel — don't await yet
      const profilePromise = fetch(`${backendURL}/profile/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const projectsPromise = fetch(`${API_URL}/projects/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      // Process responses in the background (no blocking)  
      Promise.allSettled([profilePromise, projectsPromise]).then(async ([profileRes, projectsRes]) => {
        console.log("Background fetches completed");
        try {
          if (profileRes.status === "fulfilled" && profileRes.value.ok) {
            const profileData = await profileRes.value.json();
            const userProfile = {
              ...profileData.profile,
              access_token: accessToken,
              refresh_token: refreshToken,
            };
            sessionStorage.setItem("userProfile", JSON.stringify(userProfile));

            if (profileData.company) {
              sessionStorage.setItem("companyProfile", JSON.stringify(profileData.company));
            }
          }
          if (projectsRes.status === "fulfilled" && projectsRes.value.ok) {
            const projectsData = await projectsRes.value.json();
            console.log("userProject" , projectsData)
            localStorage.setItem("userProjects", JSON.stringify(projectsData));
          }
          // Continue to redirect immediately 
          const urlParams = new URLSearchParams(window.location.search);
          const redirectTo = urlParams.get("redirect");
          window.location.href = redirectTo ? decodeURIComponent(redirectTo) : "/";
          setLoading(false);
        } catch (err) {
          console.error("Error storing background data", err);
        }
      });
    } else {
      setError(data.message || data.error || "Login failed, incorrect username or password");
      setLoading(false);
    }
  } catch (error) {
    setError("Something went wrong. Please try again.");
    setLoading(false);
  }

  };

  const handleForgotPasswordSuccess = (message: string) => {
    setForgotPasswordMessage(message);
    setShowForgotPassword(false);
    
    // Clear the message after 10 seconds
    setTimeout(() => {
      setForgotPasswordMessage("");
    }, 10000);
  };

  return (
    <>
      <motion.div
        className="form-wrapper"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.5 }}
      >
        <div className="form-header">
          <h2>Sign In</h2>
          <p className="form-subtitle">Welcome back! Please enter your details</p>
        </div>

        {successMessage && <p className="success-message">{successMessage}</p>}
        {forgotPasswordMessage && <p className="success-message">{forgotPasswordMessage}</p>}
        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">
              Email / Phone Number
              <span style={RequiredIndicator}>*</span>
            </label>
            <div className="input-wrapper">
              <input
                type="text"
                className="form-input"
                placeholder="Enter your email or phone"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Password
              <span style={RequiredIndicator}>*</span>
            </label>
            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="password-toggle-btn"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="forgot-password-container">
              <button
                type="button"
                className="forgot-password"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot password?
              </button>
            </div>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? <span className="spinner"></span> : "Sign In"}
          </button>
        </form>

        <div className="register-section">
          <span>Don't have an account?</span>
          <button onClick={onRegisterClick} className="register-link">
            Create account
          </button>
        </div>
      </motion.div>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccess={handleForgotPasswordSuccess}
      />
    </>
  );
};

interface RegisterFormProps {
  onBackToLogin: (successMessage: string) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onBackToLogin }) => {
  const [companyName, setCompanyName] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showOTPModal, setShowOTPModal] = useState<boolean>(false);
  const [otpError, setOtpError] =useState<string>("");
  const [otpLoading, setOtpLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Phone number validation
  const validatePhoneNumber = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length === 0) {
      setPhoneError("");
      return true;
    }
    
    if (cleaned.length < 10) {
      setPhoneError("Phone number must be exactly 10 digits");
      return false;
    }
    
    if (cleaned.length > 10) {
      setPhoneError("Phone number must be exactly 10 digits");
      return false;
    }
    
    setPhoneError("");
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPhone(value);
      validatePhoneNumber(value);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate phone number before proceeding
    if (!validatePhoneNumber(phone)) {
      setLoading(false);
      return;
    }

    if (phone.length !== 10) {
      setError("Phone number must be exactly 10 digits");
      setLoading(false);
      return;
    }

    try {
      // API Request 1: Send OTP with all user details
      const response = await fetch(`${backendURL}/send-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type:"signup",
          company_name: companyName,
          first_name: firstName,
          last_name: lastName,
          email,
          phone_number: phone,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowOTPModal(true);
      } else {
        // Handle validation errors from backend
        if (data.email) {
          setError(Array.isArray(data.email) ? data.email[0] : data.email);
        } else if (data.phone_number) {
          setError(Array.isArray(data.phone_number) ? data.phone_number[0] : data.phone_number);
        } else if (data.password) {
          const passwordErrors = Array.isArray(data.password) ? data.password : [data.password];
          const messages: string[] = [];

          if (passwordErrors.some((err: string) => err.includes("too short"))) {
            messages.push("be at least 8 characters long");
          }
          if (passwordErrors.some((err: string) => err.includes("too common"))) {
            messages.push("not be too common");
          }
          if (passwordErrors.some((err: string) => err.includes("entirely numeric"))) {
            messages.push("not be entirely numeric");
          }

          if (messages.length > 0) {
            setError(`Your password must ${messages.join(", ")}.`);
          } else {
            setError(passwordErrors[0]);
          }
        } else if (data.error) {
          setError(data.error);
        } else if (data.message) {
          setError(data.message);
        } else {
          setError("Failed to send verification code. Please try again.");
        }
      }
    } catch (error) {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = async (emailOtp: string) => {
    setOtpError("");
    setOtpLoading(true);

    try {
      // API Request 2: Verify OTP and complete registration
      const response = await fetch(`${backendURL}/verify-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: emailOtp,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowOTPModal(false);
        onBackToLogin("Registration successful! Please log in.");
      } else {
        // Handle errors
        if (data.error) {
          setOtpError(data.error);
        } else if (data.message) {
          setOtpError(data.message);
        } else if (data.otp) {
          setOtpError(Array.isArray(data.otp) ? data.otp[0] : data.otp);
        } else {
          setOtpError("OTP verification failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      setOtpError("Something went wrong. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      // Resend OTP by calling send-otp endpoint again
      const response = await fetch(`${backendURL}/send-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type:"resend-signup",
          company_name: companyName,
          first_name: firstName,
          last_name: lastName,
          email,
          phone_number: phone,
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || "Failed to resend OTP");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      throw error;
    }
  };

  return (
    <>
      <motion.div
        className="form-wrapper register-form"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.5 }}
      >
        <div className="form-header">
          <h2>Create Account</h2>
        </div>

        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Company Name</label>
            <div className="input-wrapper">
              <input
                type="text"
                className="form-input"
                placeholder="Your company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half-width">
              <label className="form-label">
                First Name
                <span style={RequiredIndicator}>*</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  className="form-input"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group half-width">
              <label className="form-label">Last Name</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half-width">
              <label className="form-label">
                Email
                <span style={RequiredIndicator}>*</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="email"
                  className="form-input"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group half-width">
              <label className="form-label">
                Phone Number
                <span style={RequiredIndicator}>*</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="tel"
                  className={`form-input ${phoneError ? 'error' : ''}`}
                  placeholder="1234567890"
                  value={phone}
                  onChange={handlePhoneChange}
                  required
                />
              </div>
              {phoneError && <p className="phone-error-message">{phoneError}</p>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Password
              <span style={RequiredIndicator}>*</span>
            </label>
            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="password-toggle-btn"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="submit-button" disabled={loading || phoneError !== ""}>
            {loading ? <span className="spinner"></span> : "Create Account"}
          </button>
        </form>

        <div className="register-section">
          <span>Already have an account?</span>
          <button onClick={() => onBackToLogin("")} className="register-link">
            Sign in here
          </button>
        </div>
      </motion.div>

      <OTPVerificationModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onVerify={handleOTPVerification}
        email={email}
        loading={otpLoading}
        error={otpError}
        onResendOTP={handleResendOTP}
      />
    </>
  );
};

const LoginPage: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });

  // Sync with theme changes
  useEffect(() => {
    const checkTheme = () => {
      const savedTheme = localStorage.getItem("theme");
      const newIsDarkMode = savedTheme === "dark";
      setIsDarkMode(newIsDarkMode);
      document.body.classList.toggle("dark", newIsDarkMode);
    };

    checkTheme();
    window.addEventListener("storage", checkTheme);
    const interval = setInterval(checkTheme, 100);

    return () => {
      window.removeEventListener("storage", checkTheme);
      clearInterval(interval);
    };
  }, []);

  const handleSuccessMessage = (message: string) => {
    setSuccessMessage(message);

    setTimeout(() => {
      setSuccessMessage("");
    }, 10000);
  };

  return (
    <div className={`auth-container ${isDarkMode ? "dark-theme" : ""}`}>
      <div className="left-section">
        <motion.div className="logo-wrapper">
          <motion.img
            src={SooruAILogo}
            alt="SOORU.AI Logo"
            className="logo-image"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          />
          <motion.h1
            className="brand-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            SOORU.AI
          </motion.h1>
          <motion.h2
            className="tagline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Syntax to Skylines
          </motion.h2>
          <motion.div className="slogans">
            <motion.p
              className="slogan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Build Your Dreams with Our AI!
            </motion.p>
            <motion.p
              className="slogan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Effortless. Precise. Limitless.
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
      <div className="right-section">
        <AnimatePresence mode="wait">
          {!isRegistering ? (
            <LoginForm
              key="login"
              onRegisterClick={() => setIsRegistering(true)}
              successMessage={successMessage}
            />
          ) : (
            <RegisterForm
              key="register"
              onBackToLogin={(msg) => {
                setIsRegistering(false);
                if (msg) {
                  handleSuccessMessage(msg);
                }
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LoginPage;