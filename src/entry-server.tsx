import { renderToString } from 'react-dom/server';
import { StrictMode } from 'react';
import App from './App';
import { NotFound } from './components/NotFound';

export function render(page: 'home' | '404') {
  return renderToString(<StrictMode>{page === '404' ? <NotFound /> : <App />}</StrictMode>);
}
