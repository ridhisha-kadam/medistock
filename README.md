# MediStock – Pharmacy Stock & Medicine Availability Web Application

**Third-Year Engineering Minor Project - I (Course Code: 22UISL505)**  
Department of Information Science and Engineering  
**SDM College of Engineering and Technology, Dharwad - 580002**

---

## 🌟 Overview & System Highlights

**MediStock** is a production-grade full-stack web application designed to eliminate the frustration of searching for essential and life-saving medicines across local pharmacies. Instead of physically visiting multiple stores or making multiple phone calls, customers can search medicines dynamically by therapeutic disease category (e.g. Blood Pressure, Diabetes, Heart, Fever, Gastric, Pain Relief, Antibiotics, etc.), generic chemical name, active composition, or brand name, compare verified prices and counter stock, and place counter-pickup reservations with an automated 48-hour pickup window and real-time alerts.

### 🔑 Key Functional Enhancements:

1. **Pharmacy Dashboard – Dynamic Stock Addition**:
   - Dynamic therapeutic disease category dropdown populated directly from the 40 master catalog categories.
   - Dynamic category-based medicine suggestions (e.g. selecting Blood Pressure displays Amlodipine, Telmisartan, Losartan, Atenolol, Metoprolol, Ramipril, etc.).
   - 1-click catalog chips to pre-fill medicine name, generic name, active composition, and strength/formulation.
   - Duplicate prevention check before catalog entry creation.
   - Batch number and expiry date tracking.

2. **Customer Medicine Catalog – Comprehensive Disease Category Search**:
   - Filter medicines dynamically across all 40 therapeutic categories with zero missing items.
   - Live search by Medicine Name, Generic Name, Active Composition, and Strength.
   - Direct counter stock availability lookups showing all verified pharmacies that stock the medicine.

3. **Customer Orders in Pharmacy Dashboard**:
   - Strict per-pharmacy isolation: each pharmacy sees strictly only reservations placed for their own store.
   - Displays actual customer registered name (never `undefined`), phone number, medicine name, category, strength/composition, ordered quantity, order date, status badge, and the exact pickup collection deadline.
   - Complete persistence in database and local storage.

4. **Customer Reservation Details Popup Modal**:
   - Dedicated "View Reservation Details" button on both customer reservations page, catalog confirmation, and pharmacy dashboard.
   - **Section A (Customer Details)**: Customer Full Name, Registered Mobile Number, Email, and City.
   - **Section B (Pharmacy Details)**: Pharmacy Name, Complete Physical Address, Contact Number, and Drug Licence Number.
   - **Reservation Information**: Reserved Medicine Name, Category, Strength/Formulation, Active Composition, Quantity, Unit/Total Price, Reservation ID, Order Date, Status, and Last Date/Time to Collect.

5. **Real-Time Multi-Party Notification Workflows**:
   - **Pharmacy Alert**: When a customer reserves a medicine, the pharmacy immediately receives an alert containing customer details (Name, Phone, Email) and reserved medicine details (Name, Category, Strength, Composition, Quantity, Price, Deadline).
   - **Customer Alert on Action**: When the pharmacy owner accepts (approves) or rejects a reservation, the customer receives an immediate notification with clear status and pickup instructions.
   - **Admin Alert**: When a new pharmacy registers, the administrator receives an alert: *"New Pharmacy Registration: [Pharmacy Name] added their details and is waiting for approval."*
   - **Pharmacy Alert on Admin Decision**: When the admin approves a pharmacy, the pharmacy receives a congratulatory approval notification. If rejected, they receive a clear description with the exact rejection reason.

6. **Safe Database Cleanup**:
   - Preserves all genuine pharmacy names and accounts.
   - Preserves all registered customer credentials and profiles.
   - Preserves the entire 245-item master medicine catalog.
   - Safely removes previously added medicine stock so pharmacies start fresh.
   - Starts with an empty reservation list.

---

## 💻 Visual Studio Code (VS Code) Execution Guide

Follow these simple, step-by-step instructions to run MediStock on your computer using VS Code:

