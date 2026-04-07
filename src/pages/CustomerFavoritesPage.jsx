import { Link, Navigate, useParams } from "react-router-dom";
import { useApp } from "../state/AppContext";
import { translations } from "../i18n";
import StorefrontTopBar from "../components/StorefrontTopBar";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function CustomerFavoritesPage() {
  const { slug } = useParams();
  const {
    stores,
    products,
    language,
    getStoreCustomer,
    getStoreCustomerWorkspace,
    toggleFavorite,
  } = useApp();
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
        state={{ from: `/store/${store.slug || store.id}/favorites`, storeId: store.id }}
      />
    );
  }

  const favoriteIds = getStoreCustomerWorkspace(store.id).favorites || [];
  const favoriteProducts = favoriteIds
    .map((id) => products.find((product) => product.id === id && product.storeId === store.id))
    .filter(Boolean);

  return (
    <section className="public-store-page">
      <StorefrontTopBar store={store} searchTo={`/store/${store.slug || store.id}#store-products`} />

      <section className="panel">
        <div className="panel-header">
          <h2>{t.favorites}</h2>
          <span>
            {favoriteProducts.length} {t.products}
          </span>
        </div>

        {favoriteProducts.length ? (
          <div className="public-product-grid">
            {favoriteProducts.map((product) => (
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
                </div>
                <div className="public-product-body">
                  <span className="public-product-category">{store.name}</span>
                  <h3>{product.name}</h3>
                  <div className="public-product-footer">
                    <strong>{formatCurrency(product.price)}</strong>
                    <button
                      className="secondary-button row-action danger-button"
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        toggleFavorite(store.id, product.id);
                      }}
                    >
                      {t.removeFavorite}
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="settings-subtitle">{t.favoritesEmpty}</p>
        )}
      </section>
    </section>
  );
}
