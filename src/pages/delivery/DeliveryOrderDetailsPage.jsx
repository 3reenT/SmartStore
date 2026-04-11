import { Link, Navigate, useParams } from "react-router-dom";
import { useApp } from "../../state/AppContext";
import { translations } from "../../i18n";

function formatCurrency(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function DeliveryOrderDetailsPage() {
  const { orderId } = useParams();
  const { orders, stores, updateDeliveryStatus, language } = useApp();
  const t = translations[language];
  const isArabic = language === "ar";
  const order = orders.find((item) => item.id === orderId) || null;
  const store = stores.find((item) => item.id === order?.storeId) || null;
  const storeCurrency = store?.currency || "USD";
  const orderItems = Array.isArray(order?.items) ? order.items : [];

  if (!order) {
    return <Navigate to="/delivery" replace />;
  }

  const phoneDigits = String(order.customerPhone || "").replace(/\D/g, "");
  const mapQuery = encodeURIComponent(order.customerAddress || "");

  return (
    <section className="panel delivery-details-panel">
      <div className="panel-header">
        <div>
          <h2>{t.orderDetails}</h2>
          <span>{order.id}</span>
        </div>
        <Link className="secondary-button" to="/delivery">
          {isArabic ? "رجوع للقائمة" : "Back to orders"}
        </Link>
      </div>

      <div className="delivery-details-grid">
        <div className="delivery-info-card">
          <h3>{t.customerInfo}</h3>
          <div className="stacked-cell">
            <span>{t.customer}</span>
            <strong>{order.customerName || t.unknownCustomer}</strong>
          </div>
          <div className="stacked-cell">
            <span>{t.phone}</span>
            <strong>{order.customerPhone || t.notProvided}</strong>
          </div>
          <div className="stacked-cell">
            <span>{t.address}</span>
            <strong>{order.customerAddress || t.notProvided}</strong>
          </div>
        </div>

        <div className="delivery-info-card">
          <h3>{t.orderInfo}</h3>
          <div className="stacked-cell">
            <span>{t.total}</span>
            <strong>{formatCurrency(order.total, storeCurrency)}</strong>
          </div>
          <div className="stacked-cell">
            <span>{t.items}</span>
            <strong>{order.itemsCount}</strong>
          </div>
          <div className="stacked-cell">
            <span>{t.deliveryStatus}</span>
            <strong>{t[order.deliveryStatus] || order.deliveryStatus}</strong>
          </div>
        </div>
      </div>

      <div className="delivery-info-card delivery-items-card">
        <h3>{t.orderItems}</h3>
        {orderItems.length ? (
          <div className="delivery-items-list">
            {orderItems.map((item, index) => (
              <div key={`${item.productId}-${index}`} className="delivery-item-row">
                <div className="stacked-cell">
                  <strong>{item.name}</strong>
                  <small>{item.category || "-"}</small>
                </div>
                <span>
                  {item.quantity} × {formatCurrency(item.price, storeCurrency)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="settings-subtitle">
            {isArabic ? "لا توجد تفاصيل المنتجات لهذا الطلب." : "No item details available."}
          </p>
        )}
      </div>

      <div className="delivery-action-row">
        <button
          className="primary-button"
          type="button"
          onClick={() => updateDeliveryStatus(order.id, "outForDelivery")}
        >
          {t.startDelivery}
        </button>
        <a
          className="secondary-button"
          href={phoneDigits ? `tel:${phoneDigits}` : undefined}
          aria-disabled={!phoneDigits}
        >
          {t.callCustomer}
        </a>
        <a
          className="secondary-button"
          href={order.customerAddress ? `https://maps.google.com/?q=${mapQuery}` : undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!order.customerAddress}
        >
          {t.openMap}
        </a>
        <button
          className="primary-button"
          type="button"
          onClick={() => updateDeliveryStatus(order.id, "delivered")}
        >
          {t.delivered}
        </button>
        <button
          className="secondary-button danger-button"
          type="button"
          onClick={() => updateDeliveryStatus(order.id, "failed")}
        >
          {t.failedDelivery}
        </button>
      </div>
    </section>
  );
}
