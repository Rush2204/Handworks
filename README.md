# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

---

## ✉️ Contact Form Email Setup

The **Request a Quote** form on `/contact` posts to a server-side endpoint
(`src/pages/api/send-quote.ts`) that emails the submission to the address
configured in `.env`. The site is built mostly static — only `/api/send-quote`
runs on the server, courtesy of the `@astrojs/node` adapter.

### How the pieces fit together

| File | Role |
| :--- | :--- |
| `src/pages/contact.astro` | Form markup + client script that POSTs JSON and shows success/error banners. |
| `src/pages/api/send-quote.ts` | Server endpoint: validates input, builds the email, sends via Nodemailer. |
| `src/lib/email-template.ts` | Generates the responsive HTML + plain-text email body. |
| `.env` | SMTP credentials (gitignored). Use `.env.example` as a template. |

### 1. Configure SMTP credentials

Copy the example file and fill in your credentials:

```sh
cp .env.example .env
```

Open `.env` and set:

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-account@gmail.com
SMTP_PASSWORD=your-16-char-app-password

CONTACT_RECIPIENT=alejandrasandoval4321@gmail.com
MAIL_FROM="Handworks Website <your-account@gmail.com>"
```

#### Getting a Gmail App Password (recommended for local testing)

1. Enable **2-Step Verification** on your Google account.
2. Visit https://myaccount.google.com/apppasswords.
3. Create an app password for "Mail" and copy the 16-character code.
4. Paste it into `SMTP_PASSWORD` (no spaces).

> **Why an App Password?** Google blocks plain-password SMTP logins. App
> Passwords are scoped, revocable, and don't expose your main credentials.

#### Using a different SMTP provider

Nodemailer is provider-agnostic — swap `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER`
/ `SMTP_PASSWORD` to use Brevo, Mailgun, Amazon SES, Postmark, your own
mail server, etc. No code changes are required. The application enforces no
sending limits; the only cap is whatever the upstream provider applies.

For port `587` (STARTTLS), set `SMTP_SECURE=false`. For port `465` (implicit
TLS), keep `SMTP_SECURE=true`.

### 2. Run the dev server

```sh
npm install
npm run dev
```

Open http://localhost:4321/contact, fill in the form, and click **Send
Message**. You should see a green success banner; the email arrives in
the inbox set as `CONTACT_RECIPIENT`.

### 3. Test the production build locally

```sh
npm run build
npm run preview
```

The Node adapter starts the SSR server so the `/api/send-quote` endpoint
works in the preview build, just like it will in production.

### 4. Smoke-test the API endpoint directly

You can hit the endpoint with `curl` (or PowerShell `Invoke-RestMethod`) to
validate SMTP wiring without using the UI:

```sh
curl -X POST http://localhost:4321/api/send-quote \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "phone": "+1 555 0100",
    "company": "Test Co",
    "inquiryType": "Request a Quote",
    "message": "This is a test message from curl."
  }'
```

Expected responses:
- `200 { "ok": true, ... }` — email sent.
- `422 { "ok": false, "fields": { ... } }` — validation failed.
- `500 { "ok": false, "error": "..." }` — SMTP failure (check terminal logs).

### Troubleshooting

| Symptom | Likely cause |
| :--- | :--- |
| `Invalid login: 535-5.7.8 Username and Password not accepted` | Using your normal Gmail password instead of an App Password. |
| `Error: SMTP credentials are not configured` | `.env` is missing or values are blank. Restart `npm run dev` after editing `.env`. |
| Email never arrives | Check the spam folder; verify `CONTACT_RECIPIENT` is correct; check the dev server console for `[send-quote]` errors. |
| `self-signed certificate in certificate chain` | Your network proxy is intercepting TLS — try a different network or set `SMTP_SECURE=false` with port `587`. |

