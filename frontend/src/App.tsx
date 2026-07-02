/**
 * Root application component.
 *
 * Composes providers (React Query, AuthProvider, Router) and defines
 * the route table. Feature UI lives in src/features/* and
 * src/pages/* — this file should only ever wire things together.
 */
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/store/authStore";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import LoginPage from "@/features/auth/LoginPage";
import RegisterPage from "@/features/auth/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import { LeetCodeConnectPage } from "@/features/leetcode/LeetCodeConnectPage";
import { LeetCodeDashboardPage } from "@/features/leetcode/LeetCodeDashboardPage";
import { CodeforcesConnectPage } from "@/features/codeforces/CodeforcesConnectPage";
import { CodeforcesDashboardPage } from "@/features/codeforces/CodeforcesDashboardPage";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

            <Route path="/leetcode" element={<ProtectedRoute><LeetCodeDashboardPage /></ProtectedRoute>} />
            <Route path="/leetcode/connect" element={<ProtectedRoute><LeetCodeConnectPage /></ProtectedRoute>} />

            <Route path="/codeforces" element={<ProtectedRoute><CodeforcesDashboardPage /></ProtectedRoute>} />
            <Route path="/codeforces/connect" element={<ProtectedRoute><CodeforcesConnectPage /></ProtectedRoute>} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
