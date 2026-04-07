import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useMemo } from "react";
import { useApp } from "../state/AppContext";
import StorefrontTopBar from "../components/StorefrontTopBar";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function PublicProductPage() {
  const { slug, productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    stores,
    products,
    currentUser,
    language,
    getStoreCustomer,
    getStoreCustomerWorkspace,
    toggleFavorite,
    addToCart,
    buyNow,
  } = useApp();

  const store = stores.find((item) => item.slug === slug || item.id === slug) || null;
  const product = products.find((item) => item.id === productId) || null;

  if (!store || !product || product.storeId !== store.id) {
    return <Navigate to="/" replace />;
  }

  const canPreviewUnapproved =
    currentUser?.role === "admin" ||
    (currentUser?.role === "seller" && currentUser.id === store.sellerId);

  if (store.status !== "approved" && !canPreviewUnapproved) {
    return <Navigate to="/" replace />;
  }

  const relatedProducts = useMemo(
    () =>
      products
        .filter((item) => item.storeId === store.id && item.id !== product.id)
        .slice(0, 4),
    [products, store.id, product.id],
  );

  const originalPrice = Number(product.originalPrice || 0);
  const discount =
    originalPrice > product.price
      ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
      : 0;
  const storeCustomer = getStoreCustomer(store.id);
  const isCustomer = Boolean(storeCustomer);
  const storeWorkspace = getStoreCustomerWorkspace(store.id);
  const isFavorite = storeWorkspace.favorites.includes(product.id);
  const loginRedirectState = {
    from: `${location.pathname}${location.search}${location.hash}`,
    storeId: store.id,
  };

  const requireCustomer = (callback) => {
    if (isCustomer) {
      callback();
      return;
    }

    navigate("/login", { state: loginRedirectState });
  };

  return (
    <section className="public-product-page">
      <StorefrontTopBar
        store={store}
        searchTo={`/store/${store.slug || store.id}#store-products`}
      />

      <nav className="product-breadcrumb">
        <Link to="/">{language === "ar" ? "الرئيسية" : "Home"}</Link>
        <span>/</span>
        <Link to={`/store/${store.slug || store.id}`}>{store.name}</Link>
        <span>/</span>
        <span>{product.category}</span>
        <span>/</span>
        <strong>{product.name}</strong>
      </nav>

      <section className="public-product-hero">
        <div className="public-product-gallery">
          <div className="public-product-thumbs">
            {Array.from({ length: 4 }).map((_, index) => (
              <button key={index} type="button" className="public-product-thumb-button">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="public-product-thumb-image" />
                ) : (
                  <span>{product.category}</span>
                )}
              </button>
            ))}
          </div>

          <div className="public-product-main-image-card">
            {discount > 0 ? <span className="product-sale-badge">-{discount}%</span> : null}
            {product.isNew ? <span className="product-new-badge">NEW</span> : null}
            {product.image ? (
              <img src={product.image} alt={product.name} className="public-product-main-image" />
            ) : (
              <div className="public-product-main-image placeholder">{product.category}</div>
            )}
          </div>
        </div>

        <div className="public-product-summary">
          <h1>{product.name}</h1>

          <div className="public-product-pricing">
            <span className="current-price">{formatCurrency(product.price)}</span>
            {discount > 0 ? <span className="old-price">{formatCurrency(originalPrice)}</span> : null}
          </div>

          <div className="public-product-top-actions">
            <button
              type="button"
              className={isFavorite ? "favorite-button active" : "favorite-button"}
              onClick={() => requireCustomer(() => toggleFavorite(store.id, product.id))}
            >
              {language === "ar"
                ? isFavorite
                  ? "إزالة من المفضلة"
                  : "إضافة إلى المفضلة"
                : isFavorite
                  ? "Remove from favorites"
                  : "Add to favorites"}
            </button>
          </div>

          <div className="public-product-meta-list">
            <span>{store.name}</span>
            <span>{product.category}</span>
            <span>
              {language === "ar" ? "المخزون" : "Stock"}: {product.stock}
            </span>
          </div>

          <p className="public-product-description">{product.description}</p>

          <div className="public-product-action-stack">
            <button
              className="primary-button public-product-action secondary-dark"
              type="button"
              onClick={() => requireCustomer(() => addToCart(store.id, product.id, 1))}
            >
              {language === "ar" ? "إضافة إلى السلة" : "Add to cart"}
            </button>
            <button
              className="primary-button public-product-action secondary-dark"
              type="button"
              onClick={() => requireCustomer(() => buyNow(store.id, product.id, 1))}
            >
              {language === "ar" ? "شراء الآن" : "Buy now"}
            </button>
            <a
              className="public-whatsapp-cta"
              href={`https://wa.me/${String(store.contactPhone || "").replace(/\D/g, "") || "970599123456"}`}
              target="_blank"
              rel="noreferrer"
            >
              {language === "ar" ? "للتواصل اضغط هنا" : "Contact on WhatsApp"}
            </a>
          </div>

          <div className="public-product-mini-actions">
            <button type="button">{language === "ar" ? "مشاركة" : "Share"}</button>
            <button type="button">{language === "ar" ? "اسأل عن المنتج" : "Ask a question"}</button>
            <Link to={`/store/${store.slug || store.id}`}>
              {language === "ar" ? "عرض المتجر" : "Browse store"}
            </Link>
          </div>
        </div>
      </section>

      <section className="public-store-section">
        <div className="public-store-section-heading">
          <span>{language === "ar" ? "منتجات مشابهة" : "Related products"}</span>
          <h2>{language === "ar" ? "قد يعجبك أيضًا" : "You may also like"}</h2>
        </div>

        <div className="public-product-grid">
          {relatedProducts.map((item) => (
            <Link
              key={item.id}
              to={`/store/${store.slug || store.id}/product/${item.id}`}
              className="public-product-card"
            >
              <div className="public-product-media">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="public-product-image" />
                ) : (
                  <div className="public-product-placeholder">{item.category}</div>
                )}
              </div>
              <div className="public-product-body">
                <span className="public-product-category">{item.category}</span>
                <h3>{item.name}</h3>
                <div className="public-product-footer">
                  <strong>{formatCurrency(item.price)}</strong>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
