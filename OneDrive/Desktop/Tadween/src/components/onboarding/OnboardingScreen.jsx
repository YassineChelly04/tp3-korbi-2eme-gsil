import React, { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import {
  Shield,
  Mic,
  WifiOff,
  ArrowRight,
  Sparkles,
  Sun,
  Moon,
  Keyboard,
  FilePlus,
} from "lucide-react";
import { isRTL } from "../../i18n/index";
import i18nInstance from "../../i18n/index";

/* ── Particle / sparkle background ────────────────────── */
function SparkleBackground({ count = 40 }) {
  const prefersReduced = useReducedMotion();
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 4,
        duration: 3 + Math.random() * 4,
      })),
    [count]
  );

  if (prefersReduced) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: "rgba(99, 102, 241, 0.5)",
          }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.2, 0.5],
            y: [0, -20, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ── Confetti / celebration animation ─────────────────── */
function Confetti({ count = 50 }) {
  const prefersReduced = useReducedMotion();
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: 50 + (Math.random() - 0.5) * 80,
        color: [
          "#6366f1",
          "#22c55e",
          "#f59e0b",
          "#ef4444",
          "#06b6d4",
          "#ec4899",
        ][i % 6],
        delay: Math.random() * 0.5,
        rotation: Math.random() * 360,
        size: 4 + Math.random() * 6,
      })),
    [count]
  );

  if (prefersReduced) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: "40%",
            width: p.size,
            height: p.size * 0.6,
            borderRadius: 1,
            background: p.color,
          }}
          initial={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
          animate={{
            opacity: [1, 1, 0],
            y: [0, -180 - Math.random() * 120, 300],
            x: [(Math.random() - 0.5) * 200, (Math.random() - 0.5) * 300],
            rotate: [0, p.rotation, p.rotation + 180],
            scale: [0, 1.2, 0.6],
          }}
          transition={{
            duration: 2.5,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

/* ── Step components ──────────────────────────────────── */

function StepWelcome({ onNext, t }) {
  const prefersReduced = useReducedMotion();

  return (
    <div style={styles.stepContainer}>
      <SparkleBackground />
      <div style={styles.stepContent}>
        {/* Animated logo */}
        <motion.div
          initial={prefersReduced ? {} : { scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          style={styles.logoBadgeLarge}
        >
          <span style={styles.logoLetterLarge}>T</span>
        </motion.div>

        <motion.h1
          initial={prefersReduced ? {} : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={styles.heroTitle}
        >
          {t("onboarding.welcome")}
        </motion.h1>

        <motion.p
          initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          style={styles.heroTagline}
        >
          {t("onboarding.tagline")}
        </motion.p>

        <motion.button
          initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          style={styles.primaryBtn}
        >
          <span>{t("onboarding.get_started")}</span>
          <ArrowRight size={18} className="icon-directional" />
        </motion.button>
      </div>
    </div>
  );
}

function StepFeatures({ onNext, t }) {
  const prefersReduced = useReducedMotion();

  const features = [
    {
      icon: <Shield size={28} />,
      title: t("onboarding.feature_encryption_title"),
      desc: t("onboarding.feature_encryption_desc"),
    },
    {
      icon: <Mic size={28} />,
      title: t("onboarding.feature_voice_title"),
      desc: t("onboarding.feature_voice_desc"),
    },
    {
      icon: <WifiOff size={28} />,
      title: t("onboarding.feature_offline_title"),
      desc: t("onboarding.feature_offline_desc"),
    },
  ];

  return (
    <div style={styles.stepContainer}>
      <div style={styles.stepContent}>
        <motion.h2
          initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={styles.sectionTitle}
        >
          {t("onboarding.features_title")}
        </motion.h2>

        <div style={styles.featureGrid}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={prefersReduced ? {} : { opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.15 * (i + 1) }}
              style={styles.featureCard}
            >
              <div style={styles.featureIcon}>{f.icon}</div>
              <h3 style={styles.featureTitle}>{f.title}</h3>
              <p style={styles.featureDesc}>{f.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.button
          initial={prefersReduced ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          style={styles.primaryBtn}
        >
          <span>{t("onboarding.continue")}</span>
          <ArrowRight size={18} className="icon-directional" />
        </motion.button>
      </div>
    </div>
  );
}

function StepPersonalize({ onNext, t }) {
  const prefersReduced = useReducedMotion();
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "dark";
  const [theme, setTheme] = useState(currentTheme);
  const savedLang = localStorage.getItem("tadween_lang") || "fr";
  const [lang, setLang] = useState(savedLang);

  const applyTheme = useCallback((val) => {
    setTheme(val);
    document.documentElement.setAttribute("data-theme", val);
    localStorage.setItem("tadween_theme", val);
  }, []);

  const applyLang = useCallback(
    (val) => {
      setLang(val);
      i18nInstance.changeLanguage(val);
      document.documentElement.dir = isRTL(val) ? "rtl" : "ltr";
      document.documentElement.lang = val;
      localStorage.setItem("tadween_lang", val);
    },
    []
  );

  const themes = [
    { id: "dark", icon: <Moon size={20} />, label: "Dark" },
    { id: "light", icon: <Sun size={20} />, label: "Light" },
  ];

  const languages = [
    { id: "fr", flag: "🇫🇷", label: "Français" },
    { id: "en", flag: "🇬🇧", label: "English" },
    { id: "ar", flag: "🇸🇦", label: "العربية" },
  ];

  return (
    <div style={styles.stepContainer}>
      <div style={styles.stepContent}>
        <motion.h2
          initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={styles.sectionTitle}
        >
          {t("onboarding.personalize")}
        </motion.h2>

        {/* Theme selection */}
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={styles.prefSection}
        >
          <h3 style={styles.prefLabel}>{t("onboarding.choose_theme")}</h3>
          <div style={styles.optionRow}>
            {themes.map((th) => (
              <motion.button
                key={th.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => applyTheme(th.id)}
                style={{
                  ...styles.optionCard,
                  ...(theme === th.id ? styles.optionCardActive : {}),
                }}
              >
                {/* Mini preview */}
                <div
                  style={{
                    width: "100%",
                    height: 80,
                    borderRadius: 8,
                    background:
                      th.id === "dark"
                        ? "linear-gradient(135deg, #0f172a, #1e293b)"
                        : "linear-gradient(135deg, #f8fafc, #e2e8f0)",
                    marginBlockEnd: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border:
                      th.id === "dark"
                        ? "1px solid rgba(255,255,255,0.08)"
                        : "1px solid rgba(0,0,0,0.08)",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {/* Mini mockup sidebar */}
                  <div
                    style={{
                      position: "absolute",
                      insetInlineStart: 0,
                      top: 0,
                      bottom: 0,
                      width: "30%",
                      background:
                        th.id === "dark"
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.04)",
                    }}
                  />
                  {/* Mini mockup lines */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      paddingInlineStart: "35%",
                      paddingInlineEnd: 8,
                      width: "100%",
                    }}
                  >
                    {[60, 80, 45].map((w, i) => (
                      <div
                        key={i}
                        style={{
                          height: 4,
                          width: `${w}%`,
                          borderRadius: 2,
                          background:
                            th.id === "dark"
                              ? "rgba(255,255,255,0.12)"
                              : "rgba(0,0,0,0.1)",
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div style={styles.optionMeta}>
                  {th.icon}
                  <span>{th.label}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Language selection */}
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={styles.prefSection}
        >
          <h3 style={styles.prefLabel}>{t("onboarding.choose_language")}</h3>
          <div style={styles.optionRow}>
            {languages.map((ln) => (
              <motion.button
                key={ln.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => applyLang(ln.id)}
                style={{
                  ...styles.langCard,
                  ...(lang === ln.id ? styles.optionCardActive : {}),
                }}
              >
                <span style={{ fontSize: 28 }}>{ln.flag}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{ln.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.button
          initial={prefersReduced ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          style={styles.primaryBtn}
        >
          <span>{t("onboarding.almost_there")}</span>
          <ArrowRight size={18} className="icon-directional" />
        </motion.button>
      </div>
    </div>
  );
}

function StepReady({ onComplete, t }) {
  const prefersReduced = useReducedMotion();

  return (
    <div style={styles.stepContainer}>
      <Confetti />
      <div style={styles.stepContent}>
        <motion.div
          initial={prefersReduced ? {} : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
          style={styles.celebrateIcon}
        >
          <Sparkles size={48} color="var(--accent, #6366f1)" />
        </motion.div>

        <motion.h1
          initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={styles.heroTitle}
        >
          {t("onboarding.all_set")}
        </motion.h1>

        {/* Quick tips */}
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={styles.tipsContainer}
        >
          <div style={styles.tipRow}>
            <FilePlus size={16} style={{ flexShrink: 0, color: "var(--accent, #6366f1)" }} />
            <span style={styles.tipText}>{t("onboarding.tip_new_note")}</span>
            <kbd style={styles.kbd}>Ctrl+N</kbd>
          </div>
          <div style={styles.tipRow}>
            <Keyboard size={16} style={{ flexShrink: 0, color: "var(--accent, #6366f1)" }} />
            <span style={styles.tipText}>{t("onboarding.tip_shortcuts")}</span>
            <kbd style={styles.kbd}>Ctrl+/</kbd>
          </div>
        </motion.div>

        <motion.button
          initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={onComplete}
          style={{ ...styles.primaryBtn, gap: 10 }}
        >
          <span>{t("onboarding.start_writing")}</span>
          <Sparkles size={18} />
        </motion.button>
      </div>
    </div>
  );
}

/* ── Slide transition variants ────────────────────────── */
const slideVariants = {
  enter: (dir) => ({
    x: dir > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({
    x: dir > 0 ? -300 : 300,
    opacity: 0,
  }),
};

/* ── Main OnboardingScreen ────────────────────────────── */
export default function OnboardingScreen({ onComplete }) {
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const totalSteps = 4;

  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  }, []);

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  const progress = ((step + 1) / totalSteps) * 100;

  const steps = [
    <StepWelcome key="welcome" onNext={goNext} t={t} />,
    <StepFeatures key="features" onNext={goNext} t={t} />,
    <StepPersonalize key="personalize" onNext={goNext} t={t} />,
    <StepReady key="ready" onComplete={handleComplete} t={t} />,
  ];

  return (
    <div style={styles.overlay}>
      {/* Progress bar */}
      <div style={styles.progressTrack}>
        <motion.div
          style={styles.progressFill}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Step content with AnimatePresence */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={prefersReduced ? {} : slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: "easeInOut" }}
          style={styles.slideWrap}
        >
          {steps[step]}
        </motion.div>
      </AnimatePresence>

      {/* Step indicator dots */}
      <div style={styles.dotsRow}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              width: i === step ? 24 : 8,
              background:
                i === step
                  ? "var(--accent, #6366f1)"
                  : "var(--text-muted, #64748b)",
              opacity: i === step ? 1 : 0.4,
            }}
            transition={{ duration: 0.3 }}
            style={styles.dot}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Inline styles (CSS-in-JS with CSS var references) ── */
const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "linear-gradient(145deg, var(--bg-base, #0f172a) 0%, #0c1222 50%, var(--bg-surface, #1e293b) 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-sans, 'Inter', sans-serif)",
    overflow: "hidden",
  },
  progressTrack: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    background: "var(--border, #334155)",
    zIndex: 10,
  },
  progressFill: {
    height: "100%",
    background: "var(--accent, #6366f1)",
    borderRadius: "0 2px 2px 0",
  },
  slideWrap: {
    flex: 1,
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  stepContainer: {
    position: "relative",
    width: "100%",
    maxWidth: 640,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 24px",
  },
  stepContent: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 24,
    width: "100%",
  },

  /* Logo */
  logoBadgeLarge: {
    width: 88,
    height: 88,
    borderRadius: 20,
    background: "linear-gradient(135deg, #1a6fff 0%, #6366f1 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 32px rgba(26, 111, 255, 0.35)",
  },
  logoLetterLarge: {
    fontSize: 44,
    fontWeight: 700,
    color: "#fff",
    lineHeight: 1,
    fontFamily: "'Inter', sans-serif",
  },

  /* Hero text */
  heroTitle: {
    fontSize: 32,
    fontWeight: 700,
    color: "var(--text-primary, #f1f5f9)",
    margin: 0,
    textAlign: "center",
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
  },
  heroTagline: {
    fontSize: 18,
    color: "var(--accent, #6366f1)",
    fontWeight: 600,
    margin: 0,
    textAlign: "center",
    letterSpacing: "0.02em",
  },

  /* Section title */
  sectionTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "var(--text-primary, #f1f5f9)",
    margin: 0,
    textAlign: "center",
  },

  /* Feature cards */
  featureGrid: {
    display: "flex",
    gap: 16,
    width: "100%",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  featureCard: {
    flex: "1 1 170px",
    maxWidth: 200,
    padding: "20px 16px",
    borderRadius: 14,
    background: "var(--glass-bg, rgba(30, 41, 59, 0.8))",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid var(--glass-border, rgba(255,255,255,0.08))",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    textAlign: "center",
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: "var(--accent-muted, rgba(99,102,241,0.13))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--accent, #6366f1)",
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text-primary, #f1f5f9)",
    margin: 0,
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 1.5,
    color: "var(--text-secondary, #94a3b8)",
    margin: 0,
  },

  /* Preferences */
  prefSection: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    alignItems: "center",
  },
  prefLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text-secondary, #94a3b8)",
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  optionRow: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  optionCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: 12,
    width: 160,
    borderRadius: 12,
    background: "var(--glass-bg, rgba(30, 41, 59, 0.8))",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "2px solid var(--border, #334155)",
    cursor: "pointer",
    color: "var(--text-primary, #f1f5f9)",
    transition: "border-color 0.2s, box-shadow 0.2s",
    outline: "none",
    fontSize: "inherit",
    fontFamily: "inherit",
  },
  optionCardActive: {
    borderColor: "var(--accent, #6366f1)",
    boxShadow: "0 0 12px rgba(99,102,241,0.3)",
  },
  optionMeta: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: 500,
  },
  langCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: "14px 20px",
    borderRadius: 12,
    background: "var(--glass-bg, rgba(30, 41, 59, 0.8))",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "2px solid var(--border, #334155)",
    cursor: "pointer",
    color: "var(--text-primary, #f1f5f9)",
    transition: "border-color 0.2s, box-shadow 0.2s",
    outline: "none",
    fontFamily: "inherit",
    minWidth: 100,
  },

  /* Celebrate */
  celebrateIcon: {
    width: 96,
    height: 96,
    borderRadius: "50%",
    background: "var(--accent-muted, rgba(99,102,241,0.13))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Tips */
  tipsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: "100%",
    maxWidth: 380,
    padding: "16px 20px",
    borderRadius: 12,
    background: "var(--glass-bg, rgba(30, 41, 59, 0.8))",
    border: "1px solid var(--glass-border, rgba(255,255,255,0.08))",
  },
  tipRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  tipText: {
    fontSize: 13,
    color: "var(--text-secondary, #94a3b8)",
    flex: 1,
  },
  kbd: {
    padding: "2px 8px",
    borderRadius: 6,
    background: "var(--bg-elevated, #273548)",
    border: "1px solid var(--border, #334155)",
    fontSize: 11,
    fontFamily: "var(--font-mono, monospace)",
    color: "var(--text-primary, #f1f5f9)",
    whiteSpace: "nowrap",
  },

  /* Primary button */
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 28px",
    borderRadius: 12,
    background: "linear-gradient(135deg, #1a6fff 0%, var(--accent, #6366f1) 100%)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(26, 111, 255, 0.3)",
    fontFamily: "inherit",
    outline: "none",
    marginTop: 8,
  },

  /* Dots */
  dotsRow: {
    position: "absolute",
    bottom: 32,
    display: "flex",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
};
