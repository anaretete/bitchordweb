import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './main.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find root element');
}

// Dynamically resolve basename:
// If hosted under /bitchordweb (e.g. GitHub Pages), use '/bitchordweb'.
// If hosted on Netlify, root domain, or localhost ('/'), use '/'.
const isGitHubPages = typeof window !== 'undefined' && window.location.pathname.startsWith('/bitchordweb');
const basename = isGitHubPages ? '/bitchordweb' : '/';

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

