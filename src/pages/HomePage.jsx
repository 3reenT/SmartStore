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

const pricingPlans = {
  ar: [
    {
      name: "البداية",
      price: "$100",
      annualLabel: "سنويًا",
      note: "مناسبة للتاجر الذي يبدأ متجره الأول بخطوات واضحة وبسيطة.",
      cta: "ابدأ الآن",
      features: ["متجر واحد", "منتجات غير محدودة", "إدارة طلبات أساسية", "دعم عبر واتساب"],
    },
    {
      name: "النمو",
      price: "$190",
      annualLabel: "سنويًا",
      note: "الخيار الأنسب لمعظم المتاجر التي تريد مظهرًا أقوى وإدارة أسرع.",
      cta: "الخطة الأكثر طلبًا",
      features: ["تخصيص أكبر", "تقارير أوضح", "ألوان وشعارات المتجر", "دعم أسرع"],
      featured: true,
    },
    {
      name: "التوسع",
      price: "$300",
      annualLabel: "سنويًا",
      note: "للمتاجر التي تحتاج تجربة أقوى وتحكمًا أوسع ونموًا أكثر ثباتًا.",
      cta: "ابدأ الآن",
      features: ["تحكم متقدم", "تقارير أعمق", "مرونة أعلى للفريق", "أولوية في الدعم"],
    },
  ],
  en: [
    {
      name: "Starter",
      price: "$100",
      annualLabel: "per year",
      note: "A practical starting point for sellers launching their first store.",
      cta: "Start now",
      features: ["One store", "Unlimited products", "Core order management", "WhatsApp support"],
    },
    {
      name: "Growth",
      price: "$190",
      annualLabel: "per year",
      note: "The best fit for active stores that want a stronger storefront and smoother operations.",
      cta: "Most requested",
      features: ["More customization", "Clearer insights", "Store colors and branding", "Faster support"],
      featured: true,
    },
    {
      name: "Scale",
      price: "$300",
      annualLabel: "per year",
      note: "Built for brands that need stronger control, cleaner workflows, and room to grow.",
      cta: "Start now",
      features: ["Advanced controls", "Deeper reports", "Higher team flexibility", "Priority support"],
    },
  ],
};

const launchSteps = {
  ar: {
    title: "خطوات بسيطة تصنع فرقًا",
    subtitle: "ابدأ البيع أسرع بثلاث خطوات واضحة",
    steps: [
      { title: "أضف المنتجات", text: "ارفع صورك، الأسعار، والمخزون من مكان واحد." },
      { title: "خصص المتجر", text: "اختر شكل متجرك والأقسام والهوية التي تناسبك." },
      { title: "استقبل الطلبات", text: "تابع الطلبات والمبيعات من لوحة واضحة وسريعة." },
    ],
    guaranteeTitle: "تجربة مرنة وواضحة",
    guaranteeText: "كل شيء مرتب للتاجر من أول منتج وحتى متابعة الطلبات، بدون تعقيد في الإدارة اليومية.",
  },
  en: {
    title: "Simple steps that create momentum",
    subtitle: "Start selling faster with three clear actions",
    steps: [
      { title: "Add products", text: "Upload images, prices, and stock from one place." },
      { title: "Customize the store", text: "Shape your storefront, sections, and overall identity." },
      { title: "Receive orders", text: "Follow orders and sales from one focused dashboard." },
    ],
    guaranteeTitle: "A cleaner seller workflow",
    guaranteeText: "From the first product to daily order follow-up, the experience stays clear and lightweight.",
  },
};

