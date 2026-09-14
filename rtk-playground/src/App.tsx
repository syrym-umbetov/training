import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { IntroPage } from './pages/IntroPage';

// Блок 1
import { ConfigureStorePage } from './pages/block1/ConfigureStorePage';
import { CreateSlicePage } from './pages/block1/CreateSlicePage';
import { ActionsPreparePage } from './pages/block1/ActionsPreparePage';
import { PipelinePage } from './pages/block1/PipelinePage';

// Блок 2
import { RawThunkPage } from './pages/block2/RawThunkPage';
import { CreateAsyncThunkPage } from './pages/block2/CreateAsyncThunkPage';
import { ExtraReducersPage } from './pages/block2/ExtraReducersPage';
import { ThunkApiPage } from './pages/block2/ThunkApiPage';
import { RejectWithValuePage } from './pages/block2/RejectWithValuePage';
import { ConditionPage } from './pages/block2/ConditionPage';
import { UnwrapPage } from './pages/block2/UnwrapPage';

// Блок 3
import { UseSelectorPage } from './pages/block3/UseSelectorPage';
import { CreateSelectorPage } from './pages/block3/CreateSelectorPage';
import { ShallowEqualPage } from './pages/block3/ShallowEqualPage';
import { UseStorePage } from './pages/block3/UseStorePage';

// Блок 4
import { EntityAdapterPage } from './pages/block4/EntityAdapterPage';
import { CrossSlicePage } from './pages/block4/CrossSlicePage';
import { MatchersPage } from './pages/block4/MatchersPage';

// Блок 5
import { RtkqSetupPage } from './pages/block5/RtkqSetupPage';
import { QueryPage } from './pages/block5/QueryPage';
import { MutationPage } from './pages/block5/MutationPage';
import { TagsPage } from './pages/block5/TagsPage';
import { OptimisticPage } from './pages/block5/OptimisticPage';
import { CacheLifePage } from './pages/block5/CacheLifePage';
import { TransformPage } from './pages/block5/TransformPage';

// Блок 6
import { CustomMiddlewarePage } from './pages/block6/CustomMiddlewarePage';
import { ListenerPage } from './pages/block6/ListenerPage';
import { TypingPage } from './pages/block6/TypingPage';
import { ProviderPage } from './pages/block6/ProviderPage';
import { PersistencePage } from './pages/block6/PersistencePage';
import { CodeSplittingPage } from './pages/block6/CodeSplittingPage';
import { TestingPage } from './pages/block6/TestingPage';

// Итоги
import { CheatsheetPage } from './pages/CheatsheetPage';
import { InterviewPage } from './pages/InterviewPage';

export function App(): JSX.Element {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<IntroPage />} />
        <Route path="/configure-store" element={<ConfigureStorePage />} />
        <Route path="/create-slice" element={<CreateSlicePage />} />
        <Route path="/actions-prepare" element={<ActionsPreparePage />} />
        <Route path="/pipeline" element={<PipelinePage />} />

        <Route path="/raw-thunk" element={<RawThunkPage />} />
        <Route path="/create-async-thunk" element={<CreateAsyncThunkPage />} />
        <Route path="/extra-reducers" element={<ExtraReducersPage />} />
        <Route path="/thunk-api" element={<ThunkApiPage />} />
        <Route path="/reject-with-value" element={<RejectWithValuePage />} />
        <Route path="/condition" element={<ConditionPage />} />
        <Route path="/unwrap" element={<UnwrapPage />} />

        <Route path="/use-selector" element={<UseSelectorPage />} />
        <Route path="/create-selector" element={<CreateSelectorPage />} />
        <Route path="/shallow-equal" element={<ShallowEqualPage />} />
        <Route path="/use-store" element={<UseStorePage />} />

        <Route path="/entity-adapter" element={<EntityAdapterPage />} />
        <Route path="/cross-slice" element={<CrossSlicePage />} />
        <Route path="/matchers" element={<MatchersPage />} />

        <Route path="/rtkq-setup" element={<RtkqSetupPage />} />
        <Route path="/rtkq-query" element={<QueryPage />} />
        <Route path="/rtkq-mutation" element={<MutationPage />} />
        <Route path="/rtkq-tags" element={<TagsPage />} />
        <Route path="/rtkq-optimistic" element={<OptimisticPage />} />
        <Route path="/rtkq-cache-life" element={<CacheLifePage />} />
        <Route path="/rtkq-transform" element={<TransformPage />} />

        <Route path="/custom-middleware" element={<CustomMiddlewarePage />} />
        <Route path="/listener-middleware" element={<ListenerPage />} />
        <Route path="/typing" element={<TypingPage />} />
        <Route path="/provider" element={<ProviderPage />} />
        <Route path="/persistence" element={<PersistencePage />} />
        <Route path="/code-splitting" element={<CodeSplittingPage />} />
        <Route path="/testing" element={<TestingPage />} />

        <Route path="/cheatsheet" element={<CheatsheetPage />} />
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="*" element={<p>Страница ещё не готова.</p>} />
      </Route>
    </Routes>
  );
}
