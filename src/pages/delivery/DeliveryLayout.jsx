import { NavLink, Outlet } from "react-router-dom";
import { useApp } from "../../state/AppContext";
import { translations } from "../../i18n";

export default function DeliveryLayout() {
  const { language, currentUser } = useApp();
  const t = translations[language];

  return (
    <section className="admin-shell">
      <aside className="admin-sidebar delivery-sidebar">
        <p className="sidebar-label">{t.deliveryWorkspace}</p>
        <nav className="sidebar-nav">
          <NavLink to="/delivery" end>
            {t.deliveryOrders}
          </NavLink>
        </nav>
      </aside>

      <div className="admin-content">
        <div className="section-heading">
          <div className="section-heading-copy">
            <span className="eyebrow">{t.deliveryOperations}</span>
            <h1>{t.deliveryDashboard}</h1>
          </div>
          <div className="section-heading-card seller-heading-card">
            <span>{currentUser?.name || t.deliveryAgent}</span>
            <strong>{t.deliveryQueue}</strong>
          </div>
        </div>

        <Outlet />
      </div>
    </section>
  );
}
