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
        upsert: vi.fn(function upsert() {
            return chain;
        }),
        eq: vi.fn(function eq() {
            return chain;
        }),
        in: vi.fn(function inFilter() {
            return chain;
        }),
        order: vi.fn(function order() {
            return chain;
        }),
        maybeSingle: vi.fn().mockResolvedValue(result),
        single: vi.fn().mockResolvedValue(result),
        then(onFulfilled, onRejected) {
            return Promise.resolve(result).then(onFulfilled, onRejected);
        },
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

export function makeHoistedTableMock() {
    const table = {
        insert: vi.fn(() => table),
        update: vi.fn(() => table),
        delete: vi.fn(() => table),
        select: vi.fn(() => table),
        upsert: vi.fn(() => table),
        eq: vi.fn(() => table),
        in: vi.fn(() => table),
        order: vi.fn(() => table),
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        then(onFulfilled, onRejected) {
            return Promise.resolve({ data: null, error: null }).then(onFulfilled, onRejected);
        },
    };
    return table;
}
