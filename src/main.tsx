import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthGate } from './components/auth/AuthGate.tsx';
import { PwaUpdatePrompt } from './components/common/PwaUpdatePrompt.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <>
    <AuthGate>
      {({ userEmail, role, onSignOut }) => <App userEmail={userEmail} role={role} onSignOut={onSignOut} />}
    </AuthGate>
    <PwaUpdatePrompt />
  </>
);
