import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "../state/AppContext";
import StorefrontTopBar from "../components/StorefrontTopBar";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getSelectionStock(product, size, color) {
  if (product.hasSizes && product.hasColors) {
    return Number(product.variantInventory?.[`${size}|${color}`] || 0);
  }

  if (product.hasSizes) {
    return Number(product.sizeInventory?.[size] || 0);
  }

  if (product.hasColors) {
    return Number(product.colorInventory?.[color] || 0);
  }

  return Number(product.stock || 0);
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
  const isArabic = language === "ar";
  const store = stores.find((item) => item.slug === slug || item.id === slug) || null;
  const product = products.find((item) => item.id === productId) || null;
  const productImages = Array.isArray(product?.images) && product.images.length
    ? product.images
    : product?.image
      ? [product.image]
      : [];
  const [activeImage, setActiveImage] = useState(productImages[0] || "");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectionError, setSelectionError] = useState("");

  useEffect(() => {
    setActiveImage(productImages[0] || "");
  }, [productId, product?.image, productImages]);

  useEffect(() => {
    if (product?.hasSizes) {
      setSelectedSize(product.sizeOptions?.[0] || "");
    } else {
      setSelectedSize("");
    }

    if (product?.hasColors) {
      setSelectedColor(product.colorOptions?.[0] || "");
    } else {
      setSelectedColor("");
    }

    setSelectionError("");
  }, [productId, product?.hasSizes, product?.hasColors, product?.sizeOptions, product?.colorOptions]);

  useEffect(() => {
    if (!product?.hasColors || !selectedColor) {
      if (productImages[0]) {
        setActiveImage(productImages[0]);
      }
      return;
    }

    const mappedImage = product.colorImageMap?.[selectedColor];

    if (mappedImage) {
      setActiveImage(mappedImage);
    }
  }, [product, selectedColor]);

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
  const currentStock = getSelectionStock(product, selectedSize, selectedColor);

  const requireCustomer = (callback) => {
    if (isCustomer) {
      callback();
      return;
    }

    navigate("/login", { state: loginRedirectState });
  };

  const validateSelection = () => {
    if (product.hasSizes && !selectedSize) {
      setSelectionError(isArabic ? "اختر المقاس أولًا." : "Select a size first.");
      return false;
    }

    if (product.hasColors && !selectedColor) {
      setSelectionError(isArabic ? "اختر اللون أولًا." : "Select a color first.");
      return false;
    }

    if (!currentStock) {
      setSelectionError(isArabic ? "هذا الخيار غير متوفر حاليًا." : "This option is currently unavailable.");
      return false;
    }

    setSelectionError("");
    return true;
  };

  const handleAddToCart = () => {
    if (!validateSelection()) {
      return;
    }

    requireCustomer(() =>
      addToCart(store.id, product.id, 1, {
        size: selectedSize,
        color: selectedColor,
      }),
    );
  };

  const handleBuyNow = () => {
    if (!validateSelection()) {
      return;
    }

    requireCustomer(() =>
      buyNow(store.id, product.id, 1, {
        size: selectedSize,
        color: selectedColor,
      }),
    );
  };

  return (
    <section className="public-product-page">
      <StorefrontTopBar
        store={store}
        searchTo={`/store/${store.slug || store.id}#store-products`}
      />

      <nav className="product-breadcrumb">
        <Link to="/">{isArabic ? "الرئيسية" : "Home"}</Link>
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
            {productImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                className={`public-product-thumb-button${activeImage === image ? " active" : ""}`}
                onClick={() => setActiveImage(image)}
              >
                <img src={image} alt={`${product.name} ${index + 1}`} className="public-product-thumb-image" />
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
              {isArabic
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
              {isArabic ? "المخزون" : "Stock"}: {currentStock}
            </span>
          </div>

          {product.hasSizes ? (
            <div className="public-product-option-group">
              <h3>{isArabic ? "اختر المقاس" : "Choose size"}</h3>
              <div className="public-product-option-list">
                {product.sizeOptions.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`public-option-chip${selectedSize === size ? " active" : ""}`}
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

          {product.hasColors ? (
            <div className="public-product-option-group">
              <h3>{isArabic ? "اختر اللون" : "Choose color"}</h3>
              <div className="public-product-option-list">
                {product.colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`public-option-chip${selectedColor === color ? " active" : ""}`}
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

          <p className="public-product-description">{product.description}</p>
          {selectionError ? <p className="form-error">{selectionError}</p> : null}

          <div className="public-product-action-stack">
            <button
              className="primary-button public-product-action secondary-dark"
              type="button"
              onClick={handleAddToCart}
              disabled={!currentStock}
            >
              {isArabic ? "إضافة إلى السلة" : "Add to cart"}
            </button>
            <button
              className="primary-button public-product-action secondary-dark"
              type="button"
              onClick={handleBuyNow}
              disabled={!currentStock}
            >
              {isArabic ? "شراء الآن" : "Buy now"}
            </button>
            <a
              className="public-whatsapp-cta"
              href={`https://wa.me/${String(store.contactPhone || "").replace(/\D/g, "") || "970599123456"}`}
              target="_blank"
              rel="noreferrer"
            >
              {isArabic ? "للتواصل اضغط هنا" : "Contact on WhatsApp"}
            </a>
          </div>

          <div className="public-product-mini-actions">
            <button type="button">{isArabic ? "مشاركة" : "Share"}</button>
            <button type="button">{isArabic ? "اسأل عن المنتج" : "Ask a question"}</button>
            <Link to={`/store/${store.slug || store.id}`}>
              {isArabic ? "عرض المتجر" : "Browse store"}
            </Link>
          </div>
        </div>
      </section>

      <section className="public-store-section">
        <div className="public-store-section-heading">
          <span>{isArabic ? "منتجات مشابهة" : "Related products"}</span>
          <h2>{isArabic ? "قد يعجبك أيضًا" : "You may also like"}</h2>
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
