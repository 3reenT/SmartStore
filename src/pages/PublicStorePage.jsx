import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { useApp } from "../state/AppContext";
import StorefrontTopBar from "../components/StorefrontTopBar";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
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

function getCategorySymbol(category) {
  const normalized = String(category || "").toLowerCase();

  if (normalized.includes("ipad") || normalized.includes("tablet") || normalized.includes("تابلت")) {
    return "[TB]";
  }

  if (normalized.includes("phone") || normalized.includes("iphone") || normalized.includes("جوال")) {
    return "[PH]";
  }

  if (normalized.includes("watch") || normalized.includes("ساع")) {
    return "[WT]";
  }

  if (
    normalized.includes("accessor") ||
    normalized.includes("cable") ||
    normalized.includes("charger") ||
    normalized.includes("case") ||
    normalized.includes("cover") ||
    normalized.includes("اكسسوار")
  ) {
    return "[AC]";
  }

  if (
    normalized.includes("laptop") ||
    normalized.includes("electronics") ||
    normalized.includes("tech") ||
    normalized.includes("الكترون") ||
    normalized.includes("إلكترون")
  ) {
    return "[LP]";
  }

  if (
    normalized.includes("blazer") ||
    normalized.includes("shirt") ||
    normalized.includes("قميص") ||
    normalized.includes("بليزر")
  ) {
    return "[TS]";
  }

  if (normalized.includes("jacket") || normalized.includes("جاكيت")) {
    return "[JK]";
  }

  if (normalized.includes("pants") || normalized.includes("trouser") || normalized.includes("بنطال")) {
    return "[PT]";
  }

  if (normalized.includes("shoe") || normalized.includes("sneaker") || normalized.includes("أحذية")) {
    return "[SH]";
  }

  if (normalized.includes("perfume") || normalized.includes("عطر")) {
    return "[PF]";
  }

  if (
    normalized.includes("home") ||
    normalized.includes("decor") ||
    normalized.includes("furniture") ||
    normalized.includes("منزل") ||
    normalized.includes("أثاث")
  ) {
    return "[HM]";
  }

  return "[--]";
}

function getCategoryBarStyle(color) {
  const accent = color || "#8c5729";

  return {
    background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 60%, #2b180a))`,
  };
}

