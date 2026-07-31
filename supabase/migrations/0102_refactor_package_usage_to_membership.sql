-- Drop old foreign keys referencing customer_package/customer_treatment tables
ALTER TABLE public.package_usage_history DROP CONSTRAINT IF EXISTS package_usage_history_customer_package_id_fkey;
ALTER TABLE public.package_usage_history DROP CONSTRAINT IF EXISTS package_usage_history_customer_treatment_id_fkey;

-- Add new foreign keys referencing membership table directly
ALTER TABLE public.package_usage_history ADD CONSTRAINT package_usage_history_customer_package_id_fkey 
    FOREIGN KEY (customer_package_id) REFERENCES public.membership(id) ON DELETE CASCADE;
ALTER TABLE public.package_usage_history ADD CONSTRAINT package_usage_history_customer_treatment_id_fkey 
    FOREIGN KEY (customer_treatment_id) REFERENCES public.membership(id) ON DELETE CASCADE;

-- Re-create the process_invoice_packages trigger function to update membership table directly
CREATE OR REPLACE FUNCTION public.process_invoice_packages()
RETURNS TRIGGER AS $$
DECLARE
    item JSONB;
    item_type TEXT;
    item_id TEXT;
    item_qty INTEGER;
    is_from_package BOOLEAN;
    pkg_usage_count INTEGER;
    pkg_expiry_months INTEGER;
    trt_expiry_months INTEGER;
    new_expires_at TIMESTAMP WITH TIME ZONE;
    pkg_id_uuid UUID;
BEGIN
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status <> 'paid') THEN
        -- Loop through invoice items
        FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            item_type := item->>'type';
            item_id := item->>'id';
            item_qty := COALESCE((item->>'qty')::integer, 1);
            is_from_package := COALESCE((item->>'is_from_package')::boolean, false);
            
            -- Skip items that are usages of existing packages
            IF is_from_package THEN
                -- Deduct usage on membership table directly
                IF item->>'customer_package_id' IS NOT NULL THEN
                    UPDATE public.membership
                    SET sessions_remaining = GREATEST(0, sessions_remaining - item_qty),
                        status = CASE WHEN sessions_remaining - item_qty <= 0 THEN 'exhausted' ELSE 'active' END
                    WHERE id = (item->>'customer_package_id')::uuid;
                    
                    INSERT INTO public.package_usage_history (
                        customer_package_id, customer_id, invoice_id, usage_count, branch_id
                    ) VALUES (
                        (item->>'customer_package_id')::uuid, NEW.customer_id, NEW.id, item_qty, NEW.branch_id
                    );
                ELSIF item->>'customer_treatment_id' IS NOT NULL THEN
                    UPDATE public.membership
                    SET sessions_remaining = GREATEST(0, sessions_remaining - item_qty),
                        status = CASE WHEN sessions_remaining - item_qty <= 0 THEN 'exhausted' ELSE 'active' END
                    WHERE id = (item->>'customer_treatment_id')::uuid;
                    
                    INSERT INTO public.package_usage_history (
                        customer_treatment_id, customer_id, invoice_id, usage_count, branch_id
                    ) VALUES (
                        (item->>'customer_treatment_id')::uuid, NEW.customer_id, NEW.id, item_qty, NEW.branch_id
                    );
                END IF;
                CONTINUE;
            END IF;

            -- Issue new packages (remains the same)
            IF item_type = 'package' THEN
                SELECT usage_count, expiry_months INTO pkg_usage_count, pkg_expiry_months 
                FROM public.servicepackage WHERE id = item_id::uuid;
                
                IF FOUND THEN
                    IF pkg_expiry_months > 0 THEN
                        new_expires_at := CURRENT_TIMESTAMP + (pkg_expiry_months || ' months')::interval;
                    ELSE
                        new_expires_at := NULL;
                    END IF;
                    
                    -- Insert one record per qty
                    FOR i IN 1..item_qty LOOP
                        INSERT INTO public.customer_package (
                            customer_id, package_id, invoice_id, total_usage, remaining_usage, expires_at, branch_id
                        ) VALUES (
                            NEW.customer_id, item_id::uuid, NEW.id, COALESCE(pkg_usage_count, 1), COALESCE(pkg_usage_count, 1), new_expires_at, NEW.branch_id
                        );
                    END LOOP;
                END IF;
            END IF;

            -- Issue new treatments (remains the same)
            IF item_type = 'treatment' THEN
                SELECT expiry_months INTO trt_expiry_months 
                FROM public.treatment WHERE id = item_id::uuid;
                
                IF FOUND THEN
                    IF trt_expiry_months > 0 THEN
                        new_expires_at := CURRENT_TIMESTAMP + (trt_expiry_months || ' months')::interval;
                    ELSE
                        new_expires_at := NULL;
                    END IF;
                    
                    -- Assume treatments have 1 usage count per purchase (since usage_count doesn't exist on treatment table)
                    FOR i IN 1..item_qty LOOP
                        INSERT INTO public.customer_treatment (
                            customer_id, treatment_id, invoice_id, total_usage, remaining_usage, expires_at, branch_id
                        ) VALUES (
                            NEW.customer_id, item_id::uuid, NEW.id, 1, 1, new_expires_at, NEW.branch_id
                        );
                    END LOOP;
                END IF;
            END IF;
            
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
