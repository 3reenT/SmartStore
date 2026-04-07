import { useMemo, useState } from "react";
import { useApp } from "../../state/AppContext";
import { translations } from "../../i18n";

const emptyForm = {
  name: "",
  email: "",
  password: "",
};

export default function AdminUsersPage() {
  const { users, addUser, language } = useApp();
  const t = translations[language];
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  const adminUsers = useMemo(() => {
    return users.filter((user) => user.role === "admin");
  }, [users]);

  const filteredAdmins = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return adminUsers;

    return adminUsers.filter((user) =>
      `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(value),
    );
  }, [search, adminUsers]);

  const handleSubmit = (event) => {
    event.preventDefault();
    addUser({ ...form, role: "admin" });
    setForm(emptyForm);
    setMessage(t.adminAddedSuccessfully);
  };

  return (
    <div className="dashboard-stack">
      <section className="panel">
        <div className="panel-header">
          <h2>{t.admins}</h2>
          <div className="panel-tools">
            {message ? <span className="success-text">{message}</span> : null}
            <input
              className="table-filter"
              placeholder={t.searchAdmins}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="table-like">
          <div className="table-row table-head admin-users-grid">
            <span>{t.name}</span>
            <span>{t.email}</span>
            <span>{t.status}</span>
          </div>

          {filteredAdmins.map((user) => (
            <div key={user.id} className="table-row admin-users-grid">
              <span className="stacked-cell">
                <strong>{user.name}</strong>
                <small>{t.id}: {user.id}</small>
              </span>
              <span>{user.email}</span>
              <span className={`status-pill ${user.status}`}>
                {t[user.status] || user.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>{t.addAdmin}</h2>
          <span>{t.createsNewAdministrator}</span>
        </div>

        <form className="admin-form-grid" onSubmit={handleSubmit}>
          <input
            placeholder={t.fullName}
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            required
          />
          <input
            type="email"
            placeholder={t.email}
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            required
          />
          <input
            type="password"
            placeholder={t.adminPassword}
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
            required
          />
          <button className="primary-button" type="submit">
            {t.addAdmin}
          </button>
        </form>
      </section>
    </div>
  );
}
