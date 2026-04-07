import { Link } from "react-router-dom";
import { useApp } from "../state/AppContext";
import { translations } from "../i18n";

function getStoreInitials(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function HomePage() {
  const { currentUser, language, stores } = useApp();
  const t = translations[language];
  const featuredStores = stores.filter((store) => store.status === "approved").slice(0, 8);

  const primaryLink =
    currentUser?.role === "admin"
      ? { to: "/admin", label: t.openAdminPanel }
      : currentUser?.role === "seller"
        ? { to: "/seller", label: t.openSellerPanel }
        : { to: "/seller-request", label: t.createSellerRequest };

  return (
    <section className="guest-landing">
      <section className="guest-hero">
        <div className="guest-hero-media">
          <div className="phone-mock">
            <div className="phone-notch" />
            <div className="phone-screen">
              <div className="screen-card large" />
              <div className="screen-row">
                <div className="screen-card" />
                <div className="screen-card" />
              </div>
              <div className="screen-strip" />
            </div>
          </div>
        </div>

        <div className="guest-hero-copy">
          <span className="eyebrow">{t.smartstore}</span>
          <h1>
            {language === "ar"
              ? "كن أنت وابدأ تجارتك الإلكترونية"
              : "Launch your online commerce presence with confidence"}
          </h1>
          <p>
            {language === "ar"
              ? "منصة ذكية تساعد المتاجر المحلية على البيع، إدارة الطلبات، متابعة المخزون، والنمو من مكان واحد."
              : "A modern platform for local businesses to sell online, manage orders, track inventory, and grow from one place."}
          </p>

          <div className="guest-hero-actions">
            <Link className="primary-button" to={primaryLink.to}>
              {primaryLink.label}
            </Link>
          </div>

          <div className="guest-meta-row">
            <span>{language === "ar" ? "ثنائي اللغة" : "Bilingual"}</span>
            <span>{language === "ar" ? "ذكاء اصطناعي" : "AI-ready"}</span>
            <span>{language === "ar" ? "إدارة متجر كاملة" : "Full store operations"}</span>
          </div>
          {!currentUser ? (
            <Link className="workspace-access-link" to="/login">
              {language === "ar" ? "دخول الأدمن والتاجر" : "Admin & seller access"}
            </Link>
          ) : null}
        </div>
      </section>

      <section className="guest-foundation">
        <div className="guest-section-intro">
          <span className="eyebrow">
            {language === "ar" ? "أساسيات النجاح" : "Success foundation"}
          </span>
          <h2>
            {language === "ar"
              ? "كل ما يحتاجه التاجر في منصة واحدة"
              : "Everything a seller needs in one platform"}
          </h2>
        </div>

        <div className="guest-foundation-grid">
          <article className="foundation-card">
            <div className="foundation-visual monitor" />
            <h3>{language === "ar" ? "لوحة تحكم واضحة" : "Clear operations dashboard"}</h3>
            <p>
              {language === "ar"
                ? "تابع الطلبات، المنتجات، والإيرادات من مساحة موحدة."
                : "Track orders, catalog, and revenue from one focused workspace."}
            </p>
          </article>

          <article className="foundation-card">
            <div className="foundation-visual analytics" />
            <h3>{language === "ar" ? "نمو أسرع" : "Faster growth"}</h3>
            <p>
              {language === "ar"
                ? "تحليلات ومؤشرات تساعدك على فهم أداء متجرك بشكل يومي."
                : "Daily insights and metrics that help you understand store performance."}
            </p>
          </article>

          <article className="foundation-card">
            <div className="foundation-visual delivery" />
            <h3>{language === "ar" ? "توصيل متكامل" : "Integrated delivery"}</h3>
            <p>
              {language === "ar"
                ? "اربط الطلبات مع خدمات التوصيل وتتبع التنفيذ بسهولة."
                : "Connect orders with delivery services and follow fulfillment smoothly."}
            </p>
          </article>

          <article className="foundation-card">
            <div className="foundation-visual mobile" />
            <h3>{language === "ar" ? "تجربة موبايل" : "Mobile-first experience"}</h3>
            <p>
              {language === "ar"
                ? "واجهة مناسبة للضيف والتاجر على الهاتف والويب."
                : "A polished experience for both guests and sellers across mobile and web."}
            </p>
          </article>
        </div>
      </section>

      <section className="guest-story-grid">
        <article className="story-panel story-panel-wide">
          <div className="story-copy">
            <span className="eyebrow">
              {language === "ar" ? "تسويق أذكى" : "Smarter marketing"}
            </span>
            <h2>
              {language === "ar"
                ? "وفّر أكثر من وقتك وأموال إعلاناتك"
                : "Save more of your time and ad budget"}
            </h2>
            <p>
              {language === "ar"
                ? "اعتمد على تحليلات واضحة وأفكار ذكية تساعدك على تحسين الحملات واتخاذ قرارات أسرع."
                : "Use clear analytics and intelligent suggestions to improve campaigns and make faster decisions."}
            </p>
            <div className="story-list">
              <span>{language === "ar" ? "تقارير أداء مبسطة" : "Simplified performance reports"}</span>
              <span>{language === "ar" ? "وصف منتجات ذكي" : "AI product descriptions"}</span>
              <span>{language === "ar" ? "تنبيهات تشغيلية" : "Operational alerts"}</span>
            </div>
          </div>
          <div className="story-visual gradient-card" />
        </article>

        <article className="story-panel">
          <div className="story-visual phone-card" />
          <div className="story-copy">
            <span className="eyebrow">
              {language === "ar" ? "تجربة متكاملة" : "Connected experience"}
            </span>
            <h2>
              {language === "ar"
                ? "حول متجرك إلى تجربة علامة متكاملة"
                : "Turn your store into a polished brand experience"}
            </h2>
            <p>
              {language === "ar"
                ? "من التصفح وحتى الإشعارات، تبقى تجربة العميل متناسقة وواضحة."
                : "From browsing to notifications, the customer journey stays consistent and clear."}
            </p>
          </div>
        </article>
      </section>

      <section className="guest-brands">
        <div className="guest-section-intro compact">
          <span className="eyebrow">{language === "ar" ? "قصص نجاح" : "Trusted by stores"}</span>
          <h2>
            {language === "ar"
              ? "متاجر حقيقية يمكنك زيارتها مباشرة"
              : "Real storefronts you can explore directly"}
          </h2>
        </div>

        <div className="brand-cloud">
          {featuredStores.map((store) => (
            <a
              key={store.id}
              className="brand-cloud-card brand-store-card"
              href={`/store/${store.slug || store.id}`}
              target="_blank"
              rel="noreferrer"
            >
              {store.logo && store.logo !== "/logo.png" ? (
                <img src={store.logo} alt={store.name} className="brand-store-image" />
              ) : (
                <div
                  className="brand-store-fallback"
                  style={{
                    background: `linear-gradient(135deg, ${store.primaryColor || "#18c79c"}, #0f172a)`,
                  }}
                >
                  <span>{getStoreInitials(store.name)}</span>
                </div>
              )}
              <strong>{store.name}</strong>
              <small>{store.category}</small>
            </a>
          ))}
        </div>
      </section>
    </section>
  );
}
