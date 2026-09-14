import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './app/store';
import { App } from './App';
import './styles/global.css';

// MSW стартуем ДО первого рендера: если начать рендерить раньше,
// первые запросы улетят в настоящую сеть и получат 404 от dev-сервера.
async function bootstrap(): Promise<void> {
  const { worker } = await import('./mocks/browser');
  await worker.start({
    // Запросы к самому Vite (модули, HMR) не трогаем — иначе консоль
    // зальёт предупреждениями о неперехваченных запросах.
    onUnhandledRequest: 'bypass',
    quiet: false,
  });

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {/* Provider кладёт store в React-контекст. Через контекст едет ТОЛЬКО
          сам объект store — он никогда не меняется, поэтому контекст никогда
          не «пересылает» новое значение и сам по себе ререндеров не вызывает.
          Подписка на изменения — прямая: useSelector вызывает store.subscribe(). */}
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </StrictMode>,
  );
}

void bootstrap();
