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
  
  const cleanServices = services.filter(s => typeof s === 'string' && !s.startsWith('__'));
  
  return {
    ...fac,
    room_id: dbRoomId || bedRoomMap[fac.id] || null,
    allow_overlap: allowOverlap,
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
  
  return {
    id: bed.id,
    name: bed.name,
    applicable_services: [...cleanServices, ...tags],
    branch_id: bed.branch_id || null,
    is_active: bed.is_active !== false
  };
}
