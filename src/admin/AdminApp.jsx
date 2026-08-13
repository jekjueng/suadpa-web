import { useState } from "react";
import AdminGuard from "./components/AdminGuard";
import AdminLayout from "./components/AdminLayout";
import AdminCategoriesPage from "./pages/AdminCategoriesPage";
import AdminChantsPage from "./pages/AdminChantsPage";

export default function AdminApp() {
  const [currentPage, setCurrentPage] = useState("categories");

  return (
    <AdminGuard>
      <AdminLayout currentPage={currentPage} onNavigate={setCurrentPage}>
        {currentPage === "categories" && <AdminCategoriesPage />}
        {currentPage === "chants"     && <AdminChantsPage />}
      </AdminLayout>
    </AdminGuard>
  );
}
