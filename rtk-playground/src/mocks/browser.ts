import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Service Worker перехватывает fetch на уровне браузера.
// Плюс в том, что запросы видны во вкладке Network как настоящие —
// это важно для страниц про дедупликацию и инвалидацию тегов RTK Query.
export const worker = setupWorker(...handlers);
