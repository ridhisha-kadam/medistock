-- ==============================================================================
-- MediStock: Safe Database Cleanup Script
-- ==============================================================================
-- PURPOSE:
-- Cleans the existing database by removing unwanted past medicine stock records 
-- and reservation records, while PRESERVING all registered pharmacy accounts,
-- pharmacy names, genuine customer accounts, admin accounts, and the master
-- medicine catalog.
--
-- FOREIGN-KEY SAFETY GUARANTEES:
-- 1. public.bills references public.reservations (deleted first)
-- 2. public.reservations references public.pharmacies, public.profiles, public.medicines (deleted second)
-- 3. public.inventory references public.pharmacies, public.medicines (deleted third)
-- 4. public.alerts contains notification logs (deleted fourth)
--
-- PRESERVED DATA (100% INTACT - NO LOSS):
-- - public.pharmacies (All registered pharmacy names and details are KEPT)
-- - public.profiles (All registered customers, pharmacies, and admin accounts are KEPT)
-- - public.medicines (All 245 master catalog medicines are KEPT)
-- - public.medicine_variants (All strength/dosage formulations are KEPT)
--
-- IMPORTANT SAFETY NOTICE:
-- NO "DROP TABLE" OR SCHEMA DESTRUCTION IS USED.
-- Run this in your Supabase SQL Editor.
-- ==============================================================================

BEGIN;

-- Step 1: Optional verification counts before deletion
-- SELECT COUNT(*) AS initial_bills FROM public.bills;
-- SELECT COUNT(*) AS initial_reservations FROM public.reservations;
-- SELECT COUNT(*) AS initial_inventory FROM public.inventory;
-- SELECT COUNT(*) AS preserved_pharmacies FROM public.pharmacies;
-- SELECT COUNT(*) AS preserved_profiles FROM public.profiles;
-- SELECT COUNT(*) AS preserved_medicines FROM public.medicines;

-- Step 2: Delete generated bills linked to past reservations
DELETE FROM public.bills;

-- Step 3: Delete past reservation records (Starts with an empty reservation list)
DELETE FROM public.reservations;

-- Step 4: Remove all previously added medicines from all pharmacy stock records
-- Pharmacy stock is now initially empty. Pharmacies can add medicines again through their dashboards.
DELETE FROM public.inventory;

-- Step 5: Clean past reservation and test alerts
DELETE FROM public.alerts;

-- Step 6: Log maintenance event in audit trail
INSERT INTO public.audit_logs (
    id,
    action,
    entity_type,
    details,
    created_at
) VALUES (
    gen_random_uuid(),
    'SAFE_DATABASE_CLEANUP',
    'SYSTEM',
    '{"message": "Safe cleanup executed: Inventory stock and reservations cleared. Pharmacy names, customer accounts, and catalog preserved."}'::jsonb,
    NOW()
);

COMMIT;

-- ==============================================================================
-- VERIFICATION CHECK (Run to confirm preserved state)
-- ==============================================================================
SELECT 'pharmacies_preserved' AS table_name, COUNT(*) AS remaining_count FROM public.pharmacies
UNION ALL
SELECT 'customer_profiles_preserved' AS table_name, COUNT(*) AS remaining_count FROM public.profiles WHERE role = 'CUSTOMER'
UNION ALL
SELECT 'medicines_catalog_preserved' AS table_name, COUNT(*) AS remaining_count FROM public.medicines
UNION ALL
SELECT 'inventory_cleared_to_zero' AS table_name, COUNT(*) AS remaining_count FROM public.inventory
UNION ALL
SELECT 'reservations_cleared_to_zero' AS table_name, COUNT(*) AS remaining_count FROM public.reservations;
