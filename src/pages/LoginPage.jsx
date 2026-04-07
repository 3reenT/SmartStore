import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../state/AppContext";
import { translations } from "../i18n";

const GOOGLE_CLIENT_ID =
  "651858540185-urprmiujjku7raaga77hcige4hbrivqh.apps.googleusercontent.com";

function decodeJwtPayload(token) {
  try {
    const [, payload] = String(token || "").split(".");

    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function LoginPage() {
  const { login, registerCustomer, continueWithStoreProvider, stores, language } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const t = translations[language];
  const storeId = location.state?.storeId;
  const store = stores.find((item) => item.id === storeId) || null;
  const isStoreAuth = Boolean(storeId && store);
  const [mode, setMode] = useState(isStoreAuth ? "signin" : "workspace");
  const [form, setForm] = useState({
    email: isStoreAuth ? "" : "admin@smartstore.ps",
    password: isStoreAuth ? "" : "admin123",
  });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [googleReady, setGoogleReady] = useState(false);

  const destination = useMemo(
    () => location.state?.from || `/store/${store?.slug || store?.id}`,
    [location.state?.from, store?.id, store?.slug],
  );

  useEffect(() => {
    if (!isStoreAuth) {
      return undefined;
    }

    let cancelled = false;
    const existingScript = document.querySelector('script[data-google-gsi="true"]');

    const initializeGoogle = () => {
      if (
        cancelled ||
        !window.google?.accounts?.id ||
        !GOOGLE_CLIENT_ID
      ) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (cancelled) {
            return;
          }

          const payload = decodeJwtPayload(response.credential);

          if (
            !payload?.email ||
            payload.aud !== GOOGLE_CLIENT_ID ||
            payload.email_verified === false
          ) {
            setError(
              language === "ar"
                ? "تعذر التحقق من حساب Google. حاولي مرة أخرى."
                : "We could not verify this Google account. Please try again.",
            );
            return;
          }

          const result = continueWithStoreProvider({
            provider: "google",
            storeId,
            email: payload.email,
            name: payload.name || payload.given_name || "Google Customer",
          });

          if (!result.success) {
            setError(result.message);
            return;
          }

          navigate(destination, { replace: true });
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true,
      });

      setGoogleReady(true);
    };

    if (existingScript) {
      if (window.google?.accounts?.id) {
        initializeGoogle();
      } else {
        existingScript.addEventListener("load", initializeGoogle, { once: true });
      }

      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client?hl=en";
    script.async = true;
    script.defer = true;
    script.dataset.googleGsi = "true";
    script.addEventListener("load", initializeGoogle, { once: true });
    document.body.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [continueWithStoreProvider, destination, isStoreAuth, language, navigate, storeId]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    const result = login(form.email, form.password, {
      storeId,
    });

    if (!result.success) {
      setError(
        result.message === "Your seller account is waiting for admin approval."
          ? t.accountPendingApproval
          : result.message === "Customer accounts must sign in from a store page."
            ? language === "ar"
              ? "حساب المستخدم يدخل من داخل صفحة المتجر، وليس من صفحة الدخول العامة."
              : "Customer accounts sign in from store pages, not from the general login page."
            : result.message === "This email is already registered."
              ? t.emailAlreadyRegistered
              : result.message,
      );
      return;
    }

    const nextPath =
      location.state?.from ||
      (result.user.role === "admin"
        ? "/admin"
        : result.user.role === "seller"
          ? "/seller"
          : result.user.role === "customer"
            ? `/store/${store?.slug || store?.id}`
            : "/");

    navigate(nextPath, { replace: true });
  };

  const handleRegister = (event) => {
    event.preventDefault();
    setError("");

    const result = registerCustomer({
      ...registerForm,
      storeId,
    });

    if (!result.success) {
      setError(
        result.message === "This email is already registered."
          ? t.emailAlreadyRegistered
          : result.message === "Missing required fields."
            ? language === "ar"
              ? "يرجى تعبئة جميع الحقول المطلوبة."
              : "Please fill in all required fields."
            : result.message,
      );
      return;
    }

    navigate(destination, { replace: true });
  };

  const handleProviderContinue = (provider) => {
    setError("");

    if (provider === "google") {
      if (!googleReady || !window.google?.accounts?.id) {
        setError(
          language === "ar"
            ? "زر Google لم يجهز بعد. حاولي بعد ثانية."
            : "Google sign-in is still loading. Try again in a moment.",
        );
        return;
      }

      window.google.accounts.id.prompt();
      return;
    }

    const result = continueWithStoreProvider({ provider, storeId });

    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate(destination, { replace: true });
  };

  return (
    <section className="auth-wrapper">
      <div className="login-shell">
        <div className="auth-card auth-card-aside">
          <span className="eyebrow">{isStoreAuth ? store?.name : t.smartstore}</span>
          <h1>
            {isStoreAuth
              ? language === "ar"
                ? "تسجيل الدخول أو إنشاء حساب"
                : "Sign in or create account"
              : language === "ar"
                ? "ادخل إلى مساحة العمل"
                : "Sign in to workspace"}
          </h1>
          <p>
            {isStoreAuth
              ? language === "ar"
                ? "من هنا يستطيع مستخدم المتجر تسجيل الدخول أو إنشاء حساب جديد حتى يستخدم السلة والمفضلة ويكمل الشراء."
                : "From here, store customers can sign in or create a new account to use cart, favorites, and checkout."
              : t.loginHint}
          </p>

          {isStoreAuth ? (
            <div className="auth-provider-stack">
              <button
                type="button"
                className="auth-provider-button"
                onClick={() => handleProviderContinue("google")}
              >
                Google
              </button>
              <button
                type="button"
                className="auth-provider-button"
                onClick={() => handleProviderContinue("apple")}
              >
                Apple
              </button>
              <button
                type="button"
                className="auth-provider-button"
                onClick={() => handleProviderContinue("phone")}
              >
                {language === "ar" ? "المتابعة باستخدام رقم الهاتف" : "Continue with phone"}
              </button>
            </div>
          ) : (
            <>
              <div className="credential-box">
                <span>{t.demoAdminAccount}</span>
                <strong>admin@smartstore.ps / admin123</strong>
              </div>
              <div className="credential-box">
                <span>{t.demoSellerAccount}</span>
                <strong>lina@smartstore.ps / seller123</strong>
              </div>
            </>
          )}
        </div>

        <div className="auth-card auth-card-form">
          {isStoreAuth ? (
            <>
              <div className="auth-mode-switch">
                <button
                  type="button"
                  className={mode === "signin" ? "auth-mode-button active" : "auth-mode-button"}
                  onClick={() => setMode("signin")}
                >
                  {language === "ar" ? "تسجيل الدخول" : "Sign in"}
                </button>
                <button
                  type="button"
                  className={mode === "register" ? "auth-mode-button active" : "auth-mode-button"}
                  onClick={() => setMode("register")}
                >
                  {language === "ar" ? "إنشاء حساب" : "Create account"}
                </button>
              </div>

              {mode === "signin" ? (
                <form onSubmit={handleSubmit}>
                  <span className="eyebrow">{language === "ar" ? "حساب موجود" : "Existing account"}</span>
                  <h1>{language === "ar" ? "الدخول إلى المتجر" : "Sign in to store"}</h1>

                  <label htmlFor="email">{t.email}</label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, email: event.target.value }))
                    }
                  />

                  <label htmlFor="password">{t.password}</label>
                  <input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, password: event.target.value }))
                    }
                  />

                  {error ? <p className="form-error">{error}</p> : null}

                  <button className="primary-button full-width" type="submit">
                    {language === "ar" ? "المتابعة باستخدام البريد الإلكتروني" : "Continue with email"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister}>
                  <span className="eyebrow">{language === "ar" ? "مستخدم جديد" : "New customer"}</span>
                  <h1>{language === "ar" ? "إنشاء حساب جديد" : "Create a new account"}</h1>

                  <label htmlFor="register-name">{language === "ar" ? "الاسم الكامل" : "Full name"}</label>
                  <input
                    id="register-name"
                    type="text"
                    value={registerForm.name}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />

                  <label htmlFor="register-email">{t.email}</label>
                  <input
                    id="register-email"
                    type="email"
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, email: event.target.value }))
                    }
                  />

                  <label htmlFor="register-password">{t.password}</label>
                  <input
                    id="register-password"
                    type="password"
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, password: event.target.value }))
                    }
                  />

                  {error ? <p className="form-error">{error}</p> : null}

                  <button className="primary-button full-width" type="submit">
                    {language === "ar" ? "إنشاء الحساب والمتابعة" : "Create account and continue"}
                  </button>
                </form>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <span className="eyebrow">{t.adminAccess}</span>
              <h1>{t.login}</h1>

              <label htmlFor="workspace-email">{t.email}</label>
              <input
                id="workspace-email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
              />

              <label htmlFor="workspace-password">{t.password}</label>
              <input
                id="workspace-password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
              />

              {error ? <p className="form-error">{error}</p> : null}

              <button className="primary-button full-width" type="submit">
                {t.enterDashboard}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
