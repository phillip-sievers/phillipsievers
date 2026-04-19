# How to add a post

Two steps.

1. **Register it** in `assets/posts.js` — paste a new object at the **top** of the `POSTS` array:

```js
{
  slug: "your-slug-here",              // URL
  title: "Your title",
  date: "2026-04-18",                  // YYYY-MM-DD
  desc: "One sentence summary.",       // shown on list
  readMin: 5,
  body: `
    <p>Opening paragraph…</p>
    <h2>A section</h2>
    <p>More text.</p>
    <blockquote>A pull-quote.</blockquote>
    <pre><code>some code</code></pre>
  `,
}
```

2. **Create the page** at `posts/your-slug-here.html`. Copy any existing post file and change ONE line — the `data-slug` on `<article class="post-page">`. Everything else (title, date, body, prev/next link) is wired up automatically from the registry.

That's it. No build step, no deploy script, no CMS.

### Writing conventions

- `<h2>` separates major sections. Renders as a small uppercase rule.
- `<h3>` for sub-sections.
- `<em>` for soft emphasis (dim + dotted underline). `<strong>` for sharp emphasis (pure white).
- `<blockquote>` for pull-quotes.
- `<pre><code>…</code></pre>` for block code. Inline `<code>` works too.
- `<figure>` with a `.placeholder` child works as an image stand-in before you drop the real asset in.
