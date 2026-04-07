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
  const pricingPlans = language === "ar"
    ? [
        {
          name: "البداية",
          price: "$100",
          period: "سنويًا",
          description: "للتاجر الذي يريد الانطلاق بسرعة بواجهة متجر مرتبة.",
          features: ["متجر واحد", "حتى 50 منتج", "إدارة طلبات أساسية"],
        },
        {
          name: "النمو",
          price: "$180",
          period: "سنويًا",
          description: "الخيار الأنسب للمتاجر التي بدأت تستقبل طلبات بشكل مستمر.",
          features: ["حتى 3 متاجر", "حتى 300 منتج", "تقارير ومخزون أفضل"],
          featured: true,
        },
        {
          name: "التوسع",
          price: "$300",
          period: "سنويًا",
          description: "للتاجر الذي يريد تشغيل أكبر مع مرونة أعلى في الإدارة.",
          features: ["متاجر ومنتجات أكثر", "تحليلات أوسع", "أولوية في التوسع"],
        },
      ]
    : [
        {
          name: "Starter",
          price: "$100",
          period: "per year",
          description: "For sellers who want a clean first storefront and simple operations.",
          features: ["1 store", "Up to 50 products", "Basic order handling"],
        },
        {
          name: "Growth",
          price: "$180",
          period: "per year",
          description: "Best for stores receiving steady orders and expanding their catalog.",
          features: ["Up to 3 stores", "Up to 300 products", "Better inventory and reports"],
          featured: true,
        },
        {
          name: "Scale",
          price: "$300",
          period: "per year",
          description: "For merchants running larger operations with more flexibility.",
          features: ["More stores and products", "Expanded analytics", "Growth-ready controls"],
        },
      ];
  const launchSteps = language === "ar"
    ? [
        { step: "الخطوة الأولى", title: "أضف المنتجات", text: "ابدأ بإدخال منتجاتك وصورها وأسعارها بشكل مرتب." },
        { step: "الخطوة الثانية", title: "خصص التصميم", text: "اختر ألوان متجرك وصور العرض وهوية المتجر." },
        { step: "الخطوة الثالثة", title: "استقبل الطلبات", text: "بعد الموافقة، ابدأ البيع وتابع الطلبات من لوحة التاجر." },
      ]
    : [
        { step: "Step one", title: "Add products", text: "Upload your catalog with clear images, prices, and descriptions." },
        { step: "Step two", title: "Customize design", text: "Adjust colors, showcase images, and the store identity." },
        { step: "Step three", title: "Receive orders", text: "Once approved, start selling and manage orders from one dashboard." },
      ];

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

      <section className="guest-pricing">
        <div className="guest-section-intro compact">
          <span className="eyebrow">{language === "ar" ? "خطط واضحة" : "Clear pricing"}</span>
          <h2>
            {language === "ar"
              ? "ابدأ بالخطة المناسبة لحجم متجرك"
              : "Choose a plan that fits your store size"}
          </h2>
          <p>
            {language === "ar"
              ? "أسعار بسيطة ومنطقية للتاجر الصغير والمتوسط، مع مجال واضح للنمو."
              : "Simple pricing for small and growing merchants with a clear path to scale."}
          </p>
        </div>

        <div className="guest-pricing-grid">
          {pricingPlans.map((plan) => (
            <article
              key={plan.name}
              className={plan.featured ? "guest-pricing-card featured" : "guest-pricing-card"}
            >
              <div className="guest-pricing-head">
                <span className="guest-pricing-tier">{plan.name}</span>
                {plan.featured ? (
                  <span className="guest-pricing-badge">
                    {language === "ar" ? "الأكثر طلبًا" : "Most popular"}
                  </span>
                ) : null}
              </div>
              <div className="guest-pricing-price">
                <strong>{plan.price}</strong>
                <span>{plan.period}</span>
              </div>
              <p>{plan.description}</p>
              <div className="guest-pricing-list">
                {plan.features.map((feature) => (
                  <span key={feature}>{feature}</span>
                ))}
              </div>
              <Link className="primary-button" to={primaryLink.to}>
                {language === "ar" ? "ابدأ الآن" : "Get started"}
              </Link>
            </article>
          ))}
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

      <section className="guest-steps">
        <div className="guest-section-intro compact">
          <span className="eyebrow">{language === "ar" ? "ابدأ أسرع" : "Launch faster"}</span>
          <h2>
            {language === "ar"
              ? "خطوات بسيطة تصنع فرقًا"
              : "Simple steps that make a difference"}
          </h2>
          <p>
            {language === "ar"
              ? "ثلاث خطوات واضحة لتبدأ البيع بشكل مرتب وعملي."
              : "Three clear steps to start selling in a clean and practical way."}
          </p>
        </div>

        <div className="guest-steps-panel">
          {launchSteps.map((item, index) => (
            <article key={item.title} className="guest-step-card">
              <span className="guest-step-label">{item.step}</span>
              <div className="guest-step-icon">{index + 1}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>

        <div className="guest-guarantee-panel">
          <div className="guest-guarantee-copy">
            <span className="eyebrow">{language === "ar" ? "دعم واضح" : "Clear support"}</span>
            <h2>{language === "ar" ? "انطلاقة مضمونة وواضحة" : "A clear and confident start"}</h2>
            <p>
              {language === "ar"
                ? "لو احتجت مساعدة في البداية، تواصل معنا وسنساعدك على تجهيز متجرك خطوة بخطوة."
                : "If you need help getting started, we can guide you through setup step by step."}
            </p>
            <Link className="primary-button" to={primaryLink.to}>
              {language === "ar" ? "ابدأ الآن" : "Start now"}
            </Link>
          </div>
          <div className="guest-guarantee-badge">
            <strong>100%</strong>
            <span>{language === "ar" ? "جاهزية للانطلاق" : "Launch ready"}</span>
          </div>
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
