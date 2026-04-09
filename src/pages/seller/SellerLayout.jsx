import { NavLink, Outlet } from "react-router-dom";
import { useApp } from "../../state/AppContext";
import { translations } from "../../i18n";

export default function SellerLayout() {
  const { language, currentUser, stores, sellerWorkspace } = useApp();
  const t = translations[language];
  const sellerStores = stores.filter((store) => store.sellerId === currentUser?.id);
  const activeStoreId = sellerWorkspace[currentUser?.id]?.activeStoreId;
  const activeStore =
    sellerStores.find((store) => store.id === activeStoreId) || sellerStores[0] || null;

  return (
    <section className="admin-shell">
      <aside className="admin-sidebar seller-sidebar">
        <p className="sidebar-label">{t.sellerWorkspace}</p>
        <nav className="sidebar-nav">
          <NavLink to="/seller" end>
            {t.overview}
          </NavLink>
          <NavLink to="/seller/store">{t.myStores}</NavLink>
          <NavLink to="/seller/products">{t.products}</NavLink>
          <NavLink to="/seller/orders">{t.orders}</NavLink>
          <NavLink to="/seller/inventory">{t.inventory}</NavLink>
          <NavLink to="/seller/analytics">{t.analytics}</NavLink>
        </nav>
      </aside>

      <div className="admin-content">
        <div className="section-heading">
          <div className="section-heading-copy">
            <span className="eyebrow">{t.commerceOperations}</span>
            <h1>{t.sellerCommandCenter}</h1>
          </div>
          <div className="section-heading-card seller-heading-card">
            <span>{currentUser?.name}</span>
            <strong>{activeStore?.name || t.createStoreToContinue}</strong>
          </div>
        </div>

        <Outlet />
      </div>
    </section>
  );
}
