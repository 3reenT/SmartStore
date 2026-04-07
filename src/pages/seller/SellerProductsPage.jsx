import { useEffect, useRef, useState } from "react";
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
  hasSizes: false,
  sizeMode: "",
  sizeInventoryText: "",
  hasColors: false,
  colorInventoryText: "",
  colorImageMap: {},
  variantInventoryText: "",
  price: "",
  originalPrice: "",
  stock: "",
  status: "active",
  isNew: false,
  description: "",
  image: "",
  images: [],
};

function parseSizeInventory(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((entry) => {
      const [size, stock] = entry.split("=");
      return {
        size: String(size || "").trim(),
        stock: Math.max(0, Number(String(stock || "").trim() || 0)),
      };
    })
    .filter((entry) => entry.size);
}

function parseColorInventory(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((entry) => {
      const [color, stock] = entry.split("=");
      return {
        color: String(color || "").trim(),
        stock: Math.max(0, Number(String(stock || "").trim() || 0)),
      };
    })
    .filter((entry) => entry.color);
}

function parseVariantInventory(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((entry) => {
      const [variant, stock] = entry.split("=");
      const [size, color] = String(variant || "").split("|");
      return {
        size: String(size || "").trim(),
        color: String(color || "").trim(),
        stock: Math.max(0, Number(String(stock || "").trim() || 0)),
      };
    })
    .filter((entry) => entry.size && entry.color);
}

function formatSizeInventory(entries) {
  return entries
    .filter((entry) => String(entry.size || "").trim())
    .map((entry) => `${String(entry.size || "").trim()}=${Math.max(0, Number(entry.stock || 0))}`)
    .join(", ");
}

function formatColorInventory(entries) {
  return entries
    .filter((entry) => String(entry.color || "").trim())
    .map((entry) => `${String(entry.color || "").trim()}=${Math.max(0, Number(entry.stock || 0))}`)
    .join(", ");
}

function formatVariantInventory(entries) {
  return entries
    .filter((entry) => String(entry.size || "").trim() && String(entry.color || "").trim())
    .map(
      (entry) =>
        `${String(entry.size || "").trim()}|${String(entry.color || "").trim()}=${Math.max(0, Number(entry.stock || 0))}`,
    )
    .join(", ");
}

function summarizeVariantInventory(entries) {
  const sizeMap = new Map();
  const colorMap = new Map();

  entries.forEach((entry) => {
    sizeMap.set(entry.size, (sizeMap.get(entry.size) || 0) + entry.stock);
    colorMap.set(entry.color, (colorMap.get(entry.color) || 0) + entry.stock);
  });

  return {
    sizeInventory: [...sizeMap.entries()].map(([size, stock]) => ({ size, stock })),
    colorInventory: [...colorMap.entries()].map(([color, stock]) => ({ color, stock })),
    sizeOptions: [...sizeMap.keys()],
    colorOptions: [...colorMap.keys()],
    stock: entries.reduce((sum, entry) => sum + entry.stock, 0),
  };
}

function syncVariantEntries(sizeEntries, colorEntries, currentEntries) {
  return sizeEntries.flatMap((sizeEntry) =>
    colorEntries.map((colorEntry) => {
      const existing = currentEntries.find(
        (entry) => entry.size === sizeEntry.size && entry.color === colorEntry.color,
      );

      return {
        size: sizeEntry.size,
        color: colorEntry.color,
        stock: Math.max(0, Number(existing?.stock || 0)),
      };
    }),
  );
}

function sumInventory(entries) {
  return entries.reduce((sum, entry) => sum + entry.stock, 0);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image."));
    image.src = src;
  });
}

