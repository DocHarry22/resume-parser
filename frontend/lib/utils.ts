type ClassValue = string | false | null | undefined | ClassValue[] | Record<string, boolean | null | undefined>;
export function cn(...values: ClassValue[]): string {
  return values.flatMap(value => {
    if (!value) return [];
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return [cn(...value)];
    return Object.keys(value).filter(key => value[key]);
  }).join(' ');
}
