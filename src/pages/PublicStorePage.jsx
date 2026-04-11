import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "../state/AppContext";
import StorefrontTopBar from "../components/StorefrontTopBar";

function formatCurrency(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getStoreInitials(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function getCategoryBarStyle(color) {
  const accent = color || "#8c5729";

  return {
    background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 60%, #2b180a))`,
  };
}

function formatRemainingDiscountTime(value, isArabic) {
  if (!value) {
    return "";
  }

  const remainingMs = new Date(value).getTime() - Date.now();

  if (remainingMs <= 0) {
    return "";
  }

  const totalHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const totalDays = Math.floor(totalHours / 24);

  if (totalDays >= 1) {
    return isArabic ? `${totalDays} يوم` : `${totalDays} day${totalDays > 1 ? "s" : ""}`;
  }

  if (totalHours >= 1) {
    return isArabic ? `${totalHours} ساعة` : `${totalHours} hour${totalHours > 1 ? "s" : ""}`;
  }

  const minutes = Math.max(1, Math.floor(remainingMs / (1000 * 60)));
  return isArabic ? `${minutes} دقيقة` : `${minutes} min`;
}

export default function PublicStorePage() {
  const { slug } = useParams();
  const location = useLocation();
  const {
    stores,
    products,
    language,
    currentUser,
    getEffectiveProductPrice,
    getEffectiveProductOriginalPrice,
    isDiscountCurrentlyActive,
  } = useApp();
  const [activeShowcaseIndex, setActiveShowcaseIndex] = useState(0);
  const isArabic = language === "ar";
  const store = stores.find((item) => item.slug === slug || item.id === slug) || null;
  const searchParams = new URLSearchParams(location.search);
  const searchTerm = searchParams.get("search")?.trim().toLowerCase() || "";
  const categoryFilter = searchParams.get("category")?.trim() || "";
  const storeProducts = store ? products.filter((product) => product.storeId === store.id) : [];
  const filteredProducts = storeProducts.filter((product) => {
    const matchesSearch = searchTerm
      ? [product.name, product.category, product.description]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(searchTerm))
      : true;
    const matchesCategory = categoryFilter ? product.category === categoryFilter : true;

    return matchesSearch && matchesCategory;
  });
  const categories = [...new Set(storeProducts.map((product) => product.category).filter(Boolean))];
  const visibleCategories = categoryFilter
    ? categories.filter((category) => category === categoryFilter)
    : categories;
  const groupedProducts = visibleCategories
    .map((category) => ({
      category,
      products: filteredProducts
        .filter((product) => product.category === category)
        .sort((left, right) => right.sales - left.sales),
    }))
    .filter((group) => group.products.length);
  const showcaseImages = Array.isArray(store?.galleryImages) ? store.galleryImages.filter(Boolean) : [];
  const sectionLogos =
    store?.sectionLogos && typeof store.sectionLogos === "object" ? store.sectionLogos : {};
  const homeSectionKey = isArabic ? "الرئيسية" : "Home";
  const canPreviewUnapproved =
    currentUser?.role === "admin" ||
    (currentUser?.role === "seller" && currentUser.id === store?.sellerId);
  const storeCurrency = store?.currency || "USD";

  useEffect(() => {
    setActiveShowcaseIndex(0);
  }, [store?.id]);

  useEffect(() => {
    if (showcaseImages.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveShowcaseIndex((current) => (current + 1) % showcaseImages.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, [showcaseImages]);

  const activeShowcaseImage = showcaseImages[activeShowcaseIndex] || showcaseImages[0] || "";
  const showcaseThumbs = useMemo(
    () => showcaseImages.filter((_, index) => index !== activeShowcaseIndex).slice(0, 4),
    [showcaseImages, activeShowcaseIndex],
  );

  if (!store) {
    return <Navigate to="/" replace />;
  }

  if (store.status !== "approved" && !canPreviewUnapproved) {
    return <Navigate to="/" replace />;
  }

  return (
    <section className="public-store-page">
      <StorefrontTopBar store={store} searchTo={`/store/${store.slug || store.id}#store-products`} />

      <section
        className="public-store-hero"
        style={{
          background: store.banner
            ? `linear-gradient(rgba(10, 15, 22, 0.46), rgba(10, 15, 22, 0.64)), center / cover no-repeat url(${store.banner})`
            : `linear-gradient(135deg, ${store.primaryColor || "#18c79c"}, #081217 72%)`,
        }}
      >
        <div className="public-store-hero-inner">
          <div className="public-store-brand">
            {store.logo ? (
              <img src={store.logo} alt={store.name} className="public-store-logo" />
            ) : (
              <div className="public-store-logo public-store-logo-fallback">
                {getStoreInitials(store.name)}
              </div>
            )}

            <div className="public-store-copy">
              <span className="public-store-eyebrow">
                {isArabic ? "متجر محلي مميز" : "Featured local store"}
              </span>
              <h1>{store.name}</h1>
              <p>
                {store.description ||
                  (isArabic
                    ? "واجهة متجر عامة جاهزة للعرض والتصفح."
                    : "A polished public storefront ready for browsing and discovery.")}
              </p>
              <div className="public-store-meta">
                <span>{store.category}</span>
                <span>{store.city}</span>
                <span>{store.contactPhone || store.contactEmail}</span>
              </div>
            </div>
          </div>

          <div className="public-store-highlight">
            <div className="public-store-highlight-card">
              <span>{isArabic ? "عدد المنتجات" : "Products"}</span>
              <strong>{storeProducts.length}</strong>
            </div>
            <div className="public-store-highlight-card">
              <span>{isArabic ? "التصنيفات" : "Categories"}</span>
              <strong>{categories.length}</strong>
            </div>
            <div className="public-store-highlight-card">
              <span>{isArabic ? "مدينة المتجر" : "City"}</span>
              <strong>{store.city || "-"}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="storefront-catalog-layout">
        <aside className="storefront-categories-sidebar">
          <div className="public-store-section-heading storefront-side-heading">
            <span>{isArabic ? "تصفح التصنيفات" : "Browse categories"}</span>
            <h2>{isArabic ? "أقسام المتجر" : "Store categories"}</h2>
          </div>

          <div className="store-categories-list">
            <Link
              className={categoryFilter ? "store-category-list-item" : "store-category-list-item active"}
              to={`/store/${store.slug || store.id}${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ""}#store-products`}
            >
              <span className="store-category-arrow">{isArabic ? "‹" : "›"}</span>
              <strong>{isArabic ? "كل المنتجات" : "All products"}</strong>
              <span className="store-category-icon">
                {sectionLogos[homeSectionKey] ? (
                  <img
                    src={sectionLogos[homeSectionKey]}
                    alt={homeSectionKey}
                    className="store-category-logo-image"
                  />
                ) : null}
              </span>
            </Link>

            {categories.length ? (
              categories.map((category) => (
                <Link
                  key={category}
                  className={
                    categoryFilter === category
                      ? "store-category-list-item active"
                      : "store-category-list-item"
                  }
                  to={`/store/${store.slug || store.id}?${new URLSearchParams({
                    ...(searchTerm ? { search: searchTerm } : {}),
                    category,
                  }).toString()}#store-products`}
                >
                  <span className="store-category-arrow">{isArabic ? "‹" : "›"}</span>
                  <strong>{category}</strong>
                  <span className="store-category-icon">
                    {sectionLogos[category] ? (
                      <img
                        src={sectionLogos[category]}
                        alt={category}
                        className="store-category-logo-image"
                      />
                    ) : null}
                  </span>
                </Link>
              ))
            ) : (
              <div className="public-empty-state">
                {isArabic
                  ? "لا توجد تصنيفات بعد. أضف منتجات لهذا المتجر ليظهر العرض العام."
                  : "No categories yet. Add products to this store to populate the public page."}
              </div>
            )}
          </div>
        </aside>

        <section className="public-store-section storefront-products-stage">
          {showcaseImages.length ? (
            <section className="storefront-showcase-strip" id="store-products">
              <div
                className={
                  showcaseImages.length > 1
                    ? "storefront-showcase-layout"
                    : "storefront-showcase-layout single-image"
                }
              >
                <div className="storefront-showcase-feature">
                  <img
                    src={activeShowcaseImage}
                    alt={`${store.name} showcase`}
                    className="storefront-showcase-feature-image"
                  />
                </div>

                {showcaseThumbs.length ? (
                  <div className="storefront-showcase-grid">
                    {showcaseThumbs.map((image, index) => (
                      <div key={`${index}-${image.slice(0, 24)}`} className="storefront-showcase-tile">
                        <img
                          src={image}
                          alt={`${store.name} showcase ${index + 2}`}
                          className="storefront-showcase-tile-image"
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {showcaseImages.length > 1 ? (
                <div className="storefront-showcase-dots">
                  {showcaseImages.map((image, index) => (
                    <button
                      key={`${image.slice(0, 18)}-${index}`}
                      type="button"
                      className={index === activeShowcaseIndex ? "showcase-dot active" : "showcase-dot"}
                      onClick={() => setActiveShowcaseIndex(index)}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          <div
            className="public-store-section-heading"
            id={showcaseImages.length ? undefined : "store-products"}
          >
            <span>{isArabic ? "منتجات مميزة" : "Featured products"}</span>
            <h2>{isArabic ? "جميع منتجات المتجر حسب التصنيف" : "All store products by category"}</h2>
          </div>

          {groupedProducts.length ? (
            <div className="storefront-category-sections">
              {groupedProducts.map((group) => (
                <section key={group.category} className="storefront-category-section">
                  <div
                    className="storefront-category-section-head"
                    style={getCategoryBarStyle(store.primaryColor)}
                  >
                    <span>{group.products.length}</span>
                    <div className="storefront-category-title">
                      <span className="storefront-category-head-logo">
                        {sectionLogos[group.category] ? (
                          <img
                            src={sectionLogos[group.category]}
                            alt={group.category}
                            className="store-category-logo-image"
                          />
                        ) : null}
                      </span>
                      <strong>{group.category}</strong>
                    </div>
                  </div>

                  <div className="public-product-grid">
                    {group.products.map((product) => (
                      <Link
                        key={product.id}
                        to={`/store/${store.slug || store.id}/product/${product.id}`}
                        className="public-product-card"
                      >
                        <div className="public-product-media">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="public-product-image" />
                          ) : (
                            <div className="public-product-placeholder">{group.category}</div>
                          )}
                        </div>
                        <div className="public-product-body">
                          <span className="public-product-category">{product.category}</span>
                          <h3>{product.name}</h3>
                          {product.hasDimensions && product.dimensionOptions?.length ? (
                            <small className="product-dimensions-inline">
                              {product.dimensionOptions.join(" • ")}
                            </small>
                          ) : null}
                          <div className="public-product-footer">
                            <strong>{formatCurrency(getEffectiveProductPrice(product), storeCurrency)}</strong>
                          </div>
                          {product.discountType === "temporary" && isDiscountCurrentlyActive(product) ? (
                            <small className="product-discount-timer-inline">
                              {isArabic
                                ? `متبقي: ${formatRemainingDiscountTime(product.discountEndsAt, true)}`
                                : `Ends in: ${formatRemainingDiscountTime(product.discountEndsAt, false)}`}
                            </small>
                          ) : null}
                          {getEffectiveProductOriginalPrice(product) > getEffectiveProductPrice(product) ? (
                            <small className="product-old-price-inline">
                              {formatCurrency(getEffectiveProductOriginalPrice(product), storeCurrency)}
                            </small>
                          ) : null}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="public-empty-state large">
              {searchTerm || categoryFilter
                ? isArabic
                  ? "لا توجد منتجات مطابقة لهذا البحث أو التصنيف."
                  : "No products match this search or category."
                : isArabic
                  ? "لا توجد منتجات منشورة بعد."
                  : "No published products yet."}
            </div>
          )}
        </section>
      </section>
    </section>
  );
}
