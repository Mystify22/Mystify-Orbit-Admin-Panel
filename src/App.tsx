import { UploadProvider } from './context/UploadContext';
import { MainLayout } from './components/layout/MainLayout';

export function App() {
  return (
    <UploadProvider>
      <MainLayout />
    </UploadProvider>
  );
}

export default App;
