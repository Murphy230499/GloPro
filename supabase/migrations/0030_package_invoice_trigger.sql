-- Trigger to automatically issue customer packages/treatments when an invoice is paid

CREATE OR REPLACE FUNCTION process_invoice_packages()
RETURNS TRIGGER AS $$
DECLARE
    item jsonb;
    item_type text;
    item_id text;
    item_qty integer;
    pkg_usage_count integer;
    pkg_expiry_months numeric;
    trt_expiry_months numeric;
    new_expires_at timestamp with time zone;
    is_from_package boolean;
    pkg_cust_id uuid;
    trt_cust_id uuid;
BEGIN
    -- Only process when status changes to 'paid'
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
        
        -- Loop through invoice items
        FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            item_type := item->>'type';
            item_id := item->>'id';
            item_qty := COALESCE((item->>'qty')::integer, 1);
            is_from_package := COALESCE((item->>'is_from_package')::boolean, false);
            
            -- Skip items that are usages of existing packages
            IF is_from_package THEN
                -- Deduct usage
                IF item->>'customer_package_id' IS NOT NULL THEN
                    UPDATE public.customer_package
                    SET remaining_usage = GREATEST(0, remaining_usage - 1)
                    WHERE id = (item->>'customer_package_id')::uuid;
                    
                    INSERT INTO public.package_usage_history (
                        customer_package_id, customer_id, invoice_id, usage_count, branch_id
                    ) VALUES (
                        (item->>'customer_package_id')::uuid, NEW.customer_id, NEW.id, 1, NEW.branch_id
                    );
                ELSIF item->>'customer_treatment_id' IS NOT NULL THEN
                    UPDATE public.customer_treatment
                    SET remaining_usage = GREATEST(0, remaining_usage - 1)
                    WHERE id = (item->>'customer_treatment_id')::uuid;
                    
                    INSERT INTO public.package_usage_history (
                        customer_treatment_id, customer_id, invoice_id, usage_count, branch_id
                    ) VALUES (
                        (item->>'customer_treatment_id')::uuid, NEW.customer_id, NEW.id, 1, NEW.branch_id
                    );
                END IF;
                CONTINUE;
            END IF;

            -- Issue new packages
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

            -- Issue new treatments
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

DROP TRIGGER IF EXISTS trigger_invoice_packages ON public.invoice;
CREATE TRIGGER trigger_invoice_packages
    AFTER INSERT OR UPDATE ON public.invoice
    FOR EACH ROW
    EXECUTE FUNCTION process_invoice_packages();
