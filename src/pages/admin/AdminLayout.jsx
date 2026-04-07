import { NavLink, Outlet } from "react-router-dom";
import { useApp } from "../../state/AppContext";
import { translations } from "../../i18n";

export default function AdminLayout() {
  const { language } = useApp();
  const t = translations[language];

  return (
    <section className="admin-shell">
      <aside className="admin-sidebar">
        <p className="sidebar-label">{t.adminWorkspace}</p>
        <nav className="sidebar-nav">
          <NavLink to="/admin" end>
            {t.overview}
          </NavLink>
          <NavLink to="/admin/users">{t.admins}</NavLink>
          <NavLink to="/admin/stores">{t.stores}</NavLink>
          <NavLink to="/admin/settings">{t.settings}</NavLink>
        </nav>
      </aside>

      <div className="admin-content">
        <div className="section-heading">
          <div className="section-heading-copy">
            <span className="eyebrow">{t.administration}</span>
            <h1>{t.platformControlCenter}</h1>
          </div>
          <div className="section-heading-card">
            <span>{language === "ar" ? "منطقة تشغيل" : "Operations mode"}</span>
            <strong>{language === "ar" ? "لوحة الإدارة" : "Admin workspace"}</strong>
          </div>
        </div>

        <Outlet />
      </div>
    </section>
  );
}
