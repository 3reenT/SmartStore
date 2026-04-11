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

const monthlyGrowth = [
  { monthEn: "Jan", monthAr: "ينا", users: 80, stores: 45 },
  { monthEn: "Feb", monthAr: "فبر", users: 120, stores: 72 },
  { monthEn: "Mar", monthAr: "مار", users: 98, stores: 60 },
  { monthEn: "Apr", monthAr: "أبر", users: 180, stores: 116 },
  { monthEn: "May", monthAr: "ماي", users: 140, stores: 92 },
  { monthEn: "Jun", monthAr: "يون", users: 205, stores: 132 },
];

function buildPolyline(data, key, maxValue, width, height, padding) {
  const stepX = (width - padding * 2) / (data.length - 1);

  return data
    .map((item, index) => {
      const x = padding + stepX * index;
      const y =
        height - padding - (item[key] / maxValue) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

export default function AdminOverviewPage() {
  const { users, stores, language } = useApp();
  const t = translations[language];

  const validStores = stores.filter(
    (store) =>
      store?.entityType === "store" &&
      typeof store.name === "string" &&
      typeof store.city === "string" &&
      typeof store.ownerName === "string",
  );

  const revenue = validStores.reduce((total, store) => total + store.monthlyRevenue, 0);
  const pendingStores = validStores.filter((store) => store.status === "pending");
  const approvedStores = validStores.filter((store) => store.status === "approved");

  const subscriptionData = useMemo(() => {
    const counts = { Free: 0, Pro: 0, Premium: 0 };

    stores.forEach((store) => {
      const plan = counts[store.subscription] !== undefined ? store.subscription : "Free";
      counts[plan] += 1;
    });

    const total = Object.values(counts).reduce((sum, value) => sum + value, 0) || 1;

    return {
      total,
      items: [
        { label: t.freePlan, key: "Free", value: counts.Free, color: "#3b82f6" },
        { label: t.proPlan, key: "Pro", value: counts.Pro, color: "#f59e0b" },
        { label: t.premiumPlan, key: "Premium", value: counts.Premium, color: "#ef4444" },
      ].map((item) => ({
        ...item,
        percentage: Math.round((item.value / total) * 100),
      })),
    };
  }, [validStores, t.freePlan, t.proPlan, t.premiumPlan]);

  const totalGrowthValue = Math.max(
    ...monthlyGrowth.flatMap((item) => [item.users, item.stores]),
    1,
  );

  const userLine = buildPolyline(monthlyGrowth, "users", totalGrowthValue, 640, 280, 24);
  const storeLine = buildPolyline(monthlyGrowth, "stores", totalGrowthValue, 640, 280, 24);

  const donutStyle = {
    background: `conic-gradient(
      #3b82f6 0 ${subscriptionData.items[0].percentage}%,
      #f59e0b ${subscriptionData.items[0].percentage}% ${subscriptionData.items[0].percentage + subscriptionData.items[1].percentage}%,
      #ef4444 ${subscriptionData.items[0].percentage + subscriptionData.items[1].percentage}% 100%
    )`,
  };

  const paidRate = Math.round(
    ((subscriptionData.items[1].value + subscriptionData.items[2].value) /
      subscriptionData.total) *
      100,
  );

  const stats = [
    {
      label: t.totalUsers,
      value: users.length,
      tone: "blue",
      badge: "USR",
      helper: language === "ar" ? "كل الحسابات المسجلة" : "All registered accounts",
    },
    {
      label: t.approvedStores,
      value: approvedStores.length,
      tone: "green",
      badge: "APR",
      helper: language === "ar" ? "متاجر جاهزة للعمل" : "Stores ready to operate",
    },
    {
      label: t.pendingStores,
      value: pendingStores.length,
      tone: "amber",
      badge: "PND",
      helper: language === "ar" ? "بانتظار مراجعة الإدارة" : "Waiting for admin review",
    },
    {
      label: t.paidSubscriptionRate,
      value: `${paidRate}%`,
      tone: "violet",
      badge: "SUB",
      helper: language === "ar" ? "برو + بريميوم" : "Pro + Premium plans",
    },
    {
      label: t.monthlyRevenue,
      value: formatCurrency(revenue),
      tone: "teal",
      badge: "REV",
      helper: language === "ar" ? "إجمالي دخل هذا الشهر" : "Total revenue this month",
    },
  ];

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

      <section className="panel-grid admin-overview-grid">
        <article className="panel">
          <div className="panel-header">
            <h2>{t.pendingStoreApprovals}</h2>
            <span>{pendingStores.length} {t.waiting}</span>
          </div>

          <div className="list-stack">
            {pendingStores.map((store) => (
              <div key={store.id} className="approval-card">
                <div className="stacked-cell">
                  <strong>{store.name}</strong>
                  <small>
                    {t.owner} {store.ownerName} | {store.category} | {store.city}
                  </small>
                </div>
                <span className="status-pill pending">{t.pending}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>{t.subscriptionDistribution}</h2>
            <span>{subscriptionData.total} {t.storesUnit}</span>
          </div>

          <div className="subscription-layout">
            <div className="subscription-bars">
              {subscriptionData.items.map((item) => (
                <div key={item.key} className="subscription-row">
                  <div className="subscription-row-top">
                    <span>{item.label}</span>
                    <strong>{item.value} {t.storesUnit}</strong>
                  </div>
                  <div className="subscription-bar-track">
                    <div
                      className="subscription-bar-fill"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="donut-card">
              <div className="subscription-donut" style={donutStyle}>
                <div className="subscription-donut-center">
                  <strong>{subscriptionData.total}</strong>
                  <span>{t.storesUnit}</span>
                </div>
              </div>

              <div className="donut-legend">
                {subscriptionData.items.map((item) => (
                  <span key={item.key} className="legend-chip">
                    <i style={{ backgroundColor: item.color }} />
                    {item.key}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>{t.systemAnalyticsMonthlyGrowth}</h2>
          <div className="chart-legend">
            <span className="legend-chip">
              <i style={{ backgroundColor: "#10b981" }} />
              {t.newUsers}
            </span>
            <span className="legend-chip">
              <i style={{ backgroundColor: "#3b82f6" }} />
              {t.newStores}
            </span>
          </div>
        </div>

        <div className="chart-wrapper">
          <svg viewBox="0 0 640 280" className="growth-chart" role="img" aria-label={t.systemAnalyticsMonthlyGrowth}>
            <polyline className="chart-line chart-line-users" points={userLine} />
            <polyline className="chart-line chart-line-stores" points={storeLine} />
            {monthlyGrowth.map((item, index) => {
              const x = 24 + ((640 - 48) / (monthlyGrowth.length - 1)) * index;
              const userY = 280 - 24 - (item.users / totalGrowthValue) * (280 - 48);
              const storeY = 280 - 24 - (item.stores / totalGrowthValue) * (280 - 48);

              return (
                <g key={item.monthEn}>
                  <circle cx={x} cy={userY} r="5" className="chart-point chart-point-users" />
                  <circle cx={x} cy={storeY} r="5" className="chart-point chart-point-stores" />
                </g>
              );
            })}
          </svg>

          <div className="chart-label-row">
            {monthlyGrowth.map((item) => (
              <span key={item.monthEn}>
                {language === "ar" ? item.monthAr : item.monthEn}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
