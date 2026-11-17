# MediStock — Local Medicine Availability Finder & Counter Reservation Platform

**Production-Grade Full-Stack Web Application**  
Department of Information Science and Engineering — SDM College of Engineering and Technology, Dharwad

---

## 🌟 Overview & Architectural Summary

**MediStock** is an end-to-end, production-ready healthcare web application engineered to solve the acute problem of local medicine availability. Instead of traveling across pharmacies or making uncoordinated calls during emergencies, customers can locate verified in-stock medicines, compare real-time prices, view road distances on interactive maps, and place guaranteed counter reservations with an automated 48-hour pickup window and multi-party notifications.

### 🛡️ Core Highlights & Security Architecture

1. **First-Time Admin Setup & Single-Admin Guarantee (`/admin/setup`)**:
   - The platform starts with zero default or hardcoded administrator accounts.
   - Initial boot presents the dedicated First-Time Administrator Registration page.
   - **Single-Admin Enforcement**: Both application logic and database triggers (`trg_enforce_single_admin` in PostgreSQL) enforce that exactly ONE administrator account can ever exist.
   - Once initialized, public administrator registration is permanently locked with the prompt:  
     `"Admin account has already been created. Please log in."`

2. **Clean Initial Database State & Controlled Resets**:
   - Zero dummy records, fake statistics, or sample pharmacy listings.
   - Clean slate: all operational data (inventory, reservations, orders, bills, alerts, audit logs) starts empty.
   - Complete Database Reset script provided in `supabase/complete_database_reset.sql` with foreign-key-safe dependency ordering.
   - Safe in-dashboard maintenance control with 1-click JSON database backup downloads.

3. **Master Medicine Catalogue (245+ Verified Generic Formulations)**:
   - Comprehensive catalogue covering 40 therapeutic disease categories (Blood Pressure, Diabetes, Gastrointestinal, Pain, Fever, Antibiotics, Cardiac, Respiratory, Dermatology, etc.).
   - Full chemical composition, active ingredients, verified strengths, dosage forms, routes of administration, and regulatory classifications (Prescription Required `Rx` vs Over-The-Counter `OTC`).

4. **Pharmacy Dashboard & Dynamic Stock Management**:
   - Role-protected dashboard accessible only to registered, approved pharmacies.
   - 2-Step stock addition: select from 40 disease categories → dynamically populate verified catalogue medicines with 1-click auto-fill.
   - "Add New Medicine" option for custom unlisted items.
   - Batch number, unit price, quantity, and expiry date management with low-stock (< 10 units) and near-expiry alerts.
   - Order & Reservation management: real-time customer name, mobile number, ordered quantity, order date, status controls, and pickup collection deadlines.

5. **Customer Experience & Atomic Counter Reservation**:
   - Disease, generic name, brand name, and locality-based search.
   - Interactive OpenStreetMap/Leaflet integration showing verified pharmacy locations and distances.
   - Atomic reservation creation with automatic inventory reduction and 48-hour pickup expiration timers.
   - 2-Section Reservation Details Popup: Complete Customer Details (Name, Phone, Email) and Pharmacy Details (Store Name, Address, Contact, License).

6. **Real Billing & Printable Invoices**:
   - Generated strictly for genuine completed transactions.
   - Displays sequential Bill Number, GST breakdown, itemized line items, pharmacy drug license, customer contact info, and printable PDF invoice view.

7. **Multi-Party Notification Engine**:
   - Real-time alerts for customer reservation creation, pharmacy approval/rejection, admin pharmacy onboarding notices, and admin decision feedback.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React Icons, React Router v6
- **Maps**: Leaflet & OpenStreetMap (zero paid Google API keys required)
- **Database & Auth**: Supabase PostgreSQL, Supabase Authentication, Row-Level Security (RLS)
- **Offline-First Layer**: Persistent `LocalDatabaseStore` fallback with automatic cloud synchronization
- **Build Tool**: Vite v6
- **Version Control & CI/CD**: Git, GitHub (`https://github.com/ridhisha-kadam/medistock.git`), Vercel Production Deployment

---

## 📁 Project Directory Structure

