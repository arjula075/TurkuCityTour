// TurkuCityTour/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './store/store';
import './styles/forms.css';
import './styles/mobile.css';
import 'leaflet/dist/leaflet.css';
import { initNativeShell } from './utils/initNativeShell';

initNativeShell();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
      <Provider store={store}>
          <App />
      </Provider>
  </React.StrictMode>
);