/** Paginated auth user listing — listUsers() only returns one page by default. */
export async function listAllAuthUsers(admin) {
    const users = [];
    let page = 1;
    const perPage = 1000;

    while (true) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
        if (error) throw new Error(`Failed to list users: ${error.message}`);

        users.push(...data.users);
        if (data.users.length < perPage) break;
        page += 1;
    }

    return users;
}

export async function findAuthUserByEmail(admin, email) {
    const users = await listAllAuthUsers(admin);
    return users.find((user) => user.email === email) ?? null;
}
