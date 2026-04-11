import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../state/AppContext";
import { translations } from "../i18n";
import StorefrontTopBar from "../components/StorefrontTopBar";
import defaultLogoUrl from "../assets/defaultLogo";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function CustomerCartPage() {
  const { slug } = useParams();
  const {
    stores,
    products,
    language,
    getStoreCustomer,
    getStoreCustomerWorkspace,
    updateCartQuantity,
    removeFromCart,
    checkoutProducts,
    getEffectiveProductPrice,
  } = useApp();
  const navigate = useNavigate();
  const t = translations[language];
  const store = stores.find((item) => item.slug === slug || item.id === slug) || null;

  if (!store) {
    return <Navigate to="/" replace />;
  }

  const customer = getStoreCustomer(store.id);

  if (!customer) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `/store/${store.slug || store.id}/cart`, storeId: store.id }}
      />
    );
  }

  const customerCart = getStoreCustomerWorkspace(store.id).cart || [];
  const cartItems = customerCart
    .map((item) => ({
      ...item,
      product: products.find(
        (product) => product.id === item.productId && product.storeId === store.id,
      ),
    }))
    .filter((item) => item.product);
  const total = cartItems.reduce(
    (sum, item) => sum + getEffectiveProductPrice(item.product) * item.quantity,
    0,
  );

  return (
    <section className="public-store-page">
      <StorefrontTopBar store={store} searchTo={`/store/${store.slug || store.id}#store-products`} />

      <section className="panel">
        <div className="panel-header">
          <h2>{t.cart}</h2>
          <span>
            {cartItems.length} {t.products}
          </span>
        </div>

        {cartItems.length ? (
          <>
            <div className="table-like">
              <div className="table-row table-head">
                <span>{t.productName}</span>
                <span>{t.quantity}</span>
                <span>{t.price}</span>
                <span>{t.actions}</span>
              </div>

              {cartItems.map((item) => (
                <div
                  key={`${item.productId}-${item.size || "none"}-${item.color || "none"}-${item.dimension || "none"}`}
                  className="table-row"
                >
                  <div className="product-name-cell">
                    <img
                      className="product-thumb"
                      src={item.product.image || defaultLogoUrl}
                      alt={item.product.name}
                    />
                    <div className="stacked-cell">
                      <strong>{item.product.name}</strong>
                      <small>{item.product.category}</small>
                      {item.size || item.color || item.dimension ? (
                        <small>
                          {[item.size, item.color, item.dimension].filter(Boolean).join(" / ")}
                        </small>
                      ) : null}
                    </div>
                  </div>
                  <div className="row-actions">
                    <button
                      className="secondary-button row-action"
                      onClick={() =>
                        updateCartQuantity(store.id, item.productId, item.quantity - 1, {
                          size: item.size,
                          color: item.color,
                          dimension: item.dimension,
                        })
                      }
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      className="secondary-button row-action"
                      onClick={() =>
                        updateCartQuantity(store.id, item.productId, item.quantity + 1, {
                          size: item.size,
                          color: item.color,
                          dimension: item.dimension,
                        })
                      }
                    >
                      +
                    </button>
                  </div>
                  <span>{formatCurrency(getEffectiveProductPrice(item.product) * item.quantity)}</span>
                  <button
                    className="secondary-button row-action danger-button"
                    onClick={() =>
                      removeFromCart(store.id, item.productId, {
                        size: item.size,
                        color: item.color,
                        dimension: item.dimension,
                      })
                    }
                  >
                    {t.removeFromCart}
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-summary-bar">
              <strong>
                {t.total}: {formatCurrency(total)}
              </strong>
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  const result = checkoutProducts(
                    store.id,
                    cartItems.map((item) => ({
                      productId: item.productId,
                      quantity: item.quantity,
                      size: item.size,
                      color: item.color,
                      dimension: item.dimension,
                    })),
                  );

                  if (result.success) {
                    navigate(`/store/${store.slug || store.id}`, { replace: true });
                  }
                }}
              >
                {t.checkout}
              </button>
            </div>
          </>
        ) : (
          <p className="settings-subtitle">{t.cartEmpty}</p>
        )}
      </section>
    </section>
  );
}
