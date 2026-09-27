/**
 * Robust EntityResolver (Phase 5 Intelligence)
 * 
 * Supports:
 * - Exact matching, partial matching, Vietnamese titles (chị, anh, cô, chú, bác, em, bé)
 * - Diacritic-insensitive fuzzy matching ("Nguyen Thi Lan" -> "Nguyễn Thị Lan")
 * - Confidence Tiers: HIGH (unique strong match), MEDIUM (plausible candidate), LOW (multiple matches)
 * - Safe Ambiguity Protection: NEVER guess ID or choose first result blindly
 */

export interface EntityCandidate<T = any> {
  id: string;
  name: string;
  score: number;
  confidenceTier: 'HIGH' | 'MEDIUM' | 'LOW';
  data?: T;
  matchedField: 'exact_name' | 'normalized_name' | 'partial_name' | 'phone' | 'context';
}

export interface EntityResolutionOutput<T = any> {
  resolved: boolean;
  bestMatch?: EntityCandidate<T>;
  candidates: EntityCandidate<T>[];
  isAmbiguous: boolean;
  confidenceTier: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  rawQuery: string;
}

export function removeVietnameseAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, m => (m === 'đ' ? 'd' : 'D'))
    .toLowerCase()
    .trim();
}

export class RobustEntityResolver {
  /**
   * Cleans natural Vietnamese prefixes & pronouns
   */
  static cleanNamePrefixes(raw: string): string {
    return raw
      .replace(/^(?:tìm\s+khách(?:\s+hàng)?|khách(?:\s+hàng)?|cho|của|chị|anh|cô|chú|bác|em|bé)\s+/gi, '')
      .replace(/[.!?]+$/, '')
      .trim();
  }

  /**
   * Resolves customer candidates with fuzzy matching & confidence scoring
   */
  static resolveCustomerFromList<T extends { id: string; name?: string; phone?: string; full_name?: string }>(
    query: string,
    customerList: T[]
  ): EntityResolutionOutput<T> {
    const raw = this.cleanNamePrefixes(query);
    const normQuery = removeVietnameseAccents(raw);
    const phoneOnly = raw.replace(/\D/g, '');

    const candidates: EntityCandidate<T>[] = [];

    for (const cust of customerList) {
      const custName = cust.name || cust.full_name || '';
      const custPhone = (cust.phone || '').replace(/\D/g, '');
      const normCustName = removeVietnameseAccents(custName);

      // 1. Exact Phone Match -> HIGH confidence
      if (phoneOnly.length >= 9 && custPhone.includes(phoneOnly)) {
        candidates.push({
          id: cust.id,
          name: custName,
          score: 1.0,
          confidenceTier: 'HIGH',
          data: cust,
          matchedField: 'phone'
        });
        continue;
      }

      // 2. Exact Name Match (with accents) -> HIGH
      if (raw.toLowerCase() === custName.toLowerCase()) {
        candidates.push({
          id: cust.id,
          name: custName,
          score: 0.98,
          confidenceTier: 'HIGH',
          data: cust,
          matchedField: 'exact_name'
        });
        continue;
      }

      // 3. Exact Normalized Name Match (without accents) -> HIGH / MEDIUM
      if (normQuery === normCustName) {
        candidates.push({
          id: cust.id,
          name: custName,
          score: 0.92,
          confidenceTier: 'HIGH',
          data: cust,
          matchedField: 'normalized_name'
        });
        continue;
      }

      // 4. Word boundary / Substring match
      if (normQuery.length >= 2 && normCustName.includes(normQuery)) {
        // Higher score if it's the first or last name
        const score = normCustName.endsWith(normQuery) ? 0.85 : 0.75;
        candidates.push({
          id: cust.id,
          name: custName,
          score,
          confidenceTier: 'MEDIUM',
          data: cust,
          matchedField: 'partial_name'
        });
      }
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
      return {
        resolved: false,
        candidates: [],
        isAmbiguous: false,
        confidenceTier: 'NONE',
        rawQuery: query
      };
    }

    // Ambiguity Check: If top 2 candidates have identical or near-identical scores
    const topScore = candidates[0].score;
    const sameScoreCandidates = candidates.filter(c => c.score >= topScore - 0.05);

    if (sameScoreCandidates.length > 1) {
      return {
        resolved: false,
        candidates: sameScoreCandidates,
        isAmbiguous: true,
        confidenceTier: 'LOW',
        rawQuery: query
      };
    }

    return {
      resolved: true,
      bestMatch: candidates[0],
      candidates,
      isAmbiguous: false,
      confidenceTier: candidates[0].confidenceTier,
      rawQuery: query
    };
  }

