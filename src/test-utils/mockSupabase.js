import { vi } from 'vitest';

export function makeSupabaseTableMock(result = { data: [], error: null }) {
    const chain = {
        select: vi.fn(function select() {
            return chain;
        }),
        insert: vi.fn(function insert() {
            return chain;
        }),
        update: vi.fn(function update() {
            return chain;
        }),
        delete: vi.fn(function del() {
            return chain;
        }),
        eq: vi.fn(function eq() {
            return Promise.resolve(result);
        }),
        in: vi.fn(function inFilter() {
            return Promise.resolve(result);
        }),
        order: vi.fn(function order() {
            return Promise.resolve(result);
        }),
        maybeSingle: vi.fn().mockResolvedValue(result),
        single: vi.fn().mockResolvedValue(result),
    };

    return chain;
}

export function makeSupabaseFromMock(tableHandlers = {}) {
    return vi.fn((table) => {
        if (tableHandlers[table]) {
            return tableHandlers[table];
        }
        return makeSupabaseTableMock();
    });
}
