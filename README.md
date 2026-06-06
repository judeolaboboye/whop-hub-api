# Whop Central Hub (Command Center) 🚀

A multi-tenant, secure, and country-agnostic dashboard designed for developers running SaaS applications on the Whop App Store. The Hub consolidates user data, synchronizes records with Notion CRM, automates email welcomes via Gmail, and provides advanced analytics that are missing from the native Whop creator panel.

---

## 🌟 Key Features
* **Multi-Tenant User Isolation**: Securely log in using "Sign in with Whop" (OAuth 2.1 + PKCE). Multiple developers can share the same hosted instance; data is strictly isolated in the database by `whopUserId`.
* **Granular Cohort Analysis**: Month-over-month (MoM) user retention heatmaps tracking churn rate and subscriber renewal lifecycles.
* **Country-Agnostic Financial Ledger & Bookkeeping**: Automatically estimates tax liabilities (e.g., UK/EU VAT, US Sales Tax, Nigeria 7.5% VAT) and outputs a detailed ledger compatible with QuickBooks and Xero.
* **Notion CRM & Onboarding Sync**: Captures verified user emails during app activation and automatically logs them into a central Notion CRM.
* **Automated Gmail SMTP Welcomes**: Triggers beautiful onboarding email flows as soon as new customers install and activate your Whop apps.

---

## 🛠 Usage Options

### Option A: Use the Live Hosted Hub (Quickest)
You don't need to host or configure anything. Simply connect your Whop Developer app to the master hub:
1. Navigate to the live hosted dashboard at [hub-api-taupe.vercel.app](https://hub-api-taupe.vercel.app/dashboard).
2. Click **Connect with Whop Account** and approve the permissions.
3. Once in your dashboard, copy the integration endpoint displayed in the panel:
   `POST https://hub-api-taupe.vercel.app/api/hub/notion-sync`
4. Hook your Whop Mini Apps into this endpoint during their onboarding flows.

---

### Option B: Self-Host (Your Own Private Command Center)
If you want to run a completely private instance of the Hub on your own infrastructure:

#### 1. Provision a PostgreSQL Database (Free Options)
* **Neon.tech / Supabase (Free Tier)**: Offers **500MB** of storage. This is perfect for single developers and easily holds between 500,000 to 1,000,000 transaction/customer rows.
* **CockroachDB Serverless (Free Tier)**: Offers up to **10GB** of storage for free! If you plan to host the hub publicly for multiple developers or have massive customer volumes, this is the recommended free option.

#### 2. Configure Environment Variables
Create a `.env.local` file (or set these inside your Vercel Project Settings):

```env
# Database Connection
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"

# Token Encryption Key (Generate a secure 32-byte / 64-hex-char key)
ENCRYPTION_KEY="your-random-32-byte-hex-key"

# Whop App OAuth Credentials (From Whop Developer Dashboard > App settings)
NEXT_PUBLIC_WHOP_APP_ID="app_xxxxxxxxx"
WHOP_CLIENT_SECRET="client_secret_xxxxxxxx"
NEXT_PUBLIC_WHOP_REDIRECT_URI="https://your-domain.vercel.app/api/auth/callback/whop"

# Notion CRM Integration
NOTION_API_KEY="ntn_xxxxxxxxx"
NOTION_DATABASE_ID="your-notion-database-id"

# Gmail Welcome Automations
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-gmail-app-password"
```

#### 3. Initialize the Database Schema
Generate client types and push the PostgreSQL schema:
```bash
npm install
npx prisma generate
npx prisma db push
```

#### 4. Deploy to Vercel
Connect your repository to Vercel. Ensure you set the environment variables in your Vercel project, and add a build command or postinstall hook in `package.json` to generate Prisma bindings:
```json
"scripts": {
  "postinstall": "prisma generate"
}
```

---

## 🔌 Connecting Whop Mini Apps (Spoke Apps)
To configure your Next.js Mini Apps to report back to the Central Hub, you can use the template instructions located in the workspace:
* **Mini App Template**: Copy `WHOP_MINI_APP_WORKSPACE_TEMPLATE.md` from the root workspace and use it to scaffold your Mini App.
* **Activation API Endpoint**: Have your Mini App make a server-side call containing the user's information:
  ```typescript
  const response = await fetch('https://your-hub-domain/api/hub/notion-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          email: 'customer@email.com',
          whopUserId: 'user_xxxxxxxx',
          name: 'Customer Name',
          appSource: 'My Whop Mini App',
          userTier: 'Trial / Premium',
      })
  });
  ```

---

## ⚖️ Open Source & Copyleft (GPL v3)
This project is open-sourced under the **GNU GPL v3 License** (see [LICENSE](LICENSE)). 

### 🛡 The Copyleft Lock and Dual-Licensing Advantage
* **Protection against Closed-Source Replication**: The GPL v3 copyleft license mandates that anyone who forks, copies, or builds upon this code to make a commercial service must open-source their entire platform under the same GPL v3 license. This legally blocks large corporations or SaaS platforms (including Whop itself) from directly absorbing this codebase into their proprietary, closed-source systems.
* **Dual-Licensing Leverage**: As the original copyright holder (Jude Victor Olaboboye), you are *not* bound by the GPL v3 terms. You retain the right to sell a commercial, proprietary license to Whop or other entities, providing significant bargaining leverage for acquisitions, licensing deals, or asset buyouts.
* **Developer Community Growth**: Any improvements or bug fixes made by community members forked from this repository must remain open-source, allowing the Hub to improve collaboratively.
