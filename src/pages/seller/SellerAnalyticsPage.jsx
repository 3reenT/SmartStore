import { useMemo } from "react";
import { useApp } from "../../state/AppContext";
import { translations } from "../../i18n";

function formatCurrency(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function SellerAnalyticsPage() {
  const { currentUser, stores, products, orders, sellerWorkspace, language } = useApp();
  const t = translations[language];
  const isArabic = language === "ar";
  const sellerStores = stores.filter((store) => store.sellerId === currentUser?.id);
  const activeStoreId = sellerWorkspace[currentUser?.id]?.activeStoreId;
  const sellerStore =
    sellerStores.find((store) => store.id === activeStoreId) || sellerStores[0] || null;
  const storeCurrency = sellerStore?.currency || "USD";
  const sellerProducts = products.filter((product) => product.storeId === sellerStore?.id);
  const sellerOrders = orders.filter((order) => order.storeId === sellerStore?.id);

  const revenue = sellerOrders
    .filter((order) => order.paymentStatus === "paid")
    .reduce((sum, order) => sum + order.total, 0);

  const profit = sellerProducts.reduce(
    (sum, product) =>
      sum +
      (Number(product.price || 0) - Number(product.costPrice || 0)) *
        Number(product.sales || 0),
    0,
  );

  const averageOrderValue = sellerOrders.length
    ? Math.round(revenue / sellerOrders.length)
    : 0;

  const analyticsStats = [
    {
      label: t.monthlySales,
      value: formatCurrency(sellerStore?.monthlyRevenue || 0, storeCurrency),
      tone: "teal",
      badge: "MTH",
      helper: isArabic ? "ملخص أداء الشهر الحالي" : "Current month performance",
    },
    {
      label: t.totalOrders,
      value: sellerOrders.length,
      tone: "blue",
      badge: "ORD",
      helper: isArabic ? "طلبات مرتبطة بمتجرك" : "Orders linked to your store",
    },
    {
      label: t.averageOrderValue,
      value: formatCurrency(averageOrderValue, storeCurrency),
      tone: "green",
      badge: "AVG",
      helper: isArabic ? "متوسط قيمة الطلب" : "Average order amount",
    },
    {
      label: t.estimatedProfit,
      value: formatCurrency(profit, storeCurrency),
      tone: "amber",
      badge: "PFT",
      helper: isArabic ? "محسوب من فرق سعر البيع والتكلفة" : "Calculated from selling price minus cost price",
    },
    {
      label: t.aiDescriptions,
      value: sellerProducts.filter((product) => product.description).length,
      tone: "violet",
      badge: "AI",
      helper: isArabic ? "منتجات موصوفة داخل الكتالوج" : "Products enriched in catalog",
    },
  ];

  const topProducts = useMemo(
    () =>
      [...sellerProducts]
        .sort((first, second) => second.sales - first.sales)
        .slice(0, 4),
    [sellerProducts],
  );

  if (!sellerStore) {
    return (
      <section className="panel empty-state-panel">
        <div className="panel-header">
          <h2>{t.analyticsOverview}</h2>
        </div>
        <p className="settings-subtitle">{t.createYourStoreFirst}</p>
      </section>
    );
  }

  return (
    <div className="dashboard-stack">
      <section className="stats-grid">
        {analyticsStats.map((item) => (
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
        <article className="panel">
          <div className="panel-header">
            <h2>{t.topProducts}</h2>
            <span>{topProducts.length} {t.products}</span>
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
                <strong>{formatCurrency(product.price, storeCurrency)}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>{t.analyticsOverview}</h2>
          </div>

          <div className="seller-analytics-stack">
            <div className="seller-metric-pill">
              <span>{t.liveRevenue}</span>
              <strong>{formatCurrency(revenue, storeCurrency)}</strong>
            </div>
            <div className="seller-metric-pill">
              <span>{t.estimatedProfit}</span>
              <strong>{formatCurrency(profit, storeCurrency)}</strong>
            </div>
            <div className="seller-metric-pill">
              <span>{t.productsInCatalog}</span>
              <strong>{sellerProducts.length}</strong>
            </div>
            <div className="seller-metric-pill">
              <span>{t.pendingOrders}</span>
              <strong>
                {
                  sellerOrders.filter(
                    (order) =>
                      order.status === "pending" || order.status === "processing",
                  ).length
                }
              </strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
