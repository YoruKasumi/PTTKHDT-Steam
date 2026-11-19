import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ShopProvider } from './context/ShopContext';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ShopProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ShopProvider>
  </React.StrictMode>,
);
