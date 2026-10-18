# Backend Revision Guide

This guide uses the current Express, EJS, and in-memory posts project as its example. It covers the project files, how requests travel through the app, and a reusable pattern for starting another Express `index.js`.

## 1. Project layout

```text
practicing-backend/
├── index.js                 # Creates the Express app and currently defines all routes/data
├── package.json             # Project metadata, scripts, and direct dependencies
├── package-lock.json        # Exact dependency tree installed by npm
├── README.md                # Project title
├── public/
│   └── style.css            # Static CSS served by Express
└── views/
    ├── index.ejs            # List of posts
    ├── new.ejs              # Form to create a post
    └── show.ejs             # Details for one post
```

`node_modules/` contains installed packages and should not be edited by hand or committed. Use `npm install` to recreate it from the package files.

## 2. Dependencies

The project's direct runtime dependencies, recorded in `package.json`, are:

| Package | Purpose | Used for |
|---|---|---|
| `express` (`^5.3.0`) | Web server and routing | `app`, middleware, HTTP routes, responses |
| `ejs` (`^7.0.1`) | Server-side HTML templates | `res.render(...)` and `<%= ... %>` |
| `uuid` (`^14.0.3`) | Unique IDs | `uuidv4()` for post IDs |

Install the dependencies declared by this project:

```powershell
npm install
```

For a new project, initialize npm and install the dependencies:

```powershell
npm init -y
npm install express ejs uuid
```

`path` is a built-in Node.js module; it does not need installation. `express.urlencoded`, `express.json`, and `express.static` are built into Express. `nodemon` is optional for automatic restarts during development and is not currently a project dependency.

The current `package.json` has a placeholder `test` script that deliberately exits with an error; no test suite is configured yet.

## 3. What happens when the app runs

1. Node loads `index.js`.
2. Express creates the `app`.
3. Middleware parses incoming form and JSON bodies and serves files from `public/`.
4. The view engine is configured as EJS, with templates in `views/`.
5. Routes match incoming HTTP method + URL combinations and send a response or render a view.
6. `app.listen(...)` starts the server on port `8080`.

Middleware must be registered before the routes that need it. For example, `express.urlencoded(...)` must run before the POST route reads `req.body`.

## 4. Reusable `index.js` starter

Use this as a starting point for an Express app that renders EJS templates, accepts form/JSON input, serves static assets, and keeps routes in a separate router:

```js
const express = require("express");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const port = process.env.PORT || 8080;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

const postsRouter = require("./routes/posts");
app.use("/posts", postsRouter);

app.get("/", (req, res) => {
  res.redirect("/posts");
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
```

When starting a project that has no routes folder yet, create `routes/posts.js` before requiring it. If everything is intentionally kept in one file, put the route handlers in `index.js` after middleware and before `app.listen(...)`.

### What each setup line is for

- `express()` creates the application.
- `process.env.PORT || 8080` lets a hosting platform choose a port, with `8080` as a local default.
- `express.urlencoded({ extended: true })` parses HTML form bodies into `req.body`.
- `express.json()` parses JSON request bodies into `req.body`.
- `app.set("view engine", "ejs")` selects EJS for `res.render(...)`.
- `app.set("views", ...)` points Express to the templates directory.
- `express.static(...)` makes files in `public/` available from the site root; `public/style.css` is requested as `/style.css`.
- `app.use("/posts", postsRouter)` mounts the posts router under `/posts`.
- `const { v4: uuidv4 } = require("uuid")` imports the UUID generator used by the posts example. Remove it from apps that do not need generated IDs.

## 5. Creating an EJS template

1. Create the `views/` directory if it does not exist.
2. Add an `.ejs` file, for example `views/posts/index.ejs`.
3. Render it from a route and pass it the data it needs:

   ```js
   res.render("posts/index", { posts });
   ```

4. Read values with `<%= value %>`. EJS escapes this output for HTML. Use `<% ... %>` for JavaScript control flow such as loops.
5. Reference static files using URL paths, such as `/style.css`, rather than filesystem paths.

Example list:

```ejs
<h1>Posts</h1>
<% for (const post of posts) { %>
  <article class="post">
    <h2>@<%= post.username %></h2>
    <p><%= post.content %></p>
    <a href="/posts/<%= post.id %>">See details</a>
  </article>
<% } %>
```

Template names in `res.render` are relative to the configured `views/` directory. The `.ejs` extension can be omitted, so `res.render("posts/index")` resolves to `views/posts/index.ejs`.

