# Markdown Reader — Feature Fixture

This document tests every major markdown feature.

## Typography

This is a regular paragraph with **bold text**, *italic text*, and ~~strikethrough~~.
Here's some `inline code` and a [link to GitHub](https://github.com).

## Code Blocks

JavaScript:

```javascript
async function fetchUser(id) {
  const response = await fetch(`/api/users/${id}`)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}
```

Python:

```python
def fibonacci(n: int) -> list[int]:
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result
```

Bash:

```bash
#!/usr/bin/env bash
set -euo pipefail
echo "Hello from bash"
md-reader README.md --no-open
```

## Tables

| Feature       | Status  | Notes                        |
|---------------|---------|------------------------------|
| Headings      | ✅ Done | H1–H6 with hierarchy         |
| Code blocks   | ✅ Done | Syntax highlighting via hljs |
| Tables        | ✅ Done | GFM table support            |
| Dark mode     | ✅ Done | `prefers-color-scheme`       |
| Export (PDF)  | 🚫 v2   | Not in first iteration       |

## Blockquotes

> The best tool is the one you'll actually use.
> Keep it simple, keep it fast.

## Lists

### Unordered

- First item
- Second item
  - Nested item A
  - Nested item B
    - Deeply nested
- Third item

### Ordered

1. Install: `bun install`
2. Run: `bun run src/cli.ts README.md`
3. Global: `bun link` then `md-reader file.md`

## Horizontal Rule

---

## Images

Images render inline with proper sizing and border-radius.

## Inline Formatting

You can mix **bold**, *italic*, `code`, and [links](#) freely in a paragraph.
Even **`bold code`** works.

---

*End of fixture.*