```
MediStock_Final/
├── .env.example                     # Environment template for Supabase credentials
├── .gitignore                       # Git exclusion rules (node_modules, dist, .env)
├── index.html                       # Application HTML entry point
├── package.json                     # Dependencies, scripts, and project metadata
├── postcss.config.js                # PostCSS Tailwind plugins
├── tailwind.config.js               # Tailwind styling configuration
├── tsconfig.json                    # TypeScript compiler options
├── vercel.json                      # Vercel deployment and SPA routing configuration
├── vite.config.ts                   # Vite build configuration
├── src/
│   ├── App.tsx                      # Root component, routing, and route guards
│   ├── main.tsx                     # React DOM entry point
│   ├── index.css                    # Tailwind CSS imports and custom utility classes
│   ├── components/
│   │   ├── CallPharmacyModal.tsx    # Click-to-call direct contact modal
│   │   ├── EditCustomerProfileModal.tsx # Customer profile editing modal
│   │   ├── EditPharmacyModal.tsx    # Pharmacy profile and license editing modal
│   │   ├── Footer.tsx               # Healthcare footer component
│   │   ├── InvoiceModal.tsx         # Official printable bill/invoice modal
│   │   ├── MapWidget.tsx            # Leaflet map with interactive pharmacy pins
│   │   ├── Modal.tsx                # Reusable accessible dialog component
│   │   ├── Navbar.tsx               # Responsive navbar with real-time alert notifications
│   │   ├── ReservationDetailsModal.tsx # 2-section Customer & Pharmacy reservation popup
│   │   └── StatusBadge.tsx          # Inventory and reservation status badges
│   ├── context/
│   │   └── AuthContext.tsx          # Authentication context, session persistence, role guards
│   ├── data/
│   │   └── medicineCatalogData.ts   # 245+ verified medicines across 40 therapeutic categories
│   ├── pages/
│   │   ├── AdminDashboardPage.tsx   # Approvals, statistics, catalogue management, backups
│   │   ├── AdminSetupPage.tsx       # First-Time single administrator setup page
│   │   ├── CustomerReservationsPage.tsx # Customer bookings, status tracking, bill viewing
│   │   ├── HomePage.tsx             # MediStock discovery landing page
│   │   ├── LoginPage.tsx            # Secure role-based login with password reset modal
│   │   ├── MedicineCatalogPage.tsx  # Master catalogue with disease filtering & Rx/OTC pills
│   │   ├── PendingVerificationPage.tsx # Onboarding screen for unverified pharmacies
│   │   ├── PharmacyDashboardPage.tsx # Pharmacy inventory, reservations, billing, alerts
│   │   ├── PharmacyDetailsPage.tsx  # Detailed pharmacy view with active inventory listings
│   │   ├── RegisterPage.tsx         # Customer and Pharmacy registration forms
│   │   └── SearchResultsPage.tsx    # Medicine search, pharmacy comparisons, map view
│   ├── services/
│   │   ├── api.ts                   # Fullstack API services, validation, store logic
│   │   └── supabase.ts              # Supabase client initialization
│   └── types/
│       └── database.ts              # Strict TypeScript definitions for all database entities
└── supabase/
    ├── complete_database_reset.sql  # SQL script to reset database to clean initial state
    ├── safe_cleanup.sql             # SQL script to clear stock/orders while keeping accounts
    ├── schema.sql                   # Complete PostgreSQL schema, tables, constraints, RLS
    └── seed_medicines.sql           # SQL seeds for all 245 master catalogue medicines
```

---

## 💻 Visual Studio Code (VS Code) Execution Guide

