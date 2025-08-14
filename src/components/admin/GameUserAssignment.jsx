import React, { useEffect, useState } from 'react';
import { adminUsers, gameAssignments } from '../../services/supabaseService';

export default function GameUserAssignment({ gameId }) {
    const [users, setUsers] = useState([]);
    const [assignedUserIds, setAssignedUserIds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const users = await adminUsers.fetchAll();
                const assigned = await gameAssignments.fetchByGame(gameId);
                setUsers(users);
                setAssignedUserIds(assigned);
            } catch (e) {
                alert('Failed to load users or assignments: ' + e.message);
            } finally {
                setLoading(false);
            }
        }

        if (gameId) load();
    }, [gameId]);

    const toggleUser = async (userId) => {
        try {
            const isAssigned = assignedUserIds.includes(userId);

            if (isAssigned) {
                await gameAssignments.unassign(userId, gameId);
                setAssignedUserIds((prev) => prev.filter((id) => id !== userId));
            } else {
                await gameAssignments.assign(userId, gameId);
                setAssignedUserIds((prev) => [...prev, userId]);
            }
        } catch (e) {
            alert('Failed to update assignment: ' + e.message);
        }
    };

    if (!gameId) return null;
    if (loading) return <p>Loading users...</p>;

    return (
        <div className="mt-8 bg-white p-4 rounded shadow-md">
            <h2 className="text-2xl font-bold mb-4">Assign Users to Game</h2>
            <ul className="space-y-2">
                {users.map((user) => (
                    <li key={user.id} className="flex items-center justify-between">
                        <span>{user.first_name} {user.last_name}</span>
                        <input
                            type="checkbox"
                            checked={assignedUserIds.includes(user.id)}
                            onChange={() => toggleUser(user.id)}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
}
