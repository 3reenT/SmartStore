import { useEffect, useState } from "react";
import { useApp } from "../../state/AppContext";
import { translations } from "../../i18n";

export default function AdminSettingsPage() {
  const { settings, saveSettings, language, setLanguage } = useApp();
  const t = translations[language];
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSubmit = (event) => {
    event.preventDefault();
    saveSettings(form);
    setLanguage(form.defaultLanguage === "Arabic" ? "ar" : "en");
    setSaved(true);
  };

  return (
    <section className="panel">
      <div className="settings-header">
        <h2>{t.settingsTitle}</h2>
        <p className="settings-subtitle">
          {saved ? t.savedSuccessfully : t.platformPreferences}
        </p>
      </div>

      <form className="admin-form-grid settings-form" onSubmit={handleSubmit}>
        <label className="field-block">
          <span>{t.settingsFieldPlatformName || t.platformName}</span>
          <input
            placeholder={t.platformName}
            value={form.platformName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                platformName: event.target.value,
              }))
            }
          />
        </label>
        <label className="field-block">
          <span>{t.settingsFieldSupportEmail || t.supportEmail}</span>
          <input
            type="email"
            placeholder={t.supportEmail}
            value={form.supportEmail}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                supportEmail: event.target.value,
              }))
            }
          />
        </label>
        <label className="field-block">
          <span>{t.settingsFieldDefaultLanguage || t.defaultLanguage}</span>
          <select
            value={form.defaultLanguage}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                defaultLanguage: event.target.value,
              }))
            }
          >
            <option value="English">{t.english}</option>
            <option value="Arabic">{t.arabic}</option>
          </select>
        </label>
        <div className="settings-actions">
          <button className="primary-button settings-save-button" type="submit">
            {t.saveSettings}
          </button>
        </div>
      </form>
    </section>
  );
}
