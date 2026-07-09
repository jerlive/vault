# Vault — your wedding-fund tracker (PWA)

A phone-installable app that tracks daily spending, logs income, and gamifies your
₹10,00,000 goal. Pre-loaded with your real budgets, goal, and envelopes. All data
stays on your device (localStorage) and works offline.

## Files
- `index.html` — the whole app (self-contained)
- `manifest.json` — makes it installable + adds long-press shortcuts
- `sw.js` — offline caching + best-effort daily reminder
- `icons/` — app icons

---

## 1. Put it on GitHub + go live (free, ~5 min)

```bash
# in a folder containing these files
git init
git add .
git commit -m "Vault budget app"
git branch -M main
git remote add origin https://github.com/<your-username>/vault.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Build from branch → `main` / root → Save.**
In a minute your app is live at `https://<your-username>.github.io/vault/`.

## 2. Install on your Android phone
Open that URL in **Chrome** → menu (⋮) → **Add to Home screen / Install app**.
It now behaves like a real app: full-screen, offline, own icon.
**Long-press the icon** → quick "Add expense" / "Add income" shortcuts.

## 3. (Optional) Turn it into a real APK
Go to **https://www.pwabuilder.com**, paste your GitHub Pages URL, and click
**Package → Android**. It generates a signed `.apk`/`.aab` you can sideload or put
on Play Store. (You can't build the APK from the raw files alone — it needs the
live URL, which is why step 1 comes first.)

---

## Google Sheet backend — two-way sync (real, ~5 min)

Your Google Sheet is now the **source of truth**. The app writes entries to it and
pulls your manual edits back, so you can correct history right in the sheet.

1. Open your Google Sheet → **Extensions → Apps Script**.
2. Delete the sample code, paste everything from **`google-apps-script.gs`**, Save.
3. **Deploy → New deployment → Web app.** Execute as **Me**, access **Anyone**. Deploy.
   (Reading uses JSONP and writing uses POST — both work from the app with no server.)
4. Copy the `…/exec` URL.
5. In the app: **Settings → Google Sheet backend**, paste the URL, tap **Connect**.
   The first connect seeds the sheet from the app (four tabs appear).

**The four tabs mirror your Excel:**
- **Transactions** — Date, Type, Category, Amount, Note, ID, Timestamp
- **Fixed Commitments** — Name, Monthly Amount
- **Everyday Budgets** — Category, Monthly Amount, Key
- **Plan** — income, savings, goal, vault, bonus

**How it flows:**
- Add/delete in the app → written to the sheet immediately (Auto-save on).
- Edit a row (or a budget, or the plan) **in the sheet** → tap **Pull from sheet**
  in the app, or just reopen the app, and your changes load in.
- **Push everything to sheet** re-uploads the app's full state if you ever need to
  overwrite. Rows are matched by **ID**, so nothing duplicates.

Two notes: keep the **ID** column intact when editing a transaction row (it's how the
app tracks that entry); and if you recategorize, type a category that matches one of
your envelope names so the app can map it.

## Federal Bank SMS nudge (MacroDroid, ~3 min)

A web app **cannot read SMS** — browsers block all inbox access, so no code inside
Vault can watch for messages. The clean, reliable way to get a nudge is a tiny
Android automation, and it does exactly what you asked (alert only, nothing
auto-entered):

Install **MacroDroid** (free), then create one macro:
- **Trigger:** *SMS Received* → From contains `FEDBNK` (leave message content blank).
- **Action:** *Notification* → title "New Federal Bank transaction",
  text "Tap to log it in Vault".
- **Action (add another):** *Open Website / Open Application* → your Vault URL with
  `?a=add` on the end (e.g. `https://<you>.github.io/vault/index.html?a=add`),
  set to run **on notification tap**.

Any FEDBNK debit/credit SMS then pops a reminder; tapping it opens Vault straight to
the Add page. You type the amount — Vault never guesses. (Tasker or Automate work
the same way.)

## Other notes

**True home-screen widget** (live balance on the wallpaper) still needs a native
app; the manifest **shortcuts** (long-press the icon) are the closest a PWA can do.

**Daily reminders** work while the app is open and in the background on installed
Chrome-Android (best-effort; Android controls background timing).
