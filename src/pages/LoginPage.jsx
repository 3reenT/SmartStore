import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../state/AppContext";
import { translations } from "../i18n";

export default function LoginPage() {
  const { login, registerCustomer, stores, language } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const t = translations[language];
  const isArabic = language === "ar";
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

  const destination = useMemo(
    () => location.state?.from || `/store/${store?.slug || store?.id}`,
    [location.state?.from, store?.id, store?.slug],
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    const result = login(form.email, form.password, { storeId });

    if (!result.success) {
      setError(
        result.message === "Your seller account is waiting for admin approval."
          ? t.accountPendingApproval
          : result.message === "Customer accounts must sign in from a store page."
            ? isArabic
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
            ? isArabic
              ? "يرجى تعبئة جميع الحقول المطلوبة."
              : "Please fill in all required fields."
            : result.message,
      );
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
              ? isArabic
                ? "تسجيل الدخول أو إنشاء حساب"
                : "Sign in or create account"
              : isArabic
                ? "ادخل إلى مساحة العمل"
                : "Sign in to workspace"}
          </h1>
          <p>
            {isStoreAuth
              ? isArabic
                ? "من هنا يستطيع مستخدم المتجر تسجيل الدخول أو إنشاء حساب جديد حتى يستخدم السلة والمفضلة ويكمل الشراء."
                : "From here, store customers can sign in or create a new account to use cart, favorites, and checkout."
              : t.loginHint}
          </p>

          {!isStoreAuth ? (
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
          ) : null}
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
                  {isArabic ? "تسجيل الدخول" : "Sign in"}
                </button>
                <button
                  type="button"
                  className={mode === "register" ? "auth-mode-button active" : "auth-mode-button"}
                  onClick={() => setMode("register")}
                >
                  {isArabic ? "إنشاء حساب" : "Create account"}
                </button>
              </div>

              {mode === "signin" ? (
                <form onSubmit={handleSubmit}>
                  <span className="eyebrow">{isArabic ? "حساب موجود" : "Existing account"}</span>
                  <h1>{isArabic ? "الدخول إلى المتجر" : "Sign in to store"}</h1>

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
                    {isArabic ? "تسجيل الدخول" : "Sign in"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister}>
                  <span className="eyebrow">{isArabic ? "حساب جديد" : "New account"}</span>
                  <h1>{isArabic ? "إنشاء حساب للمتجر" : "Create a store account"}</h1>

                  <label htmlFor="register-name">{t.name}</label>
                  <input
                    id="register-name"
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
                    {isArabic ? "إنشاء الحساب" : "Create account"}
                  </button>
                </form>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <span className="eyebrow">{isArabic ? "وصول الإدارة" : "Workspace access"}</span>
              <h1>{isArabic ? "الدخول إلى لوحة التحكم" : "Sign in to dashboard"}</h1>

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
                {isArabic ? "تسجيل الدخول" : "Sign in"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
