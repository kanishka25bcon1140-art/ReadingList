import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Plus, Check, Bookmark, Loader, Trash2 } from 'lucide-react';

type Status = 'want' | 'reading' | 'finished';

interface Book {
  id: string;
  title: string;
  status: Status;
}

const STATUS_META: Record<
  Status,
  { label: string; icon: typeof Bookmark; badge: string; dot: string }
> = {
  want: {
    label: 'Want to Read',
    icon: Bookmark,
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  reading: {
    label: 'Reading',
    icon: Loader,
    badge: 'bg-sky-100 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
  },
  finished: {
    label: 'Finished',
    icon: Check,
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
};

const FILTERS: { key: Status | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'want', label: 'Want to Read' },
  { key: 'reading', label: 'Reading' },
  { key: 'finished', label: 'Finished' },
];

const STORAGE_KEY = 'reading-list-books';

function loadBooks(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (b) => b && typeof b.title === 'string' && b.status in STATUS_META
    );
  } catch {
    return [];
  }
}

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState('');
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [error, setError] = useState('');

  useEffect(() => {
    setBooks(loadBooks());
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  }, [books]);

  const visibleBooks = useMemo(() => {
    if (filter === 'all') return books;
    return books.filter((b) => b.status === filter);
  }, [books, filter]);

  const counts = useMemo(() => {
    const c = { all: books.length, want: 0, reading: 0, finished: 0 };
    for (const b of books) c[b.status]++;
    return c;
  }, [books]);

  function addBook(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Please enter a book title.');
      return;
    }
    if (trimmed.length > 60) {
      setError('Book title must be 60 characters or fewer.');
      return;
    }
    const normalized = trimmed.replace(/\s+/g, ' ').toLowerCase();
    if (books.some((b) => b.title.replace(/\s+/g, ' ').toLowerCase() === normalized)) {
      setError('This book is already in your reading list.');
      return;
    }
    setError('');
    setBooks((prev) => [
      { id: crypto.randomUUID(), title: trimmed, status: 'want' },
      ...prev,
    ]);
    setTitle('');
  }

  function changeStatus(id: string, status: Status) {
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  }

  function removeBook(id: string) {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-2xl px-4 py-4 sm:py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-800 text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight sm:text-xl">
                Reading List
              </h1>
              <p className="text-xs text-stone-500">
                Track the books you read
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        {/* Add form */}
        <form
          onSubmit={addBook}
          className="mb-6 flex flex-col gap-2 sm:flex-row sm:gap-3"
        >
          <div className="flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Book title…"
              className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-800 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-300/40"
            />
            {error && (
              <p className="mt-1.5 text-xs text-red-600">{error}</p>
            )}
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-stone-800 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-stone-900 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Add Book
          </button>
        </form>

        {/* Filters */}
        <div className="mb-5 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const count = counts[f.key];
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'border-stone-800 bg-stone-800 text-white'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                {f.label}
                <span
                  className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Summary */}
        {books.length > 0 && (
          <div className="mb-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-stone-200 bg-white p-3 text-center shadow-sm sm:p-4">
              <p className="text-2xl font-semibold text-stone-800 sm:text-3xl">
                {counts.all}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-stone-500 sm:text-xs">
                Total Books
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-3 text-center shadow-sm sm:p-4">
              <p className="text-2xl font-semibold text-sky-600 sm:text-3xl">
                {counts.reading}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-stone-500 sm:text-xs">
                Currently Reading
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-3 text-center shadow-sm sm:p-4">
              <p className="text-2xl font-semibold text-emerald-600 sm:text-3xl">
                {counts.finished}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-stone-500 sm:text-xs">
                Finished
              </p>
            </div>
          </div>
        )}

        {/* List / empty state */}
        {visibleBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-400">
              <BookOpen className="h-7 w-7" />
            </div>
            <p className="text-sm font-medium text-stone-600">
              Your reading list is empty. Add your first book.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {visibleBooks.map((book) => {
              const meta = STATUS_META[book.status];
              const Icon = meta.icon;
              return (
                <li
                  key={book.id}
                  className="group rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-stone-800">
                        {book.title}
                      </h3>
                      <span
                        className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.badge}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </span>
                    </div>
                    <button
                      onClick={() => removeBook(book.id)}
                      aria-label={`Delete ${book.title}`}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-stone-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(Object.keys(STATUS_META) as Status[]).map((s) => {
                      const active = book.status === s;
                      return (
                        <button
                          key={s}
                          onClick={() => changeStatus(book.id, s)}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                            active
                              ? 'bg-stone-100 text-stone-800 ring-1 ring-stone-200'
                              : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600'
                          }`}
                        >
                          {STATUS_META[s].label}
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

export default App;
