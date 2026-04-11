import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../state/AppContext";

export default function ProtectedRoute({ allowedRoles, children }) {
  const { currentUser } = useApp();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
