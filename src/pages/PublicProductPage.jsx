import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
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

  const productImages =
    Array.isArray(product.images) && product.images.length
      ? product.images
      : product.image
        ? [product.image]
        : [];
  const sizeOptions = Array.isArray(product.sizeOptions) ? product.sizeOptions.filter(Boolean) : [];
  const colorOptions = Array.isArray(product.colorOptions)
    ? product.colorOptions.filter(Boolean)
    : [];
  const colorImageMap = product.colorImageMap || {};
  const variantInventory = Array.isArray(product.variantInventory) ? product.variantInventory : [];

  const [activeImage, setActiveImage] = useState(productImages[0] || "");
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0] || "");
  const [selectedColor, setSelectedColor] = useState(colorOptions[0] || "");
  const [selectionError, setSelectionError] = useState("");

  useEffect(() => {
    setActiveImage(productImages[0] || "");
    setSelectedSize(sizeOptions[0] || "");
    setSelectedColor(colorOptions[0] || "");
    setSelectionError("");
  }, [product.id]);

  useEffect(() => {
    if (!selectedColor) {
      return;
    }

    const mappedImage = colorImageMap[selectedColor];
    if (mappedImage) {
      setActiveImage(mappedImage);
    }
  }, [colorImageMap, selectedColor]);

  const originalPrice = Number(product.originalPrice || 0);
  const discount =
    originalPrice > product.price
      ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
      : 0;

  const availableStock = useMemo(() => {
    if (variantInventory.length && selectedSize && selectedColor) {
      return (
        variantInventory.find(
          (entry) => entry.size === selectedSize && entry.color === selectedColor,
        )?.stock ?? 0
      );
    }

    if (sizeOptions.length && selectedSize && !colorOptions.length) {
      return product.sizeInventory?.find((entry) => entry.size === selectedSize)?.stock ?? 0;
    }

    if (colorOptions.length && selectedColor && !sizeOptions.length) {
      return product.colorInventory?.find((entry) => entry.color === selectedColor)?.stock ?? 0;
    }

    return product.stock;
  }, [
    colorOptions.length,
    product.colorInventory,
    product.sizeInventory,
    product.stock,
    selectedColor,
    selectedSize,
    sizeOptions.length,
    variantInventory,
  ]);

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

  const requireSelection = (callback) => {
    if (sizeOptions.length && !selectedSize) {
      setSelectionError(language === "ar" ? "اختر المقاس أولاً." : "Select a size first.");
      return;
    }

    if (colorOptions.length && !selectedColor) {
      setSelectionError(language === "ar" ? "اختر اللون أولاً." : "Select a color first.");
      return;
    }

    if ((sizeOptions.length || colorOptions.length) && availableStock <= 0) {
      setSelectionError(
        language === "ar"
          ? "الخيار المحدد غير متوفر حالياً."
          : "The selected option is out of stock.",
      );
      return;
    }

    setSelectionError("");
    callback();
  };

  return (
    <section className="public-product-page">
      <StorefrontTopBar store={store} searchTo={`/store/${store.slug || store.id}#store-products`} />

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
            {(productImages.length ? productImages : [null]).map((image, index) => (
              <button
                key={`${index}-${image || "placeholder"}`}
                type="button"
                className={
                  activeImage === image
                    ? "public-product-thumb-button active"
                    : "public-product-thumb-button"
                }
                onClick={() => setActiveImage(image || "")}
              >
                {image ? (
                  <img src={image} alt={product.name} className="public-product-thumb-image" />
                ) : (
                  <span>{product.category}</span>
                )}
              </button>
            ))}
          </div>

          <div className="public-product-main-image-card">
            {discount > 0 ? <span className="product-sale-badge">-{discount}%</span> : null}
            {product.isNew ? <span className="product-new-badge">NEW</span> : null}
            {activeImage ? (
              <img src={activeImage} alt={product.name} className="public-product-main-image" />
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
            <span>{language === "ar" ? "المخزون" : "Stock"}: {availableStock}</span>
          </div>

          {sizeOptions.length ? (
            <div className="public-product-size-block">
              <strong>
                {language === "ar"
                  ? product.sizeMode === "numeric"
                    ? "اختر النمرة"
                    : "اختر المقاس"
                  : product.sizeMode === "numeric"
                    ? "Choose size number"
                    : "Choose size"}
              </strong>
              <div className="public-product-size-list">
                {sizeOptions.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={
                      selectedSize === size
                        ? "public-product-size-button active"
                        : "public-product-size-button"
                    }
                    onClick={() => {
                      setSelectedSize(size);
                      setSelectionError("");
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {colorOptions.length ? (
            <div className="public-product-size-block">
              <strong>{language === "ar" ? "اختر اللون" : "Choose color"}</strong>
              <div className="public-product-size-list">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={
                      selectedColor === color
                        ? "public-product-size-button active"
                        : "public-product-size-button"
                    }
                    onClick={() => {
                      setSelectedColor(color);
                      setSelectionError("");
                    }}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {selectionError ? <p className="form-error">{selectionError}</p> : null}

          <p className="public-product-description">{product.description}</p>

          <div className="public-product-action-stack">
            <button
              className="primary-button public-product-action secondary-dark"
              type="button"
              onClick={() =>
                requireSelection(() =>
                  requireCustomer(() =>
                    addToCart(store.id, product.id, 1, {
                      size: selectedSize,
                      color: selectedColor,
                    }),
                  ),
                )
              }
            >
              {language === "ar" ? "إضافة إلى السلة" : "Add to cart"}
            </button>
            <button
              className="primary-button public-product-action secondary-dark"
              type="button"
              onClick={() =>
                requireSelection(() =>
                  requireCustomer(() =>
                    buyNow(store.id, product.id, 1, {
                      size: selectedSize,
                      color: selectedColor,
                    }),
                  ),
                )
              }
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
