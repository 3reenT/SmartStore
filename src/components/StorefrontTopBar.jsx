import { useRef, useState } from "react";
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

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 7.5 8.5 5h7L17 7.5h2.2A1.8 1.8 0 0 1 21 9.3v8.4A1.8 1.8 0 0 1 19.2 19H4.8A1.8 1.8 0 0 1 3 17.7V9.3A1.8 1.8 0 0 1 4.8 7.5H7Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="13"
        r="3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14 3c.3 2 1.5 3.7 3.7 4.5v2.5a8 8 0 0 1-3.7-1.1v5.7a5 5 0 1 1-5-5h.4v2.6H9a2.4 2.4 0 1 0 2.4 2.4V3H14Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M13.5 21v-7h2.3l.4-3h-2.7V9.1c0-.9.3-1.6 1.6-1.6H16V4.8c-.3 0-1-.1-1.9-.1-1.9 0-3.2 1.1-3.2 3.4V11H8.5v3H11v7h2.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="4.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

function StoreBrand({ store }) {
  if (store.logo) {
    return <img src={store.logo} alt={store.name} className="storefront-brand-logo" />;
  }

  return <div className="storefront-brand-fallback storefront-brand-empty" />;
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
  const [searchImageName, setSearchImageName] = useState("");
  const searchImageInputRef = useRef(null);
  const storeCustomer = getStoreCustomer(store.id);
  const storeWorkspace = getStoreCustomerWorkspace(store.id);
  const isCustomer = Boolean(storeCustomer);
  const cartCount = storeWorkspace.cart.length;
  const favoriteCount = storeWorkspace.favorites.length;
  const isArabic = language === "ar";
  const loginState = {
    from: `${location.pathname}${location.search}${location.hash}`,
    storeId: store.id,
  };
  const socialLinks = store.socialLinks || {};

  return (
    <section className="storefront-topbar">
      <div className="storefront-topbar-row storefront-topbar-meta">
        <button
          type="button"
          className="storefront-language"
          onClick={() => setLanguage(isArabic ? "en" : "ar")}
        >
          <span className="storefront-language-arrow">⌄</span>
          <span>{isArabic ? "Arabic" : "English"}</span>
        </button>

        <div className="storefront-socials">
          {socialLinks.tiktok ? (
            <a href={socialLinks.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok">
              <TikTokIcon />
            </a>
          ) : (
            <span className="storefront-social-disabled" aria-label="TikTok">
              <TikTokIcon />
            </span>
          )}

          {socialLinks.facebook ? (
            <a href={socialLinks.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
              <FacebookIcon />
            </a>
          ) : (
            <span className="storefront-social-disabled" aria-label="Facebook">
              <FacebookIcon />
            </span>
          )}

          {socialLinks.instagram ? (
            <a href={socialLinks.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
              <InstagramIcon />
            </a>
          ) : (
            <span className="storefront-social-disabled" aria-label="Instagram">
              <InstagramIcon />
            </span>
          )}
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
            title={isArabic ? "بحث داخل المتجر" : "Search store products"}
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
            title={isArabic ? "الحساب" : "Account"}
          >
            <UserIcon />
          </button>
        </div>

        <div className="storefront-branding">
          <nav className="storefront-nav">
            <Link to={`/store/${store.slug || store.id}`}>
              {isArabic ? "الصفحة الرئيسية" : "Home"}
            </Link>
            <a href="#store-products">{isArabic ? "آخر المنتجات" : "Latest products"}</a>
            <a href="#store-products">
              {store.category || (isArabic ? "التصنيفات" : "Categories")}
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
                <strong>{isArabic ? "حسابي" : "My account"}</strong>
                <span>
                  {isCustomer
                    ? isArabic
                      ? `مسجل داخل ${store.name}`
                      : `Signed in to ${store.name}`
                    : isArabic
                      ? `غير مسجل داخل ${store.name}`
                      : `Not signed in to ${store.name}`}
                </span>
              </div>
            </div>

            {isCustomer ? (
              <div className="storefront-account-body">
                <div className="storefront-account-row">
                  <span>{isArabic ? "الاسم" : "Name"}</span>
                  <strong>{storeCustomer.name}</strong>
                </div>
                <div className="storefront-account-row">
                  <span>{isArabic ? "البريد" : "Email"}</span>
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
                  {isArabic ? "تسجيل الخروج" : "Sign out"}
                </button>
              </div>
            ) : (
              <div className="storefront-account-body">
                <p className="storefront-account-note">
                  {isArabic
                    ? "سجل دخولك لهذا المتجر لتتمكن من استخدام السلة والمفضلة وإتمام الطلب."
                    : "Sign in to this store to use cart, favorites, and checkout."}
                </p>
                <Link
                  className="storefront-account-action link"
                  to="/login"
                  state={loginState}
                  onClick={() => setAccountOpen(false)}
                >
                  {isArabic ? "تسجيل الدخول" : "Sign in"}
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
              <strong>{isArabic ? "ابحث في منتجات المتجر" : "Search store products"}</strong>
              <span>
                {isArabic
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
                placeholder={isArabic ? "ابحث عن منتج..." : "Search for a product..."}
              />
              <input
                ref={searchImageInputRef}
                type="file"
                accept="image/*"
                className="storefront-camera-input"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setSearchImageName(file ? file.name : "");
                }}
              />
              <button
                type="button"
                className="storefront-camera-button"
                onClick={() => searchImageInputRef.current?.click()}
                title={isArabic ? "ابحث بالصورة" : "Search by image"}
              >
                <CameraIcon />
              </button>
              <button type="submit" className="storefront-account-action">
                {isArabic ? "بحث" : "Search"}
              </button>
            </form>
            {searchImageName ? (
              <span className="storefront-search-image-note">
                {isArabic ? "تم اختيار:" : "Selected:"} {searchImageName}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
