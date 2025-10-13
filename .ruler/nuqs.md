# nuqs Best Practices Guide

**Last Updated:** January 2025  
**nuqs Version:** 2.7+

---

## TL;DR

**Don't manually manage URL search params.** Use **nuqs** for type-safe URL state management. It's like `useState`, but stored in the URL.

1. **URL state with nuqs** → Replace `useState` + manual URL manipulation with `useQueryState`. ([nuqs docs][1])
2. **Type-safe parsers** → Use built-in parsers (`parseAsInteger`, `parseAsStringLiteral`) for validation. ([Parsers][2])
3. **No manual URL construction** → nuqs handles serialization/deserialization automatically. ([Basic usage][3])
4. **Adapter setup** → Wrap your app with `NuqsAdapter` for your framework. ([Adapters][4])

---

## Why nuqs?

React's own guidance emphasizes treating URL as first-class state and avoiding manual URL synchronization. nuqs aligns perfectly with this by providing:

- **Type-safe URL state** → Like `useState`, but in the URL with full TypeScript support
- **Automatic serialization** → No manual URLSearchParams construction
- **Built-in parsers** → Handle primitives, dates, arrays, JSON, and custom types
- **Framework integration** → Works with Next.js, Remix, React Router, TanStack Router
- **No effects needed** → Direct state management without useEffect synchronization

---

## What to use instead of manual URL management

| If you were doing…                                          | Use nuqs instead                                                                                                           |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Manual URL construction with URLSearchParams**           | `useQueryState` with appropriate parser. ([nuqs][1])                                                                      |
| **useState + useEffect to sync with URL**                  | `useQueryState` directly—no effects needed. ([Basic usage][3])                                                            |
| **searchParams.get() + type conversion**                   | Built-in parsers: `parseAsInteger`, `parseAsBoolean`, etc. ([Parsers][2])                                                 |
| **Multiple search params management**                      | `useQueryStates` with object of parsers. ([nuqs docs][1])                                                                 |
| **String unions ("asc" \| "desc")**                        | `parseAsStringLiteral(["asc", "desc"])` for type safety. ([Literals][5])                                                  |
| **Arrays in URL (e.g., ?tag=a&tag=b&tag=c)**              | `parseAsNativeArrayOf(parseAsString)` for native arrays. ([Arrays][6])                                                    |
| **Complex objects in URL**                                 | `parseAsJson(zodSchema)` for validated JSON. ([JSON][7])                                                                  |
| **router.push() with search params**                       | `setQueryState(value)` handles navigation automatically. ([Basic usage][3])                                               |

---

## Core Patterns

### 1) Basic URL State Management

**Before (Manual URL Management):**
```tsx
// ❌ BAD: Manual URL management
import { useRouter, useSearchParams } from "next/navigation";

function SearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const updateQuery = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    router.push(`?${params.toString()}`);
  };

  return <input value={query} onChange={(e) => updateQuery(e.target.value)} />;
}
```

**After (nuqs):**
```tsx
// ✅ GOOD: Direct URL state with nuqs
import { useQueryState } from "nuqs";

function SearchBox() {
  const [query, setQuery] = useQueryState("q", { defaultValue: "" });

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

**Why better:** 
- No manual URLSearchParams construction
- Automatic URL updates
- Clear intent
- Less code

---

### 2) Type-Safe State with Parsers

**Before (Runtime Type Conversion):**
```tsx
// ❌ BAD: Manual parsing and type conversion
const searchParams = useSearchParams();
const page = Number(searchParams.get("page")) || 1; // Type: number, but could be NaN
const sort = searchParams.get("sort") as "asc" | "desc" | null; // No runtime validation
```

**After (nuqs with Parsers):**
```tsx
// ✅ GOOD: Type-safe with runtime validation
import { useQueryState, parseAsInteger, parseAsStringLiteral } from "nuqs";

