import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { IntroPage } from './pages/IntroPage';

// Блок 1
import { ConfigureStorePage } from './pages/block1/ConfigureStorePage';
import { CreateSlicePage } from './pages/block1/CreateSlicePage';
import { ActionsPreparePage } from './pages/block1/ActionsPreparePage';
import { PipelinePage } from './pages/block1/PipelinePage';

export function App(): JSX.Element {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<IntroPage />} />
        <Route path="/configure-store" element={<ConfigureStorePage />} />
        <Route path="/create-slice" element={<CreateSlicePage />} />
        <Route path="/actions-prepare" element={<ActionsPreparePage />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="*" element={<p>Страница ещё не готова.</p>} />
      </Route>
    </Routes>
  );
}
