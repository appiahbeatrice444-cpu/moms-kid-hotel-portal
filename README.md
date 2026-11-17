# MOM'S KID HOTEL Portal

A comprehensive hotel management and guest services web application with a Node.js/Express API, native SQLite storage (`node:sqlite`), mandatory email-code two-factor authentication, individually styled role dashboards, encrypted automated backups, and complete hotel business operations.

## Key Features

1. **Hotel Management Operations**:
   - **Room Inventory & Catalog**: Manage room numbers, types (Deluxe, Executive, Penthouse, etc.), nightly rates, guest capacities, amenities, and real-time status (`available`, `occupied`, `cleaning`, `maintenance`).
   - **Guest Reservations**: End-to-end booking engine with date overlap collision prevention, stay duration & total pricing calculation, and unique `MKH-XXXXXX` references.
   - **Front Desk Workflow**: Seamless check-in and check-out management that automatically coordinates with room status (check-in sets room to `occupied`; check-out sets room to `cleaning`).
   - **Customer Self-Service**: Guests can browse the room catalog, view photos & amenities, book reservations directly, and cancel upcoming stays.

2. **Deleted Accounts Archive**:
   - Deleting an account by an administrator permanently deactivates the user and invalidates all active sessions/challenges, while archiving full historical details in the `deleted_users` database table (original ID, email, role, deletion timestamp, deleting admin, and reason).
   - Dedicated "Archived Accounts" audit tab in the General Manager's dashboard.

3. **Non-Functional Preferences & "Restore Defaults"**:
   - Quick settings bar allows users to toggle **Display Mode** (Auto / Light / Dark), **Language** (EN, FR, ES, DE, ZH, JA, AR, PT, IT, RU), and **Time Format** (12-hour AM/PM vs. 24-hour).
   - **Restore Defaults Button**: One-click action to reset theme, mode, language, and time preferences to factory defaults without altering any user accounts, rooms, or reservation data.

4. **Modern UI/UX & Responsive Dashboards**:
   - Polished theme system with comprehensive Dark Mode support (`[data-theme="dark"]`).
   - Interactive data tables with live instant client-side search filtering.
   - Responsive tabbed navigation tailored to each role's workflow.
   - Rich modals for room bookings, room inventory additions, and account deletion confirmation with audit reasoning.

## Run locally

Requirements: Node.js 22.13 or newer.

```powershell
npm.cmd install
npm.cmd run create-admin
npm.cmd start
```

Open `http://127.0.0.1:3000`. The first command creates the administrator account using the email in `INITIAL_ADMIN_EMAIL` and asks for a password twice in a hidden terminal prompt. The password is validated and stored only as a salted hash; it is never added to source or `.env`. For safety, use a unique password that has not been shared in a message.

On first start, `setup-env.js` creates a local `.env` with random password-pepper, session, and backup-encryption keys, plus the initial admin email and SMTP settings. The `.env` file is excluded by `.gitignore`. Keep a protected offline copy of the encryption keys; losing the backup key makes encrypted backups unrecoverable.

The local `.env` can use Gmail SMTP for `appiahbeatrice444@gmail.com`. Railway may block direct SMTP connections; for Railway, use Gmail's HTTPS API instead:

