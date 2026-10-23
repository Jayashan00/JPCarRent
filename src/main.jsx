import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import App from './App';
import './styles/base.css';
import './styles/site.css';
import './styles/dash.css';

// The single-file preview build runs inside a viewer that cannot use real URLs,
// so it keeps routes in memory. The normal (Vercel) build uses real URLs.
const Router = __SINGLE__ ? MemoryRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
