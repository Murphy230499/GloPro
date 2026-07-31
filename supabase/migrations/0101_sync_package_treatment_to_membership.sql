-- Create trigger to sync customer_package updates to membership table
CREATE OR REPLACE FUNCTION public.sync_customer_package_to_membership()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.membership
    SET sessions_remaining = NEW.remaining_usage,
        status = CASE WHEN NEW.remaining_usage <= 0 THEN 'exhausted' ELSE 'active' END
    WHERE customer_id = NEW.customer_id AND invoice_id = NEW.invoice_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_customer_package_to_membership ON public.customer_package;
CREATE TRIGGER trigger_sync_customer_package_to_membership
    AFTER UPDATE ON public.customer_package
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_customer_package_to_membership();

-- Create trigger to sync customer_treatment updates to membership table
CREATE OR REPLACE FUNCTION public.sync_customer_treatment_to_membership()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.membership
    SET sessions_remaining = NEW.remaining_usage,
        status = CASE WHEN NEW.remaining_usage <= 0 THEN 'exhausted' ELSE 'active' END
    WHERE customer_id = NEW.customer_id AND invoice_id = NEW.invoice_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_customer_treatment_to_membership ON public.customer_treatment;
CREATE TRIGGER trigger_sync_customer_treatment_to_membership
    AFTER UPDATE ON public.customer_treatment
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_customer_treatment_to_membership();
