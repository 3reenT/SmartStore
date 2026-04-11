import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
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

function getSelectionStock(product, size, color, dimension) {
  if (product.hasSizes && product.hasColors) {
    return Number(product.variantInventory?.[`${size}|${color}`] || 0);
  }

  if (product.hasSizes) {
    return Number(product.sizeInventory?.[size] || 0);
  }

  if (product.hasColors) {
    return Number(product.colorInventory?.[color] || 0);
  }

  if (product.hasDimensions) {
    return Number(product.dimensionInventory?.[dimension] || 0);
  }

  return Number(product.stock || 0);
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
    getProductComments,
    toggleFavorite,
    addToCart,
    buyNow,
    addProductComment,
    getEffectiveProductPrice,
    getEffectiveProductOriginalPrice,
    getEffectiveProductDiscountPercent,
    isDiscountCurrentlyActive,
  } = useApp();
  const isArabic = language === "ar";
  const store = stores.find((item) => item.slug === slug || item.id === slug) || null;
  const product = products.find((item) => item.id === productId) || null;
  const productImages =
    Array.isArray(product?.images) && product.images.length
      ? product.images
      : product?.image
        ? [product.image]
        : [];
  const [activeImage, setActiveImage] = useState(productImages[0] || "");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedDimension, setSelectedDimension] = useState("");
  const [selectionError, setSelectionError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);

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

    if (product?.hasDimensions) {
      setSelectedDimension(product.dimensionOptions?.[0] || "");
    } else {
      setSelectedDimension("");
    }

    setSelectionError("");
    setShowAllComments(false);
    setCommentText("");
  }, [
    productId,
    product?.hasSizes,
    product?.hasColors,
    product?.hasDimensions,
    product?.sizeOptions,
    product?.colorOptions,
    product?.dimensionOptions,
  ]);

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
  }, [product, selectedColor, productImages]);

  const canPreviewUnapproved =
    currentUser?.role === "admin" ||
    (currentUser?.role === "seller" && currentUser.id === store?.sellerId);

  const relatedProducts = useMemo(
    () =>
      store && product
        ? products
            .filter((item) => item.storeId === store.id && item.id !== product.id)
            .slice(0, 4)
        : [],
    [products, store, product],
  );

  if (!store || !product || product.storeId !== store.id) {
    return <Navigate to="/" replace />;
  }

  if (store.status !== "approved" && !canPreviewUnapproved) {
    return <Navigate to="/" replace />;
  }

  const storeCurrency = store?.currency || "USD";
  const currentPrice = getEffectiveProductPrice(product);
  const originalPrice = getEffectiveProductOriginalPrice(product);
  const discount = getEffectiveProductDiscountPercent(product);
  const temporaryDiscountRemaining =
    product.discountType === "temporary" && isDiscountCurrentlyActive(product)
      ? formatRemainingDiscountTime(product.discountEndsAt, isArabic)
      : "";
  const storeCustomer = getStoreCustomer(store.id);
  const isCustomer = Boolean(storeCustomer);
  const storeWorkspace = getStoreCustomerWorkspace(store.id);
  const isFavorite = storeWorkspace.favorites.includes(product.id);
  const productComments = getProductComments(product.id);
  const visibleComments = showAllComments ? productComments : productComments.slice(0, 2);
  const loginRedirectState = {
    from: `${location.pathname}${location.search}${location.hash}`,
    storeId: store.id,
  };
  const currentStock = getSelectionStock(
    product,
    selectedSize,
    selectedColor,
    selectedDimension,
  );

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

    if (product.hasDimensions && !selectedDimension) {
      setSelectionError(isArabic ? "اختر البُعد أولًا." : "Select a dimension first.");
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
        dimension: selectedDimension,
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
        dimension: selectedDimension,
      }),
    );
  };

  const handleAddComment = () => {
    requireCustomer(() => {
      const result = addProductComment(store.id, product.id, commentText);
      if (result.success) {
        setCommentText("");
      }
    });
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
            <span className="current-price">{formatCurrency(currentPrice, storeCurrency)}</span>
            {discount > 0 ? <span className="old-price">{formatCurrency(originalPrice, storeCurrency)}</span> : null}
          </div>

          {temporaryDiscountRemaining ? (
            <div className="public-product-discount-timer">
              {isArabic
                ? `متبقي على الخصم: ${temporaryDiscountRemaining}`
                : `Discount ends in: ${temporaryDiscountRemaining}`}
            </div>
          ) : null}

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
            {product.hasDimensions && selectedDimension ? (
              <span>
                {isArabic ? "البُعد المختار" : "Selected dimension"}: {selectedDimension}
              </span>
            ) : null}
            {product.hasDimensions && product.dimensionOptions?.length ? (
              <span>
                {isArabic ? "الأبعاد" : "Dimensions"}: {product.dimensionOptions.join(" • ")}
              </span>
            ) : null}
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

          {product.hasDimensions ? (
            <div className="public-product-option-group">
              <h3>{isArabic ? "اختر البُعد" : "Choose dimension"}</h3>
              <div className="public-product-option-list">
                {product.dimensionOptions.map((dimension) => (
                  <button
                    key={dimension}
                    type="button"
                    className={`public-option-chip${selectedDimension === dimension ? " active" : ""}`}
                    onClick={() => {
                      setSelectedDimension(dimension);
                      setSelectionError("");
                    }}
                  >
                    {dimension}
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
                  <strong>{formatCurrency(getEffectiveProductPrice(item), storeCurrency)}</strong>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="public-store-section">
        <div className="public-store-section-heading">
          <span>{isArabic ? "آراء العملاء" : "Customer reviews"}</span>
          <h2>{isArabic ? "التعليقات على المنتج" : "Product comments"}</h2>
        </div>

        <div className="product-comments-panel">
          {visibleComments.length ? (
            <div className="product-comments-list">
              {visibleComments.map((comment) => (
                <div key={comment.id} className="product-comment-card">
                  <div className="product-comment-header">
                    <strong>{comment.userName}</strong>
                    <span>
                      {new Date(comment.createdAt).toLocaleDateString(
                        isArabic ? "ar" : "en-US",
                      )}
                    </span>
                  </div>
                  <p>{comment.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="settings-subtitle">
              {isArabic ? "لا توجد تعليقات بعد." : "No comments yet."}
            </p>
          )}

          {productComments.length > 2 ? (
            <button
              type="button"
              className="secondary-button comment-toggle-button"
              onClick={() => setShowAllComments((current) => !current)}
            >
              {showAllComments
                ? isArabic
                  ? "إظهار أقل"
                  : "Show less"
                : isArabic
                  ? "إظهار الكل"
                  : "Show all"}
            </button>
          ) : null}

          <div className="product-comment-form">
            <textarea
              placeholder={
                isArabic
                  ? "اكتب تعليقك عن المنتج..."
                  : "Write your comment about this product..."
              }
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
            />
            <button
              type="button"
              className="primary-button"
              onClick={handleAddComment}
            >
              {isArabic ? "نشر التعليق" : "Post comment"}
            </button>
            {!isCustomer ? (
              <span className="helper-text">
                {isArabic ? "سجل الدخول لتكتب تعليقًا." : "Sign in to leave a comment."}
              </span>
            ) : null}
          </div>
        </div>
      </section>
    </section>
  );
}
