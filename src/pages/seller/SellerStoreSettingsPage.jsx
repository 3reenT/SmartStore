import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useApp } from "../../state/AppContext";
import { translations } from "../../i18n";

const tabKeys = ["general", "design", "notifications", "privacySecurity", "billing"];
const colorChoices = ["#18c79c", "#4f7cff", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

function createDraft(store) {
  return {
    name: store.name || "",
    description: store.description || "",
    category: store.category || "",
    city: store.city || "",
    contactEmail: store.contactEmail || "",
    contactPhone: store.contactPhone || "",
    address: store.address || "",
    status: store.status || "pending",
    maintenanceMode: Boolean(store.maintenanceMode),
    storeUrl: store.storeUrl || "",
    theme: store.theme || "Modern",
    primaryColor: store.primaryColor || "#18c79c",
    logo: store.logo || "",
    banner: store.banner || "",
    galleryImages: Array.isArray(store.galleryImages) ? store.galleryImages : [],
    sectionLogos:
      store.sectionLogos && typeof store.sectionLogos === "object"
        ? { ...store.sectionLogos }
        : {},
    notifications: { ...store.notifications },
    security: { ...store.security },
    billing: { ...store.billing },
    socialLinks: {
      tiktok: store.socialLinks?.tiktok || "",
      facebook: store.socialLinks?.facebook || "",
      instagram: store.socialLinks?.instagram || "",
    },
    subscription: store.subscription || "Free",
    currency: store.currency || "USD",
  };
}

export default function SellerStoreSettingsPage() {
  const { storeId } = useParams();
  const { currentUser, stores, products, updateStore, setActiveSellerStore, language } = useApp();
  const t = translations[language];
  const sellerStores = stores.filter((store) => store.sellerId === currentUser?.id);
  const store = sellerStores.find((item) => item.id === storeId) || null;
  const [savedMessage, setSavedMessage] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const [draft, setDraft] = useState(() => (store ? createDraft(store) : null));
  const [saveError, setSaveError] = useState("");
  const storeCategories = Array.from(
    new Set(
      products
        .filter((product) => product.storeId === store?.id)
        .map((product) => product.category)
        .filter(Boolean),
    ),
  );

  useEffect(() => {
    if (store) {
      setDraft(createDraft(store));
    }
  }, [store]);

  useEffect(() => {
    if (store?.id && currentUser?.id) {
      setActiveSellerStore(currentUser.id, store.id);
    }
  }, [store?.id, currentUser?.id]);

  useEffect(() => {
    if (!savedMessage) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setSavedMessage(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [savedMessage]);

  useEffect(() => {
    if (!saveError) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setSaveError(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [saveError]);

  const persistStoreDraft = (nextDraft) => {
    updateStore(store.id, {
      ...nextDraft,
      sellerId: currentUser.id,
      ownerName: currentUser.name,
    });
    setSaveError("");
    setSavedMessage(t.savedToStore);
  };

  if (!store) {
    return <Navigate to="/seller/store" replace />;
  }

  const handleDraftChange = (event) => {
    const { name, value, type, checked } = event.target;
    setDraft((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNestedChange = (section, field, value) => {
    setDraft((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  };

  const handleAssetChange = async (field, file) => {
    if (!file) {
      return;
    }

    const value = await readFileAsDataUrl(file);
    setDraft((current) => {
      const nextDraft = { ...current, [field]: value };
      persistStoreDraft(nextDraft);
      return nextDraft;
    });
  };

  const handleSectionLogoChange = async (section, file) => {
    if (!file) {
      return;
    }

    const value = await readFileAsDataUrl(file);
    setDraft((current) => {
      const nextDraft = {
        ...current,
        sectionLogos: {
          ...current.sectionLogos,
          [section]: value,
        },
      };
      persistStoreDraft(nextDraft);
      return nextDraft;
    });
  };

  const removeSectionLogo = (section) => {
    setDraft((current) => {
      const nextSectionLogos = { ...current.sectionLogos };
      delete nextSectionLogos[section];

      const nextDraft = {
        ...current,
        sectionLogos: nextSectionLogos,
      };
      persistStoreDraft(nextDraft);
      return nextDraft;
    });
  };

  const handleGalleryUpload = async (files) => {
    const selectedFiles = Array.from(files || []).slice(0, 6);

    if (!selectedFiles.length) {
      return;
    }

    const uploadedImages = await Promise.all(selectedFiles.map((file) => readFileAsDataUrl(file)));

    setDraft((current) => {
      const nextDraft = {
        ...current,
        galleryImages: [...current.galleryImages, ...uploadedImages].slice(0, 6),
      };
      persistStoreDraft(nextDraft);
      return nextDraft;
    });
  };

  const removeGalleryImage = (index) => {
    setDraft((current) => {
      const nextDraft = {
        ...current,
        galleryImages: current.galleryImages.filter((_, imageIndex) => imageIndex !== index),
      };
      persistStoreDraft(nextDraft);
      return nextDraft;
    });
  };

  const saveCurrentStore = () => {
    if (
      !draft.socialLinks.tiktok.trim() ||
      !draft.socialLinks.facebook.trim() ||
      !draft.socialLinks.instagram.trim()
    ) {
      setSaveError(
        language === "ar"
          ? "روابط TikTok وFacebook وInstagram إجبارية لكل متجر."
          : "TikTok, Facebook, and Instagram links are required for every store.",
      );
      return;
    }

    updateStore(store.id, {
      ...draft,
      sellerId: currentUser.id,
      ownerName: currentUser.name,
    });
    setSaveError("");
    setSavedMessage(t.savedToStore);
  };

  return (
    <section className="panel store-settings-panel">
      <div className="panel-header">
        <div>
          <h2>{store.name}</h2>
          <p className="settings-subtitle">{t.selectedStore}</p>
        </div>
        <div className="panel-tools">
          {saveError ? <span className="form-error">{saveError}</span> : null}
          {savedMessage ? <span>{savedMessage}</span> : null}
          <Link
            className="secondary-button"
            to={`/store/${store.slug || store.id}`}
            target="_blank"
            rel="noreferrer"
          >
            {language === "ar" ? "عرض المتجر" : "View store"}
          </Link>
          <Link className="secondary-button" to="/seller/store">
            {t.myStores}
          </Link>
        </div>
      </div>

      <div className="settings-tabs">
        {tabKeys.map((key) => (
          <button
            key={key}
            type="button"
            className={activeTab === key ? "settings-tab active" : "settings-tab"}
            onClick={() => setActiveTab(key)}
          >
            {t[key]}
          </button>
        ))}
      </div>

      {activeTab === "general" ? (
        <div className="store-settings-body">
          <section className="settings-section">
            <h3>{t.storeInformation}</h3>
            <div className="admin-form-grid seller-form-grid">
              <div className="seller-form-span">
                <label>{t.store}</label>
                <input name="name" value={draft.name} onChange={handleDraftChange} />
              </div>
              <div className="seller-form-span">
                <label>{t.storeDescription}</label>
                <textarea
                  name="description"
                  rows="4"
                  value={draft.description}
                  onChange={handleDraftChange}
                />
              </div>
              <div>
                <label>{t.category}</label>
                <input name="category" value={draft.category} onChange={handleDraftChange} />
              </div>
              <div>
                <label>{t.city}</label>
                <input name="city" value={draft.city} onChange={handleDraftChange} />
              </div>
              <div>
                <label>{language === "ar" ? "العملة" : "Currency"}</label>
                <select name="currency" value={draft.currency} onChange={handleDraftChange}>
                  <option value="USD">{language === "ar" ? "دولار (USD)" : "US Dollar (USD)"}</option>
                  <option value="JOD">{language === "ar" ? "دينار (JOD)" : "Jordanian Dinar (JOD)"}</option>
                  <option value="ILS">{language === "ar" ? "شيكل (ILS)" : "Israeli Shekel (ILS)"}</option>
                </select>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h3>{t.contactInformation}</h3>
            <div className="admin-form-grid seller-form-grid">
              <div>
                <label>{t.contactEmail}</label>
                <input
                  name="contactEmail"
                  type="email"
                  value={draft.contactEmail}
                  onChange={handleDraftChange}
                />
              </div>
              <div>
                <label>{t.contactPhone}</label>
                <input
                  name="contactPhone"
                  value={draft.contactPhone}
                  onChange={handleDraftChange}
                />
              </div>
              <div className="seller-form-span">
                <label>{t.storeAddress}</label>
                <input name="address" value={draft.address} onChange={handleDraftChange} />
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h3>{t.storeSettings}</h3>
            <div className="admin-form-grid seller-form-grid">
              <div>
                <label>{t.currentStoreStatus}</label>
                <div className="readonly-status-field">
                  <span className={`status-pill ${store.status}`}>{t[store.status]}</span>
                </div>
                <small className="helper-text">{t.visibleToCustomers}</small>
              </div>
              <div className="toggle-card">
                <div className="stacked-cell">
                  <strong>{t.maintenanceMode}</strong>
                  <small>
                    {language === "ar"
                      ? "ضع المتجر في وضع الصيانة للتحديثات"
                      : "Put store in maintenance mode for updates"}
                  </small>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={draft.maintenanceMode}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        maintenanceMode: event.target.checked,
                      }))
                    }
                  />
                  <span className="slider" />
                </label>
              </div>
              <div className="seller-form-span">
                <label>{t.storeUrl}</label>
                <div className="url-row">
                  <input name="storeUrl" value={draft.storeUrl} onChange={handleDraftChange} />
                  <button className="secondary-button" type="button">
                    {t.copy}
                  </button>
                </div>
              </div>
              <div className="seller-form-span">
                <label>{language === "ar" ? "روابط السوشال ميديا" : "Social media links"}</label>
                <div className="admin-form-grid seller-form-grid">
                  <div>
                    <label>{language === "ar" ? "رابط TikTok" : "TikTok URL"}</label>
                    <input
                      value={draft.socialLinks.tiktok}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          socialLinks: {
                            ...current.socialLinks,
                            tiktok: event.target.value,
                          },
                        }))
                      }
                      placeholder="https://www.tiktok.com/@yourstore"
                    />
                  </div>
                  <div>
                    <label>{language === "ar" ? "رابط Facebook" : "Facebook URL"}</label>
                    <input
                      value={draft.socialLinks.facebook}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          socialLinks: {
                            ...current.socialLinks,
                            facebook: event.target.value,
                          },
                        }))
                      }
                      placeholder="https://www.facebook.com/yourstore"
                    />
                  </div>
                  <div className="seller-form-span">
                    <label>{language === "ar" ? "رابط Instagram" : "Instagram URL"}</label>
                    <input
                      value={draft.socialLinks.instagram}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          socialLinks: {
                            ...current.socialLinks,
                            instagram: event.target.value,
                          },
                        }))
                      }
                      placeholder="https://www.instagram.com/yourstore"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "design" ? (
        <div className="store-settings-body">
          <section className="settings-section">
            <h3>{t.customization}</h3>
            <div className="admin-form-grid seller-form-grid">
              <div className="seller-form-span">
                <label>{t.theme}</label>
                <select
                  value={draft.theme}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, theme: event.target.value }))
                  }
                >
                  <option value="Modern">{t.modern}</option>
                </select>
              </div>
              <div className="seller-form-span">
                <label>{t.primaryColor}</label>
                <p className="helper-text">
                  {language === "ar"
                    ? "هذا اللون يظهر في عناصر واجهة المتجر العامة مثل شريط التصنيف."
                    : "This color appears in public store elements such as the category bar."}
                </p>
                <div className="color-choices">
                  {colorChoices.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={
                        draft.primaryColor === color ? "color-swatch active" : "color-swatch"
                      }
                      style={{ backgroundColor: color }}
                      onClick={() =>
                        setDraft((current) => ({ ...current, primaryColor: color }))
                      }
                    />
                  ))}
                </div>
              </div>
              <div>
                <label>{t.storeLogo}</label>
                <div className="asset-upload-box">
                  {draft.logo ? (
                    <img src={draft.logo} alt={t.storeLogo} className="store-logo-preview" />
                  ) : (
                    <div className="store-logo-preview store-logo-empty">
                      {language === "ar" ? "بدون شعار" : "No logo"}
                    </div>
                  )}
                  <label className="secondary-button upload-trigger">
                    {t.uploadLogo}
                    <input
                      type="file"
                      className="hidden-file-input"
                      accept="image/*"
                      onChange={(event) => handleAssetChange("logo", event.target.files?.[0])}
                    />
                  </label>
                  {draft.logo ? (
                    <button
                      type="button"
                      className="secondary-button danger-button"
                      onClick={() => setDraft((current) => ({ ...current, logo: "" }))}
                    >
                      {language === "ar" ? "حذف الشعار" : "Remove logo"}
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="seller-form-span">
                <label>{t.storeBanner}</label>
                <div
                  className="store-banner-preview"
                  style={{
                    background: draft.banner
                      ? `center / cover no-repeat url(${draft.banner})`
                      : `linear-gradient(135deg, ${draft.primaryColor}, #0f172a)`,
                  }}
                >
                  <strong>{draft.name}</strong>
                </div>
                <label className="secondary-button upload-trigger">
                  {t.uploadBanner}
                  <input
                    type="file"
                    className="hidden-file-input"
                    accept="image/*"
                    onChange={(event) => handleAssetChange("banner", event.target.files?.[0])}
                  />
                </label>
              </div>
              <div className="seller-form-span">
                <label>{language === "ar" ? "صور عرض المتجر" : "Store showcase images"}</label>
                <p className="helper-text">
                  {language === "ar"
                    ? "هذه الصور تظهر في بداية صفحة المتجر قبل عرض المنتجات."
                    : "These images appear at the top of the public store page before products."}
                </p>
                <label className="secondary-button upload-trigger">
                  {language === "ar" ? "رفع صور العرض" : "Upload showcase images"}
                  <input
                    type="file"
                    className="hidden-file-input"
                    accept="image/*"
                    multiple
                    onChange={(event) => {
                      handleGalleryUpload(event.target.files);
                      event.target.value = "";
                    }}
                  />
                </label>
                {draft.galleryImages.length ? (
                  <div className="store-gallery-editor">
                    {draft.galleryImages.map((image, index) => (
                      <div key={`${index}-${image.slice(0, 24)}`} className="store-gallery-editor-card">
                        <img src={image} alt={`${draft.name || "Store"} ${index + 1}`} />
                        <button
                          type="button"
                          className="secondary-button danger-button"
                          onClick={() => removeGalleryImage(index)}
                        >
                          {language === "ar" ? "حذف الصورة" : "Remove image"}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="seller-form-span">
                <label>{language === "ar" ? "شعارات أقسام المتجر" : "Store section logos"}</label>
                <p className="helper-text">
                  {language === "ar"
                    ? "ارفع صورة لكل قسم، وإذا لم ترفع صورة سيبقى القسم بدون لوجو."
                    : "Upload a logo for each section. If you skip it, the section stays without a logo."}
                </p>
                <div className="store-gallery-editor">
                  {[
                    language === "ar" ? "الرئيسية" : "Home",
                    ...storeCategories,
                  ].map((section) => (
                    <div key={section} className="store-gallery-editor-card section-logo-card">
                      {draft.sectionLogos?.[section] ? (
                        <img src={draft.sectionLogos[section]} alt={section} />
                      ) : (
                        <div className="store-logo-preview store-logo-empty small">
                          {language === "ar" ? "بدون لوجو" : "No logo"}
                        </div>
                      )}
                      <strong>{section}</strong>
                      <label className="secondary-button upload-trigger">
                        {language === "ar" ? "رفع الصورة" : "Upload image"}
                        <input
                          type="file"
                          className="hidden-file-input"
                          accept="image/*"
                          onChange={(event) => handleSectionLogoChange(section, event.target.files?.[0])}
                        />
                      </label>
                      {draft.sectionLogos?.[section] ? (
                        <button
                          type="button"
                          className="secondary-button danger-button"
                          onClick={() => removeSectionLogo(section)}
                        >
                          {language === "ar" ? "حذف" : "Remove"}
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "notifications" ? (
        <div className="store-settings-body">
          <section className="settings-section">
            <h3>{t.notificationSettings}</h3>
            <div className="settings-list">
              <div className="toggle-card">
                <div className="stacked-cell">
                  <strong>{t.newOrders}</strong>
                  <small>{t.notifyOrdersHelp}</small>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={draft.notifications.emailOrders}
                    onChange={(event) =>
                      handleNestedChange("notifications", "emailOrders", event.target.checked)
                    }
                  />
                  <span className="slider" />
                </label>
              </div>
              <div className="toggle-card">
                <div className="stacked-cell">
                  <strong>{t.lowStockAlerts}</strong>
                  <small>{t.notifyStockHelp}</small>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={draft.notifications.lowStockAlerts}
                    onChange={(event) =>
                      handleNestedChange("notifications", "lowStockAlerts", event.target.checked)
                    }
                  />
                  <span className="slider" />
                </label>
              </div>
              <div className="toggle-card">
                <div className="stacked-cell">
                  <strong>{t.customerMessages}</strong>
                  <small>{t.notifyMessagesHelp}</small>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={draft.notifications.customerMessages}
                    onChange={(event) =>
                      handleNestedChange("notifications", "customerMessages", event.target.checked)
                    }
                  />
                  <span className="slider" />
                </label>
              </div>
              <div className="toggle-card">
                <div className="stacked-cell">
                  <strong>{t.pushNotifications}</strong>
                  <small>{t.notifyPushHelp}</small>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={draft.notifications.pushNotifications}
                    onChange={(event) =>
                      handleNestedChange("notifications", "pushNotifications", event.target.checked)
                    }
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "privacySecurity" ? (
        <div className="store-settings-body">
          <section className="settings-section">
            <h3>{t.securitySettings}</h3>
            <div className="settings-list">
              <div className="toggle-card">
                <div className="stacked-cell">
                  <strong>{t.twoFactorAuthentication}</strong>
                  <small>{t.addExtraSecurity}</small>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={draft.security.twoFactorEnabled}
                    onChange={(event) =>
                      handleNestedChange("security", "twoFactorEnabled", event.target.checked)
                    }
                  />
                  <span className="slider" />
                </label>
              </div>
              <div className="setting-card-inline">
                <div className="stacked-cell">
                  <strong>{t.sessionTimeout}</strong>
                  <small>{t.sessionTimeoutHelp}</small>
                </div>
                <select
                  value={draft.security.sessionTimeout}
                  onChange={(event) =>
                    handleNestedChange("security", "sessionTimeout", event.target.value)
                  }
                >
                  <option value="30 minutes">30 minutes</option>
                  <option value="1 hour">1 hour</option>
                  <option value="2 hours">2 hours</option>
                </select>
              </div>
              <div className="setting-card-inline">
                <div className="stacked-cell">
                  <strong>{t.apiAccess}</strong>
                  <small>{t.manageKeysHelp}</small>
                </div>
                <div className="inline-badge-row">
                  <span className="status-chip success">{t.enabled}</span>
                  <button className="secondary-button" type="button">
                    {t.manageApiKeys}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "billing" ? (
        <div className="store-settings-body">
          <section className="settings-section">
            <h3>{t.billingInformation}</h3>
            <div className="billing-card">
              <div className="billing-grid">
                <div className="stacked-cell">
                  <span>{t.currentPlan}</span>
                  <strong>{draft.billing.currentPlan}</strong>
                </div>
                <div className="stacked-cell">
                  <span>{t.nextBillingDate}</span>
                  <strong>{draft.billing.nextBillingDate}</strong>
                </div>
                <div className="stacked-cell">
                  <span>{t.paymentMethod}</span>
                  <strong>{draft.billing.paymentMethod}</strong>
                </div>
              </div>
              <button className="primary-button full-width" type="button">
                {t.updatePaymentMethod}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <div className="store-settings-footer">
        <button className="primary-button" type="button" onClick={saveCurrentStore}>
          {t.saveSettings}
        </button>
      </div>
    </section>
  );
}