const [page, setPage] = useQueryState(
  "page",
  parseAsInteger.withDefault(1) // Type: number
);

const [sort, setSort] = useQueryState(
  "sort",
  parseAsStringLiteral(["asc", "desc"] as const).withDefault("asc") // Type: "asc" | "desc"
);
```

**Why better:**
- Runtime validation ensures type safety
- Invalid values fall back to default
- TypeScript infers correct types
- No NaN edge cases

---

### 3) Multiple Search Params

**Before (Managing Multiple Params):**
```tsx
// ❌ BAD: Managing multiple params separately
const searchParams = useSearchParams();
const router = useRouter();

const updateFilters = (key: string, value: string) => {
  const params = new URLSearchParams(searchParams.toString());
  params.set(key, value);
  router.push(`?${params.toString()}`);
};

const category = searchParams.get("category");
const minPrice = Number(searchParams.get("minPrice")) || 0;
const inStock = searchParams.get("inStock") === "true";
```

**After (nuqs with useQueryStates):**
```tsx
// ✅ GOOD: Manage multiple params together
import { useQueryStates, parseAsString, parseAsInteger, parseAsBoolean } from "nuqs";

const [filters, setFilters] = useQueryStates({
  category: parseAsString,
  minPrice: parseAsInteger.withDefault(0),
  inStock: parseAsBoolean.withDefault(false),
});

// Update single param
setFilters({ category: "electronics" });

// Update multiple params at once
setFilters({ minPrice: 100, inStock: true });
```

**Why better:**
- Single hook for all params
- Batch updates for better performance
- Type-safe access to all filters
- Atomic URL updates

---

### 4) String Literals for Type Safety

**Before (Unsafe String Unions):**
```tsx
// ❌ BAD: No runtime validation
type SortOrder = "asc" | "desc";
const sort = searchParams.get("sort") as SortOrder; // Could be anything!

// User navigates to ?sort=invalid → TypeScript thinks it's "asc" | "desc", but it's not
```

**After (nuqs with String Literals):**
```tsx
// ✅ GOOD: Runtime-validated string literals
import { useQueryState, parseAsStringLiteral } from "nuqs";

const [sort, setSort] = useQueryState(
  "sort",
  parseAsStringLiteral(["asc", "desc"] as const).withDefault("asc")
);

// Type: "asc" | "desc"
// ?sort=invalid → falls back to "asc" (default)
// setSort("invalid") → TypeScript error ✅
```

**Why better:**
- Type-runtime safety (not just types)
- Invalid values handled gracefully
- TypeScript catches bugs at compile time

---

### 5) Arrays in URLs

**Before (Manual Array Handling):**
```tsx
// ❌ BAD: Manual array parsing
const tags = searchParams.get("tags")?.split(",").filter(Boolean) || [];

const updateTags = (newTags: string[]) => {
  const params = new URLSearchParams(searchParams.toString());
  if (newTags.length > 0) {
    params.set("tags", newTags.join(","));
  } else {
    params.delete("tags");
  }
  router.push(`?${params.toString()}`);
};
```

**After (nuqs with Arrays):**
```tsx
// ✅ GOOD: Native array handling
import { useQueryState, parseAsNativeArrayOf, parseAsString } from "nuqs";

// Native format: ?tag=books&tag=tech&tag=design
const [tags, setTags] = useQueryState(
  "tag",
  parseAsNativeArrayOf(parseAsString) // Built-in default: []
);

// Add a tag
setTags((prev) => [...prev, "newTag"]);

// Remove a tag
setTags((prev) => prev.filter((t) => t !== "removeMe"));
```

**Why better:**
- Native URL format (more standard)
- Built-in empty array default
- No manual splitting/joining
- Works with primitive parsers (integers, booleans, etc.)

---

### 6) Complex State with JSON

**Before (Manual JSON Handling):**
```tsx
// ❌ BAD: Manual JSON parsing with no validation
const filterStr = searchParams.get("filters");
let filters = {};
try {
  filters = filterStr ? JSON.parse(filterStr) : {};
} catch {
  filters = {};
}

