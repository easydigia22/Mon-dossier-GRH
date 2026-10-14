/** Aperçu design (dev) : monte l'app complète en mode local, sans connexion. */
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);
