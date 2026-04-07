import { useEffect, useState } from "react";
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
};

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
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
  const sellerStores = stores.filter((store) => store.sellerId === currentUser?.id);
  const activeStoreId = sellerWorkspace[currentUser?.id]?.activeStoreId;
  const sellerStore =
    sellerStores.find((store) => store.id === activeStoreId) || sellerStores[0] || null;
  const sellerProducts = products.filter((product) => product.storeId === sellerStore?.id);
  const [editingId, setEditingId] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);

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
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const image = await readFileAsDataUrl(file);
      setForm((current) => ({ ...current, image }));
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

    if (!form.image) {
      setError(t.imageRequired);
      return;
    }

    const payload = {
      ...form,
      price: Number(form.price),
      originalPrice: Number(form.originalPrice || 0),
      stock: Number(form.stock),
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
  };

  const startEdit = (product) => {
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
      image: product.image || "",
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
                className="hidden-file-input"
                onChange={handleImageChange}
              />
              {form.image ? (
                <button
                  className="secondary-button row-action danger-button"
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, image: "" }))}
                >
                  {t.removeImage}
                </button>
              ) : null}
            </div>
          </div>

          {form.image ? (
            <div className="seller-form-span">
              <div className="product-image-preview-card">
                <img className="product-image-preview" src={form.image} alt={form.name || "Product preview"} />
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
                </div>
              </div>
              <span>{formatCurrency(product.price)}</span>
              <span>{product.stock}</span>
              <span className={`status-pill ${product.status}`}>{t[product.status]}</span>
              <div className="row-actions">
                <button className="secondary-button row-action" onClick={() => startEdit(product)}>
                  {t.editProduct}
                </button>
                <button
                  className="secondary-button row-action danger-button"
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
