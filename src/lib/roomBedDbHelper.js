/**
 * roomBedDbHelper.js
 * Enables full database persistence for Rooms and Beds into Supabase PostgreSQL `facility` table.
 * Encodes room metadata and bed-room associations seamlessly within PostgreSQL JSON array.
 */

export function isRoomFacility(fac) {
  return Boolean(
    fac &&
    Array.isArray(fac.applicable_services) &&
    fac.applicable_services.some(s => typeof s === 'string' && s.startsWith('__type__:room'))
  );
}

export function parseRoomFromFacility(fac) {
  if (!fac) return null;
  const colorTag = (fac.applicable_services || []).find(s => typeof s === 'string' && s.startsWith('__color__:'));
  const color = colorTag ? colorTag.replace('__color__:', '') : '#3B82F6';
  
  return {
    id: fac.id,
    name: fac.name,
    color,
    branch_id: fac.branch_id || null,
    display_order: fac.display_order || 0
  };
}

export function encodeRoomToFacility(room) {
  if (!room) return null;
  return {
    id: room.id,
    name: room.name,
    applicable_services: [
      '__type__:room',
      `__color__:${room.color || '#3B82F6'}`
    ],
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
  
  return {
    ...fac,
    room_id: dbRoomId || bedRoomMap[fac.id] || null,
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
  
  return {
    id: bed.id,
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

