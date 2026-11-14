# MediStock – A Local Medicine Availability Finder

**Third-Year Engineering Minor Project - I (Course Code: 22UISL505)**  
Department of Information Science and Engineering  
**SDM College of Engineering and Technology, Dharwad - 580002**

---

## 🌟 Executive Overview & Purpose

**MediStock** is a production-grade, full-stack web application designed to solve the common real-world problem of finding prescription and essential medicines across local medical stores. Instead of travelling from pharmacy to pharmacy or making endless phone calls, patients can search for medicines by generic name, brand name, composition, or location (PIN code / GPS coordinates), check reported stock levels, compare prices, inspect pharmacy operating hours, and place atomic counter-pickup reservations.

The application strictly implements and synthesizes the four official MediStock reference documents:
1. **MediStock Design Phase Report** (Figures 9.1 through 9.7 user interfaces, 3-tier architecture, client-server model, UML diagrams, ER model, DFD Level 0 & 1).
2. **MediStock Software Requirements Specification (SRS)** (Functional requirements FR-01 through FR-16, Performance requirements PR-01 through PR-06, data integrity rules, stale data indicators).
3. **MediStock API Catalogue** (All 32 specified API endpoints across 8 functional modules).
4. **MediStock Project Synopsis** (Core objectives 1 to 8, literature survey, and academic problem statement).

---

## 🚀 Key Features & Strict Compliance

### 1. Strict Zero-Dummy-Data Compliance
* Starts with an initially **completely empty database**.
* **Zero prefilled fake data, zero dummy pharmacies, zero dummy customers, zero dummy medicines.**
* All dashboard counts, inventory listings, audit logs, and search results originate strictly from actual user submissions.
* Professional empty-state handling:
  * *"No pharmacies registered yet."*
  * *"No stock listed yet. Add your first medicine with the form below."*
  * *"No pharmacy reports '&lt;medicine&gt;'."*
  * *"No active reservations found."*
  * *"No bills generated yet."*

### 2. Form Validation (All User-Entered Fields Mandatory)
* **Indian Mobile Numbers**: Strictly validated 10-digit Indian numbers starting with 6, 7, 8, or 9.
* **Indian PIN Codes**: Strictly validated 6-digit postal codes (e.g. 580001, 580002).
* **Emails & Passwords**: Standard RFC email format and minimum 8-character passwords with alphanumeric requirements.
* **Prices & Quantities**: Validated positive whole numbers for stock and non-negative decimals for prices.

### 3. Role-Based Access Control (RBAC)
* **Customer (`CUSTOMER`)**:
  * Public medicine search by name, brand, generic composition, city, or PIN code.
  * Browser geolocation support with Haversine distance calculation in kilometers.
  * Filter by "In stock only" and sort by Most stock, Lowest price, or Nearest distance.
  * Comparison view across participating pharmacies.
  * Counter-pickup medicine reservations.
  * Reservation status tracking and official pickup invoice/receipt downloads.
* **Pharmacy Owner (`PHARMACY`)**:
  * Dedicated self-registration with drug licence number, address, contact person, and operating hours.
  * Initial safety state: `PENDING_VERIFICATION` (cannot publish stock or appear in customer searches until approved).
  * 6 Real-time stat cards (Medicines listed, In stock, Low stock, Out of stock, Pending reservations, Completed reservations).
  * Inventory management table (Add, Edit, Delete, Update quantity & price).
  * Shared medicine catalogue integration (add new medicines with composition).
  * Reservation workflow management (Accept, Reject, Mark Ready for Pickup, Mark Completed).
  * Automated official bill generation upon pickup completion.
  * Stock alerts when quantities drop below 10 units.
* **System Administrator (`ADMIN`)**:
  * One-time atomic registration protected by `ADMIN_SETUP_SECRET`. Once registered, public admin registration is permanently locked.
  * Pharmacy Verification Portal: Pending review, Verified (Approved), Rejected (mandatory rejection reason required), and Disabled.
  * Platform metrics, registered customer oversight, and full audit logs.
  * **Strict safety rule**: Admin does *not* create pharmacies; pharmacies originate solely from owner self-registration.

