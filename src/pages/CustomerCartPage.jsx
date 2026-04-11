import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "../state/AppContext";
import { translations } from "../i18n";
import StorefrontTopBar from "../components/StorefrontTopBar";
import defaultLogoUrl from "../assets/defaultLogo";

function formatCurrency(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
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
  const storeCurrency = store?.currency || "USD";

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
    .map((item, index) => ({
      ...item,
      cartKey: `${item.productId}-${item.size || "none"}-${item.color || "none"}-${item.dimension || "none"}-${index}`,
      product: products.find(
        (product) => product.id === item.productId && product.storeId === store.id,
      ),
    }))
    .filter((item) => item.product);
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());

  const selectionKey = (item) => item.cartKey;

  useEffect(() => {
    if (!cartItems.length) {
      setSelectedKeys(new Set());
      return;
    }

    setSelectedKeys((current) => {
      const validKeys = new Set(cartItems.map(selectionKey));
      const next = new Set([...current].filter((key) => validKeys.has(key)));

      if (next.size) {
        return next;
      }

      return validKeys;
    });
  }, [cartItems]);

  const selectedItems = useMemo(
    () => cartItems.filter((item) => selectedKeys.has(selectionKey(item))),
    [cartItems, selectedKeys],
  );

  const total = selectedItems.reduce(
    (sum, item) => sum + getEffectiveProductPrice(item.product) * item.quantity,
    0,
  );
  const allSelected = selectedItems.length === cartItems.length && cartItems.length > 0;
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const selectedCount = selectedItems.length;

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
                <span>
                  <label className="select-all-toggle">
                    <input
                      className="cart-checkbox"
                      type="checkbox"
                      checked={allSelected}
                      onChange={(event) => {
                        setSelectedKeys(() =>
                          event.target.checked
                            ? new Set(cartItems.map(selectionKey))
                            : new Set(),
                        );
                      }}
                    />
                    {t.selectAll}
                  </label>
                  {selectedCount ? (
                    <button
                      type="button"
                      className="secondary-button cart-remove-selected"
                      onClick={() => {
                        selectedItems.forEach((item) => {
                          removeFromCart(store.id, item.productId, {
                            size: item.size,
                            color: item.color,
                            dimension: item.dimension,
                          });
                        });
                      }}
                    >
                      {t.removeFromCart}
                    </button>
                  ) : null}
                </span>
                <span>{t.productName}</span>
                <span>{t.quantity}</span>
                <span>{t.price}</span>
                <span>{t.actions}</span>
              </div>

              {cartItems.map((item) => (
                <div
                  key={item.cartKey}
                  className="table-row"
                >
                  <div className="row-actions">
                    <input
                      className="cart-checkbox"
                      type="checkbox"
                      checked={selectedKeys.has(selectionKey(item))}
                      onChange={(event) => {
                        setSelectedKeys((current) => {
                          const next = new Set(current);
                          const key = selectionKey(item);
                          if (event.target.checked) {
                            next.add(key);
                          } else {
                            next.delete(key);
                          }
                          return next;
                        });
                      }}
                    />
                  </div>
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
                  <span>{formatCurrency(getEffectiveProductPrice(item.product) * item.quantity, storeCurrency)}</span>
                  <button
                    className="secondary-button row-action danger-button cart-remove-button"
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
              <div className="cart-payment-method">
                <span>{t.paymentMethod}</span>
                <div className="payment-choice-row">
                  <label className="payment-choice">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={() => setPaymentMethod("cash")}
                    />
                    {t.payWithCash}
                  </label>
                  <label className="payment-choice">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                    />
                    {t.payWithCard}
                  </label>
                </div>
              </div>
              <strong>
                {t.total}: {formatCurrency(total, storeCurrency)}
              </strong>
              <button
                className="primary-button"
                type="button"
                disabled={!selectedCount}
                onClick={() => {
                  const result = checkoutProducts(
                    store.id,
                    selectedItems.map((item) => ({
                      productId: item.productId,
                      quantity: item.quantity,
                      size: item.size,
                      color: item.color,
                      dimension: item.dimension,
                    })),
                    paymentMethod,
                    { preserveCart: true },
                  );

                  if (result.success) {
                    navigate(`/store/${store.slug || store.id}`, { replace: true });
                  }
                }}
              >
                {t.checkout} {selectedItems.length ? `(${selectedItems.length})` : ""}
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