### Prerequisites:
- **Node.js** (v18 or higher): Download from [nodejs.org](https://nodejs.org/)
- **Visual Studio Code**: Download from [code.visualstudio.com](https://code.visualstudio.com/)
- A modern web browser (Google Chrome, Edge, Firefox, Brave)

### Step 1: Open Folder in VS Code
1. Extract `MediStock_Final.zip` (or open the existing project directory `medistock-fullstack-app`).
2. Launch VS Code, click **File** → **Open Folder...**, and select the folder.

### Step 2: Install Dependencies
Open the VS Code integrated terminal (`Ctrl + ~` or **Terminal** → **New Terminal**) and run:
```bash
npm install
```

### Step 3: Configure Environment (`.env`)
Create or edit your `.env` file in the root directory:
```env
# MediStock Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_ADMIN_SETUP_SECRET=MEDISTOCK_SECRET_2026
```
*(Note: MediStock includes a complete offline-first database fallback. The web app functions fully with 0 errors even prior to cloud Supabase configuration).*

### Step 4: Run the Local Development Server
In your VS Code terminal, start the Vite development server:
```bash
npm run dev
```
Output:
```
  VITE v6.x.x  ready in 350 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```
Hold `Ctrl` and click `http://localhost:5173/` to open MediStock in your browser.

### Step 5: Verify Production Build
Run the production build command to confirm zero TypeScript compilation errors:
```bash
npm run build
```

---

## 🚀 Deployment & Continuous Integration Guide

### Connected GitHub Repository:
- **Remote URL**: `https://github.com/ridhisha-kadam/medistock.git`
- **Main Branch**: `main`

### Existing Vercel Project Connection:
Because your GitHub repository is connected to Vercel, every commit pushed to `origin/main` automatically triggers a zero-downtime production deployment on Vercel:

1. **Pushing Updates**:
   ```bash
   git add .
   git commit -m "feat: complete website implementation and direct deployment"
   git push origin main
   ```
2. **Vercel Build Command**:
   ```bash
   node node_modules/vite/bin/vite.js build
   ```
3. **Vercel Output Directory**:
   ```
   dist
   ```
4. **Environment Variables on Vercel Dashboard**:
   In your Vercel project settings (**Settings** → **Environment Variables**), add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_SETUP_SECRET` = `MEDISTOCK_SECRET_2026`

---

## 🧪 Comprehensive Feature Verification Checklist

| Test Item | Steps to Verify | Expected Result |
| :--- | :--- | :--- |
| **1. First-Time Admin Setup** | Visit `/admin/setup` on clean boot | Shows Admin registration form. Submitting creates single Admin account and navigates to `/admin`. |
| **2. Single-Admin Security** | Visit `/admin/setup` again after creation | Displays: *"Admin account has already been created. Please log in."* Form is completely locked. |
| **3. Pharmacy Registration** | Click Create Account → Select **Pharmacy** | Fills store details, owner name, mobile, address, license number. Account created with `PENDING_VERIFICATION`. |
| **4. Admin Approval Workflow** | Log in as Admin → Verification Tab | New pharmacy appears under Pending. Click **Approve**. Pharmacy status changes to `APPROVED`. |
| **5. Add Medicine to Stock** | Log in as approved Pharmacy → Click **Add Stock** | Step 1: Select category (e.g. Blood Pressure). Step 2: Populates relevant medicines (Amlodipine, Telmisartan). Click auto-fills details. Set price, qty, batch, expiry. Stock saved. |
| **6. Customer Search & Map** | Go to Home → Search disease or medicine | Displays matching medicines, pricing, and live pharmacy pins on interactive Leaflet map. |
| **7. Customer Reservation** | Log in as Customer → Click **Reserve** | Sets quantity, confirms reservation. Stock decreases atomically. 48-hour deadline countdown begins. |
| **8. Reservation Details Popup** | Click **View Reservation Details** | Opens 2-section modal displaying complete Customer details (name, phone) and Pharmacy details (store name, address, contact). |
| **9. Multi-Party Notifications** | Check bell icon on Navbar | Customer, Pharmacy, and Admin receive contextual real-time notifications for bookings and approvals. |
| **10. Official Invoice Generation** | In Pharmacy Dashboard, mark collected | Displays official pickup bill with Bill Number, GST breakdown, and **Print / Save PDF** action. |
| **11. Forgot Password Flow** | On Login page, click **Forgot password?** | Modal allows entering registered email and setting new password (min 8 chars, letter + number). |
| **12. Database Safety & Cleanup** | In Admin Dashboard, run Maintenance | Offers 1-click JSON backup download, Safe Cleanup, and Complete Database Reset. |

---

## 🔄 Future Feature Workflow (Same Website & Same Deployment)

For future enhancements:
1. **Inspect**: Inspect the existing implementation in `src/`.
2. **Modify**: Implement features cleanly using the established React, TypeScript, and Tailwind conventions.
3. **Test**: Run `npm run build` in the terminal to verify zero build errors.
4. **Deploy**: Commit and push to `origin/main` (`git push origin main`). Vercel automatically deploys to the same production URL without recreating the project or changing the web link!
