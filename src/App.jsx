import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import CustomerCartPage from "./pages/CustomerCartPage";
import CustomerFavoritesPage from "./pages/CustomerFavoritesPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import PublicProductPage from "./pages/PublicProductPage";
import PublicStorePage from "./pages/PublicStorePage";
import SellerRequestPage from "./pages/SellerRequestPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverviewPage from "./pages/admin/AdminOverviewPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminStoresPage from "./pages/admin/AdminStoresPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import SellerLayout from "./pages/seller/SellerLayout";
import SellerOverviewPage from "./pages/seller/SellerOverviewPage";
import SellerStorePage from "./pages/seller/SellerStorePage";
import SellerStoreSettingsPage from "./pages/seller/SellerStoreSettingsPage";
import SellerProductsPage from "./pages/seller/SellerProductsPage";
import SellerOrdersPage from "./pages/seller/SellerOrdersPage";
import SellerInventoryPage from "./pages/seller/SellerInventoryPage";
import SellerAnalyticsPage from "./pages/seller/SellerAnalyticsPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/store/:slug" element={<PublicStorePage />} />
        <Route path="/store/:slug/product/:productId" element={<PublicProductPage />} />
        <Route path="/seller-request" element={<SellerRequestPage />} />
        <Route path="/store/:slug/cart" element={<CustomerCartPage />} />
        <Route path="/store/:slug/favorites" element={<CustomerFavoritesPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverviewPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="stores" element={<AdminStoresPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
        <Route
          path="/seller"
          element={
            <ProtectedRoute allowedRoles={["seller"]}>
              <SellerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SellerOverviewPage />} />
          <Route path="store" element={<SellerStorePage />} />
          <Route path="store/:storeId" element={<SellerStoreSettingsPage />} />
          <Route path="products" element={<SellerProductsPage />} />
          <Route path="orders" element={<SellerOrdersPage />} />
          <Route path="inventory" element={<SellerInventoryPage />} />
          <Route path="analytics" element={<SellerAnalyticsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