async function optimizeImage(file) {
  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    return source;
  }

  const maxSide = 1400;
  const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", 0.82);
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
    storageError,
  } = useApp();
  const t = translations[language];
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
  const formSectionRef = useRef(null);
  const nameInputRef = useRef(null);

  const sizeInventoryEntries = parseSizeInventory(form.sizeInventoryText);
  const colorInventoryEntries = parseColorInventory(form.colorInventoryText);
  const variantInventoryEntries = parseVariantInventory(form.variantInventoryText);
  const totalStock = form.hasSizes && form.hasColors
    ? sumInventory(variantInventoryEntries)
    : form.hasSizes
      ? sumInventory(sizeInventoryEntries)
      : form.hasColors
        ? sumInventory(colorInventoryEntries)
        : Number(form.stock || 0);

  useEffect(() => {
    if (!savedMessage) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setSavedMessage(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [savedMessage]);

  useEffect(() => {
    if (storageError !== "storage-limit") {
      return;
    }

    setError(
      language === "ar"
        ? "حجم الصور كبير جدًا للتخزين المحلي. جرّب صورًا أصغر أو عددًا أقل."
        : "Images are too large for local storage. Try smaller files or fewer images.",
    );
  }, [storageError, language]);

  useEffect(() => {
    if (form.hasSizes) {
      return;
    }

    setForm((current) =>
      current.sizeMode || current.sizeInventoryText || current.variantInventoryText
        ? {
            ...current,
            sizeMode: "",
            sizeInventoryText: "",
            variantInventoryText: "",
          }
        : current,
    );
  }, [form.hasSizes]);

  useEffect(() => {
    if (form.hasColors) {
      return;
    }

    setForm((current) =>
      current.colorInventoryText || current.variantInventoryText
        ? {
            ...current,
            colorInventoryText: "",
            variantInventoryText: "",
          }
        : current,
    );
  }, [form.hasColors]);

  useEffect(() => {
    if (!form.hasSizes || !form.hasColors) {
      return;
    }

    const synced = syncVariantEntries(
      sizeInventoryEntries,
      colorInventoryEntries,
      variantInventoryEntries,
    );
    const formatted = formatVariantInventory(synced);

    if (formatted !== form.variantInventoryText) {
      setForm((current) => ({
        ...current,
        variantInventoryText: formatted,
      }));
    }
  }, [colorInventoryEntries, form.hasColors, form.hasSizes, form.variantInventoryText, sizeInventoryEntries, variantInventoryEntries]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const addSizeEntry = () => {
    const value = String(sizeDraft || "").trim();
    if (!value) {
      return;
    }

    if (sizeInventoryEntries.some((entry) => entry.size === value)) {
      setSizeDraft("");
      return;
    }

    setForm((current) => ({
      ...current,
      sizeInventoryText: formatSizeInventory([...sizeInventoryEntries, { size: value, stock: 0 }]),
    }));
    setSizeDraft("");
  };

  const addColorEntry = () => {
    const value = String(colorDraft || "").trim();
    if (!value) {
      return;
    }

    if (colorInventoryEntries.some((entry) => entry.color === value)) {
      setColorDraft("");
      return;
    }

    setForm((current) => ({
      ...current,
      colorInventoryText: formatColorInventory([...colorInventoryEntries, { color: value, stock: 0 }]),
    }));
    setColorDraft("");
  };

  const updateSizeEntry = (size, nextValue) => {
    setForm((current) => ({
      ...current,
      sizeInventoryText: formatSizeInventory(
        sizeInventoryEntries.map((entry) =>
          entry.size === size ? { ...entry, ...nextValue } : entry,
        ),
      ),
    }));
  };

  const updateColorEntry = (color, nextValue) => {
    setForm((current) => ({
      ...current,
      colorInventoryText: formatColorInventory(
        colorInventoryEntries.map((entry) =>
          entry.color === color ? { ...entry, ...nextValue } : entry,
        ),
      ),
    }));
  };

  const removeSizeEntry = (size) => {
    setForm((current) => ({
      ...current,
      sizeInventoryText: formatSizeInventory(
        sizeInventoryEntries.filter((entry) => entry.size !== size),
      ),
    }));
  };

  const removeColorEntry = (color) => {
    setForm((current) => ({
      ...current,
      colorInventoryText: formatColorInventory(
        colorInventoryEntries.filter((entry) => entry.color !== color),
      ),
    }));
  };

  const updateVariantStock = (size, color, stock) => {
    setForm((current) => ({
      ...current,
      variantInventoryText: formatVariantInventory(
        variantInventoryEntries.map((entry) =>
          entry.size === size && entry.color === color
            ? { ...entry, stock: Math.max(0, Number(stock || 0)) }
            : entry,
        ),
      ),
    }));
  };

  const updateColorImage = (color, image) => {
    setForm((current) => ({
      ...current,
      colorImageMap: {
        ...current.colorImageMap,
        [color]: image,
      },
    }));
  };

  const handleImageChange = async (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    try {
      const uploadedImages = await Promise.all(files.map((file) => optimizeImage(file)));

      setForm((current) => {
        const images = [...current.images, ...uploadedImages].filter(Boolean).slice(0, 6);
        return {
          ...current,
          images,
          image: images[0] || "",
        };
      });

      setError("");
    } catch {
      setError(t.imageRequired);
    }
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

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!sellerStore) {
      return;
    }

    if (!form.images.length) {
      setError(t.imageRequired);
      return;
    }

    if (form.hasSizes && !form.sizeMode) {
      setError(language === "ar" ? "اختر نوع المقاس أولاً." : "Choose the size type first.");
      return;
    }

    if (form.hasSizes && form.hasColors && !variantInventoryEntries.length) {
      setError(
        language === "ar"
          ? "أدخل مخزون كل تركيبة مقاس مع لون."
          : "Enter stock for each size and color combination.",
      );
      return;
    }

    const variantSummary =
      form.hasSizes && form.hasColors
        ? summarizeVariantInventory(variantInventoryEntries)
        : null;

    const payload = {
      ...form,
      image: form.images[0] || "",
      colorImageMap: form.hasColors
        ? Object.fromEntries(
            Object.entries(form.colorImageMap || {}).filter(
              ([color, image]) =>
                colorInventoryEntries.some((entry) => entry.color === color) &&
                form.images.includes(image),
            ),
          )
        : {},
      sizeMode: form.hasSizes ? form.sizeMode : "",
      sizeInventory: variantSummary?.sizeInventory || (form.hasSizes ? sizeInventoryEntries : []),
      sizeOptions: variantSummary?.sizeOptions || (form.hasSizes ? sizeInventoryEntries.map((entry) => entry.size) : []),
      colorInventory: variantSummary?.colorInventory || (form.hasColors ? colorInventoryEntries : []),
      colorOptions: variantSummary?.colorOptions || (form.hasColors ? colorInventoryEntries.map((entry) => entry.color) : []),
      variantInventory: form.hasSizes && form.hasColors ? variantInventoryEntries : [],
      price: Number(form.price),
      originalPrice: Number(form.originalPrice || 0),
      stock: variantSummary?.stock ?? totalStock,
      storeId: sellerStore.id,
    };

    if (editingId) {
      updateProduct(editingId, payload);
      setSavedMessage(t.productUpdatedSuccessfully);
    } else {
      addProduct(payload);
      setSavedMessage(t.productAddedSuccessfully);
    }

    setError("");
    setEditingId("");
    setForm(initialForm);
    setSizeDraft("");
    setColorDraft("");
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setError("");
    setSizeDraft("");
    setColorDraft("");
    setForm({
      name: product.name,
      category: product.category,
      hasSizes: Boolean(product.sizeOptions?.length),
      sizeMode: product.sizeMode || "",
      sizeInventoryText: Array.isArray(product.sizeInventory)
        ? product.sizeInventory.map((entry) => `${entry.size}=${entry.stock}`).join(", ")
        : "",
      hasColors: Boolean(product.colorOptions?.length),
      colorInventoryText: Array.isArray(product.colorInventory)
        ? product.colorInventory.map((entry) => `${entry.color}=${entry.stock}`).join(", ")
        : "",
      colorImageMap: product.colorImageMap || {},
      variantInventoryText: Array.isArray(product.variantInventory)
        ? product.variantInventory
            .map((entry) => `${entry.size}|${entry.color}=${entry.stock}`)
            .join(", ")
        : "",
      price: String(product.price),
      originalPrice: product.originalPrice ? String(product.originalPrice) : "",
      stock: String(product.stock),
      status: product.status,
      isNew: Boolean(product.isNew),
      description: product.description,
      image: product.image || "",
      images:
        Array.isArray(product.images) && product.images.length
          ? product.images
          : product.image
            ? [product.image]
            : [],
    });

    window.requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      nameInputRef.current?.focus();
    });
  };

  const cancelEdit = () => {
    setEditingId("");
    setError("");
    setSizeDraft("");
    setColorDraft("");
    setForm(initialForm);
  };

  const removeImageAtIndex = (imageIndex) => {
    setForm((current) => {
      const images = current.images.filter((_, index) => index !== imageIndex);
      const removedImage = current.images[imageIndex];
      const colorImageMap = Object.fromEntries(
        Object.entries(current.colorImageMap || {}).filter(([, image]) => image !== removedImage),
      );
      return {
        ...current,
        images,
        image: images[0] || "",
        colorImageMap,
      };
    });
  };

  const handleDelete = (productId) => {
    deleteProduct(productId);
    setSavedMessage(t.productDeletedSuccessfully);

    if (editingId === productId) {
      setEditingId("");
      setForm(initialForm);
    }
  };

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

  if (sellerStore.status !== "approved") {
    return (
      <section className="panel empty-state-panel">
        <div className="panel-header">
          <h2>{t.manageProducts}</h2>
        </div>
        <p className="settings-subtitle">
          {language === "ar"
            ? "لا يمكنك إضافة أو تعديل المنتجات حتى يوافق الأدمن على هذا المتجر."
            : "You cannot add or edit products until this store is approved by an admin."}
        </p>
      </section>
    );
  }

  return (
    <div className="dashboard-stack">
      <section className="panel" ref={formSectionRef}>
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
              ref={nameInputRef}
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

          <div className="product-checkbox-row">
            <label className="checkbox-label" htmlFor="product-has-sizes">
              <input
                id="product-has-sizes"
                name="hasSizes"
                type="checkbox"
                checked={form.hasSizes}
                onChange={handleChange}
              />
              <span>{language === "ar" ? "هذا المنتج له مقاسات" : "This product has sizes"}</span>
            </label>
          </div>

          {form.hasSizes ? (
            <>
              <div>
                <label htmlFor="product-size-mode">
                  {language === "ar" ? "نوع المقاس" : "Size type"}
                </label>
                <select
                  id="product-size-mode"
                  name="sizeMode"
                  value={form.sizeMode}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    {language === "ar" ? "اختر نوع المقاس" : "Choose size type"}
                  </option>
                  <option value="alpha">{language === "ar" ? "حروفي S/M/L" : "Alpha S/M/L"}</option>
                  <option value="numeric">
                    {language === "ar" ? "رقمي 36/38/40" : "Numeric 36/38/40"}
                  </option>
                </select>
              </div>

              <div className="seller-form-span inventory-builder">
                <div className="inventory-builder-header">
                  <strong>{language === "ar" ? "المقاسات المتوفرة" : "Available sizes"}</strong>
                  <p>
                    {language === "ar"
                      ? "أضف المقاسات بزر واضح، وإذا لم توجد ألوان ستدخل كمية كل مقاس هنا."
                      : "Add sizes with a clear button. If there are no colors, enter stock for each size here."}
                  </p>
                </div>
                <div className="inventory-builder-add">
                  <input
                    value={sizeDraft}
                    onChange={(event) => setSizeDraft(event.target.value)}
                    placeholder={form.sizeMode === "numeric" ? "42" : "M"}
                  />
                  <button className="secondary-button" type="button" onClick={addSizeEntry}>
                    {language === "ar" ? "إضافة مقاس" : "Add size"}
                  </button>
                </div>
                <div className="inventory-row-list">
                  {sizeInventoryEntries.map((entry) => (
                    <div key={entry.size} className="inventory-row-card">
                      <div className="inventory-row-fields">
                        <div>
                          <label>{language === "ar" ? "المقاس" : "Size"}</label>
                          <input
                            value={entry.size}
                            onChange={(event) =>
                              updateSizeEntry(entry.size, { size: event.target.value })
                            }
                          />
                        </div>
                        {!form.hasColors ? (
                          <div>
                            <label>{language === "ar" ? "الكمية" : "Stock"}</label>
                            <input
                              type="number"
                              min="0"
                              value={entry.stock}
                              onChange={(event) =>
                                updateSizeEntry(entry.size, { stock: event.target.value })
                              }
                            />
                          </div>
                        ) : null}
                      </div>
                      <div className="inventory-row-actions">
                        <button
                          className="secondary-button row-action danger-button"
                          type="button"
                          onClick={() => removeSizeEntry(entry.size)}
                        >
                          {language === "ar" ? "حذف" : "Remove"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          <div className="product-checkbox-row">
            <label className="checkbox-label" htmlFor="product-has-colors">
              <input
                id="product-has-colors"
                name="hasColors"
                type="checkbox"
                checked={form.hasColors}
                onChange={handleChange}
              />
              <span>{language === "ar" ? "هذا المنتج له ألوان" : "This product has colors"}</span>
            </label>
          </div>

          {form.hasColors ? (
            <>
              <div className="seller-form-span inventory-builder">
                <div className="inventory-builder-header">
                  <strong>{language === "ar" ? "الألوان المتوفرة" : "Available colors"}</strong>
                  <p>
                    {language === "ar"
                      ? "أضف الألوان المتوفرة. إذا كان المنتج له مقاسات سيظهر جدول جاهز للكميات."
                      : "Add the available colors. If the product has sizes, a ready stock matrix will appear."}
                  </p>
                </div>
                <div className="inventory-builder-add">
                  <input
                    value={colorDraft}
                    onChange={(event) => setColorDraft(event.target.value)}
                    placeholder={language === "ar" ? "أسود" : "Black"}
                  />
                  <button className="secondary-button" type="button" onClick={addColorEntry}>
                    {language === "ar" ? "إضافة لون" : "Add color"}
                  </button>
                </div>
                <div className="inventory-row-list">
                  {colorInventoryEntries.map((entry) => (
                    <div key={entry.color} className="inventory-row-card">
                      <div className="inventory-row-fields">
                        <div>
                          <label>{language === "ar" ? "اللون" : "Color"}</label>
                          <input
                            value={entry.color}
                            onChange={(event) =>
                              updateColorEntry(entry.color, { color: event.target.value })
                            }
                          />
                        </div>
                        {!form.hasSizes ? (
                          <div>
                            <label>{language === "ar" ? "الكمية" : "Stock"}</label>
                            <input
                              type="number"
                              min="0"
                              value={entry.stock}
                              onChange={(event) =>
                                updateColorEntry(entry.color, { stock: event.target.value })
                              }
                            />
                          </div>
                        ) : null}
                      </div>
                      <div className="inventory-row-actions">
                        <button
                          className="secondary-button row-action danger-button"
                          type="button"
                          onClick={() => removeColorEntry(entry.color)}
                        >
                          {language === "ar" ? "حذف" : "Remove"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {form.hasSizes && sizeInventoryEntries.length && colorInventoryEntries.length ? (
                <div className="seller-form-span inventory-builder">
                  <div className="inventory-builder-header">
                    <strong>
                      {language === "ar" ? "جدول الكميات حسب المقاس واللون" : "Stock matrix"}
                    </strong>
                    <p>
                      {language === "ar"
                        ? "أدخل كمية كل لون مع كل مقاس مباشرة من الجدول."
                        : "Fill in stock for each size and color directly from the grid."}
                    </p>
                  </div>
                  <div className="inventory-matrix-wrap">
                    <table className="inventory-matrix">
                      <thead>
                        <tr>
                          <th>{language === "ar" ? "اللون \\ المقاس" : "Color \\ Size"}</th>
                          {sizeInventoryEntries.map((entry) => (
                            <th key={entry.size}>{entry.size}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {colorInventoryEntries.map((colorEntry) => (
                          <tr key={colorEntry.color}>
                            <td>{colorEntry.color}</td>
                            {sizeInventoryEntries.map((sizeEntry) => {
                              const currentVariant = variantInventoryEntries.find(
                                (entry) =>
                                  entry.size === sizeEntry.size &&
                                  entry.color === colorEntry.color,
                              );

                              return (
                                <td key={`${colorEntry.color}-${sizeEntry.size}`}>
                                  <input
                                    type="number"
                                    min="0"
                                    value={currentVariant?.stock ?? 0}
                                    onChange={(event) =>
                                      updateVariantStock(
                                        sizeEntry.size,
                                        colorEntry.color,
                                        event.target.value,
                                      )
                                    }
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

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

          {form.hasSizes || form.hasColors ? (
            <div>
              <label>{language === "ar" ? "إجمالي المخزون" : "Total stock"}</label>
              <input value={totalStock} readOnly />
            </div>
          ) : (
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
          )}

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
            <label htmlFor="product-image">{t.productImage}</label>
            <div className="product-image-upload">
              <label className="secondary-button upload-trigger" htmlFor="product-image">
                {t.uploadImage}
              </label>
              <input
                id="product-image"
                type="file"
                accept="image/*"
                multiple
                className="hidden-file-input"
                onChange={handleImageChange}
              />
              {form.images.length ? (
                <button
                  className="secondary-button row-action danger-button"
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      image: "",
                      images: [],
                      colorImageMap: {},
                    }))
                  }
                >
                  {language === "ar" ? "حذف كل الصور" : "Remove all images"}
                </button>
              ) : null}
            </div>
          </div>

          {form.images.length ? (
            <div className="seller-form-span">
              <div className="product-image-preview-grid">
                {form.images.map((image, index) => (
                  <div
                    key={`${index}-${image.slice(0, 24)}`}
                    className="product-image-preview-card"
                  >
                    <img
                      className="product-image-preview"
                      src={image}
                      alt={form.name || `Product preview ${index + 1}`}
                    />
                    <div className="product-image-preview-actions">
                      {index === 0 ? (
                        <span className="status-pill active">
                          {language === "ar" ? "الرئيسية" : "Primary"}
                        </span>
                      ) : (
                        <button
                          className="secondary-button row-action"
                          type="button"
                          onClick={() =>
                            setForm((current) => {
                              const nextImages = [...current.images];
                              const [selectedImage] = nextImages.splice(index, 1);
                              nextImages.unshift(selectedImage);

                              return {
                                ...current,
                                images: nextImages,
                                image: nextImages[0] || "",
                              };
                            })
                          }
                        >
                          {language === "ar" ? "اجعلها رئيسية" : "Set as primary"}
                        </button>
                      )}
                      <button
                        className="secondary-button row-action danger-button"
                        type="button"
                        onClick={() => removeImageAtIndex(index)}
                      >
                        {t.removeImage}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {form.hasColors && colorInventoryEntries.length && form.images.length ? (
            <div className="seller-form-span inventory-builder">
              <div className="inventory-builder-header">
                <strong>{language === "ar" ? "تعيين صورة لكل لون" : "Assign an image to each color"}</strong>
                <p>
                  {language === "ar"
                    ? "اختر الصورة التي يجب أن تظهر للزبون عند الضغط على كل لون."
                    : "Choose which image should appear for shoppers when each color is selected."}
                </p>
              </div>
              <div className="inventory-row-list">
                {colorInventoryEntries.map((entry) => {
                  const selectedImage = form.colorImageMap?.[entry.color] || "";

                  return (
                    <div key={entry.color} className="inventory-row-card">
                      <div className="inventory-row-fields">
                        <div>
                          <label>{language === "ar" ? "اللون" : "Color"}</label>
                          <input value={entry.color} readOnly />
                        </div>
                        <div>
                          <label>{language === "ar" ? "صورة اللون" : "Color image"}</label>
                          <select
                            value={selectedImage}
                            onChange={(event) => updateColorImage(entry.color, event.target.value)}
                          >
                            <option value="">{language === "ar" ? "اختر صورة" : "Choose image"}</option>
                            {form.images.map((image, index) => (
                              <option key={`${entry.color}-${index}`} value={image}>
                                {language === "ar" ? `الصورة ${index + 1}` : `Image ${index + 1}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {selectedImage ? (
                        <img
                          className="product-image-preview"
                          src={selectedImage}
                          alt={`${entry.color} preview`}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
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
              <button
                className="secondary-button seller-save-button"
                type="button"
                onClick={cancelEdit}
              >
                {language === "ar" ? "إلغاء التعديل" : "Cancel editing"}
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
                <img className="product-thumb" src={product.image || "/logo.png"} alt={product.name} />
                <div className="stacked-cell">
                  <strong>{product.name}</strong>
                  <small>{product.category}</small>
                </div>
              </div>
              <span>{formatCurrency(product.price)}</span>
              <span>{product.stock}</span>
              <span className={`status-pill ${product.status}`}>{t[product.status]}</span>
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
                  {t.deleteProduct}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
