import { AppLayout } from '@/components/layout/AppLayout';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

function App() {
  return (
    <>
      <ThemeProvider />
      <AppLayout />
    </>
  );
}

export default App;
