import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import FirebaseListener from './components/FirebaseListener';
import './index.css';
import { registerServiceWorker } from './utils/registerSW';

const InstallPrompt = React.lazy(() => import('./components/InstallPrompt'));

const Main = () => {
  return (
    <React.StrictMode>
      {/* The FirebaseListener handles all global state and background sync */}
      <FirebaseListener />
      <App />
      <React.Suspense fallback={null}>
        <InstallPrompt />
      </React.Suspense>
    </React.StrictMode>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);
root.render(<Main />);

registerServiceWorker();