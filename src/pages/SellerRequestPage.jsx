import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../state/AppContext";
import { translations } from "../i18n";

const initialSellerForm = {
  ownerName: "",
  storeName: "",
  email: "",
  password: "",
  contactEmail: "",
  contactPhone: "",
  category: "",
  city: "",
  address: "",
  description: "",
};

export default function SellerRequestPage() {
  const { language, registerSellerRequest } = useApp();
  const t = translations[language];
  const [sellerForm, setSellerForm] = useState(initialSellerForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSellerForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    const result = registerSellerRequest(sellerForm);

    if (!result.success) {
      setError(
        result.message === "This email is already registered."
          ? t.emailAlreadyRegistered
          : result.message,
      );
      return;
    }

    setSellerForm(initialSellerForm);
    setMessage(t.requestSubmitted);
  };

  return (
    <section className="auth-wrapper seller-request-page">
      <div className="page-shell-inner">
        <section className="panel seller-request-panel">
          <div className="panel-header">
            <div>
              <h2>{t.createSellerRequest}</h2>
              <p className="settings-subtitle">{t.sellerRequestBody}</p>
            </div>
            <Link className="secondary-button" to="/">
              {t.navHome}
            </Link>
          </div>

          {message ? <p className="success-text">{message}</p> : null}

          <form className="admin-form-grid seller-request-grid" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="ownerName">{t.ownerName}</label>
              <input id="ownerName" name="ownerName" value={sellerForm.ownerName} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="storeName">{t.storeName}</label>
              <input id="storeName" name="storeName" value={sellerForm.storeName} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="sellerEmail">{t.email}</label>
              <input id="sellerEmail" name="email" type="email" value={sellerForm.email} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="sellerPassword">{t.sellerPassword}</label>
              <input id="sellerPassword" name="password" type="password" value={sellerForm.password} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="contactEmail">{t.contactEmail}</label>
              <input id="contactEmail" name="contactEmail" type="email" value={sellerForm.contactEmail} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="contactPhone">{t.contactPhone}</label>
              <input id="contactPhone" name="contactPhone" value={sellerForm.contactPhone} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="category">{t.category}</label>
              <input id="category" name="category" value={sellerForm.category} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="city">{t.city}</label>
              <input id="city" name="city" value={sellerForm.city} onChange={handleChange} required />
            </div>
            <div className="seller-form-span">
              <label htmlFor="address">{t.storeAddress}</label>
              <input id="address" name="address" value={sellerForm.address} onChange={handleChange} required />
            </div>
            <div className="seller-form-span">
              <label htmlFor="description">{t.storeDescription}</label>
              <textarea id="description" name="description" rows="4" value={sellerForm.description} onChange={handleChange} required />
            </div>
            {error ? <p className="form-error seller-form-span">{error}</p> : null}
            <div className="seller-form-actions seller-form-span">
              <button className="primary-button seller-save-button" type="submit">
                {t.submitRequest}
              </button>
            </div>
          </form>
        </section>
      </div>
    </section>
  );
}