export default function HomePage() {
  const { currentUser, language, stores } = useApp();
  const t = translations[language];
  const isArabic = language === "ar";
  const featuredStores = stores.filter((store) => store.status === "approved").slice(0, 8);
  const plans = pricingPlans[language] || pricingPlans.en;
  const stepsContent = launchSteps[language] || launchSteps.en;

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
          <div className="storefront-stage">
            <div className="storefront-stage-glow left" />
            <div className="storefront-stage-glow right" />
            <div className="storefront-stage-shell">
              <div className="storefront-stage-topbar">
                <div className="storefront-stage-logo">{t.smartstore}</div>
                <span>{isArabic ? "منصة تجارة ذكية" : "Intelligent commerce platform"}</span>
              </div>

              <div className="storefront-stage-grid">
                <article className="storefront-stage-card home" data-label="HS">
                  <strong>{isArabic ? "Home Store" : "Home Store"}</strong>
                  <span>{isArabic ? "منزل وحديقة" : "Home & Garden"}</span>
                </article>
                <article className="storefront-stage-card featured" data-label="Smart">
                  <strong>{t.smartstore}</strong>
                  <span>{isArabic ? "إدارة المتاجر والطلبات" : "Storefront and order operations"}</span>
                </article>
                <article className="storefront-stage-card tech" data-label="TS">
                  <strong>{isArabic ? "TechStore" : "TechStore"}</strong>
                  <span>{isArabic ? "إلكترونيات" : "Electronics"}</span>
                </article>
                <article className="storefront-stage-card sport" data-label="AW">
                  <strong>{isArabic ? "Activewear" : "Activewear"}</strong>
                  <span>{isArabic ? "رياضة ولياقة" : "Sports & Fitness"}</span>
                </article>
                <article className="storefront-stage-card fashion" data-label="AP">
                  <strong>{isArabic ? "Apparel" : "Apparel"}</strong>
                  <span>{isArabic ? "أزياء وملابس" : "Fashion & Apparel"}</span>
                </article>
                <article className="storefront-stage-card green" data-label="GH">
                  <strong>{isArabic ? "Green Harvest" : "Green Harvest"}</strong>
                  <span>{isArabic ? "منتجات وحدائق" : "Produce & Gardening"}</span>
                </article>
              </div>
            </div>
          </div>
        </div>

        <div className="guest-hero-copy">
          <span className="eyebrow">{t.smartstore}</span>
          <h1>
            {isArabic
              ? "ابدأ متجرك الإلكتروني بثقة ومن غير تعقيد"
              : "Launch your online store with more clarity and confidence"}
          </h1>
          <p>
            {isArabic
              ? "منصة تساعد التاجر على إدارة المنتجات، الطلبات، المخزون، وتجربة المتجر العامة من مكان واحد."
              : "A focused platform that helps sellers manage products, orders, inventory, and the storefront experience from one place."}
          </p>

          <div className="guest-hero-actions">
            <Link className="primary-button" to={primaryLink.to}>
              {primaryLink.label}
            </Link>
          </div>

          <div className="guest-meta-row">
            <span>{isArabic ? "ثنائي اللغة" : "Bilingual"}</span>
            <span>{isArabic ? "جاهز للذكاء الاصطناعي" : "AI-ready"}</span>
            <span>{isArabic ? "إدارة متجر كاملة" : "Full store operations"}</span>
          </div>
          {!currentUser ? (
            <Link className="workspace-access-link" to="/login">
              {isArabic ? "دخول الأدمن والتاجر" : "Admin & seller access"}
            </Link>
          ) : null}
        </div>
      </section>

      <section className="guest-pricing">
        <div className="guest-section-intro compact">
          <span className="eyebrow">{isArabic ? "بلا تعقيد" : "No complexity"}</span>
          <h2>{isArabic ? "خطط واضحة تتطور مع نجاحك" : "Clear plans that grow with your store"}</h2>
          <p>
            {isArabic
              ? "كل خطة تمنح متجرك الأدوات التي يحتاجها، مع سعر سنوي مناسب يبدأ من 100 وحتى 300 دولار."
              : "Each plan gives your store the tools it needs, with simple annual pricing from $100 to $300."}
          </p>
        </div>

        <div className="guest-pricing-grid">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`pricing-card${plan.featured ? " featured" : ""}`}
            >
              {plan.featured ? (
                <span className="pricing-badge">
                  {isArabic ? "الأكثر طلبًا" : "Most requested"}
                </span>
              ) : null}
              <span className="pricing-plan-name">{plan.name}</span>
              <div className="pricing-price-wrap">
                <strong className="pricing-plan-price">{plan.price}</strong>
                <span className="pricing-plan-period">{plan.annualLabel}</span>
              </div>
              <p>{plan.note}</p>
              <button
                className={plan.featured ? "primary-button pricing-cta" : "secondary-button pricing-cta"}
                type="button"
              >
                {plan.cta}
              </button>
              <div className="pricing-feature-list">
                {plan.features.map((feature) => (
                  <span key={feature}>{feature}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="guest-foundation">
        <div className="guest-section-intro">
          <span className="eyebrow">{isArabic ? "أساسيات النجاح" : "Success foundation"}</span>
          <h2>
            {isArabic
              ? "كل ما يحتاجه التاجر في منصة واحدة"
              : "Everything a seller needs in one platform"}
          </h2>
        </div>

        <div className="guest-foundation-grid">
          <article className="foundation-card">
            <div className="foundation-visual monitor" />
            <h3>{isArabic ? "لوحة تحكم واضحة" : "Clear operations dashboard"}</h3>
            <p>
              {isArabic
                ? "تابع الطلبات والمنتجات والإيرادات من مساحة واحدة."
                : "Track orders, catalog changes, and revenue from one focused workspace."}
            </p>
          </article>

          <article className="foundation-card">
            <div className="foundation-visual analytics" />
            <h3>{isArabic ? "نمو أسرع" : "Faster growth"}</h3>
            <p>
              {isArabic
                ? "تحليلات ومؤشرات تساعدك على فهم أداء متجرك بشكل يومي."
                : "Daily insights that make store performance easier to understand."}
            </p>
          </article>

          <article className="foundation-card">
            <div className="foundation-visual delivery" />
            <h3>{isArabic ? "إدارة تنفيذ أسلس" : "Smoother fulfillment"}</h3>
            <p>
              {isArabic
                ? "نظّم الطلبات والمتابعة والمخزون بطريقة أبسط."
                : "Handle orders, follow-up, and stock with less friction."}
            </p>
          </article>

          <article className="foundation-card">
            <div className="foundation-visual mobile" />
            <h3>{isArabic ? "تجربة مناسبة للموبايل" : "Mobile-ready experience"}</h3>
            <p>
              {isArabic
                ? "واجهة مناسبة للتاجر والزبون على الهاتف والويب."
                : "A cleaner experience for both sellers and shoppers across devices."}
            </p>
          </article>
        </div>
      </section>

      <section className="guest-brands">
        <div className="guest-section-intro compact">
          <span className="eyebrow">{isArabic ? "متاجر معروضة" : "Featured stores"}</span>
          <h2>
            {isArabic
              ? "متاجر حقيقية يمكنك تصفحها مباشرة"
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
              {store.logo ? (
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

      <section className="guest-steps-footer">
        <div className="guest-section-intro compact">
          <span className="eyebrow">{isArabic ? "ابدأ أسرع" : "Move faster"}</span>
          <h2>{stepsContent.title}</h2>
          <p>{stepsContent.subtitle}</p>
        </div>

        <div className="steps-footer-card">
          <div className="steps-footer-grid">
            {stepsContent.steps.map((step, index) => (
              <article key={step.title} className="steps-footer-item">
                <span className="steps-footer-number">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="steps-guarantee-card">
          <div>
            <span className="eyebrow">{isArabic ? "واجهة أنظف" : "Cleaner workflow"}</span>
            <h3>{stepsContent.guaranteeTitle}</h3>
            <p>{stepsContent.guaranteeText}</p>
          </div>
        </div>
      </section>
    </section>
  );
}