### Prerequisites:
- **Node.js** (v18 or higher): Download from [nodejs.org](https://nodejs.org/)
- **Visual Studio Code**: Download from [code.visualstudio.com](https://code.visualstudio.com/)
- **Google Chrome** or any modern web browser

### Step 1: Open the Project in VS Code
1. Extract `medistock-fullstack-app.zip` to your preferred folder (e.g. `C:\Projects\medistock-fullstack-app`).
2. Open VS Code, click **File** &rarr; **Open Folder...**, and select the extracted `medistock-fullstack-app` folder.

### Step 2: Open Terminal & Install Dependencies
1. In VS Code, open the integrated terminal: press ``Ctrl + ` `` (or click **Terminal** &rarr; **New Terminal**).
2. Install the required project packages by running:
   ```bash
   npm install
   ```

### Step 3: Environment Setup (`.env`)
A ready-to-use `.env` file is already included with default configurations:
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ADMIN_SETUP_SECRET=MEDISTOCK_SECRET_2026
```
*(Note: MediStock runs seamlessly out of the box using its resilient offline-first database. If connecting to a cloud Supabase database, paste your project URL and public anon key into these variables).*

### Step 4: Start the Development Server
In your VS Code terminal, start the local Vite server:
```bash
npm run dev
```
You will see output similar to:
```
  VITE v6.x.x  ready in 450 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```
Hold `Ctrl` and click `http://localhost:5173/` in your terminal, or open Google Chrome and navigate to `http://localhost:5173/`.

### Step 5: Build for Production (Optional Verification)
To verify that all TypeScript code compiles with zero errors:
```bash
npm run build
```

---

## 🗄️ Safe Database Cleanup Guide

If you wish to reset test orders and inventory while keeping all registered pharmacies and customer accounts:

### Method A: Standalone SQL Script (for Supabase Cloud DB)
1. Open your Supabase Dashboard &rarr; **SQL Editor**.
2. Open the file `supabase/safe_cleanup.sql`.
3. Copy and paste the contents into the SQL Editor and click **Run**.
4. **What this does:**
   - Deletes rows in `public.bills` and `public.reservations`.
   - Deletes rows in `public.inventory` (so pharmacies start with a clean, empty stock list).
   - Deletes past test `public.alerts`.
   - **Guarantees 100% preservation** of `public.pharmacies`, `public.profiles` (customers, pharmacies, admins), and `public.medicines`.
   - Uses zero `DROP TABLE` or cascading drops.

### Method B: Automated Local Cleanup
- The offline store automatically backs up all existing profiles and pharmacy names into `localStorage` under `medistock_db_backup_<timestamp>`.
- Registered pharmacy accounts and customer accounts are kept intact.
- Inventory stock and reservations are set to empty so you can demonstrate adding stock and placing reservations from scratch.

---

## 🧪 Demonstration & Testing Workflow

### 1. Customer Experience:
1. Navigate to `/search` or `/catalog`.
2. Select a disease category such as **Blood Pressure (BP)** or **Diabetes**.
3. View available medicines (Amlodipine, Telmisartan, Metformin, etc.).
4. Click on a medicine to inspect dosage variants and see which pharmacies have stock.
5. Click **Reserve Medicine (48h)**.
6. A confirmation banner appears displaying the reservation reference ID, customer phone, pickup collection deadline, and a **View Reservation Details** button.
7. Click **View Reservation Details** to open the comprehensive modal showing **Customer Details**, **Pharmacy Details**, and **Medicine Details**.
8. Go to **My Reservations** (`/customer/reservations`) to view active countdown timers and notification dispatches.

### 2. Pharmacy Owner Experience:
1. Log in as a pharmacy owner.
2. In **Pharmacy Dashboard** &rarr; **Add Medicine to Stock**:
   - Select a disease category (e.g. *Blood Pressure*).
   - Notice the category suggestions appearing as 1-click chips.
   - Enter stock quantity, price, batch number, and expiry date.
   - Click **Save Medicine to Stock**.
3. In **Reservations / Orders Tab**:
   - View customer reservations placed for this pharmacy.
   - Inspect columns: Customer Name & Phone, Medicine Name & Category, Strength/Composition, Qty, Total (₹), Order Date, Last Date to Pick Up, and Status.
   - Click **View Details** to open the complete Reservation Details popup.
   - Click **Accept** to approve or **Reject** to cancel. The customer will immediately receive a notification in their bell icon.
   - Click **Mark Ready** when prepared at the counter.
   - Click **Mark Collected / Bill** to generate the official tax invoice receipt.

### 3. Administrator Experience:
1. Log in as Administrator (`/login`).
2. If a new pharmacy registers, a notification alert is automatically delivered to the Admin bell icon.
3. In **Pharmacy Verification Tab**, review submitted pharmacy details (owner name, licence number, address, contact).
4. Click **Approve** (or click **Reject** with a clear rejection reason).
5. The pharmacy receives a real-time notification alert confirming approval or detailing the rejection reason.

---

## 📁 Repository & File Structure

```
medistock/
├── index.html                   # HTML entry point with meta tags
├── package.json                 # Project dependencies and npm scripts
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite bundler configuration
├── supabase/
│   ├── schema.sql               # Complete Supabase PostgreSQL schema with RLS
│   ├── seed_medicines.sql       # SQL seed for all 245 catalog medicines
│   └── safe_cleanup.sql         # Non-destructive safe database cleanup script
├── src/
│   ├── App.tsx                  # Main application routes and AuthProvider
│   ├── main.tsx                 # React application mounting
│   ├── index.css                # Tailwind CSS stylesheets
│   ├── types/
│   │   └── database.ts          # TypeScript database interfaces & snapshot types
│   ├── services/
│   │   ├── api.ts               # Central API service, notifications, & safe cleanup
│   │   └── supabase.ts          # Supabase client & environment helpers
│   ├── context/
│   │   └── AuthContext.tsx      # Authentication state and role management
│   ├── data/
│   │   └── medicineCatalogData.ts # 245 verified medicines & 40 disease categories
│   ├── components/
│   │   ├── Navbar.tsx           # Navigation bar with real-time notification bell
│   │   ├── Footer.tsx           # Application footer
│   │   ├── StatusBadge.tsx      # Clean status badges
│   │   ├── MapWidget.tsx        # Leaflet interactive map with pharmacy pins
│   │   ├── Modal.tsx            # Base modal dialog
│   │   ├── InvoiceModal.tsx     # Printable tax invoice receipt modal
│   │   ├── CallPharmacyModal.tsx # Counter dialing modal
│   │   ├── EditCustomerProfileModal.tsx # Customer profile editing modal
│   │   ├── EditPharmacyModal.tsx # Pharmacy profile editing modal
│   │   └── ReservationDetailsModal.tsx # Comprehensive reservation details popup
│   └── pages/
│       ├── HomePage.tsx         # Landing page with search bar & category shortcuts
│       ├── LoginPage.tsx        # Authentication login page
│       ├── RegisterPage.tsx     # Customer, Pharmacy, & Admin registration page
│       ├── SearchResultsPage.tsx # Medicine search, filters, & map view
│       ├── MedicineCatalogPage.tsx # Master medicine catalog & category browser
│       ├── PharmacyDetailsPage.tsx # Pharmacy public profile & listed inventory
│       ├── PharmacyDashboardPage.tsx # Pharmacy inventory & customer orders dashboard
│       ├── CustomerReservationsPage.tsx # Customer reservations & notifications
│       ├── PendingVerificationPage.tsx # Pharmacy verification pending / rejected view
│       └── AdminDashboardPage.tsx # Administrator pharmacy verification & reports
```

---

## 📜 Compliance & Academic Project Information

- **Institution**: SDM College of Engineering and Technology, Dharwad - 580002
- **Department**: Information Science and Engineering
- **Course**: Minor Project - I (22UISL505)
- **Year**: 2026
- **Status**: Production-Ready / Complete Compliance with SRS & Design Phase Specifications
