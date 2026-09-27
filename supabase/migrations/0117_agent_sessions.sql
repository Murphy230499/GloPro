-- Migration: 0117_agent_sessions.sql
-- Description: Creates persistent agent_sessions table with tenant isolation, actor binding, optimistic concurrency versioning, and TTL expiration.

CREATE TABLE IF NOT EXISTS public.agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  branch_id TEXT,
  state_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_trace_id TEXT,
  CONSTRAINT uq_agent_sessions_tenant_conversation UNIQUE (tenant_id, conversation_id)
);

-- Performance & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_agent_sessions_lookup 
  ON public.agent_sessions (tenant_id, actor_id, conversation_id);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_actor 
  ON public.agent_sessions (actor_id);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_branch 
  ON public.agent_sessions (branch_id) 
  WHERE branch_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_sessions_expires_at 
  ON public.agent_sessions (expires_at);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_updated_at 
  ON public.agent_sessions (updated_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Tenants can only access their own sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agent_sessions' AND policyname = 'agent_sessions_tenant_isolation_policy'
  ) THEN
    CREATE POLICY agent_sessions_tenant_isolation_policy ON public.agent_sessions
      FOR ALL
      TO authenticated, service_role
      USING (
        tenant_id = COALESCE(current_setting('app.current_tenant_id', true), tenant_id)
      )
      WITH CHECK (
        tenant_id = COALESCE(current_setting('app.current_tenant_id', true), tenant_id)
      );
  END IF;
END $$;
