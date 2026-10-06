export function canonicalNames(names: readonly string[]): string[] {
    if (new Set(names).size !== names.length) throw new Error('duplicate names in lineup entry')
    return names.toSorted()
}