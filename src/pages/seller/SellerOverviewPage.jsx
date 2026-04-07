import { useMemo } from "react";
import { useApp } from "../../state/AppContext";
import { translations } from "../../i18n";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function SellerOverviewPage() {
  const {
    currentUser,
    stores,
    products,
    orders,
    storePreferences,
    sellerWorkspace,
    language,
  } = useApp();
  const t = translations[language];

  const sellerStores = stores.filter((store) => store.sellerId === currentUser?.id);
  const activeStoreId = sellerWorkspace[currentUser?.id]?.activeStoreId;
  const activeStore =
    sellerStores.find((store) => store.id === activeStoreId) || sellerStores[0] || null;
  const sellerStoreIds = sellerStores.map((store) => store.id);
  const sellerProducts = products.filter((product) => sellerStoreIds.includes(product.storeId));
  const sellerOrders = orders.filter((order) => sellerStoreIds.includes(order.storeId));
  const activeProducts = products.filter((product) => product.storeId === activeStore?.id);
  const activeOrders = orders.filter((order) => order.storeId === activeStore?.id);
  const activeThreshold = storePreferences[activeStore?.id]?.lowStockThreshold ?? 5;
  const lowStockProducts = activeProducts.filter(
    (product) => product.stock <= activeThreshold,
  );
  const pendingOrders = activeOrders.filter(
    (order) => order.status === "pending" || order.status === "processing",
  );
  const paidOrders = sellerOrders.filter((order) => order.paymentStatus === "paid");
  const liveRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const totalMonthlyRevenue = sellerStores.reduce(
    (sum, store) => sum + store.monthlyRevenue,
    0,
  );
  const averageOrderValue = sellerOrders.length
    ? Math.round(liveRevenue / sellerOrders.length)
    : 0;

  const topProducts = useMemo(
    () => [...activeProducts].sort((a, b) => b.sales - a.sales).slice(0, 3),
    [activeProducts],
  );

  const stats = [
    {
      label: t.myStores,
      value: sellerStores.length,
      tone: "blue",
      badge: "STR",
      helper: language === "ar" ? "إجمالي متاجرك داخل المنصة" : "Total stores in your workspace",
    },
    {
      label: t.liveRevenue,
      value: formatCurrency(liveRevenue),
      tone: "teal",
      badge: "REV",
      helper: language === "ar" ? "من الطلبات المدفوعة عبر جميع المتاجر" : "From paid orders across all stores",
    },
    {
      label: t.pendingOrders,
      value: pendingOrders.length,
      tone: "amber",
      badge: "ORD",
      helper: language === "ar" ? "للمتجر النشط حاليًا" : "For the currently selected store",
    },
    {
      label: t.lowStockItems,
      value: lowStockProducts.length,
      tone: "violet",
      badge: "STK",
      helper: language === "ar" ? "بحسب حد التنبيه للمتجر النشط" : "Based on the active store threshold",
    },
    {
      label: t.averageOrderValue,
      value: formatCurrency(averageOrderValue),
      tone: "green",
      badge: "AOV",
      helper: language === "ar" ? "متوسط قيمة الطلب عبر متاجرك" : "Average order value across your stores",
    },
  ];

  if (!sellerStores.length) {
    return (
      <section className="panel empty-state-panel">
        <div className="panel-header">
          <h2>{t.noStoreYet}</h2>
        </div>
        <p className="settings-subtitle">{t.createYourStoreFirst}</p>
      </section>
    );
  }

  return (
    <div className="dashboard-stack">
      <section className="stats-grid stats-grid-admin">
        {stats.map((item) => (
          <article
            key={item.label}
            className={`stat-card overview-stat-card tone-${item.tone}`}
          >
            <div className="overview-stat-top">
              <span className="overview-stat-badge">{item.badge}</span>
              <span className="overview-stat-dot" aria-hidden="true" />
            </div>
            <span className="overview-stat-label">{item.label}</span>
            <strong className="overview-stat-value">{item.value}</strong>
            <span className="overview-stat-helper">{item.helper}</span>
          </article>
        ))}
      </section>

      <section className="panel-grid seller-overview-grid">
        <article className="panel seller-hero-panel">
          <div className="panel-header">
            <h2>{t.selectedStore}</h2>
            <span className={`status-pill ${activeStore.status}`}>{t[activeStore.status]}</span>
          </div>

          <div className="seller-hero-grid">
            <div className="stacked-cell">
              <strong>{activeStore.name}</strong>
              <small>
                {activeStore.category} | {activeStore.city}
              </small>
            </div>

            <div className="seller-metric-pill">
              <span>{t.subscriptionPlan}</span>
              <strong>{activeStore.subscription}</strong>
            </div>

            <div className="seller-metric-pill">
              <span>{t.monthlySales}</span>
              <strong>{formatCurrency(activeStore.monthlyRevenue)}</strong>
            </div>

            <div className="seller-metric-pill">
              <span>{t.lowStockThreshold}</span>
              <strong>{activeThreshold}</strong>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>{t.recentOperationalAlerts}</h2>
            <span>{pendingOrders.length + lowStockProducts.length} {t.notifications}</span>
          </div>

          <div className="list-stack">
            {pendingOrders.slice(0, 2).map((order) => (
              <div key={order.id} className="seller-alert seller-alert-blue">
                <strong>{t.orderReadyForDelivery}</strong>
                <span>
                  {language === "ar"
                    ? `الطلب ${order.id} للعميل ${order.customerName} يحتاج متابعة.`
                    : `${order.id} for ${order.customerName} needs an update.`}
                </span>
              </div>
            ))}
            {lowStockProducts.slice(0, 2).map((product) => (
              <div key={product.id} className="seller-alert seller-alert-amber">
                <strong>{t.lowStockNeedsAttention}</strong>
                <span>
                  {language === "ar"
                    ? `${product.name} بقي منه ${product.stock} فقط.`
                    : `${product.name} is down to ${product.stock} units.`}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel-grid seller-overview-grid">
        <article className="panel">
          <div className="panel-header">
            <h2>{t.topProducts}</h2>
            <span>{activeProducts.length} {t.products}</span>
          </div>

          <div className="list-stack">
            {topProducts.map((product) => (
              <div key={product.id} className="approval-card">
                <div className="stacked-cell">
                  <strong>{product.name}</strong>
                  <small>
                    {product.category} | {product.sales} sold
                  </small>
                </div>
                <strong>{formatCurrency(product.price)}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>{t.storeHealth}</h2>
            <span>{formatCurrency(totalMonthlyRevenue)} {t.revenue}</span>
          </div>

          <div className="seller-analytics-stack">
            <div className="seller-metric-pill">
              <span>{t.productsInCatalog}</span>
              <strong>{activeProducts.length}</strong>
            </div>
            <div className="seller-metric-pill">
              <span>{t.totalOrders}</span>
              <strong>{activeOrders.length}</strong>
            </div>
            <div className="seller-metric-pill">
              <span>{t.monthlySales}</span>
              <strong>{formatCurrency(activeStore.monthlyRevenue)}</strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
