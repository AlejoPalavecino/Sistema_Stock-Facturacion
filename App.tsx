
import React, { useState } from 'react';
import AppRouter from '@/routes/AppRouter';
import { QuickSaleButton } from '@/components/quick-sale/QuickSaleButton';
import { QuickSaleModal } from '@/components/quick-sale/QuickSaleModal';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

const App: React.FC = () => {
  const [isQuickSaleOpen, setQuickSaleOpen] = useState(false);

  return (
    <div className="antialiased text-slate-700">
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
      <QuickSaleButton onClick={() => setQuickSaleOpen(true)} />
      <QuickSaleModal isOpen={isQuickSaleOpen} onClose={() => setQuickSaleOpen(false)} />
    </div>
  );
};

export default App;
