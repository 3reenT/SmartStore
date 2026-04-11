import { useMemo, useState } from "react";
import { useApp } from "../../state/AppContext";
import { translations } from "../../i18n";

export default function AdminStoresPage() {
  const { stores, updateStoreStatus, language } = useApp();
  const t = translations[language];
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");

  const visibleStores = useMemo(() => {
    if (statusFilter === "all") return stores;
    return stores.filter((store) => store.status === statusFilter);
  }, [statusFilter, stores]);

  return (
    <div className="dashboard-stack">
      <section className="panel">
        <div className="panel-header">
          <h2>{t.storesPageTitle}</h2>
          <div className="panel-tools">
            {message ? <span className="success-text">{message}</span> : null}
            <select
              className="table-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">{t.allStores}</option>
              <option value="pending">{t.pending}</option>
              <option value="approved">{t.approved}</option>
              <option value="rejected">{t.rejected}</option>
            </select>
          </div>
        </div>

        <div className="table-like">
          <div className="table-row stores-grid table-head">
            <span>{t.store}</span>
            <span>{t.owner}</span>
            <span>{t.status}</span>
            <span>{t.actions}</span>
          </div>

          {visibleStores.map((store) => (
            <div key={store.id} className="table-row stores-grid">
              <span className="stacked-cell">
                <strong>{store.name}</strong>
                <small>
                  {store.city} | {store.category || t.general}
                </small>
              </span>
              <span className="stacked-cell">
                <strong>{store.ownerName || "-"}</strong>
                <small>{store.ownerEmail || store.contactEmail || "-"}</small>
              </span>
              <span className={`status-pill ${store.status}`}>
                {t[store.status] || store.status}
              </span>
              <span className="inline-actions">
                <button
                  className="secondary-button small-button"
                  onClick={() => {
                    updateStoreStatus(store.id, "approved");
                    setMessage(`${t.store} "${store.name}" ${t.approved}.`);
                  }}
                >
                  {t.approve}
                </button>
                <button
                  className="secondary-button small-button danger-button"
                  onClick={() => {
                    updateStoreStatus(store.id, "rejected");
                    setMessage(`${t.store} "${store.name}" ${t.rejected}.`);
                  }}
                >
                  {t.reject}
                </button>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
