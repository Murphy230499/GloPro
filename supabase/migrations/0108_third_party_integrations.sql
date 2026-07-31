CREATE TABLE "Integration" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES "Branch"(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'facebook', 'zalo', 'whatsapp', 'email'
    status VARCHAR(20) DEFAULT 'disconnected', -- 'connected', 'disconnected'
    credentials JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_integration_branch ON "Integration"(branch_id);
CREATE INDEX idx_integration_provider ON "Integration"(provider);
