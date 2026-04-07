import { useEffect, useState } from "react";
import { useApp } from "../../state/AppContext";
import { translations } from "../../i18n";

export default function SellerInventoryPage() {
  const {
    currentUser,
    stores,
    products,
    sellerWorkspace,
    storePreferences,
    saveStorePreferences,
    restockProduct,
    language,
  } = useApp();
  const t = translations[language];
  const sellerStores = stores.filter((store) => store.sellerId === currentUser?.id);
  const activeStoreId = sellerWorkspace[currentUser?.id]?.activeStoreId;
  const sellerStore =
    sellerStores.find((store) => store.id === activeStoreId) || sellerStores[0] || null;
  const sellerProducts = products.filter((product) => product.storeId === sellerStore?.id);
  const threshold = storePreferences[sellerStore?.id]?.lowStockThreshold ?? 5;
  const lowStockProducts = sellerProducts.filter((product) => product.stock <= threshold);
  const [savedMessage, setSavedMessage] = useState("");
  const [restockAmount, setRestockAmount] = useState({});

  useEffect(() => {
    if (!savedMessage) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setSavedMessage(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [savedMessage]);

  if (!sellerStore) {
    return (
      <section className="panel empty-state-panel">
        <div className="panel-header">
          <h2>{t.inventoryControl}</h2>
        </div>
        <p className="settings-subtitle">{t.createYourStoreFirst}</p>
      </section>
    );
  }

  return (
    <div className="dashboard-stack">
      <section className="panel">
        <div className="panel-header">
          <h2>{t.inventoryControl}</h2>
          {savedMessage ? <span>{savedMessage}</span> : null}
        </div>

        <div className="inventory-threshold-card">
          <div className="stacked-cell">
            <strong>{t.lowStockThreshold}</strong>
            <small>
              {language === "ar"
                ? "أي منتج يصل إلى هذا الحد أو أقل سيظهر في التنبيهات."
                : "Products at or below this value will appear in alerts."}
            </small>
          </div>
          <div className="inventory-threshold-actions">
            <input
              type="number"
              min="1"
              value={threshold}
              onChange={(event) =>
                saveStorePreferences(sellerStore.id, {
                  lowStockThreshold: Number(event.target.value),
                })
              }
            />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>{t.lowStockItems}</h2>
          <span>{lowStockProducts.length} {t.lowStockAlert}</span>
        </div>

        <div className="table-like">
          <div className="table-row table-head seller-inventory-grid">
            <span>{t.productName}</span>
            <span>{t.stock}</span>
            <span>{t.lowStockThreshold}</span>
            <span>{t.quantity}</span>
            <span>{t.actions}</span>
          </div>

          {lowStockProducts.map((product) => (
            <div key={product.id} className="table-row seller-inventory-grid">
              <div className="stacked-cell">
                <strong>{product.name}</strong>
                <small>{product.category}</small>
              </div>
              <span>{product.stock}</span>
              <span>{threshold}</span>
              <input
                type="number"
                min="1"
                value={restockAmount[product.id] || ""}
                onChange={(event) =>
                  setRestockAmount((current) => ({
                    ...current,
                    [product.id]: event.target.value,
                  }))
                }
                placeholder="5"
              />
              <button
                className="primary-button row-action"
                onClick={() => {
                  const amount = Number(restockAmount[product.id] || 0);

                  if (!amount) {
                    return;
                  }

                  restockProduct(product.id, amount);
                  setRestockAmount((current) => ({ ...current, [product.id]: "" }));
                  setSavedMessage(t.restockApplied);
                }}
              >
                {t.restock}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
