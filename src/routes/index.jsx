import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { AppLayout } from "@/app/AppLayout";
import { useAuth } from "@/hooks/useAuth";

import { LandingPage } from "@/features/landing/LandingPage";

import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";

import { StudentDashboard } from "@/features/dashboard/StudentDashboard";
import { LibrarianDashboard } from "@/features/dashboard/LibrarianDashboard";

import { BookCatalog } from "@/features/books/BookCatalog";
import { BookDetail } from "@/features/books/BookDetail";
import { MyLoans } from "@/features/books/MyLoans";
import { StudentReservations } from "@/features/books/StudentReservations";

import { NotificationsPage } from "@/features/notifications/NotificationsPage";
import { StudentProfile } from "@/features/profile/StudentProfile";

import { Settings } from "@/features/settings";
import { Analytics } from "@/features/librarian/Analytics";

import { LibrarianInventory } from "@/features/librarian/LibrarianInventory";
import { LibrarianCirculation } from "@/features/librarian/LibrarianCirculation";
import { StudentDirectory } from "@/features/librarian/StudentDirectory";
import { FinesManagement } from "@/features/librarian/FinesManagement";
import { LibrarianReservations } from "@/features/librarian/LibrarianReservations";

function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();

  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === "student") {
      return <Navigate to="/student/dashboard" replace />;
    }

    if (role === "librarian") {
      return <Navigate to="/librarian/dashboard" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/register" element={<RegisterPage />} />

        {/* =========================
            STUDENT
        ========================== */}

        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/catalog"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <BookCatalog />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/catalog/:id"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <BookDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/loans"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <MyLoans />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/reservations"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentReservations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/settings"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* =========================
            SHARED AUTHENTICATED
        ========================== */}

        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={["student", "librarian"]}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["student", "librarian"]}>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* =========================
            LIBRARIAN
        ========================== */}

        <Route
          path="/librarian/dashboard"
          element={
            <ProtectedRoute allowedRoles={["librarian"]}>
              <LibrarianDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/librarian/inventory"
          element={
            <ProtectedRoute allowedRoles={["librarian"]}>
              <LibrarianInventory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/librarian/circulation"
          element={
            <ProtectedRoute allowedRoles={["librarian"]}>
              <LibrarianCirculation />
            </ProtectedRoute>
          }
        />

        <Route
          path="/librarian/students"
          element={
            <ProtectedRoute allowedRoles={["librarian"]}>
              <StudentDirectory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/librarian/reservations"
          element={
            <ProtectedRoute allowedRoles={["librarian"]}>
              <LibrarianReservations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/librarian/fines"
          element={
            <ProtectedRoute allowedRoles={["librarian"]}>
              <FinesManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/librarian/analytics"
          element={
            <ProtectedRoute allowedRoles={["librarian"]}>
              <Analytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/librarian/profile"
          element={
            <ProtectedRoute allowedRoles={["librarian"]}>
              <StudentProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/librarian/settings"
          element={
            <ProtectedRoute allowedRoles={["librarian"]}>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