const updateFilters = (newFilters: object) => {
  const params = new URLSearchParams(searchParams.toString());
  params.set("filters", JSON.stringify(newFilters));
  router.push(`?${params.toString()}`);
};
```

**After (nuqs with JSON + Zod):**
```tsx
// ✅ GOOD: Type-safe JSON with validation
import { useQueryState, parseAsJson } from "nuqs";
import { z } from "zod";

const filtersSchema = z.object({
  category: z.string(),
  minPrice: z.number(),
  maxPrice: z.number(),
  inStock: z.boolean(),
});

const [filters, setFilters] = useQueryState(
  "filters",
  parseAsJson(filtersSchema).withDefault({
    category: "all",
    minPrice: 0,
    maxPrice: 1000,
    inStock: false,
  })
);

// Fully typed access
filters.category; // Type: string
filters.minPrice; // Type: number

// Update
setFilters({ ...filters, minPrice: 100 });
```

**Why better:**
- Zod/Standard Schema validation
- Full TypeScript inference
- Invalid JSON handled gracefully
- No try-catch boilerplate

---

### 7) Pagination Pattern

**Before (Manual Pagination):**
```tsx
// ❌ BAD: Zero-indexed state, one-indexed URL
const pageParam = searchParams.get("page");
const [page, setPage] = useState(pageParam ? Number(pageParam) - 1 : 0);

useEffect(() => {
  const params = new URLSearchParams(searchParams.toString());
  params.set("page", String(page + 1));
  router.push(`?${params.toString()}`);
}, [page]);
```

**After (nuqs with parseAsIndex):**
```tsx
// ✅ GOOD: Built-in pagination helper
import { useQueryState, parseAsIndex } from "nuqs";

// Internal: zero-indexed (0, 1, 2...)
// URL: one-indexed (?page=1, ?page=2, ?page=3...)
const [pageIndex, setPageIndex] = useQueryState(
  "page",
  parseAsIndex.withDefault(0)
);

// pageIndex: 0 → ?page=1 in URL
// ?page=1 → pageIndex: 0 in state
```

**Why better:**
- Automatic +1/-1 offset
- No manual synchronization
- No useEffect needed
- User-friendly URLs

---

## Framework Setup

### Next.js App Router

**1. Wrap your app with NuqsAdapter:**

```tsx
// app/layout.tsx or providers.tsx
import { NuqsAdapter } from "nuqs/adapters/next/app";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NuqsAdapter>
          {children}
        </NuqsAdapter>
      </body>
    </html>
  );
}
```

**2. Use in client components:**

```tsx
"use client";
import { useQueryState, parseAsString } from "nuqs";

export function SearchBox() {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  // ...
}
```

---

### Server-Side Usage

For shared code (server + client), import from `nuqs/server`:

```tsx
// lib/parsers.ts (shared code)
import { parseAsStringLiteral } from "nuqs/server"; // ✅ No 'use client' directive

export const sortParser = parseAsStringLiteral(["asc", "desc"] as const);
```

```tsx
// app/products/page.tsx (Server Component)
import { sortParser } from "@/lib/parsers";

export default async function ProductsPage({ searchParams }) {
  // Access search params on server
  const sort = sortParser.parse(searchParams.sort); // "asc" | "desc" | null
  // ...
}
```

```tsx
// components/sort-button.tsx (Client Component)
"use client";
import { useQueryState } from "nuqs";
import { sortParser } from "@/lib/parsers";

export function SortButton() {
  const [sort, setSort] = useQueryState("sort", sortParser);
  // ...
}
```

**Why this matters:**
- Shared parsers across server & client
- Type-safe on both sides
- No bundling errors

---

## Common Patterns

### Pattern 1: Search + Filters + Pagination

```tsx
import { useQueryStates, parseAsString, parseAsStringLiteral, parseAsIndex } from "nuqs";

