import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../state/AppContext";

function ShoppingBagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 8V7a5 5 0 0 1 10 0v1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M6 8h12l-1 11H7L6 8Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function FavoriteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m12 3.7 2.6 5.27 5.82.85-4.21 4.1.99 5.78L12 16.94 6.8 19.7l.99-5.78-4.21-4.1 5.82-.85L12 3.7Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="11"
        cy="11"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="m20 20-4.2-4.2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="8"
        r="3.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M5.5 19a6.5 6.5 0 0 1 13 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14 3c.2 1.7 1 3 2.4 4 1 .7 2.1 1.1 3.6 1.1v2.9a9 9 0 0 1-3.9-.9v5.3a6.1 6.1 0 1 1-6.1-6.1c.4 0 .8 0 1.2.1v3a3.4 3.4 0 1 0 2.8 3.3V3h3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M13.5 21v-7.3H16l.4-3h-2.9V8.8c0-.9.2-1.6 1.5-1.6h1.6V4.5c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 4v2.3H8v3h2.5V21h3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" />
    </svg>
  );
}

function StoreBrand({ store }) {
  if (store.logo) {
    return <img src={store.logo} alt={store.name} className="storefront-brand-logo" />;
  }

  return <div className="storefront-brand-fallback">{String(store.name || "S").slice(0, 2)}</div>;
}

function getInitials(name) {
  return String(name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function StorefrontTopBar({ store, searchTo = "#store-products" }) {
  const { getStoreCustomer, getStoreCustomerWorkspace, logout, language, setLanguage } = useApp();
  const location = useLocation();
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const storeCustomer = getStoreCustomer(store.id);
  const storeWorkspace = getStoreCustomerWorkspace(store.id);
  const isCustomer = Boolean(storeCustomer);
  const cartCount = storeWorkspace.cart.length;
  const favoriteCount = storeWorkspace.favorites.length;
  const loginState = {
    from: `${location.pathname}${location.search}${location.hash}`,
    storeId: store.id,
  };

  return (
    <section className="storefront-topbar">
      <div className="storefront-topbar-row storefront-topbar-meta">
        <button
          type="button"
          className="storefront-language"
          onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
        >
          <span className="storefront-language-arrow">⌄</span>
          <span>{language === "ar" ? "Arabic" : "English"}</span>
        </button>

        <div className="storefront-socials">
          <span className="storefront-social-icon"><TikTokIcon /></span>
          <span className="storefront-social-icon"><FacebookIcon /></span>
          <span className="storefront-social-icon"><InstagramIcon /></span>
        </div>
      </div>

      <div className="storefront-topbar-row storefront-topbar-main">
        <div className="storefront-utility-icons">
          <Link
            className="storefront-utility-link"
            to={isCustomer ? `/store/${store.slug || store.id}/cart` : "/login"}
            state={isCustomer ? undefined : loginState}
          >
            <span className="storefront-counter">{cartCount}</span>
            <ShoppingBagIcon />
          </Link>

          <Link
            className="storefront-utility-link"
            to={isCustomer ? `/store/${store.slug || store.id}/favorites` : "/login"}
            state={isCustomer ? undefined : loginState}
          >
            <span className="storefront-counter">{favoriteCount}</span>
            <FavoriteIcon />
          </Link>

          <button
            type="button"
            className={
              searchOpen
                ? "storefront-utility-link plain storefront-logout-button active"
                : "storefront-utility-link plain storefront-logout-button"
            }
            onClick={() => setSearchOpen((current) => !current)}
            title={language === "ar" ? "بحث داخل المتجر" : "Search store products"}
          >
            <SearchIcon />
          </button>

          <button
            type="button"
            className={
              accountOpen
                ? "storefront-utility-link plain storefront-logout-button active"
                : "storefront-utility-link plain storefront-logout-button"
            }
            onClick={() => setAccountOpen((current) => !current)}
            title={language === "ar" ? "الحساب" : "Account"}
          >
            <UserIcon />
          </button>
        </div>

        <div className="storefront-branding">
          <nav className="storefront-nav">
            <Link to={`/store/${store.slug || store.id}`}>
              {language === "ar" ? "الصفحة الرئيسية" : "Home"}
            </Link>
            <a href="#store-products">{language === "ar" ? "اخر المنتجات" : "Latest products"}</a>
            <a href="#store-products">
              {store.category || (language === "ar" ? "التصنيفات" : "Categories")}
            </a>
          </nav>

          <Link className="storefront-brand" to={`/store/${store.slug || store.id}`}>
            <StoreBrand store={store} />
            <strong>{store.name}</strong>
          </Link>
        </div>
      </div>

      {accountOpen ? (
        <div className="storefront-account-panel-wrap">
          <div className="storefront-account-panel">
            <div className="storefront-account-top">
              <div className="storefront-account-avatar">
                {isCustomer ? getInitials(storeCustomer.name) : <UserIcon />}
              </div>

              <div className="storefront-account-copy">
                <strong>{language === "ar" ? "حسابي" : "My account"}</strong>
                <span>
                  {isCustomer
                    ? language === "ar"
                      ? `مسجل داخل ${store.name}`
                      : `Signed in to ${store.name}`
                    : language === "ar"
                      ? `غير مسجل داخل ${store.name}`
                      : `Not signed in to ${store.name}`}
                </span>
              </div>
            </div>

            {isCustomer ? (
              <div className="storefront-account-body">
                <div className="storefront-account-row">
                  <span>{language === "ar" ? "الاسم" : "Name"}</span>
                  <strong>{storeCustomer.name}</strong>
                </div>
                <div className="storefront-account-row">
                  <span>{language === "ar" ? "البريد" : "Email"}</span>
                  <strong>{storeCustomer.email}</strong>
                </div>
                <button
                  type="button"
                  className="storefront-account-action"
                  onClick={() => {
                    logout({ storeId: store.id });
                    setAccountOpen(false);
                  }}
                >
                  {language === "ar" ? "تسجيل الخروج" : "Sign out"}
                </button>
              </div>
            ) : (
              <div className="storefront-account-body">
                <p className="storefront-account-note">
                  {language === "ar"
                    ? "سجل دخولك لهذا المتجر لتتمكن من استخدام السلة والمفضلة وإتمام الطلب."
                    : "Sign in to this store to use cart, favorites, and checkout."}
                </p>
                <Link
                  className="storefront-account-action link"
                  to="/login"
                  state={loginState}
                  onClick={() => setAccountOpen(false)}
                >
                  {language === "ar" ? "تسجيل الدخول" : "Sign in"}
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {searchOpen ? (
        <div className="storefront-account-panel-wrap">
          <div className="storefront-account-panel storefront-search-panel">
            <div className="storefront-account-copy">
              <strong>{language === "ar" ? "ابحث في منتجات المتجر" : "Search store products"}</strong>
              <span>
                {language === "ar"
                  ? "اكتب اسم المنتج أو التصنيف ثم اضغط Enter."
                  : "Type a product or category name and press Enter."}
              </span>
            </div>

            <form
              className="storefront-search-form"
              onSubmit={(event) => {
                event.preventDefault();
                const [basePath, hash = ""] = searchTo.split("#");
                const searchQuery = searchValue.trim()
                  ? `?search=${encodeURIComponent(searchValue.trim())}`
                  : "";
                const target = `${basePath}${searchQuery}${hash ? `#${hash}` : ""}`;
                window.location.href = target;
              }}
            >
              <input
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={language === "ar" ? "ابحث عن منتج..." : "Search for a product..."}
              />
              <button type="submit" className="storefront-account-action">
                {language === "ar" ? "بحث" : "Search"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
