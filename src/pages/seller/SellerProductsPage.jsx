import { useEffect, useMemo, useState } from "react";
import { useApp } from "../../state/AppContext";
import { translations } from "../../i18n";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

const initialForm = {
  name: "",
  category: "",
  price: "",
  originalPrice: "",
  stock: "",
  status: "active",
  isNew: false,
  description: "",
  image: "",
  images: [],
  hasSizes: false,
  sizeMode: "alpha",
  sizeOptions: [],
  hasColors: false,
  colorOptions: [],
  sizeInventory: {},
  colorInventory: {},
  variantInventory: {},
  colorImageMap: {},
};

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

function sumInventory(values) {
  return Object.values(values || {}).reduce(
    (sum, value) => sum + Math.max(0, Number(value || 0)),
    0,
  );
}

function sanitizeOption(value) {
  return String(value || "").trim();
}

function buildSizeSuggestions(mode) {
  return mode === "numeric"
    ? ["36", "37", "38", "39", "40", "41", "42", "43", "44"]
    : ["XS", "S", "M", "L", "XL", "XXL"];
}

export default function SellerProductsPage() {
  const {
    currentUser,
    stores,
    products,
    sellerWorkspace,
    addProduct,
    updateProduct,
    deleteProduct,
    generateProductDescription,
    language,
  } = useApp();
  const t = translations[language];
  const isArabic = language === "ar";
  const sellerStores = stores.filter((store) => store.sellerId === currentUser?.id);
  const activeStoreId = sellerWorkspace[currentUser?.id]?.activeStoreId;
  const sellerStore =
    sellerStores.find((store) => store.id === activeStoreId) || sellerStores[0] || null;
  const sellerProducts = products.filter((product) => product.storeId === sellerStore?.id);
  const [editingId, setEditingId] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [sizeDraft, setSizeDraft] = useState("");
  const [colorDraft, setColorDraft] = useState("");

  const computedStock = useMemo(() => {
    if (form.hasSizes && form.hasColors) {
      return sumInventory(form.variantInventory);
    }

    if (form.hasSizes) {
      return sumInventory(form.sizeInventory);
    }

    if (form.hasColors) {
      return sumInventory(form.colorInventory);
    }

    return Number(form.stock || 0);
  }, [form]);

  useEffect(() => {
    if (!savedMessage) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setSavedMessage(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [savedMessage]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = async (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    try {
      const uploadedImages = await Promise.all(files.map((file) => readFileAsDataUrl(file)));

      setForm((current) => {
        const nextImages = [...current.images, ...uploadedImages].slice(0, 6);
        return {
          ...current,
          image: nextImages[0] || "",
          images: nextImages,
        };
      });

      setError("");
      event.target.value = "";
    } catch {
      setError(t.imageRequired);
    }
  };

  const removeImage = (index) => {
    setForm((current) => {
      const nextImages = current.images.filter((_, imageIndex) => imageIndex !== index);
      const nextColorImageMap = Object.fromEntries(
        Object.entries(current.colorImageMap || {}).filter(([, value]) => nextImages.includes(value)),
      );

      return {
        ...current,
        images: nextImages,
        image: nextImages[0] || "",
        colorImageMap: nextColorImageMap,
      };
    });
  };

  const setPrimaryImage = (index) => {
    setForm((current) => {
      const nextImages = [...current.images];
      const [selectedImage] = nextImages.splice(index, 1);
      nextImages.unshift(selectedImage);

      return {
        ...current,
        image: nextImages[0] || "",
        images: nextImages,
      };
    });
  };

  const handleGenerate = () => {
    setForm((current) => ({
      ...current,
      description: generateProductDescription({
        name: current.name,
        category: current.category,
      }),
    }));
  };

  const addSizeOption = () => {
    const value = sanitizeOption(sizeDraft);

    if (!value) {
      return;
    }

    setForm((current) => ({
      ...current,
      sizeOptions: current.sizeOptions.includes(value)
        ? current.sizeOptions
        : [...current.sizeOptions, value],
    }));
    setSizeDraft("");
  };

  const addColorOption = () => {
    const value = sanitizeOption(colorDraft);

    if (!value) {
      return;
    }

    setForm((current) => ({
      ...current,
      colorOptions: current.colorOptions.includes(value)
        ? current.colorOptions
        : [...current.colorOptions, value],
    }));
    setColorDraft("");
  };

  const removeSizeOption = (value) => {
    setForm((current) => {
      const nextSizeOptions = current.sizeOptions.filter((option) => option !== value);
      const nextSizeInventory = { ...current.sizeInventory };
      delete nextSizeInventory[value];
      const nextVariantInventory = Object.fromEntries(
        Object.entries(current.variantInventory).filter(([key]) => !key.startsWith(`${value}|`)),
      );

      return {
        ...current,
        sizeOptions: nextSizeOptions,
        sizeInventory: nextSizeInventory,
        variantInventory: nextVariantInventory,
      };
    });
  };

  const removeColorOption = (value) => {
    setForm((current) => {
      const nextColorOptions = current.colorOptions.filter((option) => option !== value);
      const nextColorInventory = { ...current.colorInventory };
      const nextColorImageMap = { ...current.colorImageMap };
      delete nextColorInventory[value];
      delete nextColorImageMap[value];

      const nextVariantInventory = Object.fromEntries(
        Object.entries(current.variantInventory).filter(([key]) => !key.endsWith(`|${value}`)),
      );

      return {
        ...current,
        colorOptions: nextColorOptions,
        colorInventory: nextColorInventory,
        colorImageMap: nextColorImageMap,
        variantInventory: nextVariantInventory,
      };
    });
  };

  const updateSingleInventory = (type, key, value) => {
    const normalizedValue = Math.max(0, Number(value || 0));

    setForm((current) => ({
      ...current,
      [type]: {
        ...current[type],
        [key]: normalizedValue,
      },
    }));
  };

  const updateVariantInventory = (size, color, value) => {
    const normalizedValue = Math.max(0, Number(value || 0));

    setForm((current) => ({
      ...current,
      variantInventory: {
        ...current.variantInventory,
        [`${size}|${color}`]: normalizedValue,
      },
    }));
  };

  const buildPayload = () => {
    const images = form.images.filter(Boolean);
    const payload = {
      ...form,
      price: Number(form.price),
      originalPrice: Number(form.originalPrice || 0),
      stock: computedStock,
      image: images[0] || "",
      images,
      sizeOptions: form.hasSizes ? form.sizeOptions : [],
      colorOptions: form.hasColors ? form.colorOptions : [],
      sizeInventory: form.hasSizes && !form.hasColors ? form.sizeInventory : {},
      colorInventory: form.hasColors && !form.hasSizes ? form.colorInventory : {},
      variantInventory: form.hasSizes && form.hasColors ? form.variantInventory : {},
      colorImageMap: form.hasColors ? form.colorImageMap : {},
      storeId: sellerStore.id,
    };

    if (!form.hasSizes) {
      payload.sizeMode = "alpha";
    }

    return payload;
  };

  const resetEditor = () => {
    setEditingId("");
    setError("");
    setForm(initialForm);
    setSizeDraft("");
    setColorDraft("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!sellerStore) {
      return;
    }

    if (!form.images.length) {
      setError(t.imageRequired);
      return;
    }

    if (form.hasSizes && !form.sizeOptions.length) {
      setError(isArabic ? "أضف مقاسًا واحدًا على الأقل." : "Add at least one size.");
      return;
    }

    if (form.hasColors && !form.colorOptions.length) {
      setError(isArabic ? "أضف لونًا واحدًا على الأقل." : "Add at least one color.");
      return;
    }

    const payload = buildPayload();

    if (editingId) {
      updateProduct(editingId, payload);
      setSavedMessage(t.productUpdatedSuccessfully);
    } else {
      addProduct(payload);
      setSavedMessage(t.productAddedSuccessfully);
    }

    resetEditor();
  };

  const startEdit = (product) => {
    const images = Array.isArray(product.images)
      ? product.images.filter(Boolean)
      : product.image
        ? [product.image]
        : [];

    setEditingId(product.id);
    setError("");
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      originalPrice: product.originalPrice ? String(product.originalPrice) : "",
      stock: String(product.stock),
      status: product.status,
      isNew: Boolean(product.isNew),
      description: product.description,
      image: images[0] || product.image || "",
      images,
      hasSizes: Boolean(product.hasSizes),
      sizeMode: product.sizeMode || "alpha",
      sizeOptions: Array.isArray(product.sizeOptions) ? product.sizeOptions : [],
      hasColors: Boolean(product.hasColors),
      colorOptions: Array.isArray(product.colorOptions) ? product.colorOptions : [],
      sizeInventory: product.sizeInventory || {},
      colorInventory: product.colorInventory || {},
      variantInventory: product.variantInventory || {},
      colorImageMap: product.colorImageMap || {},
    });
  };

  const handleDelete = (productId) => {
    deleteProduct(productId);
    setSavedMessage(t.productDeletedSuccessfully);

    if (editingId === productId) {
      resetEditor();
    }
  };

  const sizeSuggestions = buildSizeSuggestions(form.sizeMode);

  if (!sellerStore) {
    return (
      <section className="panel empty-state-panel">
        <div className="panel-header">
          <h2>{t.manageProducts}</h2>
        </div>
        <p className="settings-subtitle">{t.createYourStoreFirst}</p>
      </section>
    );
  }

  return (
    <div className="dashboard-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>{editingId ? t.editProduct : t.addProduct}</h2>
            <p className="settings-subtitle">{t.productCatalogBody}</p>
          </div>
          {savedMessage ? <span>{savedMessage}</span> : null}
        </div>

        <form className="admin-form-grid seller-form-grid" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="product-name">{t.productName}</label>
            <input
              id="product-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="product-category">{t.productCategory}</label>
            <input
              id="product-category"
              name="category"
              value={form.category}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="product-price">{t.price}</label>
            <input
              id="product-price"
              name="price"
              type="number"
              min="0"
              value={form.price}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="product-original-price">{t.originalPrice}</label>
            <input
              id="product-original-price"
              name="originalPrice"
              type="number"
              min="0"
              value={form.originalPrice}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="product-status">{t.productStatus}</label>
            <select
              id="product-status"
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option value="active">{t.active}</option>
              <option value="draft">{t.draft}</option>
            </select>
          </div>

          <div className="product-checkbox-row">
            <label className="checkbox-label" htmlFor="product-is-new">
              <input
                id="product-is-new"
                name="isNew"
                type="checkbox"
                checked={form.isNew}
                onChange={handleChange}
              />
              <span>{t.markAsNew}</span>
            </label>
          </div>

          <div className="seller-inline-action">
            <button className="secondary-button" type="button" onClick={handleGenerate}>
              {t.generateWithAi}
            </button>
          </div>

          <div className="seller-form-span">
            <label htmlFor="product-images">
              {isArabic ? "صور المنتج" : "Product images"}
            </label>
            <div className="product-image-upload">
              <label className="secondary-button upload-trigger" htmlFor="product-images">
                {isArabic ? "رفع صور" : "Upload images"}
              </label>
              <input
                id="product-images"
                type="file"
                accept="image/*"
                multiple
                className="hidden-file-input"
                onChange={handleImageChange}
              />
            </div>
          </div>

          {form.images.length ? (
            <div className="seller-form-span">
              <div className="product-preview-grid">
                {form.images.map((image, index) => (
                  <div key={`${image}-${index}`} className="product-preview-tile">
                    <img className="product-image-preview" src={image} alt={`Preview ${index + 1}`} />
                    <div className="product-preview-actions">
                      <button
                        className="secondary-button row-action"
                        type="button"
                        onClick={() => setPrimaryImage(index)}
                      >
                        {index === 0
                          ? isArabic
                            ? "رئيسية"
                            : "Primary"
                          : isArabic
                            ? "اجعلها رئيسية"
                            : "Make primary"}
                      </button>
                      <button
                        className="secondary-button row-action danger-button"
                        type="button"
                        onClick={() => removeImage(index)}
                      >
                        {isArabic ? "حذف" : "Remove"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="seller-form-span product-variant-box">
            <label className="checkbox-label" htmlFor="product-has-sizes">
              <input
                id="product-has-sizes"
                name="hasSizes"
                type="checkbox"
                checked={form.hasSizes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    hasSizes: event.target.checked,
                    sizeOptions: event.target.checked ? current.sizeOptions : [],
                    sizeInventory: event.target.checked ? current.sizeInventory : {},
                    variantInventory: event.target.checked ? current.variantInventory : {},
                  }))
                }
              />
              <span>{isArabic ? "هذا المنتج له مقاسات" : "This product has sizes"}</span>
            </label>

            {form.hasSizes ? (
              <div className="variant-config-block">
                <div className="variant-mode-row">
                  <span>{isArabic ? "نوع المقاس" : "Size type"}</span>
                  <select
                    name="sizeMode"
                    value={form.sizeMode}
                    onChange={handleChange}
                  >
                    <option value="alpha">{isArabic ? "حروفي S / M / L" : "Letter sizes"}</option>
                    <option value="numeric">{isArabic ? "رقمي 36 / 38 / 40" : "Numeric sizes"}</option>
                  </select>
                </div>

                <div className="variant-chip-row">
                  {sizeSuggestions.map((option) => (
                    <button
                      key={option}
                      className="secondary-button row-action"
                      type="button"
                      onClick={() => {
                        setSizeDraft(option);
                        window.setTimeout(addSizeOption, 0);
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                <div className="variant-entry-row">
                  <input
                    value={sizeDraft}
                    onChange={(event) => setSizeDraft(event.target.value)}
                    placeholder={isArabic ? "أضف مقاسًا" : "Add a size"}
                  />
                  <button className="secondary-button" type="button" onClick={addSizeOption}>
                    {isArabic ? "إضافة مقاس" : "Add size"}
                  </button>
                </div>

                {form.sizeOptions.length ? (
                  <div className="variant-chip-list">
                    {form.sizeOptions.map((option) => (
                      <button
                        key={option}
                        className="variant-chip"
                        type="button"
                        onClick={() => removeSizeOption(option)}
                      >
                        {option} ×
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="seller-form-span product-variant-box">
            <label className="checkbox-label" htmlFor="product-has-colors">
              <input
                id="product-has-colors"
                name="hasColors"
                type="checkbox"
                checked={form.hasColors}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    hasColors: event.target.checked,
                    colorOptions: event.target.checked ? current.colorOptions : [],
                    colorInventory: event.target.checked ? current.colorInventory : {},
                    colorImageMap: event.target.checked ? current.colorImageMap : {},
                    variantInventory: event.target.checked ? current.variantInventory : {},
                  }))
                }
              />
              <span>{isArabic ? "هذا المنتج له ألوان" : "This product has colors"}</span>
            </label>

            {form.hasColors ? (
              <div className="variant-config-block">
                <div className="variant-entry-row">
                  <input
                    value={colorDraft}
                    onChange={(event) => setColorDraft(event.target.value)}
                    placeholder={isArabic ? "أضف لونًا" : "Add a color"}
                  />
                  <button className="secondary-button" type="button" onClick={addColorOption}>
                    {isArabic ? "إضافة لون" : "Add color"}
                  </button>
                </div>

                {form.colorOptions.length ? (
                  <div className="variant-chip-list">
                    {form.colorOptions.map((option) => (
                      <button
                        key={option}
                        className="variant-chip"
                        type="button"
                        onClick={() => removeColorOption(option)}
                      >
                        {option} ×
                      </button>
                    ))}
                  </div>
                ) : null}

                {form.colorOptions.length && form.images.length ? (
                  <div className="color-image-map-grid">
                    {form.colorOptions.map((color) => (
                      <div key={color} className="color-image-map-row">
                        <strong>{color}</strong>
                        <select
                          value={form.colorImageMap[color] || ""}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              colorImageMap: {
                                ...current.colorImageMap,
                                [color]: event.target.value,
                              },
                            }))
                          }
                        >
                          <option value="">{isArabic ? "بدون صورة مخصصة" : "No dedicated image"}</option>
                          {form.images.map((image, index) => (
                            <option key={`${color}-${index}`} value={image}>
                              {(isArabic ? "الصورة" : "Image") + ` ${index + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {!form.hasSizes && !form.hasColors ? (
            <div>
              <label htmlFor="product-stock">{t.stock}</label>
              <input
                id="product-stock"
                name="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={handleChange}
                required
              />
            </div>
          ) : null}

          {form.hasSizes && !form.hasColors && form.sizeOptions.length ? (
            <div className="seller-form-span">
              <label>{isArabic ? "مخزون كل مقاس" : "Stock per size"}</label>
              <div className="variant-stock-list">
                {form.sizeOptions.map((size) => (
                  <div key={size} className="variant-stock-row">
                    <strong>{size}</strong>
                    <input
                      type="number"
                      min="0"
                      value={form.sizeInventory[size] ?? 0}
                      onChange={(event) =>
                        updateSingleInventory("sizeInventory", size, event.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {form.hasColors && !form.hasSizes && form.colorOptions.length ? (
            <div className="seller-form-span">
              <label>{isArabic ? "مخزون كل لون" : "Stock per color"}</label>
              <div className="variant-stock-list">
                {form.colorOptions.map((color) => (
                  <div key={color} className="variant-stock-row">
                    <strong>{color}</strong>
                    <input
                      type="number"
                      min="0"
                      value={form.colorInventory[color] ?? 0}
                      onChange={(event) =>
                        updateSingleInventory("colorInventory", color, event.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {form.hasSizes && form.hasColors && form.sizeOptions.length && form.colorOptions.length ? (
            <div className="seller-form-span">
              <label>{isArabic ? "مخزون كل لون مع كل مقاس" : "Stock per size and color"}</label>
              <div className="variant-matrix-wrap">
                <table className="variant-matrix-table">
                  <thead>
                    <tr>
                      <th>{isArabic ? "اللون \\ المقاس" : "Color \\ Size"}</th>
                      {form.sizeOptions.map((size) => (
                        <th key={size}>{size}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {form.colorOptions.map((color) => (
                      <tr key={color}>
                        <td>{color}</td>
                        {form.sizeOptions.map((size) => (
                          <td key={`${size}-${color}`}>
                            <input
                              type="number"
                              min="0"
                              value={form.variantInventory[`${size}|${color}`] ?? 0}
                              onChange={(event) =>
                                updateVariantInventory(size, color, event.target.value)
                              }
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {(form.hasSizes || form.hasColors) ? (
            <div className="seller-form-span variant-summary-note">
              <strong>
                {isArabic ? "إجمالي الكمية" : "Total stock"}: {computedStock}
              </strong>
            </div>
          ) : null}

          <div className="seller-form-span">
            <label htmlFor="product-description">{t.description}</label>
            <textarea
              id="product-description"
              name="description"
              rows="5"
              value={form.description}
              onChange={handleChange}
              required
            />
          </div>

          {error ? <p className="form-error seller-form-span">{error}</p> : null}

          <div className="seller-form-actions seller-form-span">
            <button className="primary-button seller-save-button" type="submit">
              {editingId ? t.editProduct : t.addProduct}
            </button>
            {editingId ? (
              <button className="secondary-button" type="button" onClick={resetEditor}>
                {isArabic ? "إلغاء التعديل" : "Cancel edit"}
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>{t.manageProducts}</h2>
          <span>
            {sellerProducts.length} {t.products}
          </span>
        </div>

        <div className="table-like">
          <div className="table-row table-head seller-products-grid">
            <span>{t.productName}</span>
            <span>{t.price}</span>
            <span>{t.stock}</span>
            <span>{t.productStatus}</span>
            <span>{t.actions}</span>
          </div>

          {sellerProducts.map((product) => (
            <div key={product.id} className="table-row seller-products-grid">
              <div className="product-name-cell">
                <img
                  className="product-thumb"
                  src={product.image || "/logo.png"}
                  alt={product.name}
                />
                <div className="stacked-cell">
                  <strong>{product.name}</strong>
                  <small>{product.category}</small>
                  {product.hasSizes || product.hasColors ? (
                    <small>
                      {product.hasSizes && product.hasColors
                        ? isArabic
                          ? "مقاسات + ألوان"
                          : "Sizes + colors"
                        : product.hasSizes
                          ? isArabic
                            ? "مقاسات"
                            : "Sizes"
                          : isArabic
                            ? "ألوان"
                            : "Colors"}
                    </small>
                  ) : null}
                </div>
              </div>
              <span>{formatCurrency(product.price)}</span>
              <span>{product.stock}</span>
              <span>{product.status}</span>
              <div className="row-actions">
                <button
                  className="secondary-button row-action"
                  type="button"
                  onClick={() => startEdit(product)}
                >
                  {t.editProduct}
                </button>
                <button
                  className="secondary-button row-action danger-button"
                  type="button"
                  onClick={() => handleDelete(product.id)}
                >
                  {t.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
