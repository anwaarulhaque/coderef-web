// Starter examples for the Try It editor, grouped like a tutorial: HTML, then CSS, then JavaScript.
import type { TryItCode } from "./document";

export type TryItExample = TryItCode & { id: string; group: "HTML" | "CSS" | "JavaScript"; title: string };

export const EXAMPLES: TryItExample[] = [
  {
    id: "starter",
    group: "HTML",
    title: "Starter page",
    html: `<h1>Hello, world!</h1>
<p>Edit the code on the left, then press <strong>Run</strong> to see the result.</p>
<button id="greet">Click me</button>
<p id="output"></p>`,
    css: `body {
  font-family: system-ui, sans-serif;
  margin: 2rem;
  line-height: 1.5;
}

h1 {
  color: #2563eb;
}

button {
  padding: 0.5rem 1rem;
  border: 0;
  border-radius: 6px;
  background: #2563eb;
  color: white;
  cursor: pointer;
}`,
    js: `const button = document.getElementById("greet");
const output = document.getElementById("output");
let clicks = 0;

button.addEventListener("click", () => {
  clicks++;
  output.textContent = \`You clicked \${clicks} time\${clicks === 1 ? "" : "s"}.\`;
  console.log("clicked", clicks);
});`,
  },
  {
    id: "html-document",
    group: "HTML",
    title: "A complete HTML document",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>My first page</title>
  <style>
    body { font-family: Georgia, serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem; }
  </style>
</head>
<body>

<h1>My First Heading</h1>
<p>My first paragraph.</p>

</body>
</html>`,
    css: "",
    js: "",
  },
  {
    id: "html-text",
    group: "HTML",
    title: "Headings, paragraphs & formatting",
    html: `<h1>Heading 1</h1>
<h2>Heading 2</h2>
<h3>Heading 3</h3>

<p>This is a paragraph with <b>bold</b>, <i>italic</i>, <mark>highlighted</mark>,
<del>deleted</del>, <ins>inserted</ins>, <sub>subscript</sub> and <sup>superscript</sup> text.</p>

<blockquote>A blockquote is used for longer quotations.</blockquote>

<p>Line one<br>Line two</p>
<hr>
<p><code>console.log("inline code")</code> and <kbd>Ctrl</kbd> + <kbd>C</kbd></p>`,
    css: "",
    js: "",
  },
  {
    id: "html-lists-links",
    group: "HTML",
    title: "Links, images & lists",
    html: `<p><a href="https://developer.mozilla.org/" target="_blank">Visit MDN</a> (opens in a new tab)</p>

<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='90'%3E%3Crect width='160' height='90' rx='8' fill='%232563eb'/%3E%3Ctext x='80' y='52' font-size='18' text-anchor='middle' fill='white' font-family='sans-serif'%3EImage%3C/text%3E%3C/svg%3E"
     alt="A blue placeholder image" width="160" height="90">

<h3>Unordered list</h3>
<ul>
  <li>Coffee</li>
  <li>Tea</li>
  <li>Milk</li>
</ul>

<h3>Ordered list</h3>
<ol>
  <li>Open the editor</li>
  <li>Write some HTML</li>
  <li>Press Run</li>
</ol>

<h3>Description list</h3>
<dl>
  <dt>HTML</dt><dd>Structure</dd>
  <dt>CSS</dt><dd>Presentation</dd>
</dl>`,
    css: "",
    js: "",
  },
  {
    id: "html-table",
    group: "HTML",
    title: "Tables",
    html: `<table>
  <caption>Monthly savings</caption>
  <thead>
    <tr><th>Month</th><th>Savings</th></tr>
  </thead>
  <tbody>
    <tr><td>January</td><td>$100</td></tr>
    <tr><td>February</td><td>$80</td></tr>
    <tr><td>March</td><td>$120</td></tr>
  </tbody>
  <tfoot>
    <tr><td>Total</td><td>$300</td></tr>
  </tfoot>
</table>`,
    css: `table {
  border-collapse: collapse;
  font-family: system-ui, sans-serif;
}

th, td {
  border: 1px solid #ccc;
  padding: 8px 14px;
  text-align: left;
}

thead, tfoot {
  background: #f1f3f6;
  font-weight: bold;
}

tbody tr:nth-child(even) {
  background: #fafafa;
}`,
    js: "",
  },
  {
    id: "html-form",
    group: "HTML",
    title: "Forms & inputs",
    html: `<form id="signup">
  <label for="name">Name</label>
  <input id="name" name="name" required placeholder="Ada Lovelace">

  <label for="email">Email</label>
  <input id="email" name="email" type="email" required>

  <label for="plan">Plan</label>
  <select id="plan" name="plan">
    <option>Free</option>
    <option>Pro</option>
  </select>

  <label><input type="checkbox" name="news"> Send me news</label>

  <button>Sign up</button>
</form>`,
    css: `form {
  display: grid;
  gap: 6px;
  max-width: 280px;
  font-family: system-ui, sans-serif;
}

input, select, button {
  padding: 6px 8px;
  font: inherit;
}

button {
  margin-top: 8px;
}`,
    js: `document.getElementById("signup").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  console.log("Submitted:", data);
});`,
  },
  {
    id: "css-flexbox",
    group: "CSS",
    title: "Flexbox layout",
    html: `<nav class="bar">
  <span class="logo">Logo</span>
  <a href="#">Home</a>
  <a href="#">About</a>
  <a href="#">Contact</a>