1. In [Google Cloud Console](https://console.cloud.google.com/), create/select a project and enable the Gmail API.
2. Configure the OAuth consent screen for the Gmail sending account and add that account as a test user if the app is in Testing.
3. Create an OAuth client ID. For the OAuth Playground method, use a Web application client and add `https://developers.google.com/oauthplayground` as an authorized redirect URI.
4. Open [OAuth 2.0 Playground](https://developers.google.com/oauthplayground), open its settings, select **Use your own OAuth credentials**, and enter the client ID and secret. Authorize `https://www.googleapis.com/auth/gmail.send`, exchange the authorization code, and copy the returned refresh token.
5. In Railway service Variables set `EMAIL_TRANSPORT=gmail-api`, `GMAIL_USER` to the authorized sender address, and `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, and `GMAIL_REFRESH_TOKEN` to the OAuth values. Store secrets only in Railway Variables; never commit or share them. The Gmail account used for OAuth must match `GMAIL_USER`.

Google OAuth apps left in Testing can have refresh tokens expire after seven days; for ongoing use, publish the consent configuration to Production and complete any Google verification requirements that apply to your app. Remove the SMTP app password from Railway when switching to the API. Every sign-in requires a random six-digit code sent to the account email; it expires after five minutes and is limited to five attempts. If email delivery is not configured or sending fails, sign-in is denied; password-only access is never allowed.

The sign-in page's **Forgot your password?** flow emails a separate six-digit reset code. It expires after ten minutes, is limited to five attempts, and is stored only as a keyed hash. Reset requests use a generic response so the page does not reveal whether an email has an account. A successful reset replaces the salted/peppered password hash, invalidates that account's existing sessions and pending authentication challenges, and requires the user to sign in and complete email 2FA again.

Customers can create their own accounts from the sign-in page. Registration always creates a `customer` account; submitted role values cannot grant elevated access. Admins and managers provision staff and manager accounts according to their permissions. The first administrator is created as a one-time setup operation, locally or from the Render service Shell. On every sign-in, users select their account type and enter their existing email and password; the selected role must match the stored account before an email code is issued. Signing out destroys the session, and the next sign-in requires a new email code.

Run checks with:

```powershell
npm.cmd test
```

## Deploy to Railway

This application uses SQLite, so production requires a Railway persistent volume. The included `.railwayignore` explicitly excludes `.env`, the local database, backups, and the Supabase certificate from CLI uploads. Create one Railway service and attach a volume mounted at `/data`; set `DB_PATH=/data/beatrice.sqlite` and `BACKUP_DIR=/data/backups` in that service's variables before relying on it for production data. Run a single service instance because SQLite is not a shared multi-instance database.

From the project directory, run `railway up` to upload and deploy with the Railway CLI. In the Railway dashboard, open the created service and set `HOST=0.0.0.0`, `NODE_ENV=production`, `TRUST_PROXY=1`, the persistent-disk paths above, stable random 32-byte hex values for `PASSWORD_PEPPER`, `SESSION_SECRET`, and `BACKUP_ENCRYPTION_KEY`, `INITIAL_ADMIN_EMAIL`, and the Gmail API variables listed above. Set `EMAIL_TRANSPORT=gmail-api`; direct SMTP is not reachable from this Railway service.

After variables and the volume are configured, redeploy. Create the first admin once from a service shell by temporarily setting `ADMIN_BOOTSTRAP_PASSWORD` to a unique 12–128 character value, running `npm run create-admin`, and immediately removing that variable. Configure the optional S3 settings below for off-site backup copies. Test `/api/auth/status`, admin login, email 2FA, dashboard access, logout, and an encrypted backup.

Keep application keys stable across deploys. Losing the persistent volume loses the SQLite database, and losing the backup key makes encrypted backups unrecoverable. Railway hosting and persistent-volume usage may incur charges; check the current plan and usage before deploying.

## Access levels

| Role | Permissions |
| --- | --- |
| `admin` | General Manager's Suite: complete hotel overview; manage room catalog, reservations, and active user accounts; access permanent Deleted Accounts Archive; review security audit events; trigger AES-256-GCM encrypted backups. Admin accounts cannot be deleted, and the final admin cannot be demoted. |
| `manager` | Operations Lounge: coordinate guest services team and room inventory; create staff and customer accounts; update room status; manage reservations and front desk check-in/out. Cannot assign admin roles, access deleted accounts archive, or trigger system backups. |
| `staff` | Guest Services & Front Desk: perform guest check-ins and check-outs; view live room availability and cleaning status board; read reservations and customer directory; cannot manage system accounts or access admin controls. |
| `customer` | Guest Portal: browse available suites and room catalog; book real-time reservations; review upcoming and past stays; cancel confirmed bookings; manage personal account profile and 2FA status. |

Authorization is checked by API middleware on every protected request. Admin, manager, staff, and customer dashboards have distinct data and actions; hiding an interface control does not grant or revoke access. Admin account removal is permanently destructive, requires a browser confirmation, revokes the target's sessions and pending challenges, and is recorded in the audit log. Administrator accounts cannot be removed through the dashboard. To add another administrator, an existing admin must change that account's role.

## Backups and cloud storage

The service creates an encrypted online SQLite snapshot at startup and then at the configured interval. It retains encrypted local copies in `BACKUP_DIR`; `BACKUP_KEEP_LOCAL` controls how many are kept. The administrator can also trigger a snapshot from the dashboard. Each snapshot is encrypted using AES-256-GCM with a fresh random nonce before it is written or uploaded.

Cloud upload uses the AWS S3 API and AWS SDK credential resolution. To enable it, set `BACKUP_S3_BUCKET` and `AWS_REGION` in `.env`, and provide credentials through the standard AWS environment variables or an instance/task role. For an S3-compatible service, also set `AWS_ENDPOINT_URL`. On Render, add these values in the service's environment settings. Until configured, encrypted backups are written to the persistent disk only; off-site backup storage is strongly recommended.

Treat `BACKUP_ENCRYPTION_KEY` as a recovery key. Store an independent protected copy outside the application host and cloud bucket. If the host and its `.env` are both lost, the cloud backup alone is not sufficient to decrypt the database.

## Deployment notes

The local default bind address is `127.0.0.1`. Render's blueprint binds to `0.0.0.0`, sets production cookie security, and terminates HTTPS at Render's edge. Keep the local `.env` private and use Render's environment settings for production secrets. The application encrypts backups before S3 upload and requests bucket-side AES encryption as defense in depth. It does not provision a cloud bucket or manage provider credentials.

The SQLite database, `.env`, and local backups are runtime data and are ignored by Git. Email-based password recovery, external identity providers, and multi-instance session sharing are not included in this assignment implementation.
