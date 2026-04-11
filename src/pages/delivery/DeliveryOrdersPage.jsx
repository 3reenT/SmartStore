import { Link } from "react-router-dom";
import { useApp } from "../../state/AppContext";
import { translations } from "../../i18n";

function formatCurrency(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function DeliveryOrdersPage() {
  const { orders, stores, language } = useApp();
  const t = translations[language];
  const isArabic = language === "ar";

  const sortedOrders = [...orders].sort((a, b) =>
    String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
  );

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{t.deliveryOrders}</h2>
        <span>{sortedOrders.length} {t.orders}</span>
      </div>

      <div className="delivery-card-grid">
        {sortedOrders.map((order) => {
          const store = stores.find((item) => item.id === order.storeId);
          const storeCurrency = store?.currency || "USD";

          return (
            <article key={order.id} className="delivery-order-card">
              <div className="delivery-order-top">
                <div>
                  <span className="delivery-order-label">{t.orderId}</span>
                  <strong>{order.id}</strong>
                </div>
                <span className={`status-pill ${order.deliveryStatus || "ready"}`}>
                  {t[order.deliveryStatus] || order.deliveryStatus}
                </span>
              </div>

              <div className="delivery-order-meta">
                <div>
                  <span>{t.customer}</span>
                  <strong>{order.customerName || t.unknownCustomer}</strong>
                </div>
                <div>
                  <span>{t.address}</span>
                  <strong>{order.customerAddress || t.notProvided}</strong>
                </div>
                <div>
                  <span>{t.total}</span>
                  <strong>{formatCurrency(order.total, storeCurrency)}</strong>
                </div>
              </div>

              <div className="delivery-order-actions">
                <Link className="primary-button" to={`/delivery/orders/${order.id}`}>
                  {t.startDelivery}
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {!sortedOrders.length ? (
        <p className="settings-subtitle">
          {isArabic ? "لا توجد طلبات للتوصيل بعد." : "No delivery orders yet."}
        </p>
      ) : null}
    </section>
  );
}