export default function PublicStorePage() {
  const { slug } = useParams();
  const location = useLocation();
  const { stores, products, language, currentUser } = useApp();
  const store = stores.find((item) => item.slug === slug || item.id === slug) || null;

  if (!store) {
    return <Navigate to="/" replace />;
  }

  const canPreviewUnapproved =
    currentUser?.role === "admin" ||
    (currentUser?.role === "seller" && currentUser.id === store.sellerId);

  if (store.status !== "approved" && !canPreviewUnapproved) {
    return <Navigate to="/" replace />;
  }

  const searchParams = new URLSearchParams(location.search);
  const searchTerm = searchParams.get("search")?.trim().toLowerCase() || "";
  const categoryFilter = searchParams.get("category")?.trim() || "";
  const storeProducts = products.filter((product) => product.storeId === store.id);
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
  const categoryImages = Object.fromEntries(
    categories.map((category) => [
      category,
      store.categoryLogos?.[category] || "",
    ]),
  );
  const allProductsImage = store.categoryLogos?.__all__ || "";
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
  const showcaseImages = Array.isArray(store.galleryImages) ? store.galleryImages.filter(Boolean) : [];
  const [activeShowcaseIndex, setActiveShowcaseIndex] = useState(0);
  const rotatedShowcaseImages = showcaseImages.length
    ? showcaseImages.map((_, index) => showcaseImages[(activeShowcaseIndex + index) % showcaseImages.length])
    : [];

  useEffect(() => {
    setActiveShowcaseIndex(0);
  }, [store.id]);

  useEffect(() => {
    if (showcaseImages.length <= 1) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveShowcaseIndex((current) => (current + 1) % showcaseImages.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, [showcaseImages]);

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
                {language === "ar" ? "متجر محلي مميز" : "Featured local store"}
              </span>
              <h1>{store.name}</h1>
              <p>
                {store.description ||
                  (language === "ar"
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
              <span>{language === "ar" ? "عدد المنتجات" : "Products"}</span>
              <strong>{storeProducts.length}</strong>
            </div>
            <div className="public-store-highlight-card">
              <span>{language === "ar" ? "التصنيفات" : "Categories"}</span>
              <strong>{categories.length}</strong>
            </div>
            <div className="public-store-highlight-card">
              <span>{language === "ar" ? "مدينة المتجر" : "City"}</span>
              <strong>{store.city || "-"}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="storefront-catalog-layout">
        <aside className="storefront-categories-sidebar">
          <div className="public-store-section-heading storefront-side-heading">
            <span>{language === "ar" ? "تصفح التصنيفات" : "Browse categories"}</span>
            <h2>{language === "ar" ? "أقسام المتجر" : "Store categories"}</h2>
          </div>

          <div className="store-categories-list">
            <Link
              className={categoryFilter ? "store-category-list-item" : "store-category-list-item active"}
              to={`/store/${store.slug || store.id}${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ""}#store-products`}
            >
              <span className="store-category-arrow">{language === "ar" ? "‹" : "›"}</span>
              <strong>{language === "ar" ? "الرئيسية" : "All products"}</strong>
              <span className="store-category-icon">
                {allProductsImage ? (
                  <img
                    src={allProductsImage}
                    alt={language === "ar" ? "جميع المنتجات" : "All products"}
                    className="store-category-icon-image"
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
                  <span className="store-category-arrow">{language === "ar" ? "‹" : "›"}</span>
                  <strong>{category}</strong>
                  <span className="store-category-icon">
                    {categoryImages[category] ? (
                      <img
                        src={categoryImages[category]}
                        alt={category}
                        className="store-category-icon-image"
                      />
                    ) : null}
                  </span>
                </Link>
              ))
            ) : (
              <div className="public-empty-state">
                {language === "ar"
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
                  rotatedShowcaseImages.length > 1
                    ? "storefront-showcase-layout"
                    : "storefront-showcase-layout single-image"
                }
              >
                <div className="storefront-showcase-feature">
                  <img
                    src={rotatedShowcaseImages[0]}
                    alt={`${store.name} showcase`}
                    className="storefront-showcase-feature-image"
                  />
                </div>

                {rotatedShowcaseImages.length > 1 ? (
                  <div className="storefront-showcase-grid">
                    {rotatedShowcaseImages.slice(1, 5).map((image, index) => (
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
              {rotatedShowcaseImages.length > 1 ? (
                <div className="storefront-showcase-dots" aria-label={language === "ar" ? "صور العرض" : "Showcase images"}>
                  {showcaseImages.map((image, index) => (
                    <button
                      key={`${index}-${image.slice(0, 24)}`}
                      type="button"
                      className={
                        index === activeShowcaseIndex
                          ? "storefront-showcase-dot active"
                          : "storefront-showcase-dot"
                      }
                      aria-label={
                        language === "ar"
                          ? `الانتقال إلى الصورة ${index + 1}`
                          : `Go to image ${index + 1}`
                      }
                      onClick={() => setActiveShowcaseIndex(index)}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          <div className="public-store-section-heading" id={showcaseImages.length ? undefined : "store-products"}>
            <span>{language === "ar" ? "منتجات مميزة" : "Featured products"}</span>
            <h2>{language === "ar" ? "جميع منتجات المتجر حسب التصنيف" : "All store products by category"}</h2>
            {categoryFilter ? (
              <p className="storefront-search-result-note">
                {language === "ar"
                  ? `التصنيف الحالي: ${categoryFilter}`
                  : `Current category: ${categoryFilter}`}
              </p>
            ) : null}
            {searchTerm ? (
              <p className="storefront-search-result-note">
                {language === "ar"
                  ? `نتائج البحث عن: ${searchTerm}`
                  : `Search results for: ${searchTerm}`}
              </p>
            ) : null}
          </div>

          {groupedProducts.length ? (
            <div className="storefront-category-sections">
              {groupedProducts.map((group) => (
                <section key={group.category} className="storefront-category-section">
                  <div
                    className="storefront-category-section-head"
                    style={getCategoryBarStyle(store.primaryColor)}
                  >
                    <h3>{group.category}</h3>
                    <span className="storefront-category-pill">
                      {language === "ar"
                        ? `${group.products.length} منتج`
                        : `${group.products.length} products`}
                    </span>
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
                            <div className="public-product-placeholder">{product.category}</div>
                          )}
                          {product.sales > 0 ? (
                            <span className="public-product-badge">
                              {language === "ar" ? `${product.sales} مباعة` : `${product.sales} sold`}
                            </span>
                          ) : null}
                        </div>

                        <div className="public-product-body">
                          <span className="public-product-category">{product.category}</span>
                          <h3>{product.name}</h3>
                          <p>{product.description}</p>
                          <div className="public-product-footer">
                            <strong>{formatCurrency(product.price)}</strong>
                            <span className="secondary-button public-product-link-button">
                              {language === "ar" ? "عرض المنتج" : "View product"}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="public-empty-state">
              {language === "ar"
                ? searchTerm || categoryFilter
                  ? "لا توجد منتجات مطابقة لهذا التصفية."
                  : "هذا المتجر لا يحتوي على منتجات منشورة بعد."
                : searchTerm || categoryFilter
                  ? "No products matched this filter."
                  : "This store does not have published products yet."}
            </div>
          )}
        </section>
      </section>

      <footer className="public-store-footer">
        <div>
          <strong>{store.name}</strong>
          <p>{store.address || (language === "ar" ? "فلسطين" : "Palestine")}</p>
        </div>
        <div className="public-store-footer-links">
          <span>{store.contactEmail || "-"}</span>
          <span>{store.contactPhone || "-"}</span>
        </div>
      </footer>
    </section>
  );
}
