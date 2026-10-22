/**
 * roomBedDbHelper.js
 * Enables full database persistence for Rooms and Beds into Supabase PostgreSQL `facility` table.
 * Encodes room metadata and bed-room associations seamlessly within PostgreSQL JSON array.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Ensures any string is converted to a valid, deterministic UUID
 * for PostgreSQL UUID columns.
 */
export function ensureValidUuid(id) {
  if (!id) return '00000000-0000-4000-8000-000000000000';
  if (typeof id === 'string' && UUID_REGEX.test(id)) return id.toLowerCase();
  
  if (typeof id === 'string') {
    // 24-character hex ID (e.g. MongoDB ObjectId)
    if (id.length === 24) {
      const hex = id + '00000000';
      return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`.toLowerCase();
    }
    // Simple fast deterministic hash to UUID format
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < id.length; i++) {
      const ch = id.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    
    const hex1 = ('00000000' + (h1 >>> 0).toString(16)).slice(-8);
    const hex2 = ('00000000' + (h2 >>> 0).toString(16)).slice(-8);
    const hex3 = ('00000000' + ((h1 ^ h2) >>> 0).toString(16)).slice(-8);
    const hex4 = ('00000000' + ((h1 + h2) >>> 0).toString(16)).slice(-8);
    const full = (hex1 + hex2 + hex3 + hex4).slice(0, 32);

    return `${full.slice(0,8)}-${full.slice(8,12)}-4${full.slice(13,16)}-a${full.slice(17,20)}-${full.slice(20,32)}`.toLowerCase();
  }

  return (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : '00000000-0000-4000-8000-000000000000';
}

export function isRoomFacility(fac) {
  return Boolean(
    fac &&
    Array.isArray(fac.applicable_services) &&
    fac.applicable_services.some(s => typeof s === 'string' && s.startsWith('__type__:room'))
  );
}

export function parseRoomFromFacility(fac) {
  if (!fac) return null;
  const services = Array.isArray(fac.applicable_services) ? fac.applicable_services : [];
  const colorTag = services.find(s => typeof s === 'string' && s.startsWith('__color__:'));
  const color = colorTag ? colorTag.replace('__color__:', '') : '#3B82F6';
  
  const origIdTag = services.find(s => typeof s === 'string' && s.startsWith('__orig_id__:'));
  const origId = origIdTag ? origIdTag.replace('__orig_id__:', '') : null;
  
  return {
    id: origId || fac.id,
    db_id: fac.id,
    name: fac.name,
    color,
    branch_id: fac.branch_id || null,
    display_order: fac.display_order || 0
  };
}

export function encodeRoomToFacility(room) {
  if (!room) return null;
  const validUuid = ensureValidUuid(room.id);
  const tags = [
    '__type__:room',
    `__color__:${room.color || '#3B82F6'}`
  ];
  if (room.id && room.id !== validUuid) {
    tags.push(`__orig_id__:${room.id}`);
  }

  return {
    id: validUuid,
    name: room.name,
    applicable_services: tags,
    branch_id: room.branch_id || null,
    is_active: true
  };
}

export function parseBedFromFacility(fac, bedRoomMap = {}) {
  if (!fac) return null;
  const services = Array.isArray(fac.applicable_services) ? fac.applicable_services : [];
  
  const roomTag = services.find(s => typeof s === 'string' && s.startsWith('__room__:'));
  const dbRoomId = roomTag ? (roomTag.replace('__room__:', '') || null) : null;
  
  const overlapTag = services.find(s => typeof s === 'string' && s.startsWith('__overlap__:'));
  const allowOverlap = overlapTag ? overlapTag === '__overlap__:true' : false;

  const cleaningTag = services.find(s => typeof s === 'string' && s.startsWith('__cleaning_time__:'));
  const cleaningDuration = cleaningTag ? parseInt(cleaningTag.replace('__cleaning_time__:', ''), 10) || 0 : 0;
  
  const cleanServices = services.filter(s => typeof s === 'string' && !s.startsWith('__'));
  
  // Try finding room_id from db tag first, then bedRoomMap (both original and UUID variants)
  const mappedRoomId = bedRoomMap[fac.id] || 
                       bedRoomMap[fac.id?.toLowerCase()] || 
                       (ensureValidUuid(fac.id) ? bedRoomMap[ensureValidUuid(fac.id)] : null);

  return {
    ...fac,
    room_id: dbRoomId || mappedRoomId || null,
    allow_overlap: allowOverlap,
    cleaning_duration: cleaningDuration,
    applicable_services: cleanServices
  };
}

export function encodeBedToFacility(bed) {
  if (!bed) return null;
  const cleanServices = (bed.applicable_services || []).filter(s => typeof s === 'string' && !s.startsWith('__'));
  const tags = [];
  if (bed.room_id) {
    tags.push(`__room__:${bed.room_id}`);
  }
  if (bed.allow_overlap) {
    tags.push('__overlap__:true');
  }
  if (bed.cleaning_duration !== undefined && bed.cleaning_duration !== null) {
    tags.push(`__cleaning_time__:${bed.cleaning_duration}`);
  }
  
  const validBedId = ensureValidUuid(bed.id);

  return {
    id: validBedId,
    name: bed.name,
    applicable_services: [...cleanServices, ...tags],
    branch_id: bed.branch_id || null,
    is_active: bed.is_active !== false
  };
}

/**
 * Calculates remaining cleaning time for a session in 'cleaning' status
 */
export function calculateCleaningCountdown(session, nowTimestamp = Date.now()) {
  if (!session || session.status !== 'cleaning' || !session.cleaning_started_at) {
    return { isCleaning: false, remainingSeconds: 0, progressPercent: 0, isFinished: true };
  }

  const durationMs = (session.cleaning_duration_minutes || 10) * 60 * 1000;
  const elapsedMs = Math.max(0, nowTimestamp - session.cleaning_started_at);
  const remainingMs = Math.max(0, durationMs - elapsedMs);

  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const remainingMinutes = Math.ceil(remainingSeconds / 60);
  const progressPercent = Math.min(100, Math.round((elapsedMs / durationMs) * 100));

  return {
    isCleaning: true,
    remainingSeconds,
    remainingMinutes,
    progressPercent,
    isFinished: remainingMs <= 0
  };
}
