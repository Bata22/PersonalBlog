/** Grupiše stavke biblioteke po statusu, zadatim redom; prazne grupe se preskaču. */
export function groupByStatus<T extends { status: string }, S extends string>(items: T[], order: readonly S[]) {
  return order
    .map((status) => ({ status, items: items.filter((item) => item.status === status) }))
    .filter((group) => group.items.length > 0)
}