  /**
   * Resolves staff member with Vietnamese role titles (thợ, chuyên viên, kỹ thuật viên)
   */
  static resolveStaffFromList<T extends { id: string; name?: string; full_name?: string }>(
    query: string,
    staffList: T[]
  ): EntityResolutionOutput<T> {
    const raw = query
      .replace(/^(?:thợ|nhân\s*viên|kỹ\s*thuật\s*viên|chuyên\s*viên|cho|của)\s+/gi, '')
      .trim();
    const normQuery = removeVietnameseAccents(raw);

    const candidates: EntityCandidate<T>[] = [];

    for (const staff of staffList) {
      const staffName = staff.full_name || staff.name || '';
      const normStaffName = removeVietnameseAccents(staffName);

      if (raw.toLowerCase() === staffName.toLowerCase()) {
        candidates.push({
          id: staff.id,
          name: staffName,
          score: 1.0,
          confidenceTier: 'HIGH',
          data: staff,
          matchedField: 'exact_name'
        });
      } else if (normQuery === normStaffName) {
        candidates.push({
          id: staff.id,
          name: staffName,
          score: 0.93,
          confidenceTier: 'HIGH',
          data: staff,
          matchedField: 'normalized_name'
        });
      } else if (normQuery.length >= 2 && normStaffName.includes(normQuery)) {
        candidates.push({
          id: staff.id,
          name: staffName,
          score: normStaffName.endsWith(normQuery) ? 0.88 : 0.75,
          confidenceTier: 'MEDIUM',
          data: staff,
          matchedField: 'partial_name'
        });
      }
    }

    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
      return { resolved: false, candidates: [], isAmbiguous: false, confidenceTier: 'NONE', rawQuery: query };
    }

    const topScore = candidates[0].score;
    const sameScore = candidates.filter(c => c.score >= topScore - 0.05);
    if (sameScore.length > 1) {
      return { resolved: false, candidates: sameScore, isAmbiguous: true, confidenceTier: 'LOW', rawQuery: query };
    }

    return {
      resolved: true,
      bestMatch: candidates[0],
      candidates,
      isAmbiguous: false,
      confidenceTier: candidates[0].confidenceTier,
      rawQuery: query
    };
  }

  /**
   * Resolves service catalog items
   */
  static resolveServiceFromList<T extends { id: string; name?: string; price?: number }>(
    query: string,
    serviceList: T[]
  ): EntityResolutionOutput<T> {
    const raw = query.trim();
    const normQuery = removeVietnameseAccents(raw);

    const candidates: EntityCandidate<T>[] = [];

    for (const s of serviceList) {
      const sName = s.name || '';
      const normSName = removeVietnameseAccents(sName);

      if (raw.toLowerCase() === sName.toLowerCase()) {
        candidates.push({ id: s.id, name: sName, score: 1.0, confidenceTier: 'HIGH', data: s, matchedField: 'exact_name' });
      } else if (normQuery === normSName) {
        candidates.push({ id: s.id, name: sName, score: 0.95, confidenceTier: 'HIGH', data: s, matchedField: 'normalized_name' });
      } else if (normQuery.length >= 3 && normSName.includes(normQuery)) {
        candidates.push({ id: s.id, name: sName, score: 0.82, confidenceTier: 'MEDIUM', data: s, matchedField: 'partial_name' });
      }
    }

    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
      return { resolved: false, candidates: [], isAmbiguous: false, confidenceTier: 'NONE', rawQuery: query };
    }

    const topScore = candidates[0].score;
    const sameScore = candidates.filter(c => c.score >= topScore - 0.05);
    if (sameScore.length > 1) {
      return { resolved: false, candidates: sameScore, isAmbiguous: true, confidenceTier: 'LOW', rawQuery: query };
    }

    return {
      resolved: true,
      bestMatch: candidates[0],
      candidates,
      isAmbiguous: false,
      confidenceTier: candidates[0].confidenceTier,
      rawQuery: query
    };
  }
}