</nav>

<div class="cards">
  <div class="card">One</div>
  <div class="card">Two</div>
  <div class="card">Three</div>
</div>`,
    css: `body {
  font-family: system-ui, sans-serif;
  margin: 0;
}

.bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: #16181d;
}

.bar a {
  color: #ddd;
  text-decoration: none;
}

.logo {
  margin-right: auto;
  font-weight: bold;
  color: white;
}

.cards {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 20px;
}

.card {
  flex: 1 1 140px;
  padding: 32px;
  border-radius: 8px;
  background: #e0e7ff;
  text-align: center;
}`,
    js: "",
  },
  {
    id: "css-grid",
    group: "CSS",
    title: "Grid layout",
    html: `<div class="page">
  <header>Header</header>
  <aside>Sidebar</aside>
  <main>Main content</main>
  <footer>Footer</footer>
</div>`,
    css: `.page {
  display: grid;
  grid-template-columns: 180px 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  gap: 10px;
  min-height: 90vh;
  font-family: system-ui, sans-serif;
}

.page > * {
  padding: 16px;
  border-radius: 8px;
  background: #dbeafe;
}

header { grid-area: header; }
aside  { grid-area: sidebar; background: #fef3c7; }
main   { grid-area: main; background: #dcfce7; }
footer { grid-area: footer; }

@media (max-width: 500px) {
  .page {
    grid-template-columns: 1fr;
    grid-template-areas: "header" "main" "sidebar" "footer";
  }
}`,
    js: "",
  },
  {
    id: "css-transitions",
    group: "CSS",
    title: "Hover effects & transitions",
    html: `<button class="btn">Hover me</button>
<div class="box">Hover the box</div>`,
    css: `body {
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 40px;
  font-family: system-ui, sans-serif;
}

.btn {
  padding: 12px 24px;
  border: 2px solid #2563eb;
  border-radius: 999px;
  background: transparent;
  color: #2563eb;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s, color 0.3s, transform 0.2s;
}

.btn:hover {
  background: #2563eb;
  color: white;
  transform: translateY(-3px);
}

.box {
  width: 140px;
  height: 140px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #f97316;
  color: white;
  transition: transform 0.5s ease, border-radius 0.5s;
}

.box:hover {
  transform: rotate(15deg) scale(1.1);
  border-radius: 50%;
}`,
    js: "",
  },
  {
    id: "css-animation",
    group: "CSS",
    title: "Keyframe animation",
    html: `<div class="loader"></div>
<p class="pulse">Loading…</p>`,
    css: `body {
  display: grid;
  place-items: center;
  min-height: 90vh;
  font-family: system-ui, sans-serif;
}

.loader {
  width: 56px;
  height: 56px;
  border: 6px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  50% { opacity: 0.3; }
}`,
    js: "",
  },
  {
    id: "css-variables",
    group: "CSS",
    title: "Custom properties & dark mode",
    html: `<div class="card">
  <h2>Theme card</h2>
  <p>Colors come from CSS variables. Click to toggle dark mode.</p>
  <button onclick="document.body.classList.toggle('dark')">Toggle theme</button>
</div>`,
    css: `:root {
  --bg: #f6f7f9;
  --card: #ffffff;
  --text: #16181d;
  --accent: #2563eb;
}

body.dark {
  --bg: #0d0f13;
  --card: #161920;
  --text: #e8eaee;
  --accent: #60a5fa;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, sans-serif;
  padding: 32px;
  transition: background 0.3s, color 0.3s;
}

.card {
  max-width: 320px;
  padding: 20px;
  border-radius: 12px;
  background: var(--card);
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.1);
}

button {
  padding: 8px 14px;
  border: 0;
  border-radius: 6px;
  background: var(--accent);
  color: white;
  cursor: pointer;
}`,
    js: "",
  },
  {
    id: "js-console",
    group: "JavaScript",
    title: "Variables, arrays & the console",
    html: `<p>This example only logs to the <strong>console</strong> below.</p>`,
    css: "",
    js: `const name = "Ada";
let age = 36;
console.log("Hello,", name, "— age", age);

const numbers = [3, 1, 4, 1, 5, 9, 2, 6];
console.log("sorted:", [...numbers].sort((a, b) => a - b));
console.log("doubled:", numbers.map((n) => n * 2));
console.log("evens:", numbers.filter((n) => n % 2 === 0));
console.log("sum:", numbers.reduce((total, n) => total + n, 0));

const person = { name, age, languages: ["en", "fr"] };
console.log(person);

console.warn("This is a warning");
console.error("This is an error");`,
  },
  {
    id: "js-dom",
    group: "JavaScript",
    title: "DOM: a to-do list",
    html: `<h2>To-do</h2>
<form id="form">
  <input id="task" placeholder="Add a task" autocomplete="off">
  <button>Add</button>
</form>
<ul id="list"></ul>`,
    css: `body {
  font-family: system-ui, sans-serif;
  padding: 16px;
}

li {
  cursor: pointer;
  padding: 4px 0;
}

li.done {
  text-decoration: line-through;
  color: #999;
}`,
    js: `const form = document.getElementById("form");
const input = document.getElementById("task");
const list = document.getElementById("list");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  const item = document.createElement("li");
  item.textContent = text;
  item.title = "Click to mark done";
  item.addEventListener("click", () => item.classList.toggle("done"));
  list.append(item);

  input.value = "";
  input.focus();
});`,
  },
  {
    id: "js-events",
    group: "JavaScript",
    title: "Events: mouse & keyboard",
    html: `<div id="pad">Move the mouse here, or press any key</div>
