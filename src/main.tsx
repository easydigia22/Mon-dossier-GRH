import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthGate } from './components/auth/AuthGate.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <AuthGate>
    {({ userEmail, role, onSignOut }) => <App userEmail={userEmail} role={role} onSignOut={onSignOut} />}
  </AuthGate>
);
