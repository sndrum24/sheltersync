import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import PageNotFound from "./lib/PageNotFound";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Animals from "@/pages/Animals";
import AddAnimal from "@/pages/AddAnimal";
import AnimalDetail from "@/pages/AnimalDetail";
import ShelterSetup from "@/pages/ShelterSetup";
import CalendarPage from "@/pages/CalendarPage";
import BreedResources from "@/pages/BreedResources";
import Reports from "@/pages/Reports";
import Login from "@/pages/Login";
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>

          {/* AUTH + APP SHELL */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/animals" element={<Animals />} />
            <Route path="/animals/new" element={<AddAnimal />} />
            <Route path="/animals/:id" element={<AnimalDetail />} />
            <Route path="/shelters" element={<ShelterSetup />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/breed-resources" element={<BreedResources />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

          {/* AUTH PAGES */}
          <Route path="/login" element={<Login />} />

          {/* FALLBACK */}
          <Route path="*" element={<PageNotFound />} />

        </Routes>

        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;