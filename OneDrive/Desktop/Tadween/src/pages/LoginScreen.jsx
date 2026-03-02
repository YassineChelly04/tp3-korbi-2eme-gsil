import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Shield,
} from "lucide-react";

/* ── Password strength helper ─────────────────────────── */
function getPasswordStrength(pwd) {
  if (!pwd) return { score: 0, label: "", color: "var(--text-muted, #64748b)" };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  const levels = [
    { label: "Too short", color: "var(--danger, #ef4444)" },
    { label: "Weak", color: "var(--danger, #ef4444)" },
    { label: "Fair", color: "var(--warning, #f59e0b)" },
    { label: "Good", color: "var(--success, #22c55e)" },
    { label: "Strong", color: "var(--success, #22c55e)" },
    { label: "Very strong", color: "#06b6d4" },
  ];
  return { score, ...levels[score] };
}

/* ── Framer-motion variants ───────────────────────────── */
const shakeVariants = {
  idle: { x: 0 },
  shake: {
    x: [-8, 8, -5, 5, -3, 3, 0],
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

const orbConfigs = [
  { size: 320, top: "-80px", right: "-80px", opacity: 0.07, dur: 8 },
  { size: 220, bottom: "-60px", left: "-50px", opacity: 0.05, dur: 11 },
  { size: 160, top: "50%", left: "-40px", opacity: 0.04, dur: 7 },
  { size: 100, top: "20%", right: "15%", opacity: 0.06, dur: 9 },
  { size: 80, bottom: "30%", right: "-20px", opacity: 0.03, dur: 13 },
];

const waveData = [
  { cls: "tw-wave tw-wave--1", fill: "rgba(255,255,255,0.10)", d: "M0,192L80,181C160,171,320,149,480,160C640,171,800,213,960,208C1120,203,1280,149,1360,122L1440,96L1440,320L0,320Z" },
  { cls: "tw-wave tw-wave--2", fill: "rgba(255,255,255,0.07)", d: "M0,256L60,240C120,224,240,192,360,181C480,171,600,181,720,192C840,203,960,213,1080,202C1200,192,1320,160,1380,144L1440,128L1440,320L0,320Z" },
  { cls: "tw-wave tw-wave--3", fill: "rgba(255,255,255,0.05)", d: "M0,128L80,149C160,171,320,213,480,218C640,224,800,192,960,181C1120,171,1280,181,1360,186L1440,192L1440,320L0,320Z" },
];

/* ─────────────────────────────────────────────────────────
   Right panel – animated deep-blue background with waves
───────────────────────────────────────────────────────── */
function BlueSide() {
  const prefersReduced = useReducedMotion();

  return (
    <div className="tw-blue-side">
      {/* floating orbs – framer-motion driven */}
      {orbConfigs.map((orb, i) => (
        <motion.div
          key={i}
          aria-hidden="true"
          style={{
            position: "absolute",
            width: orb.size,
            height: orb.size,
            borderRadius: "50%",
            background: `rgba(255,255,255,${orb.opacity})`,
            top: orb.top,
            right: orb.right,
            bottom: orb.bottom,
            left: orb.left,
            pointerEvents: "none",
          }}
          animate={
            prefersReduced
              ? {}
              : {
                  y: [0, -(20 + i * 8), 0],
                  x: [0, 10 + i * 5, 0],
                  scale: [1, 1.06, 1],
                }
          }
          transition={{
            duration: orb.dur,
            ease: "easeInOut",
            repeat: Infinity,
            delay: i * 1.5,
          }}
        />
      ))}

      {/* wave SVG layers */}
      <div className="tw-waves">
        {waveData.map(({ cls, fill, d }) => (
          <svg
            key={cls}
            className={cls}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path fill={fill} d={d} />
          </svg>
        ))}
      </div>

      {/* brand copy – animated entrance */}
      <motion.div
        className="tw-brand"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
      >
        <motion.div
          className="tw-brand-logo"
          animate={prefersReduced ? {} : { rotate: [0, 3, -3, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="tw-brand-letter">T</span>
        </motion.div>
        <h2 className="tw-brand-name">Tadween</h2>
        <p className="tw-brand-tagline">Your Thoughts, Locked.</p>
        <p className="tw-brand-sub">
          A private, encrypted space for everything you think, plan, and create.
        </p>
      </motion.div>

      {/* decorative dots grid – staggered pulse */}
      <div className="tw-dots" aria-hidden="true">
        {Array.from({ length: 24 }).map((_, i) => (
          <motion.div
            key={i}
            className="tw-dot"
            style={{ animationName: "none" }}
            animate={prefersReduced ? {} : { opacity: [0.18, 0.5, 0.18] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.12,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Password strength bar ────────────────────────────── */
function PasswordStrengthBar({ password }) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  if (!password) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: -4 }}>
      <div
        style={{
          display: "flex",
          gap: 4,
          height: 3,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scaleX: 0 }}
            animate={{
              scaleX: i < strength.score ? 1 : 0.3,
              opacity: i < strength.score ? 1 : 0.2,
            }}
            transition={{ duration: 0.25, delay: i * 0.05 }}
            style={{
              flex: 1,
              height: "100%",
              borderRadius: 2,
              background: i < strength.score ? strength.color : "var(--border, #334155)",
              transformOrigin: "left",
            }}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.span
          key={strength.label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            fontSize: 11,
            color: strength.color,
            fontWeight: 500,
            alignSelf: "flex-end",
          }}
        >
          {strength.label}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/* ── Styled checkbox ──────────────────────────────────── */
function StyledCheckbox({ checked, onChange, children }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 13,
        color: "#64748b",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <motion.div
        whileTap={{ scale: 0.88 }}
        onClick={() => onChange(!checked)}
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          border: `2px solid ${checked ? "var(--accent, #2563eb)" : "#94a3b8"}`,
          background: checked ? "var(--accent, #2563eb)" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.2s, border-color 0.2s",
          flexShrink: 0,
        }}
      >
        <AnimatePresence>
          {checked && (
            <motion.svg
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              width="11"
              height="9"
              viewBox="0 0 11 9"
              fill="none"
            >
              <path
                d="M1 4.5L4 7.5L10 1"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.div>
      <span>{children}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
      />
    </label>
  );
}

/* ─────────────────────────────────────────────────────────
   Main LoginScreen
───────────────────────────────────────────────────────── */
export default function LoginScreen({ onAuthenticated }) {
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();

  const [tab, setTab] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [success, setSuccess] = useState(false);

  // Enter key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter" && password && !loading) handleSubmit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [password, loading, tab, confirmPassword, username]);

  const triggerShake = useCallback(() => {
    setShakeKey((k) => k + 1);
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");

    if (tab === "signup" && password !== confirmPassword) {
      setError(t("auth.error_mismatch", "Passwords do not match."));
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const result = await window.api.login(username, password);
      if (!result || !result.success) {
        setError(t("auth.error_invalid"));
        triggerShake();
      } else {
        localStorage.setItem("tadween_username", username);
        setSuccess(true);
        setTimeout(() => onAuthenticated(username), 700);
      }
    } catch (err) {
      setError(err?.message || t("auth.error_invalid"));
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const switchTab = useCallback((next) => {
    setTab(next);
    setError("");
    setPassword("");
    setConfirmPassword("");
    setUsername("");
    setSuccess(false);
  }, []);

  return (
    <div className="tw-root">
      {/* ── LEFT: form side ── */}
      <motion.div
        className="tw-form-side"
        key={shakeKey}
        variants={shakeVariants}
        initial="idle"
        animate={shakeKey > 0 ? "shake" : "idle"}
      >
        {/* success pulse overlay */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.14, 0] }}
              transition={{ duration: 0.7 }}
              style={{
                position: "absolute",
                inset: 0,
                background: "var(--success, #22c55e)",
                borderRadius: "inherit",
                pointerEvents: "none",
                zIndex: 50,
              }}
            />
          )}
        </AnimatePresence>

        {/* glass-morphism inner card */}
        <motion.div
          className="tw-form-inner"
          initial={prefersReduced ? {} : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            background: "var(--glass-bg, rgba(255,255,255,0.85))",
            backdropFilter: "blur(var(--glass-blur, 12px))",
            WebkitBackdropFilter: "blur(var(--glass-blur, 12px))",
            border: "1px solid var(--glass-border, rgba(255,255,255,0.08))",
            borderRadius: "var(--radius-xl, 18px)",
            padding: "32px 28px",
          }}
        >
          {/* header */}
          <motion.div
            className="tw-header"
            initial={prefersReduced ? {} : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="tw-logo-badge">
              <span className="tw-logo-letter">T</span>
            </div>
            <div>
              <h1 className="tw-app-name">Tadween</h1>
              <AnimatePresence mode="wait">
                <motion.p
                  key={tab}
                  className="tw-app-sub"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  {tab === "login"
                    ? t("auth.welcome", "Welcome back 👋")
                    : t("auth.create_account", "Create your account")}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* tab pills with animated indicator */}
          <div className="tw-tabs" role="tablist">
            {["login", "signup"].map((id) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                className={`tw-tab ${tab === id ? "tw-tab--active" : ""}`}
                onClick={() => switchTab(id)}
                type="button"
                style={{ position: "relative", background: "transparent" }}
              >
                {tab === id && (
                  <motion.div
                    layoutId="tw-active-tab"
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "#ffffff",
                      borderRadius: 8,
                      boxShadow: "0 2px 10px rgba(0,0,0,0.09)",
                      zIndex: 0,
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span style={{ position: "relative", zIndex: 1 }}>
                  {id === "login"
                    ? t("auth.login_tab", "Login")
                    : t("auth.signup_tab", "Sign Up")}
                </span>
              </button>
            ))}
          </div>

          {/* form */}
          <form className="tw-form" onSubmit={handleSubmit} noValidate>
            {/* animated tab content */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.25 }}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {/* username */}
                <div className="tw-field">
                  <label className="tw-label">
                    {t("auth.username_label", "Username")}
                  </label>
                  <div className="tw-input-wrap">
                    <User className="tw-input-icon" size={16} />
                    <input
                      className="tw-input tw-input--icon"
                      type="text"
                      placeholder={t("auth.username_placeholder", "your_username")}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoFocus
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* password */}
                <div className="tw-field">
                  <div className="tw-label-row">
                    <label className="tw-label">
                      {t("auth.password_label", "Password")}
                    </label>
                    {tab === "login" && (
                      <button type="button" className="tw-forgot">
                        {t("auth.forgot", "Forgot password?")}
                      </button>
                    )}
                  </div>
                  <div className="tw-input-wrap">
                    <Lock className="tw-input-icon" size={16} />
                    <input
                      className="tw-input tw-input--icon tw-input--eye"
                      type={showPwd ? "text" : "password"}
                      placeholder="••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete={
                        tab === "login" ? "current-password" : "new-password"
                      }
                    />
                    <button
                      type="button"
                      className="tw-eye"
                      onClick={() => setShowPwd((v) => !v)}
                      tabIndex={-1}
                      aria-label={showPwd ? "Hide password" : "Show password"}
                    >
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* password strength (signup only) */}
                  {tab === "signup" && <PasswordStrengthBar password={password} />}
                </div>

                {/* confirm password (signup only) */}
                {tab === "signup" && (
                  <motion.div
                    className="tw-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <label className="tw-label">
                      {t("auth.confirm_password", "Confirm Password")}
                    </label>
                    <div className="tw-input-wrap">
                      <Lock className="tw-input-icon" size={16} />
                      <input
                        className="tw-input tw-input--icon tw-input--eye"
                        type={showConfirm ? "text" : "password"}
                        placeholder="••••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="tw-eye"
                        onClick={() => setShowConfirm((v) => !v)}
                        tabIndex={-1}
                        aria-label={
                          showConfirm ? "Hide password" : "Show password"
                        }
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* remember me (login only) */}
                {tab === "login" && (
                  <StyledCheckbox checked={rememberMe} onChange={setRememberMe}>
                    {t("auth.remember_me", "Remember me")}
                  </StyledCheckbox>
                )}
              </motion.div>
            </AnimatePresence>

            {/* error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="tw-error"
                  role="alert"
                  initial={{ opacity: 0, y: -8, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto", marginTop: 0 }}
                  exit={{ opacity: 0, y: -8, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* submit */}
            <motion.button
              type="submit"
              className="tw-submit"
              disabled={loading || !password || !username}
              whileHover={
                !loading && !success ? { scale: 1.02, y: -2 } : undefined
              }
              whileTap={!loading ? { scale: 0.97 } : undefined}
              animate={
                success
                  ? {
                      background:
                        "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                      boxShadow: "0 6px 20px rgba(22,163,74,0.4)",
                    }
                  : {}
              }
              transition={{ duration: 0.3 }}
            >
              {loading ? (
                <Loader2 size={18} className="tw-spin" />
              ) : success ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <CheckCircle2 size={16} />
                  <span>{t("auth.done", "Done!")}</span>
                </motion.span>
              ) : (
                <>
                  <span>
                    {tab === "login"
                      ? t("auth.login_btn", "Login")
                      : t("auth.create_btn", "Create Account")}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>

            {/* switch link */}
            <p className="tw-switch">
              {tab === "login"
                ? t("auth.no_account", "Don't have an account? ")
                : t("auth.has_account", "Already have an account? ")}
              <button
                type="button"
                className="tw-switch-link"
                onClick={() =>
                  switchTab(tab === "login" ? "signup" : "login")
                }
              >
                {tab === "login"
                  ? t("auth.signup_link", "Sign up")
                  : t("auth.login_link", "Log in")}
              </button>
            </p>

            {/* security footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontSize: 11,
                color: "var(--text-muted, #94a3b8)",
                margin: 0,
                textAlign: "center",
              }}
            >
              <Shield size={12} style={{ flexShrink: 0 }} />
              {t(
                "auth.footer",
                "Your password is never stored. All notes are encrypted with Argon2id."
              )}
            </motion.p>
          </form>
        </motion.div>
      </motion.div>

      {/* ── RIGHT: Blue animated panel ── */}
      <BlueSide />
    </div>
  );
}
