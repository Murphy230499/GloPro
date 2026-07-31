-- Migration to track purchased packages and treatments for customers
CREATE TABLE IF NOT EXISTS public.customer_package (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    customer_id UUID NOT NULL REFERENCES public.customer(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES public.servicepackage(id) ON DELETE RESTRICT,
    invoice_id UUID REFERENCES public.invoice(id) ON DELETE SET NULL,
    total_usage INTEGER NOT NULL DEFAULT 1,
    remaining_usage INTEGER NOT NULL DEFAULT 1,
    expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'exhausted', 'expired', 'cancelled')),
    branch_id UUID REFERENCES public.branch(id) ON DELETE SET NULL
);

CREATE TRIGGER trigger_update_customer_package_updated_at
    BEFORE UPDATE ON public.customer_package
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.customer_treatment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    customer_id UUID NOT NULL REFERENCES public.customer(id) ON DELETE CASCADE,
    treatment_id UUID NOT NULL REFERENCES public.treatment(id) ON DELETE RESTRICT,
    invoice_id UUID REFERENCES public.invoice(id) ON DELETE SET NULL,
    total_usage INTEGER NOT NULL DEFAULT 1,
    remaining_usage INTEGER NOT NULL DEFAULT 1,
    expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'exhausted', 'expired', 'cancelled')),
    branch_id UUID REFERENCES public.branch(id) ON DELETE SET NULL
);

CREATE TRIGGER trigger_update_customer_treatment_updated_at
    BEFORE UPDATE ON public.customer_treatment
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.package_usage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    customer_package_id UUID REFERENCES public.customer_package(id) ON DELETE CASCADE,
    customer_treatment_id UUID REFERENCES public.customer_treatment(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customer(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.invoice(id) ON DELETE SET NULL, -- The invoice where it was used
    usage_count INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    branch_id UUID REFERENCES public.branch(id) ON DELETE SET NULL,
    CHECK (
        (customer_package_id IS NOT NULL AND customer_treatment_id IS NULL) OR
        (customer_treatment_id IS NOT NULL AND customer_package_id IS NULL)
    )
);

-- Note: In a real system, you'd add constraints to ensure remaining_usage >= 0, etc.
