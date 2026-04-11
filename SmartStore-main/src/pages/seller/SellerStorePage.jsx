import { Navigate } from "react-router-dom";
import { useApp } from "../../state/AppContext";
import { translations } from "../../i18n";

export default function SellerStorePage() {
  const { currentUser, stores, sellerWorkspace, language } = useApp();
  const t = translations[language];
  const sellerStores = stores.filter((store) => store.sellerId === currentUser?.id);
  const activeStoreId = sellerWorkspace[currentUser?.id]?.activeStoreId;
  const activeStore =
    sellerStores.find((store) => store.id === activeStoreId) || sellerStores[0] || null;

  if (!activeStore) {
    return (
      <section className="panel empty-state-panel">
        <div className="panel-header">
          <h2>{t.noStoreYet}</h2>
        </div>
        <p className="settings-subtitle">{t.createYourStoreFirst}</p>
      </section>
    );
  }

  return <Navigate to={`/seller/store/${activeStore.id}`} replace />;
}
