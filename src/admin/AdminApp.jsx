import { useState } from "react";
import AdminGuard from "./components/AdminGuard";
import AdminLayout from "./components/AdminLayout";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminCategoriesPage from "./pages/AdminCategoriesPage";
import AdminChantsPage from "./pages/AdminChantsPage";
import AdminBroadcastPage from "./pages/AdminBroadcastPage";
import AdminUsersPage from "./pages/AdminUsersPage";

export default function AdminApp() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  return (
    <AdminGuard>
      <AdminLayout currentPage={currentPage} onNavigate={setCurrentPage}>
        {currentPage === "dashboard"  && <AdminDashboardPage />}
        {currentPage === "categories" && <AdminCategoriesPage />}
        {currentPage === "chants"     && <AdminChantsPage />}
        {currentPage === "broadcast"  && <AdminBroadcastPage />}
        {currentPage === "users"      && <AdminUsersPage />}
      </AdminLayout>
    </AdminGuard>
  );
}
