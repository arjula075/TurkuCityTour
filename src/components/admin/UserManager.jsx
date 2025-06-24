import React, { useEffect, useState } from 'react';
import { adminUsers } from '../../services/supabaseService';

export default function UserManager() {
    const [users, setUsers] = useState([]);
    const [expandedUserId, setExpandedUserId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadUsers() {
            try {
                const data = await adminUsers.fetchAll();
                const sorted = [...data].sort((a, b) => a.last_name.localeCompare(b.last_name));
                setUsers(sorted);
            } catch (e) {
                alert('Failed to load users: ' + e.message);
            } finally {
                setLoading(false);
            }
        }
        loadUsers();
    }, []);

    const toggleExpand = (id) => {
        setExpandedUserId(prev => (prev === id ? null : id));
    };

    const handleFieldChange = async (userId, field, newValue) => {
        setUsers(prev =>
            prev.map(user =>
                user.id === userId ? { ...user, [field]: newValue } : user
            )
        );

        try {
            await adminUsers.update(userId, { [field]: newValue });
        } catch (e) {
            alert(`Failed to update ${field}: ` + e.message);
        }
    };

    return (
        <div className="bg-gray-100 p-6 rounded-lg shadow-inner mt-12">
            <h2 className="text-2xl font-semibold mb-4">User Management</h2>
            {loading ? (
                <p>Loading users...</p>
            ) : (
                <div className="space-y-4">
                    {users.map(user => (
                        <div
                            key={user.id}
                            className="border border-gray-300 rounded overflow-hidden bg-white"
                        >
                            <button
                                onClick={() => toggleExpand(user.id)}
                                className="w-full text-left p-4 bg-gray-300 hover:bg-gray-400 focus:outline-none"
                            >
                                <div className="font-medium">
                                    {user.last_name}, {user.first_name}
                                </div>
                                <div className="text-sm text-gray-600">{user.email}</div>
                            </button>
                            {expandedUserId === user.id && (
                                <div className="p-4 border-t border-gray-300 text-sm text-gray-700 space-y-2">
                                    {Object.entries(user).map(([key, value]) => {
                                        if (key === 'id') {
                                            return (
                                                <div key={key} className="grid grid-cols-[150px_1fr] gap-2 items-center">
                                                    <label className="font-semibold">{key}</label>
                                                    <span>{value}</span>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div
                                                key={key}
                                                className="grid grid-cols-[150px_1fr] gap-2 items-center"
                                            >
                                                <label className="font-semibold capitalize" htmlFor={`${user.id}-${key}`}>
                                                    {key.replace('_', ' ')}
                                                </label>

                                                {key === 'is_admin' ? (
                                                    <input
                                                        id={`${user.id}-${key}`}
                                                        className="input-admin h-4 w-4"
                                                        type="checkbox"
                                                        checked={!!value}
                                                        onChange={(e) =>
                                                            handleFieldChange(user.id, key, e.target.checked)
                                                        }
                                                    />
                                                ) : key === 'message' ? (
                                                    <textarea
                                                        id={`${user.id}-${key}`}
                                                        className="input-admin"
                                                        rows={3}
                                                        value={value ?? ''}
                                                        onChange={(e) =>
                                                            handleFieldChange(user.id, key, e.target.value)
                                                        }
                                                    />
                                                ) : (
                                                    <input
                                                        id={`${user.id}-${key}`}
                                                        className="input-admin"
                                                        type="text"
                                                        value={value ?? ''}
                                                        onChange={(e) =>
                                                            handleFieldChange(user.id, key, e.target.value)
                                                        }
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
