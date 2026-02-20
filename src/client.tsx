import React from 'react';
import { createRoot } from 'react-dom/client';
import DealMotivationDemoApp from './DealMotivationDemo';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<DealMotivationDemoApp />);
}
