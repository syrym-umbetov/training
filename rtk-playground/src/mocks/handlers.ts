import { http, HttpResponse, delay } from 'msw';
import { countRequest, db, type Post } from './db';

// Единая искусственная задержка. 800мс — специально много:
// без неё состояния 'pending' и isLoading мелькают быстрее, чем глаз успевает заметить,
// и половина демонстраций в этом стенде теряет смысл.
const LATENCY = 800;

export const handlers = [
  // --- Аутентификация: используется на страницах про thunk'и ---------------
  http.post('/api/login', async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as { username?: string; password?: string };

    // Валидация "по-серверному": возвращаем 400 со СТРУКТУРОЙ ошибки,
    // а не просто текстом. Именно эту структуру подхватывает rejectWithValue.
    const fieldErrors: Record<string, string> = {};
    if (!body.username) fieldErrors.username = 'Логин обязателен';
    if (!body.password) fieldErrors.password = 'Пароль обязателен';
    else if (body.password.length < 4) fieldErrors.password = 'Минимум 4 символа';

    if (Object.keys(fieldErrors).length > 0) {
      return HttpResponse.json(
        { message: 'Проверьте поля формы', fieldErrors, code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    if (body.password !== 'secret') {
      return HttpResponse.json(
        { message: 'Неверный логин или пароль', code: 'BAD_CREDENTIALS' },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      token: `token-${Math.random().toString(36).slice(2, 10)}`,
      user: { id: 1, name: body.username, email: `${body.username}@example.kz`, role: 'admin' },
    });
  }),

  // Эндпоинт, который ВСЕГДА падает необработанной ошибкой сервера.
  // Нужен, чтобы смотреть на action.error (там только message/stack/name).
  http.post('/api/login-boom', async () => {
    await delay(LATENCY);
    return HttpResponse.json({ message: 'Внутренняя ошибка сервера' }, { status: 500 });
  }),

  // --- Пользователи -------------------------------------------------------
  http.get('/api/users', async () => {
    await delay(LATENCY);
    countRequest('/api/users');
    return HttpResponse.json(db.users);
  }),

  http.get('/api/users/:id', async ({ params }) => {
    await delay(LATENCY);
    countRequest(`/api/users/${params.id}`);
    const user = db.users.find((u) => String(u.id) === params.id);
    if (!user) return HttpResponse.json({ message: 'Не найден' }, { status: 404 });
    return HttpResponse.json(user);
  }),

  // --- Посты: основа для RTK Query ----------------------------------------
  http.get('/api/posts', async ({ request }) => {
    await delay(LATENCY);
    const n = countRequest('/api/posts');
    const url = new URL(request.url);
    const author = url.searchParams.get('author');
    const list = author ? db.posts.filter((p) => p.author === author) : db.posts;
    // Отдаём "конвертное" представление — на странице transformResponse
    // будем срезать обёртку, чтобы компонент не знал про мета-поля.
    return HttpResponse.json({
      data: [...list].sort((a, b) => b.createdAt - a.createdAt),
      meta: { total: list.length, serverRequestNumber: n, generatedAt: new Date().toISOString() },
    });
  }),

  http.get('/api/posts/:id', async ({ params }) => {
    await delay(LATENCY);
    countRequest(`/api/posts/${params.id}`);
    const post = db.posts.find((p) => String(p.id) === params.id);
    if (!post) return HttpResponse.json({ message: 'Пост не найден' }, { status: 404 });
    return HttpResponse.json(post);
  }),

  http.post('/api/posts', async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as { title: string; body: string };
    if (!body.title?.trim()) {
      return HttpResponse.json(
        { message: 'Заголовок обязателен', fieldErrors: { title: 'Заполните заголовок' } },
        { status: 400 },
      );
    }
    const post: Post = {
      id: db.nextPostId++,
      title: body.title,
      body: body.body || '',
      likes: 0,
      author: 'Сырым',
      createdAt: Date.now(),
    };
    db.posts.unshift(post);
    return HttpResponse.json(post, { status: 201 });
  }),

  http.patch('/api/posts/:id', async ({ params, request }) => {
    await delay(LATENCY);
    const patch = (await request.json()) as Partial<Post>;
    const post = db.posts.find((p) => String(p.id) === params.id);
    if (!post) return HttpResponse.json({ message: 'Пост не найден' }, { status: 404 });
    Object.assign(post, patch);
    return HttpResponse.json(post);
  }),

  http.delete('/api/posts/:id', async ({ params }) => {
    await delay(LATENCY);
    db.posts = db.posts.filter((p) => String(p.id) !== params.id);
    return HttpResponse.json({ id: Number(params.id) });
  }),

  // Лайк с УПРАВЛЯЕМЫМ отказом: ?fail=1 → 500.
  // Ровно этот эндпоинт нужен для оптимистичных апдейтов: пользователь жмёт лайк,
  // UI меняется мгновенно, а на 500 мы должны увидеть откат своими глазами.
  http.post('/api/posts/:id/like', async ({ params, request }) => {
    await delay(LATENCY);
    const url = new URL(request.url);
    if (url.searchParams.get('fail') === '1') {
      return HttpResponse.json({ message: 'Сервер не принял лайк' }, { status: 500 });
    }
    const post = db.posts.find((p) => String(p.id) === params.id);
    if (!post) return HttpResponse.json({ message: 'Пост не найден' }, { status: 404 });
    post.likes += 1;
    return HttpResponse.json(post);
  }),

  // --- Эндпоинт со случайным падением -------------------------------------
  // Примерно в половине случаев отдаёт 500. Нужен, чтобы ловить ошибки
  // "естественным" путём и видеть, как ведёт себя retry/refetch.
  http.get('/api/flaky', async () => {
    await delay(LATENCY);
    const n = countRequest('/api/flaky');
    if (Math.random() < 0.5) {
      return HttpResponse.json(
        { message: 'Упс, сервер прилёг', code: 'FLAKY_500', attempt: n },
        { status: 500 },
      );
    }
    return HttpResponse.json({ ok: true, attempt: n, at: new Date().toISOString() });
  }),

  // --- Медленный поиск для демонстрации отмены и дебаунса -----------------
  http.get('/api/search', async ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') ?? '';
    // Тут задержка больше: нужно успеть нажать "Отменить" до прихода ответа.
    await delay(2000);
    countRequest('/api/search');
    const found = db.posts.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()));
    return HttpResponse.json({ q, results: found.slice(0, 5) });
  }),

  // --- Большой список для createEntityAdapter -----------------------------
  http.get('/api/items', async ({ request }) => {
    await delay(LATENCY);
    const url = new URL(request.url);
    const count = Number(url.searchParams.get('count') ?? 1000);
    return HttpResponse.json(
      Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        name: `Элемент ${i + 1}`,
        value: Math.round(Math.random() * 1000),
        done: false,
      })),
    );
  }),
];