<p id="info"></p>`,
    css: `#pad {
  height: 160px;
  display: grid;
  place-items: center;
  border: 2px dashed #94a3b8;
  border-radius: 12px;
  font-family: system-ui, sans-serif;
  user-select: none;
}

#info {
  font-family: monospace;
}`,
    js: `const pad = document.getElementById("pad");
const info = document.getElementById("info");

pad.addEventListener("mousemove", (e) => {
  info.textContent = \`x: \${e.offsetX}, y: \${e.offsetY}\`;
});

pad.addEventListener("click", () => {
  pad.style.background = \`hsl(\${Math.random() * 360} 80% 85%)\`;
});

document.addEventListener("keydown", (e) => {
  info.textContent = \`key: "\${e.key}"  code: \${e.code}\`;
  console.log("keydown", e.key);
});`,
  },
  {
    id: "js-timer",
    group: "JavaScript",
    title: "Timers: a live clock",
    html: `<div id="clock"></div>
<button id="toggle">Pause</button>`,
    css: `body {
  font-family: system-ui, sans-serif;
  text-align: center;
  padding-top: 40px;
}

#clock {
  font-size: 48px;
  font-variant-numeric: tabular-nums;
  margin-bottom: 16px;
}`,
    js: `const clock = document.getElementById("clock");
const toggle = document.getElementById("toggle");

function tick() {
  clock.textContent = new Date().toLocaleTimeString();
}

tick();
let timer = setInterval(tick, 1000);

toggle.addEventListener("click", () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
    toggle.textContent = "Resume";
  } else {
    tick();
    timer = setInterval(tick, 1000);
    toggle.textContent = "Pause";
  }
});`,
  },
  {
    id: "js-async",
    group: "JavaScript",
    title: "Promises & async/await",
    html: `<button id="load">Load data</button>
<pre id="out"></pre>`,
    css: "",
    js: `// A fake API call that resolves after a delay.
function fetchUser(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id > 0) resolve({ id, name: "User " + id });
      else reject(new Error("Invalid id"));
    }, 800);
  });
}

document.getElementById("load").addEventListener("click", async () => {
  const out = document.getElementById("out");
  out.textContent = "Loading…";
  try {
    const users = await Promise.all([fetchUser(1), fetchUser(2)]);
    out.textContent = JSON.stringify(users, null, 2);
    console.log("loaded", users);
    await fetchUser(0);
  } catch (error) {
    console.error(error);
  }
});`,
  },
];

export const DEFAULT_EXAMPLE = EXAMPLES[0];
