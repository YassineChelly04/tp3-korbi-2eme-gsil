import React, { useEffect, useState, useCallback } from "react";
import LoginScreen from "./pages/LoginScreen";
import NotesShell from "./pages/NotesShell";
import OnboardingScreen from "./components/onboarding/OnboardingScreen";
import i18n from "./i18n/index"; // static import — initializes i18next

function App() {
  const [session, setSession] = useState({ authenticated: false });
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Restore saved language preference on boot
    const savedLang = localStorage.getItem("tadween_lang");
    if (savedLang) {
      i18n.changeLanguage(savedLang);
      document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = savedLang;
    }

    if (window.api?.onLocked) {
      window.api.onLocked(() => setSession({ authenticated: false }));
    }
  }, []);

  const handleAuthenticated = useCallback(async () => {
    setSession({ authenticated: true });
    try {
      const done = await window.api.getSetting("onboarding_complete");
      if (!done) setShowOnboarding(true);
    } catch {
      // If getSetting fails, skip onboarding gracefully
    }
  }, []);

  const handleOnboardingComplete = useCallback(async () => {
    try {
      await window.api.setSetting("onboarding_complete", "true");
    } catch {
      // Best-effort persist
    }
    setShowOnboarding(false);
  }, []);

  if (!session.authenticated) {
    return <LoginScreen onAuthenticated={handleAuthenticated} />;
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return <NotesShell onLock={() => setSession({ authenticated: false })} />;
}

export default App;
