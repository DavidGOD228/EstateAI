import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { Layout } from './shared/components/Layout';
import { NotFoundPage } from './routes/NotFoundPage';
import { HomePage } from './routes/HomePage';
import { PropertyDetailsPage } from './routes/PropertyDetailsPage';
import { CreatePage } from './routes/CreatePage';
import { LoginPage } from './routes/LoginPage';
import { RegisterPage } from './routes/RegisterPage';
import { ProfilePage } from './routes/ProfilePage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/properties/:id" element={<PropertyDetailsPage />} />
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreatePage />
            </ProtectedRoute>
          }
        />
        <Route path="/generate" element={<Navigate to="/create" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
