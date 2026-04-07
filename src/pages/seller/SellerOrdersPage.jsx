import { useEffect, useState } from "react";
import { useApp } from "../../state/AppContext";
import { translations } from "../../i18n";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function SellerOrdersPage() {
  const { currentUser, stores, orders, sellerWorkspace, updateOrderStatus, language } =
    useApp();
  const t = translations[language];
  const sellerStores = stores.filter((store) => store.sellerId === currentUser?.id);
  const activeStoreId = sellerWorkspace[currentUser?.id]?.activeStoreId;
  const sellerStore =
    sellerStores.find((store) => store.id === activeStoreId) || sellerStores[0] || null;
  const sellerOrders = orders.filter((order) => order.storeId === sellerStore?.id);
  const [savedMessage, setSavedMessage] = useState("");

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
          <h2>{t.orderManagement}</h2>
        </div>
        <p className="settings-subtitle">{t.createYourStoreFirst}</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{t.orderManagement}</h2>
        {savedMessage ? <span>{savedMessage}</span> : <span>{sellerOrders.length} {t.orders}</span>}
      </div>

      <div className="table-like">
        <div className="table-row table-head seller-orders-grid">
          <span>{t.id}</span>
          <span>{t.customer}</span>
          <span>{t.total}</span>
          <span>{t.paymentStatus}</span>
          <span>{t.deliveryStatus}</span>
          <span>{t.status}</span>
          <span>{t.actions}</span>
        </div>

        {sellerOrders.map((order) => (
          <div key={order.id} className="table-row seller-orders-grid">
            <div className="stacked-cell">
              <strong>{order.id}</strong>
              <small>{order.createdAt}</small>
            </div>
            <div className="stacked-cell">
              <strong>{order.customerName}</strong>
              <small>
                {order.itemsCount} {t.items}
              </small>
            </div>
            <span>{formatCurrency(order.total)}</span>
            <span className={`status-pill ${order.paymentStatus}`}>{t[order.paymentStatus] || order.paymentStatus}</span>
            <span>{t[order.deliveryStatus] || order.deliveryStatus}</span>
            <span className={`status-pill ${order.status}`}>{t[order.status]}</span>
            <select
              value={order.status}
              onChange={(event) => {
                updateOrderStatus(order.id, event.target.value);
                setSavedMessage(t.orderUpdatedSuccessfully);
              }}
            >
              <option value="pending">{t.pending}</option>
              <option value="processing">{t.processing}</option>
              <option value="delivered">{t.delivered}</option>
              <option value="cancelled">{t.cancelled}</option>
            </select>
          </div>
        ))}
      </div>
    </section>
  );
}
