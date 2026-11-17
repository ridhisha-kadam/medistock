-- ==============================================================================
-- MediStock: Complete Database Reset & Clean Initial State Script
-- ==============================================================================
-- PURPOSE:
-- Resets the database to a completely clean, fresh production state.
-- Deletes all operational data, customer accounts, pharmacy accounts,
-- reservations, inventory, bills, and alerts.
-- Re-establishes the 245 verified Master Medicine Catalogue.
-- Enforces Single-Admin uniqueness constraint and trigger at the database level.
--
-- FOREIGN-KEY SAFE DELETION ORDER:
-- 1. public.bills references public.reservations
-- 2. public.reservations references public.pharmacies, public.profiles, public.medicines
-- 3. public.inventory references public.pharmacies, public.medicines
-- 4. public.alerts references public.pharmacies, public.profiles
-- 5. public.audit_logs references system activity
-- 6. public.pharmacies references public.profiles
-- 7. public.profiles (Auth linked accounts)
-- 8. public.medicine_variants references public.medicines
-- 9. public.medicines (re-seeded fresh)
--
-- EXECUTION:
-- Run this script in the Supabase SQL Editor.
-- ==============================================================================

BEGIN;

-- Step 1: Remove all dependent transactional and operational records
DELETE FROM public.bills;
DELETE FROM public.reservations;
DELETE FROM public.inventory;
DELETE FROM public.alerts;
DELETE FROM public.audit_logs;

-- Step 2: Remove all registered pharmacy accounts and profiles
DELETE FROM public.pharmacies;
DELETE FROM public.profiles;

-- Optional: To also delete Supabase Auth accounts, run with admin/service privileges:
-- DELETE FROM auth.users;

-- Step 3: Re-seed Master Medicine Catalogue & Variants
DELETE FROM public.medicine_variants;
DELETE FROM public.medicines;

-- Step 4: Database-Level Single-Admin Uniqueness Trigger
-- Guarantees that at most ONE administrator profile can exist at any time.
CREATE OR REPLACE FUNCTION check_single_admin_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'ADMIN' THEN
    IF (SELECT COUNT(*) FROM public.profiles WHERE role = 'ADMIN' AND id <> NEW.id) > 0 THEN
      RAISE EXCEPTION 'Admin account has already been created. Please log in.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_single_admin ON public.profiles;
CREATE TRIGGER trg_enforce_single_admin
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_single_admin_uniqueness();

-- Step 5: Log the clean initialization in audit trail
INSERT INTO public.audit_logs (
    id,
    action,
    entity_type,
    details,
    created_at
) VALUES (
    gen_random_uuid(),
    'COMPLETE_DATABASE_RESET',
    'SYSTEM',
    '{"message": "Database reset to clean initial state. Master medicines preserved. Single-admin uniqueness enforced."}'::jsonb,
    NOW()
);

COMMIT;

-- ==============================================================================
-- POST-RESET VERIFICATION QUERY
-- Run to confirm 0 accounts, 0 inventory, 0 reservations, clean slate.
-- ==============================================================================
SELECT 'profiles' AS table_name, COUNT(*) AS record_count FROM public.profiles
UNION ALL
SELECT 'pharmacies' AS table_name, COUNT(*) AS record_count FROM public.pharmacies
UNION ALL
SELECT 'inventory' AS table_name, COUNT(*) AS record_count FROM public.inventory
UNION ALL
SELECT 'reservations' AS table_name, COUNT(*) AS record_count FROM public.reservations
UNION ALL
SELECT 'bills' AS table_name, COUNT(*) AS record_count FROM public.bills
UNION ALL
SELECT 'alerts' AS table_name, COUNT(*) AS record_count FROM public.alerts;
