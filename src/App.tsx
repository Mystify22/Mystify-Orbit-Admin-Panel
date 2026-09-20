import { AuthProvider, useAuth } from './context/AuthContext';
import { UploadProvider } from './context/UploadContext';
import { LoginPage } from './components/auth/LoginPage';
import { MainLayout } from './components/layout/MainLayout';
import { ToastContainer } from './components/common/Toast';

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <ToastContainer />
      </>
    );
  }

  return <MainLayout />;
}

export function App() {
  return (
    <UploadProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </UploadProvider>
  );
}

export default App;