## 6. Creating routes with an Express Router

Create `routes/posts.js`:

```js
const express = require("express");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

let posts = [
  {
    id: uuidv4(),
    username: "Example user",
    content: "Example post content",
  },
];

router.get("/", (req, res) => {
  res.render("index.ejs", { posts });
});

router.get("/new", (req, res) => {
  res.render("new.ejs");
});

router.post("/", (req, res) => {
  const { username, content } = req.body;

  posts.push({
    id: uuidv4(),
    username,
    content,
  });

  res.redirect("/posts");
});

router.get("/:id", (req, res) => {
  const post = posts.find((item) => item.id === req.params.id);

  if (!post) {
    return res.status(404).send("Post not found");
  }

  res.render("show.ejs", { post });
});

module.exports = router;
```

Because the router is mounted at `/posts`:

- `router.get("/")` handles `GET /posts`.
- `router.get("/new")` handles `GET /posts/new`.
- `router.post("/")` handles `POST /posts`.
- `router.get("/:id")` handles `GET /posts/:id`.

Put specific paths such as `/new` before parameter paths such as `/:id`; otherwise, the parameter route can match the word `new`.

## 7. Current project routes and request flow

| Method | URL | Current behavior |
|---|---|---|
| `GET` | `/` | Sends the plain text `server is listenig` |
| `GET` | `/posts` | Renders `views/index.ejs` with the `posts` array |
| `GET` | `/posts/new` | Renders the post-creation form |
| `POST` | `/posts` | Reads `username` and `content`, generates an ID, adds a post, and redirects to `/posts` |
| `GET` | `/posts/:id` | Finds a post and renders `views/show.ejs` |
| `PATCH` | `/posts/:id` | Currently only responds with `working`; it does not update a post yet |

The `new.ejs` form sends a POST request to `/posts`. The URL-encoded body parser turns its named fields into `req.body.username` and `req.body.content`. The POST handler adds the post to the in-memory array, then redirects the browser to the posts list.

## 8. Current data and important limitations

- Posts are stored in a JavaScript array in `index.js`, not a database. They disappear when the server restarts.
- IDs are generated with `uuidv4()`.
- The detail route should return a 404 when an ID does not exist. Without that check, the current route tries to render the detail view with an undefined `post`.
- The current PATCH handler is a stub. A complete update flow must find the post, validate the submitted data, update it, and return an appropriate response.
- HTML forms natively support GET and POST, not PATCH. To submit PATCH from a standard HTML form, add a method-override solution or use a JavaScript `fetch` request. Alternatively, use POST for a simple form-driven update.
- Validate required fields such as `username` and `content` before saving; do not assume that a form always sends valid values.

## 9. Static CSS and template paths

The stylesheet is `public/style.css`. Express serves it at `/style.css`. Use this in EJS:

```html
<link rel="stylesheet" href="/style.css">
```

The current templates use `\style.css`. A URL should use forward slashes and start at the site root, so change that reference to `/style.css` when updating the templates. Prefer relative application links such as `/posts/<%= post.id %>` instead of hardcoding `http://localhost:8080`.

## 10. Run and check the app

From the project directory in PowerShell:

```powershell
npm install
node index.js
```

Open `http://localhost:8080/posts` in a browser. Check that:

1. The posts list renders.
2. The “Create new post” link opens the form.
3. Submitting the form returns to the list with the new post.
4. “See in detail” opens that post.
5. An unknown post ID returns a 404 after a not-found check has been added.

Stop the server with `Ctrl+C`.

## 11. Suggested learning sequence

1. Read the app setup and middleware in `index.js`.
2. Trace `GET /posts` from the route into `views/index.ejs`.
3. Trace the form in `views/new.ejs` through `POST /posts`, `req.body`, and the redirect.
4. Trace the detail link into `GET /posts/:id` and `views/show.ejs`.
5. Practice adding a 404 branch and input validation.
6. Move the post-related handlers and data into `routes/posts.js`, then mount the router in `index.js`.
7. Replace the in-memory array with persistent storage when ready to learn a database.

## Files reviewed

The project-specific guide is based on `index.js`, `package.json`, `package-lock.json`, `README.md`, `views/index.ejs`, `views/new.ejs`, `views/show.ejs`, and `public/style.css`. Installed package files under `node_modules/` are generated dependencies and are intentionally not documented individually.
