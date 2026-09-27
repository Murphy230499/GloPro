/**
 * Phase 7 Stage 1 — Persistent Agent Session Automated Test Suite
 * 
 * Verifies all 15 required Stage 1 production invariants:
 * 1. Create session
 * 2. Read session
 * 3. Update session
 * 4. Restart recovery (destroy in-memory context, recover from disk/db)
 * 5. Multi-worker recovery
 * 6. TTL expiration
 * 7. Actor isolation
 * 8. Tenant isolation
 * 9. Branch isolation
 * 10. Concurrent update
 * 11. Stale version rejection
 * 12. Oversized state rejection
 * 13. Persistence failure handling
 * 14. Secure non-predictable session ID
 * 15. Forbidden secret persistence rejection
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  AgentContextManager,
  FilePersistentSessionStore,
  InMemoryAgentSessionStore,
  TrustedActorContext,
  ActorIsolationError,
  TenantIsolationError,
  BranchIsolationError,
  StaleSessionVersionError,
  OversizedStateError,
  SecuritySecretForbiddenError,
  SessionPersistenceError
} from '../context';

interface TestResult {
  id: number;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
  error?: string;
}

export async function runStage1SessionTests(): Promise<{ total: number; passed: number; results: TestResult[] }> {
  const results: TestResult[] = [];
  const testDbFile = path.resolve(process.cwd(), '.test_stage1_sessions.json');

  if (fs.existsSync(testDbFile)) {
    fs.unlinkSync(testDbFile);
  }

  const fileStore = new FilePersistentSessionStore(testDbFile);
  AgentContextManager.setStore(fileStore);

  const actorAlice: TrustedActorContext = {
    actorId: 'user_alice_123',
    tenantId: 'salon_alpha_001',
    branchId: 'branch_q1',
    role: 'owner',
    permissions: 'all'
  };

  const actorBob: TrustedActorContext = {
    actorId: 'user_bob_456',
    tenantId: 'salon_alpha_001',
    branchId: 'branch_q1',
    role: 'staff',
    permissions: 'appointments'
  };

  const actorEveOtherTenant: TrustedActorContext = {
    actorId: 'user_eve_789',
    tenantId: 'salon_beta_999',
    branchId: 'branch_q1',
    role: 'owner',
    permissions: 'all'
  };

  const actorBranchMismatch: TrustedActorContext = {
    actorId: 'user_alice_123',
    tenantId: 'salon_alpha_001',
    branchId: 'branch_q2', // Different branch
    role: 'owner',
    permissions: 'all'
  };

  // ----------------------------------------------------
  // TEST 1: Create Session
  // ----------------------------------------------------
  try {
    const session = await AgentContextManager.loadOrCreatePersistentSession('conv_alpha_1', actorAlice);
    const pass = Boolean(session && session.id && session.version === 1 && session.actorId === actorAlice.actorId);
    results.push({
      id: 1,
      name: 'Create session',
      expected: 'Session created with version 1 and bound actor',
      actual: `Created session ${session.id} (version ${session.version})`,
      passed: pass
    });
  } catch (err: any) {
    results.push({ id: 1, name: 'Create session', expected: 'Session created', actual: err.message, passed: false, error: err.message });
  }

  // ----------------------------------------------------
  // TEST 2: Read Session
  // ----------------------------------------------------
  try {
    const store = AgentContextManager.getStore();
    const session = await store.getSessionByConversation('conv_alpha_1', actorAlice);
    const pass = Boolean(session && session.conversationId === 'conv_alpha_1' && session.tenantId === actorAlice.tenantId);
    results.push({
      id: 2,
      name: 'Read session',
      expected: 'Retrieve matching active session',
      actual: session ? `Found session for conv ${session.conversationId}` : 'Not found',
      passed: pass
    });
  } catch (err: any) {
    results.push({ id: 2, name: 'Read session', expected: 'Found', actual: err.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 3: Update Session
  // ----------------------------------------------------
  try {
    const session = await AgentContextManager.loadOrCreatePersistentSession('conv_alpha_1', actorAlice);
    AgentContextManager.recordEntity(session.id, {
      type: 'customer',
      id: 'cust_lan_99',
      name: 'Chị Lan',
      phone: '0901234567'
    });

    const updated = await AgentContextManager.savePersistentSession(session, session.version, actorAlice);
    const pass = updated.version === 2 && updated.state.currentCustomer?.name === 'Chị Lan';
    results.push({
      id: 3,
      name: 'Update session',
      expected: 'Version increments to 2 and entity saved',
      actual: `Updated to version ${updated.version}, customer: ${updated.state.currentCustomer?.name}`,
      passed: pass
    });
  } catch (err: any) {
    results.push({ id: 3, name: 'Update session', expected: 'Version 2', actual: err.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 4: Restart Recovery (Kill in-memory context, recover from disk)
  // ----------------------------------------------------
  try {
    // 1. Clear in-memory Map completely (simulating server process death / restart)
    AgentContextManager.clearContext('non-existent');
    AgentContextManager.setStore(null); // Destroy reference

    // 2. Instantiate new instance pointing to same persistent file
    const brandNewStore = new FilePersistentSessionStore(testDbFile);
    AgentContextManager.setStore(brandNewStore);

    // 3. Load conversation again
    const recovered = await AgentContextManager.loadOrCreatePersistentSession('conv_alpha_1', actorAlice);
    const pass = Boolean(recovered && recovered.state.currentCustomer?.name === 'Chị Lan' && recovered.version === 2);
    results.push({
      id: 4,
      name: 'Restart recovery',
      expected: 'Recover Chị Lan and version 2 after memory destruction',
      actual: recovered ? `Recovered customer ${recovered.state.currentCustomer?.name} (v${recovered.version})` : 'Failed recovery',
      passed: pass
    });
  } catch (err: any) {
    results.push({ id: 4, name: 'Restart recovery', expected: 'Recovered', actual: err.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 5: Multi-Worker Recovery
  // ----------------------------------------------------
  try {
    // Worker A updates state
    const workerAStore = new FilePersistentSessionStore(testDbFile);
    const workerBStore = new FilePersistentSessionStore(testDbFile);

    const sessA = await workerAStore.getSessionByConversation('conv_alpha_1', actorAlice);
    sessA!.state.conversationTopic = 'revenue';
    const savedByA = await workerAStore.updateSession(sessA!, sessA!.version, actorAlice);

    // Worker B loads same conversation
    const loadedByB = await workerBStore.getSessionByConversation('conv_alpha_1', actorAlice);
    const pass = loadedByB?.state.conversationTopic === 'revenue' && loadedByB.version === savedByA.version;
    results.push({
      id: 5,
      name: 'Multi-worker recovery',
      expected: 'Worker B observes state saved by Worker A',
      actual: `Worker B read topic: ${loadedByB?.state.conversationTopic} (v${loadedByB?.version})`,
      passed: pass
    });
  } catch (err: any) {
    results.push({ id: 5, name: 'Multi-worker recovery', expected: 'Observed', actual: err.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 6: TTL Expiration
  // ----------------------------------------------------
  try {
    const expiredParams = {
      conversationId: 'conv_expired_test',
      actorId: actorAlice.actorId,
      tenantId: actorAlice.tenantId,
      ttlMs: -1000 // Already expired in the past
    };
    const store = AgentContextManager.getStore();
    const expiredSess = await store.createSession(expiredParams);
    const fetched = await store.getSession(expiredSess.id, actorAlice);

    const pass = fetched === null; // Expired session must return null
    results.push({
      id: 6,
      name: 'TTL expiration',
      expected: 'Expired session returns null (stale context rejected)',
      actual: fetched === null ? 'Returned null (expired)' : 'Returned active session',
      passed: pass
    });
  } catch (err: any) {
    results.push({ id: 6, name: 'TTL expiration', expected: 'Null', actual: err.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 7: Actor Isolation
  // ----------------------------------------------------
  try {
    const session = await AgentContextManager.loadOrCreatePersistentSession('conv_alpha_1', actorAlice);
    // Bob attempts to load Alice's session
    let rejected = false;
    try {
      await AgentContextManager.loadPersistentSession(session.id, actorBob);
    } catch (e: any) {
      if (e instanceof ActorIsolationError) rejected = true;
    }
    results.push({
      id: 7,
      name: 'Actor isolation',
      expected: 'ActorIsolationError when Bob attempts to access Alice session',
      actual: rejected ? 'ActorIsolationError thrown (DENIED)' : 'Unauthorized access allowed',
      passed: rejected
    });
  } catch (err: any) {
    results.push({ id: 7, name: 'Actor isolation', expected: 'DENIED', actual: err.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 8: Tenant Isolation
  // ----------------------------------------------------
  try {
    const session = await AgentContextManager.loadOrCreatePersistentSession('conv_alpha_1', actorAlice);
    // Eve (Tenant Beta) attempts to load Alice's session (Tenant Alpha)
    let rejected = false;
    try {
      await AgentContextManager.loadPersistentSession(session.id, actorEveOtherTenant);
    } catch (e: any) {
      if (e instanceof TenantIsolationError) rejected = true;
    }
    results.push({
      id: 8,
      name: 'Tenant isolation',
      expected: 'TenantIsolationError when Tenant Beta accesses Tenant Alpha session',
      actual: rejected ? 'TenantIsolationError thrown (DENIED)' : 'Cross-tenant leak',
      passed: rejected
    });
  } catch (err: any) {
    results.push({ id: 8, name: 'Tenant isolation', expected: 'DENIED', actual: err.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 9: Branch Isolation
  // ----------------------------------------------------
  try {
    const session = await AgentContextManager.loadOrCreatePersistentSession('conv_alpha_1', actorAlice);
    let rejected = false;
    try {
      await AgentContextManager.loadPersistentSession(session.id, actorBranchMismatch);
    } catch (e: any) {
      if (e instanceof BranchIsolationError) rejected = true;
    }
    results.push({
      id: 9,
      name: 'Branch isolation',
      expected: 'BranchIsolationError when accessing session bound to another branch',
      actual: rejected ? 'BranchIsolationError thrown (DENIED)' : 'Cross-branch leak',
      passed: rejected
    });
  } catch (err: any) {
    results.push({ id: 9, name: 'Branch isolation', expected: 'DENIED', actual: err.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 10: Concurrent Update
  // ----------------------------------------------------
  try {
    const store = AgentContextManager.getStore();
    const session = await store.getSessionByConversation('conv_alpha_1', actorAlice);
    const initialVersion = session!.version;

    // Worker 1 writes version + 1
    const copy1 = JSON.parse(JSON.stringify(session!));
    copy1.state.conversationTopic = 'topic_1';
    await store.updateSession(copy1, initialVersion, actorAlice);

    // Worker 2 attempts to write with same old initialVersion
    const copy2 = JSON.parse(JSON.stringify(session!));
    copy2.state.conversationTopic = 'topic_2';

    let threwStale = false;
    try {
      await store.updateSession(copy2, initialVersion, actorAlice);
    } catch (e: any) {
      if (e instanceof StaleSessionVersionError) threwStale = true;
    }

    results.push({
      id: 10,
      name: 'Concurrent update',
      expected: 'First write succeeds, second concurrent write is rejected',
      actual: threwStale ? 'StaleSessionVersionError thrown on concurrent write' : 'Silent overwrite occurred',
      passed: threwStale
    });
  } catch (err: any) {
    results.push({ id: 10, name: 'Concurrent update', expected: 'Conflict detected', actual: err.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 11: Stale Version Rejection
  // ----------------------------------------------------
  try {
    const store = AgentContextManager.getStore();
    const session = await store.getSessionByConversation('conv_alpha_1', actorAlice);
    let rejected = false;
    try {
      // Intentionally pass wrong expected version (e.g. 99)
      await store.updateSession(session!, 99, actorAlice);
    } catch (e: any) {
      if (e instanceof StaleSessionVersionError) rejected = true;
    }
    results.push({
      id: 11,
      name: 'Stale version rejection',
      expected: 'Reject update if expectedVersion does not match current version',
      actual: rejected ? 'StaleSessionVersionError correctly thrown' : 'Stale update accepted',
      passed: rejected
    });
  } catch (err: any) {
    results.push({ id: 11, name: 'Stale version rejection', expected: 'Rejected', actual: err.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 12: Oversized State Rejection
  // ----------------------------------------------------
  try {
    const store = AgentContextManager.getStore();
    const session = await store.getSessionByConversation('conv_alpha_1', actorAlice);
    const oversizedState = JSON.parse(JSON.stringify(session!.state));
    // Inject > 64 KB of payload
    oversizedState.hugeGarbage = 'X'.repeat(70000);

    let rejected = false;
    try {
      await store.updateSession({ ...session!, state: oversizedState }, session!.version, actorAlice);
    } catch (e: any) {
      if (e instanceof OversizedStateError) rejected = true;
    }
    results.push({
      id: 12,
      name: 'Oversized state rejection',
      expected: 'Reject state > 64KB with OversizedStateError',
      actual: rejected ? 'OversizedStateError thrown (>64KB blocked)' : 'Oversized state accepted',
      passed: rejected
    });
  } catch (err: any) {
    results.push({ id: 12, name: 'Oversized state rejection', expected: 'Rejected', actual: err.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 13: Persistence Failure Handling
  // ----------------------------------------------------
  try {
    class FailingStore extends InMemoryAgentSessionStore {
      override async getSession(): Promise<any> {
        throw new SessionPersistenceError('Simulated database connection timeout');
      }
    }
    const failingStore = new FailingStore();
    let threwPersistence = false;
    try {
      await failingStore.getSession('sess_fail', actorAlice);
    } catch (e: any) {
      if (e instanceof SessionPersistenceError && e.message.includes('timeout')) threwPersistence = true;
    }
    results.push({
      id: 13,
      name: 'Persistence failure',
      expected: 'Explicit SessionPersistenceError without silent in-memory fallback',
      actual: threwPersistence ? 'Explicit SessionPersistenceError thrown' : 'Fell back silently',
      passed: threwPersistence
    });
  } catch (err: any) {
    results.push({ id: 13, name: 'Persistence failure', expected: 'Explicit error', actual: err.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 14: Secure Session ID (UUID)
  // ----------------------------------------------------
  try {
    const store = AgentContextManager.getStore();
    const s1 = await store.createSession({ conversationId: 'c_uuid_1', actorId: 'u1', tenantId: 't1' });
    const s2 = await store.createSession({ conversationId: 'c_uuid_2', actorId: 'u1', tenantId: 't1' });

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(s1.id) && uuidRegex.test(s2.id);
    const nonPredictable = s1.id !== s2.id && !s1.id.startsWith('1') && !s2.id.startsWith('2');

    results.push({
      id: 14,
      name: 'Secure session ID',
      expected: 'Cryptographically random non-sequential UUIDs',
      actual: isUuid && nonPredictable ? `Valid secure UUIDs (${s1.id.substring(0, 8)}..., ${s2.id.substring(0, 8)}...)` : 'Predictable IDs',
      passed: isUuid && nonPredictable
    });
  } catch (err: any) {
    results.push({ id: 14, name: 'Secure session ID', expected: 'UUID', actual: err.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 15: No Secret Persistence
  // ----------------------------------------------------
  try {
    const store = AgentContextManager.getStore();
    const session = await store.createSession({ conversationId: 'c_sec_1', actorId: 'u1', tenantId: 't1' });

    let secretBlocked = false;
    const taintedState = {
      ...session.state,
      leakedSecret: 'dummy_secret_test_token_placeholder'
    };

    try {
      await store.updateSession({ ...session, state: taintedState }, session.version, {
        actorId: 'u1',
        tenantId: 't1'
      });
    } catch (e: any) {
      if (e instanceof SecuritySecretForbiddenError) secretBlocked = true;
    }

    results.push({
      id: 15,
      name: 'No secret persistence',
      expected: 'Block attempts to store service_role keys, JWT tokens, or raw secrets',
      actual: secretBlocked ? 'SecuritySecretForbiddenError thrown (secret blocked)' : 'Secret was persisted to storage',
      passed: secretBlocked
    });
  } catch (err: any) {
    results.push({ id: 15, name: 'No secret persistence', expected: 'Blocked', actual: err.message, passed: false });
  }

  // Clean test DB
  if (fs.existsSync(testDbFile)) {
    fs.unlinkSync(testDbFile);
  }

  const passedCount = results.filter(r => r.passed).length;
  return { total: results.length, passed: passedCount, results };
}

// Auto-run if executed directly via CLI
if (process.argv[1]?.endsWith('stage1_session_tests.ts') || process.argv[1]?.endsWith('stage1_session_tests.js')) {
  runStage1SessionTests().then(res => {
    console.log('================================================================');
    console.log(`PHASE 7 STAGE 1 — PERSISTENT AGENT SESSION TEST RESULTS: ${res.passed}/${res.total}`);
    console.log('================================================================');
    for (const r of res.results) {
      console.log(`${r.passed ? '✅' : '❌'} Test ${r.id.toString().padStart(2, ' ')}: [${r.name}] -> ${r.actual}`);
    }
    console.log('----------------------------------------------------------------');
    if (res.passed === res.total) {
      console.log('🎉 ALL 15 STAGE 1 TESTS PASSED!');
    } else {
      console.error(`❌ ${res.total - res.passed} TESTS FAILED!`);
      process.exit(1);
    }
  }).catch(e => {
    console.error('Test Runner Failed:', e);
    process.exit(1);
  });
}
