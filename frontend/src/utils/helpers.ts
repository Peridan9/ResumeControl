// Helper functions to handle backend's sql.NullString and sql.NullTime formats

type NullStringValue = string | null | { String: string; Valid: boolean }
type NullTimeValue = string | { Time: string; Valid: boolean }

/**
 * Converts a NullString value (which can be a string, null, or {String, Valid} object)
 * to a regular string or null
 */
export function nullStringToString(value: NullStringValue): string | null {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'object' && 'String' in value && 'Valid' in value) {
    return value.Valid ? value.String : null
  }
  return null
}

/**
 * Converts a NullTime value (which can be a string or {Time, Valid} object)
 * to a regular ISO string or null
 */
export function nullTimeToString(value: NullTimeValue): string | null {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'object' && 'Time' in value && 'Valid' in value) {
    return value.Valid ? value.Time : null
  }
  return null
}

