import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PortalApp } from './portal/PortalApp.tsx';
import { PwaUpdatePrompt } from './components/common/PwaUpdatePrompt.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <PortalApp />
    <PwaUpdatePrompt />
  </BrowserRouter>
);
