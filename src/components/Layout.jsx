import { Link, NavLink, useLocation } from "react-router-dom";
import { useApp } from "../state/AppContext";
import { translations } from "../i18n";
import FloatingSupport from "./FloatingSupport";

export default function Layout({ children }) {
  const { currentUser, logout, language, setLanguage } = useApp();
  const location = useLocation();
  const t = translations[language];
  const isPublicStoreRoute = /^\/store\/[^/]+(?:\/.*)?$/.test(location.pathname);
  const hideGuestLoginOnHome = location.pathname === "/" && !currentUser;

  return (
    <div className="app-shell">
      {!isPublicStoreRoute ? (
        <header className="site-header">
          <Link className="brand" to="/">
            <img className="brand-logo" src="/logo.png" alt="SmartStore logo" />
            <div>
              <strong className="brand-title">{t.smartstore}</strong>
            </div>
          </Link>

          <nav className="main-nav">
            <NavLink to="/">{t.navHome}</NavLink>
            {currentUser?.role === "admin" && <NavLink to="/admin">{t.navAdmin}</NavLink>}
            {currentUser?.role === "seller" && <NavLink to="/seller">{t.navSeller}</NavLink>}
          </nav>

          <div className="header-actions">
            <div className="language-toggle">
              <button
                className={language === "en" ? "language-button active" : "language-button"}
                onClick={() => setLanguage("en")}
              >
                EN
              </button>
              <button
                className={language === "ar" ? "language-button active" : "language-button"}
                onClick={() => setLanguage("ar")}
              >
                AR
              </button>
            </div>
            {currentUser ? (
              <>
                <span className="user-chip">{currentUser.name}</span>
                <button className="secondary-button" onClick={logout}>
                  {t.logout}
                </button>
              </>
            ) : !hideGuestLoginOnHome ? (
              <Link className="primary-button" to="/login">
                {t.login}
              </Link>
            ) : null}
          </div>
        </header>
      ) : null}

      <main className="page-shell">{children}</main>
      <FloatingSupport />
    </div>
  );
}
