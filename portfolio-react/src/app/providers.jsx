import { LanguageProvider } from '@/context/LanguageContext.jsx';
import { DataProvider } from '@/context/DataContext.jsx';

/** Composición central de providers (fácil de extender: theme, router, etc.). */
export function AppProviders({ children }) {
  return (
    <LanguageProvider>
      <DataProvider>{children}</DataProvider>
    </LanguageProvider>
  );
}
