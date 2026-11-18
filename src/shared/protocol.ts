export type Item = Record<string, unknown>;
export type BoardState = { items: Record<string, Item>; order: string[]; fields: Record<string, unknown> };
export type Op = { opId: string; author: string; seq?: number; kind: 'add'|'update'|'remove'|'order'|'field'; id?: string; patch?: Item; field?: string; value?: unknown };
export type Student = { id: string; name: string; status: 'pending'|'active'|'removed'; last_seen: number };
export const emptyState = (): BoardState => ({ items: {}, order: [], fields: {} });
export const clone = <T>(value: T): T => structuredClone(value);
export function applyOp(state: BoardState, op: Op) {
  if (op.kind === 'add' && op.id && op.patch) { state.items[op.id] = clone(op.patch); if (!state.order.includes(op.id)) state.order.push(op.id); }
  if (op.kind === 'update' && op.id && state.items[op.id] && op.patch) Object.assign(state.items[op.id], clone(op.patch));
  if (op.kind === 'remove' && op.id) { delete state.items[op.id]; state.order = state.order.filter(id => id !== op.id); }
  if (op.kind === 'order' && Array.isArray(op.value)) state.order = [...new Set((op.value as string[]).filter(id => Object.hasOwn(state.items, id))), ...Object.keys(state.items).filter(id => !(op.value as string[]).includes(id))];
  if (op.kind === 'field' && op.field) state.fields[op.field] = clone(op.value);
}
const safeKey = (s: unknown): s is string => typeof s === 'string' && /^[\w:.-]{1,160}$/.test(s) && !['__proto__','prototype','constructor'].includes(s);
export function validOp(x: unknown): x is Op {
  if (!x || typeof x !== 'object') return false;
  const o = x as Op;
  if (!safeKey(o.opId) || !safeKey(o.author)) return false;
  if (o.kind === 'order') return Array.isArray(o.value) && o.value.length <= 2000 && o.value.every(safeKey);
  if (o.kind === 'field') return safeKey(o.field) && o.value !== undefined;
  if (!safeKey(o.id)) return false;
  if (o.kind === 'remove') return true;
  return ['add','update'].includes(o.kind) && !!o.patch && typeof o.patch === 'object' && !Array.isArray(o.patch) && Object.keys(o.patch).every(safeKey);
}
