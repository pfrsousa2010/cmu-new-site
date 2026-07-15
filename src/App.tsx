import { Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { ToastProvider } from "./components/Toast";
import { AuthProvider } from "./hooks/useAuth";
import PublicLayout from "./components/PublicLayout";

import Home from "./pages/Home";
import Sobre from "./pages/Sobre";
import Projetos from "./pages/Projetos";
import Cursos from "./pages/Cursos";
import Eventos from "./pages/Eventos";
import Parceiros from "./pages/Parceiros";
import Editais from "./pages/Editais";
import Transparencia from "./pages/Transparencia";
import Doar from "./pages/Doar";
import Contato from "./pages/Contato";

import Login from "./pages/admin/Login";
import AdminLayout from "./pages/admin/AdminLayout";
import RequireAuth from "./pages/admin/RequireAuth";
import Dashboard from "./pages/admin/Dashboard";
import AdminEventos from "./pages/admin/AdminEventos";
import AdminArquivos from "./pages/admin/AdminArquivos";
import AdminCursos from "./pages/admin/AdminCursos";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ScrollToTop />
        <Routes>
          {/* Site público */}
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="sobre" element={<Sobre />} />
            <Route path="projetos" element={<Projetos />} />
            <Route path="cursos" element={<Cursos />} />
            <Route path="eventos" element={<Eventos />} />
            <Route path="parceiros" element={<Parceiros />} />
            <Route path="editais" element={<Editais />} />
            <Route path="transparencia" element={<Transparencia />} />
            <Route path="doar" element={<Doar />} />
            <Route path="contato" element={<Contato />} />
          </Route>

          {/* Admin */}
          <Route path="admin/login" element={<Login />} />
          <Route
            path="admin"
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="eventos" element={<AdminEventos />} />
            <Route path="arquivos" element={<AdminArquivos />} />
            <Route path="cursos" element={<AdminCursos />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
