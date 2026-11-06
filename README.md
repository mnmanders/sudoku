# Sudoku in pencil

A single-page Sudoku game: five levels, shareable puzzle codes, and a solve record that syncs between devices
through a free Supabase account. It works without an account too: everything is always saved in the browser.

| File | What it is |
| --- | --- |
| `index.html` | The whole game |
| `config.js` | Your Supabase URL and public key (safe to commit) |
| `supabase/schema.sql` | The `games` table and its Row Level Security policies |
| `manifest.webmanifest`, `icons/` | Home Screen install |

## 1. Publish on GitHub Pages

1. Install git (once): `winget install --id Git.Git -e`, then open a new terminal.
2. Tell git who you are (once):
   `git config --global user.name "Your Name"` and `git config --global user.email "you@example.com"`
3. Create the repo on GitHub: <https://github.com/new>, name it `sudoku`, set it to **Public**, and
   **don't** add a README, .gitignore or license.
4. From this folder:
   ```
   git init -b main
   git add .
   git commit -m "Sudoku in pencil"
   git remote add origin https://github.com/mnmanders/sudoku.git
   git push -u origin main
   ```
   The first push opens a browser window so you can sign in to GitHub.
5. On GitHub: repo → **Settings → Pages**. Under "Build and deployment", set Source to **Deploy from a branch**,
   then Branch to **main** and folder **/ (root)**, and click **Save**.
6. After a minute or two the game is live at `https://mnmanders.github.io/sudoku/`.

## 2. Set up Supabase (accounts and sync)

1. Create a free project at <https://supabase.com/dashboard>.
2. **SQL Editor → New query**: paste all of `supabase/schema.sql` and click **Run**.
3. **Authentication → URL Configuration**:
   - Site URL: `https://mnmanders.github.io/sudoku/`
   - Redirect URLs: add the same address.
4. **Authentication → Emails → Magic Link** template: make the email include the code, not only the link.
   Paste this as the body:
   ```html
   <h2>Your Sudoku sign-in code</h2>
   <p>Type this code in the game: <strong style="font-size:24px;letter-spacing:4px">{{ .Token }}</strong></p>
   <p>Or, in Safari, <a href="{{ .ConfirmationURL }}">tap here to sign in</a>.</p>
   ```
   **Why the code matters on iPhone:** an app added to the Home Screen keeps its own storage, separate from
   Safari, and links in Mail always open in Safari. So in the installed app you sign in by typing the code.
5. **Project Settings → API** (or the **Connect** button): copy the Project URL and the **anon / publishable**
   key into `config.js`. Never use the `service_role` or secret key.
6. Commit and push (`git add . && git commit -m "Connect Supabase" && git push`). Pages updates in about a minute.

Good to know (free tier):
- The built-in email sender only sends a few emails per hour. That's fine for two people.
  If someone hits "Too many emails", wait a bit, or set up custom SMTP under Authentication → Emails.
- Free projects **pause after about a week with no activity**. While a project is paused, the game keeps working
  and saves in the browser. Restore the project from the dashboard and the next sync uploads anything new.

## 3. Install on iPhone and iPad

1. Open `https://mnmanders.github.io/sudoku/` in **Safari**.
2. Tap **Share → Add to Home Screen → Add**.
3. Open the game from the Home Screen icon, tap **Sign in to sync**, enter your email, and type the code from the email.
4. Do the same on the other device with the **same email**. Solved puzzles sync whenever the app opens or comes
   back to the foreground.

## How sync works

- Each solved game is a row in `public.games`, keyed by `(user_id, id)`. RLS only lets a signed-in person read
  and write rows where `user_id = auth.uid()`. Signed-out visitors get no access at all.
- A copy of the record always stays in `localStorage`, so it shows instantly and works offline or signed out.
  Games solved while signed out or offline are uploaded at the next sync.
- Signing out removes that account's games from the device. Games that were never uploaded stay.
- The game in progress is saved on each device only. It doesn't sync.
- Puzzle codes (`H-4F7KQ2`) are unchanged: the same code rebuilds the same puzzle on every device.
