import '@fontsource-variable/albert-sans/wght.css';
import './styles.css';
import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import { NotFound } from './components/NotFound';

const root = document.getElementById('root')!;
const page = <StrictMode>{root.dataset.page === '404' ? <NotFound /> : <App />}</StrictMode>;

if (root.firstElementChild) hydrateRoot(root, page);
else createRoot(root).render(page);

if (root.dataset.page === '404') window.__ready = true;