export function ProductList() {
  const [params, setParams] = useQueryStates({
    search: parseAsString.withDefault(""),
    category: parseAsStringLiteral(["electronics", "books", "clothing"] as const),
    sort: parseAsStringLiteral(["price-asc", "price-desc", "newest"] as const).withDefault("newest"),
    page: parseAsIndex.withDefault(0),
  });

  return (
    <>
      {/* Search */}
      <input
        value={params.search}
        onChange={(e) => setParams({ search: e.target.value, page: 0 })} // Reset page on search
      />

      {/* Category Filter */}
      <select
        value={params.category || ""}
        onChange={(e) => setParams({ category: e.target.value as any, page: 0 })}
      >
        <option value="">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="books">Books</option>
        <option value="clothing">Clothing</option>
      </select>

      {/* Sort */}
      <select
        value={params.sort}
        onChange={(e) => setParams({ sort: e.target.value as any })}
      >
        <option value="newest">Newest</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
      </select>

      {/* Pagination */}
      <button onClick={() => setParams({ page: params.page + 1 })}>
        Next Page
      </button>
    </>
  );
}
```

---

### Pattern 2: Modal State in URL

```tsx
import { useQueryState, parseAsString } from "nuqs";

export function ProductPage() {
  const [modalId, setModalId] = useQueryState("modal", parseAsString);

  const openModal = (id: string) => setModalId(id);
  const closeModal = () => setModalId(null);

  return (
    <>
      <button onClick={() => openModal("share")}>Share</button>
      <button onClick={() => openModal("settings")}>Settings</button>

      {modalId === "share" && <ShareModal onClose={closeModal} />}
      {modalId === "settings" && <SettingsModal onClose={closeModal} />}
    </>
  );
}
```

**Benefits:**
- Modal state survives refresh
- Shareable URLs with modal open
- Browser back button closes modal

---

### Pattern 3: Date Range Filters

```tsx
import { useQueryStates, parseAsIsoDate } from "nuqs";

export function DateRangePicker() {
  const [dateRange, setDateRange] = useQueryStates({
    startDate: parseAsIsoDate,
    endDate: parseAsIsoDate,
  });

  return (
    <>
      <input
        type="date"
        value={dateRange.startDate?.toISOString().split("T")[0] || ""}
        onChange={(e) =>
          setDateRange({ startDate: e.target.valueAsDate || null })
        }
      />
      <input
        type="date"
        value={dateRange.endDate?.toISOString().split("T")[0] || ""}
        onChange={(e) =>
          setDateRange({ endDate: e.target.valueAsDate || null })
        }
      />
    </>
  );
}
```

---

## Common Pitfalls

### ❌ Pitfall 1: Not using adapters

```tsx
// ❌ BAD: Forgot to wrap with NuqsAdapter
export default function App({ children }) {
  return <>{children}</>;
}

// Component will error or not update URL
```

```tsx
// ✅ GOOD: Wrap with adapter
import { NuqsAdapter } from "nuqs/adapters/next/app";

export default function App({ children }) {
  return <NuqsAdapter>{children}</NuqsAdapter>;
}
```

---

### ❌ Pitfall 2: Mixing `nuqs` and `nuqs/server` imports

```tsx
// ❌ BAD: Mixing imports causes bundling errors
import { parseAsString } from "nuqs"; // Has 'use client'
import { parseAsInteger } from "nuqs/server"; // No 'use client'
```

```tsx
// ✅ GOOD: Consistent imports
// For client components:
import { parseAsString, parseAsInteger } from "nuqs";

// For shared/server code:
import { parseAsString, parseAsInteger } from "nuqs/server";
```

---

### ❌ Pitfall 3: Not using `.withDefault()`

```tsx
// ❌ BAD: Nullable state requires null checks everywhere
const [count, setCount] = useQueryState("count", parseAsInteger);
//      ^? number | null

