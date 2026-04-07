import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../state/AppContext";
import { translations } from "../../i18n";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function SellerStorePage() {
  const {
    currentUser,
    stores,
    products,
    orders,
    addStore,
    setActiveSellerStore,
    language,
  } = useApp();
  const t = translations[language];
  const navigate = useNavigate();
  const sellerStores = stores.filter((store) => store.sellerId === currentUser?.id);
  const [savedMessage, setSavedMessage] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    category: "",
    city: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    subscription: "Free",
  });

  useEffect(() => {
    if (!savedMessage) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setSavedMessage(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [savedMessage]);

  const storeCards = useMemo(
    () =>
      sellerStores.map((store) => {
        const storeProducts = products.filter((product) => product.storeId === store.id);
        const storeOrders = orders.filter((order) => order.storeId === store.id);

        return {
          ...store,
          productCount: storeProducts.length,
          orderCount: storeOrders.length,
          revenue: store.monthlyRevenue,
        };
      }),
    [sellerStores, products, orders],
  );

  const handleCreateStore = (event) => {
    event.preventDefault();

    const newStoreId = addStore({
      ...createForm,
      sellerId: currentUser.id,
      ownerName: currentUser.name,
      status: "pending",
    });

    setActiveSellerStore(currentUser.id, newStoreId);
    setCreateForm({
      name: "",
      description: "",
      category: "",
      city: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      subscription: "Free",
    });
    setShowCreateForm(false);
    setSavedMessage(t.storeCreatedSuccessfully);
  };

  return (
    <div className="dashboard-stack">
      <section className="panel">
        <div className="panel-header">
          <h2>{t.myStores}</h2>
          <div className="panel-tools">
            {savedMessage ? <span>{savedMessage}</span> : null}
            <button
              className="primary-button"
              type="button"
              onClick={() => setShowCreateForm((current) => !current)}
            >
              {t.addNewStore}
            </button>
          </div>
        </div>

        {showCreateForm ? (
          <form
            className="my-stores-create-form seller-request-panel"
            onSubmit={handleCreateStore}
          >
            <div className="panel-header create-store-header">
              <div>
                <h2>{t.createStoreTitle}</h2>
                <p className="settings-subtitle">{t.createStoreBody}</p>
              </div>
            </div>

            <section className="settings-section">
              <h3>{t.storeInformation}</h3>
              <div className="admin-form-grid seller-form-grid">
                <div className="seller-form-span">
                  <label htmlFor="new-store-name">{t.store}</label>
                  <input
                    id="new-store-name"
                    value={createForm.name}
                    onChange={(event) =>
                      setCreateForm((current) => ({ ...current, name: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="seller-form-span">
                  <label htmlFor="new-store-description">{t.storeDescription}</label>
                  <textarea
                    id="new-store-description"
                    rows="4"
                    value={createForm.description}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <label htmlFor="new-store-category">{t.category}</label>
                  <input
                    id="new-store-category"
                    value={createForm.category}
                    onChange={(event) =>
                      setCreateForm((current) => ({ ...current, category: event.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label htmlFor="new-store-city">{t.city}</label>
                  <input
                    id="new-store-city"
                    value={createForm.city}
                    onChange={(event) =>
                      setCreateForm((current) => ({ ...current, city: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="seller-form-span">
                  <label htmlFor="new-store-subscription">{t.subscriptionPlan}</label>
                  <select
                    id="new-store-subscription"
                    value={createForm.subscription}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        subscription: event.target.value,
                      }))
                    }
                  >
                    <option value="Free">Free</option>
                    <option value="Pro">Pro</option>
                    <option value="Premium">Premium</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="settings-section">
              <h3>{t.contactInformation}</h3>
              <div className="admin-form-grid seller-form-grid">
                <div>
                  <label htmlFor="new-store-email">{t.contactEmail}</label>
                  <input
                    id="new-store-email"
                    type="email"
                    value={createForm.contactEmail}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        contactEmail: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <label htmlFor="new-store-phone">{t.contactPhone}</label>
                  <input
                    id="new-store-phone"
                    value={createForm.contactPhone}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        contactPhone: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="seller-form-span">
                  <label htmlFor="new-store-address">{t.storeAddress}</label>
                  <input
                    id="new-store-address"
                    value={createForm.address}
                    onChange={(event) =>
                      setCreateForm((current) => ({ ...current, address: event.target.value }))
                    }
                    required
                  />
                </div>
              </div>
            </section>

            <div className="seller-form-actions seller-form-span">
              <button className="primary-button seller-save-button" type="submit">
                {t.addNewStore}
              </button>
            </div>
          </form>
        ) : null}

        <div className="my-stores-grid">
          {storeCards.map((store) => (
            <article key={store.id} className="store-card">
              <div className="store-card-top">
                <div className="store-card-brand">
                  <img
                    src={store.logo || "/logo.png"}
                    alt={store.name}
                    className="store-logo-thumb"
                  />
                  <div className="stacked-cell">
                    <strong>{store.name}</strong>
                    <small>{store.description}</small>
                  </div>
                </div>
                <div className="store-card-badges">
                  <span className="store-tag">{store.category}</span>
                  <span className={`status-pill ${store.status}`}>{t[store.status]}</span>
                </div>
              </div>

              <div className="store-card-stats">
                <div className="store-card-stat">
                  <span>{t.productsSold}</span>
                  <strong>{store.productCount}</strong>
                </div>
                <div className="store-card-stat">
                  <span>{t.orders}</span>
                  <strong>{store.orderCount}</strong>
                </div>
                <div className="store-card-stat">
                  <span>{t.revenue}</span>
                  <strong>{formatCurrency(store.revenue)}</strong>
                </div>
              </div>

              <div className="store-card-actions">
                <button
                  className="primary-button store-card-primary"
                  type="button"
                  onClick={() => {
                    setActiveSellerStore(currentUser.id, store.id);
                    navigate(`/seller/store/${store.id}`);
                  }}
                >
                  {t.manageStore}
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setActiveSellerStore(currentUser.id, store.id);
                    navigate(`/seller/store/${store.id}`);
                  }}
                >
                  {t.storeSettings}
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => navigate(`/store/${store.slug || store.id}`)}
                >
                  {t.viewStore}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
