import React from 'react';
import App from '../App';
import { AuthGate } from '../components/auth/AuthGate';

/**
 * Monte l'application SimulRH existante telle quelle (authentification comprise).
 * Servie sous /app par le routeur du portail, sans aucune modification de l'app.
 */
export const LegacyAppMount: React.FC = () => (
  <AuthGate>
    {({ userEmail, role, onSignOut }) => <App userEmail={userEmail} role={role} onSignOut={onSignOut} />}
  </AuthGate>
);
