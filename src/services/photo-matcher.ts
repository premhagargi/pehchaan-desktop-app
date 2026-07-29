import { RecordItem, PhotoItem, FieldDefinition } from '../types';

export interface MatchResult {
  photoId: string;
  recordId: string | null;
  confidence: number;
  method: 'EXACT_FILENAME' | 'FUZZY_FILENAME' | 'SEQUENTIAL' | 'MANUAL';
  suggestedRecordName?: string;
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/\.[^/.]+$/, '') // remove extension
    .replace(/[^a-z0-9]/g, '') // remove special chars/spaces
    .trim();
}

// Simple Levenshtein distance
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function autoMatchPhotos(
  photos: PhotoItem[],
  records: RecordItem[],
  fields: FieldDefinition[]
): MatchResult[] {
  const results: MatchResult[] = [];
  const assignedRecordIds = new Set<string>();

  // Identify photo reference and candidate text fields (like roll_no, id, name)
  const candidateKeys = fields
    .filter(f => f.type === 'TEXT' || f.type === 'PHONE' || f.type === 'NUMBER' || f.type === 'PHOTO_REF')
    .map(f => f.key);

  for (const photo of photos) {
    if (photo.status === 'CONFIRMED' && photo.recordId) {
      assignedRecordIds.add(photo.recordId);
      continue;
    }

    const cleanFilename = normalizeString(photo.originalFilename);
    let bestRecord: RecordItem | null = null;
    let bestScore = 0;
    let matchMethod: MatchResult['method'] = 'FUZZY_FILENAME';

    for (const record of records) {
      for (const key of candidateKeys) {
        const val = record.recordData[key];
        if (!val) continue;

        const cleanVal = normalizeString(String(val));
        if (!cleanVal) continue;

        // 1. Exact match
        if (cleanFilename === cleanVal) {
          bestRecord = record;
          bestScore = 1.0;
          matchMethod = 'EXACT_FILENAME';
          break;
        }

        // 2. Partial containment
        if (cleanFilename.includes(cleanVal) || cleanVal.includes(cleanFilename)) {
          const score = 0.85;
          if (score > bestScore) {
            bestScore = score;
            bestRecord = record;
            matchMethod = 'FUZZY_FILENAME';
          }
        }

        // 3. Levenshtein fuzzy distance
        const dist = levenshtein(cleanFilename, cleanVal);
        const maxLen = Math.max(cleanFilename.length, cleanVal.length);
        if (maxLen > 0) {
          const sim = 1 - dist / maxLen;
          if (sim > 0.65 && sim > bestScore) {
            bestScore = sim;
            bestRecord = record;
            matchMethod = 'FUZZY_FILENAME';
          }
        }
      }

      if (bestScore === 1.0) break;
    }

    if (bestRecord && bestScore >= 0.6) {
      assignedRecordIds.add(bestRecord.id);
      const nameKey = fields.find(f => f.key.toLowerCase().includes('name'))?.key || 'name';
      results.push({
        photoId: photo.id,
        recordId: bestRecord.id,
        confidence: Math.round(bestScore * 100) / 100,
        method: matchMethod,
        suggestedRecordName: bestRecord.recordData[nameKey] || bestRecord.id,
      });
    } else {
      results.push({
        photoId: photo.id,
        recordId: null,
        confidence: 0,
        method: 'MANUAL',
      });
    }
  }

  return results;
}