// Annoying to work with:
const increment = () => setCount((c) => (c ?? 0) + 1);
```

```tsx
// ✅ GOOD: Use default for required state
const [count, setCount] = useQueryState(
  "count",
  parseAsInteger.withDefault(0)
);
//      ^? number

// Much cleaner:
const increment = () => setCount((c) => c + 1);
```

---

### ❌ Pitfall 4: Stringifying objects manually

```tsx
// ❌ BAD: Manual JSON stringification
const [filters, setFilters] = useQueryState("filters", {
  parse: (value) => JSON.parse(value),
  serialize: (value) => JSON.stringify(value),
});
```

```tsx
// ✅ GOOD: Use parseAsJson with schema
import { z } from "zod";

const [filters, setFilters] = useQueryState(
  "filters",
  parseAsJson(
    z.object({
      category: z.string(),
      minPrice: z.number(),
    })
  )
);
```

---

### ❌ Pitfall 5: Using `router.push` with nuqs

```tsx
// ❌ BAD: Mixing nuqs with manual routing
const [search, setSearch] = useQueryState("q");
const router = useRouter();

const updateSearch = (value: string) => {
  setSearch(value);
  router.push(`?q=${value}`); // ❌ Redundant! nuqs already updates URL
};
```

```tsx
// ✅ GOOD: Let nuqs handle navigation
const [search, setSearch] = useQueryState("q");

const updateSearch = (value: string) => {
  setSearch(value); // nuqs automatically updates URL
};
```

---

## Decision Checklist

Use nuqs when you need:

- ✅ **Search/filter/sort state** → Store in URL for shareability
- ✅ **Pagination state** → Use `parseAsIndex` for pagination
- ✅ **Tab/view state** → Use `parseAsStringLiteral` for tab selection
- ✅ **Modal/drawer state** → Store open/closed state in URL
- ✅ **Form state** → Pre-fill forms from URL params
- ✅ **Shareable links** → URL as source of truth for state

Don't use nuqs for:

- ❌ **Truly ephemeral UI** → Hover states, animations
- ❌ **Sensitive data** → Never store secrets/passwords in URL
- ❌ **Large data** → URLs have length limits (~2000 chars)
- ❌ **High-frequency updates** → Typing indicators, cursor position

---

## Built-in Parsers Quick Reference

| Type | Parser | Example URL | Example Value |
|------|--------|-------------|---------------|
| String | `parseAsString` | `?q=hello` | `"hello"` |
| Integer | `parseAsInteger` | `?count=42` | `42` |
| Float | `parseAsFloat` | `?price=19.99` | `19.99` |
| Boolean | `parseAsBoolean` | `?active` | `true` |
| String Literal | `parseAsStringLiteral(["a", "b"])` | `?mode=a` | `"a"` |
| Number Literal | `parseAsNumberLiteral([1, 2, 3])` | `?level=2` | `2` |
| Date (ISO) | `parseAsIsoDate` | `?date=2025-01-15` | `Date` |
| DateTime | `parseAsIsoDateTime` | `?time=2025-01-15T10:30:00Z` | `Date` |
| Timestamp | `parseAsTimestamp` | `?ts=1736940600000` | `Date` |
| Array | `parseAsArrayOf(parseAsInteger)` | `?ids=1,2,3` | `[1, 2, 3]` |
| Native Array | `parseAsNativeArrayOf(parseAsString)` | `?tag=a&tag=b` | `["a", "b"]` |
| JSON | `parseAsJson(schema)` | `?data={"foo":1}` | `{ foo: 1 }` |
| Hex | `parseAsHex` | `?color=ff0000` | `16711680` |
| Index (pagination) | `parseAsIndex` | `?page=1` | `0` (zero-indexed) |

---

## TanStack Query Integration

nuqs works great with TanStack Query for data fetching:

```tsx
import { useQueryState, parseAsString } from "nuqs";
import { useQuery } from "@tanstack/react-query";