---

## 🛠️ Technology Stack

* **Frontend**:
  * **React.js 18** with **TypeScript** (Strict mode)
  * **Vite 6** (Blazing fast HMR and optimized bundler)
  * **Tailwind CSS 3** (Custom healthcare color scheme: `#00875A` / `#059669` / `#047857`)
  * **React Router v6** (Protected routes and role navigation)
  * **Leaflet & OpenStreetMap** (Interactive geospatial map with custom markers)
  * **Lucide React** (Clean medical and interface iconography)
* **Backend & Database**:
  * **Supabase PostgreSQL** database
  * **Supabase Authentication & Row Level Security (RLS)**
  * **PostgreSQL Functions & Atomic Transactions**:
    * `register_initial_admin`: Atomic single-admin creation with secret verification.
    * `create_reservation_atomic`: Concurrency-safe stock deduction and status adjustment.
    * `complete_reservation_and_bill`: Automated sequential bill generation (`BILL-YYYYMMDD-XXXX`).
    * `admin_verify_pharmacy`: Role-enforced verification and audit logging.
  * Resilient offline-first engine providing seamless local execution and live Supabase switching.

---

## 📋 Complete API Catalogue Implementation (32 Endpoints)

| # | Endpoint | Method | Module | Purpose |
|---|---|---|---|---|
| 1 | `/api/register` | POST | Auth | Register customer, pharmacy owner, or first admin |
| 2 | `/api/login` | POST | Auth | Authenticate user with role-based JWT |
| 3 | `/api/user/{id}` | GET | Auth | Retrieve authenticated profile |
| 4 | `/api/pharmacies` | GET | Pharmacy | Find pharmacies by location / PIN code |
| 5 | `/api/pharmacy/{id}` | GET | Pharmacy | View verified pharmacy details and inventory |
| 6 | `/api/pharmacies` | POST | Pharmacy | Pharmacy self-registration (`PENDING_VERIFICATION`) |
| 7 | `/api/pharmacy/{id}` | PUT | Pharmacy | Update pharmacy profile |
| 8 | `/api/pharmacy/{id}` | DELETE | Pharmacy | Remove pharmacy |
| 9 | `/api/medicines` | GET | Medicine | Search shared medicine catalogue |
| 10 | `/api/medicine/{id}` | GET | Medicine | View medicine details |
| 11 | `/api/medicines` | POST | Medicine | Add new medicine to shared catalogue |
| 12 | `/api/medicine/{id}` | PUT | Medicine | Update medicine details |
| 13 | `/api/medicine/{id}` | DELETE | Medicine | Delete medicine record |
| 14 | `/api/inventory` | GET | Inventory | View pharmacy stock listings |
| 15 | `/api/inventory` | POST | Inventory | Add medicine stock listing |
| 16 | `/api/inventory/{id}` | PUT | Inventory | Update stock quantity, price, and status |
| 17 | `/api/inventory/{id}` | DELETE | Inventory | Remove inventory listing |
| 18 | `/api/inventory/verify` | POST | Inventory | Verify real-time stock availability |
| 19 | `/api/search/medicine` | GET | Search | Search medicine availability with distance & prices |
| 20 | `/api/pharmacies/nearby` | GET | Search | Find nearby approved pharmacies using GPS coords |
| 21 | `/api/medicine/{id}/availability` | GET | Search | Check cross-pharmacy stock levels |
| 22 | `/api/compare/medicine` | GET | Search | Compare medicine prices across pharmacies |
| 23 | `/api/reservations` | POST | Reservation | Atomic medicine reservation with stock deduction |
| 24 | `/api/reservations/{id}` | GET | Reservation | View reservation details |
| 25 | `/api/reservations/{id}/cancel` | PUT | Reservation | Cancel reservation and restore stock |
| 26 | `/api/billing` | POST | Billing | Generate pickup bill upon completion |
| 27 | `/api/billing/{id}` | GET | Billing | Retrieve bill details and tax breakdown |
| 28 | `/api/billing/user/{id}` | GET | Billing | View user billing history |
| 29 | `/api/billing/{id}/receipt` | GET | Billing | Printable invoice receipt data |
| 30 | `/api/admin/dashboard` | GET | Admin | System metrics, pharmacy status, and audit logs |
| 31 | `/api/admin/pharmacy/verify` | PUT | Admin | Approve, reject, or disable pharmacy |
| 32 | `/api/admin/reports` | GET | Admin | System distribution reports and reservation stats |

