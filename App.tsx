
import React, { useState } from 'react';
import AppRouter from './routes/AppRouter.tsx';
import { QuickSaleButton } from './components/quick-sale/QuickSaleButton.tsx';
import { QuickSaleModal } from './components/quick-sale/QuickSaleModal.tsx';
import { ErrorBoundary } from './components/shared/ErrorBoundary.tsx';

const App: React.FC = () => {
  const [isQuickSaleOpen, setQuickSaleOpen] = useState(false);

  return (
    <div className="antialiased text-slate-800">
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
      <QuickSaleButton onClick={() => setQuickSaleOpen(true)} />
      <QuickSaleModal isOpen={isQuickSaleOpen} onClose={() => setQuickSaleOpen(false)} />
    </div>
  );
};

export default App;