function ProductList() {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));

  const { data, isLoading } = useQuery({
    queryKey: ["products", search],
    queryFn: () => fetchProducts({ search }),
  });

  return (
    <>
      <input value={search} onChange={(e) => setSearch(e.target.value)} />
      {isLoading ? "Loading..." : <ProductGrid products={data} />}
    </>
  );
}
```

**Benefits:**
- URL is source of truth for filters
- TanStack Query handles data fetching
- Automatic refetch on URL change
- Cache keyed by URL params

---

## Performance Optimization

### Batch Updates

```tsx
// ❌ BAD: Multiple separate updates (3 navigations)
setSearch("laptop");
setCategory("electronics");
setSort("price-asc");
```

```tsx
// ✅ GOOD: Single batched update (1 navigation)
setParams({
  search: "laptop",
  category: "electronics",
  sort: "price-asc",
});
```

### Shallow Routing

```tsx
// Prevent scroll reset and full page reload
const [query, setQuery] = useQueryState("q", {
  shallow: true, // Next.js only
});
```

### History Management

```tsx
// Replace instead of push (don't fill history)
const [query, setQuery] = useQueryState("q", {
  history: "replace",
});
```

---

## Testing

```tsx
// Mock search params in tests
import { NuqsTestingAdapter } from "nuqs/adapters/testing";

test("updates search on input change", async () => {
  const searchParams = { q: "initial" };

  render(
    <NuqsTestingAdapter searchParams={searchParams}>
      <SearchBox />
    </NuqsTestingAdapter>
  );

  // Your test code...
});
```

---

## Migration Strategy

If you have existing manual URL management, migrate incrementally:

**Step 1: Install and setup adapter**
```bash
npm install nuqs
```

**Step 2: Add adapter to root**
```tsx
import { NuqsAdapter } from "nuqs/adapters/next/app";
```

**Step 3: Migrate one param at a time**
```tsx
// Before: Manual
const category = searchParams.get("category");

// After: nuqs
const [category] = useQueryState("category", parseAsString);
```

**Step 4: Replace batch updates**
```tsx
// Before: Multiple router.push calls
// After: Single useQueryStates call
```

---

## References

- [1]: https://nuqs.dev/docs/installation "nuqs Documentation"
- [2]: https://nuqs.dev/docs/parsers/built-in "Built-in Parsers"
- [3]: https://nuqs.dev/docs/basic-usage "Basic Usage"
- [4]: https://nuqs.dev/docs/adapters "Framework Adapters"
- [5]: https://nuqs.dev/docs/parsers/built-in#literals "String Literals"
- [6]: https://nuqs.dev/docs/parsers/built-in#native-arrays "Native Arrays"
- [7]: https://nuqs.dev/docs/parsers/built-in#json "JSON Parser"

[1]: https://nuqs.dev/docs/installation
[2]: https://nuqs.dev/docs/parsers/built-in
[3]: https://nuqs.dev/docs/basic-usage
[4]: https://nuqs.dev/docs/adapters
[5]: https://nuqs.dev/docs/parsers/built-in#literals
[6]: https://nuqs.dev/docs/parsers/built-in#native-arrays
[7]: https://nuqs.dev/docs/parsers/built-in#json

---

## Summary

nuqs eliminates the need for manual URL search param management by providing:

1. ✅ **Type-safe state management** → Like `useState`, but in the URL
2. ✅ **Built-in parsers** → Primitives, dates, arrays, JSON, custom types
3. ✅ **No effects needed** → Direct state access without synchronization
4. ✅ **Framework integration** → Adapters for Next.js, Remix, React Router, etc.
5. ✅ **Better DX** → Less code, better types, clearer intent

**Golden Rule:** If your state should survive page refresh or be shareable via URL, use nuqs instead of `useState` + manual URL management.