---

## 💻 Local Execution Instructions

### Prerequisites
* **Node.js** (v18 or higher; tested on v26)
* **npm**

### Step-by-Step Run
1. Navigate to the project root:
   ```bash
   cd medistock
   ```
2. Install dependencies (already pre-installed in workspace):
   ```bash
   npm install
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```
4. Open your browser and visit:
   ```
   http://localhost:5173
   ```

### Connecting to Your Live Supabase Project
1. Log in to [supabase.com](https://supabase.com) and create a new project.
2. Open the **SQL Editor** in your Supabase dashboard and run the entire script in `supabase/schema.sql`.
3. In `Project Settings > API`, copy your:
   * **Project URL**
   * **Anon / Public Key**
4. Paste them into your `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_ADMIN_SETUP_SECRET=MEDISTOCK_SECRET_2026
   ```
5. Deploy seamlessly to **Vercel** with one click.

---

## 👥 Demonstration Workflow for Project Viva / Presentation

To demonstrate the full lifecycle tomorrow morning:

1. **Step 1: Admin Setup**
   * Navigate to `Create account` &rarr; `Admin setup`.
   * Fill out admin details and enter secret: `MEDISTOCK_SECRET_2026`.
   * Submit to become the initial administrator.
2. **Step 2: Pharmacy Self-Registration**
   * Click `Create account` &rarr; `I run a pharmacy`.
   * Enter pharmacy details (e.g., *Green Cross Pharmacy*, Licence *KA-DWD-2024-1189*, Address *Keshwapur, Hubballi*, PIN *580023*).
   * Notice that the pharmacy is placed in `PENDING_VERIFICATION` and cannot yet publish stock.
3. **Step 3: Admin Review & Approval**
   * Log in as the Administrator.
   * Go to `Pharmacy verification` &rarr; `Pending`.
   * Click `Approve` (or test `Reject` with a mandatory reason).
   * Notice the real-time status change to `Verified` and the recorded audit event.
4. **Step 4: Pharmacy Adds Stock**
   * Log in as the approved Pharmacy.
   * Add a medicine from the catalogue (or click `Add new medicine to catalogue` if adding a new composition).
   * Set Quantity (e.g. 25), Price (e.g. ₹28.00), and Expiry Date.
   * Save changes &mdash; observe the updated stat cards (Medicines listed: 1, In stock: 1).
5. **Step 5: Customer Discovery & Reservation**
   * Open the homepage (`/`) or search page (`/search`).
   * Search for the medicine.
   * Inspect the result card showing pharmacy name, price (₹28.00), availability badge (*Reported available*), and the Leaflet interactive map pin!
   * Click `Reserve`, enter quantity (e.g. 2 units), and confirm.
   * Notice the pharmacy's stock atomically decreases from 25 to 23!
6. **Step 6: Counter Collection & Invoice Generation**
   * Pharmacy opens `Reservations` tab &rarr; marks status as `Ready for Pickup`, then `Mark Collected / Bill`.
   * Official printable invoice modal opens with bill number (`BILL-YYYYMMDD-XXXX`), customer details, pharmacy licence, and tax breakdown!
