import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.tsx';
import { IntroPage } from './pages/IntroPage.tsx';
import { LessonPage } from './pages/LessonPage.tsx';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<IntroPage />} />
        <Route path="lesson/:slug" element={<LessonPage />} />
        <Route path="*" element={<IntroPage />} />
      </Route>
    </Routes>
  );
}
