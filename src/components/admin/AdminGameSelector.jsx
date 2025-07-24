import React, { useEffect, useState } from 'react';
import { adminGames } from '../../services/supabaseService';

export default function AdminGameSelector({ selectedGameId, setSelectedGameId }) {
    const [games, setGames] = useState([]);
    const [newGameName, setNewGameName] = useState('');

    useEffect(() => {
        adminGames.fetch().then(setGames);
    }, []);

    const handleCreate = async () => {
        const created = await adminGames.insert({ name: newGameName });
        setGames(prev => [...prev, created]);
        setNewGameName('');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this game?')) return;
        await adminGames.delete(id);
        setGames(prev => prev.filter(g => g.id !== id));
        if (selectedGameId === id) setSelectedGameId(null);
    };

    return (
        <div className="bg-white p-4 rounded shadow mb-6">
            <label className="block font-semibold mb-2 text-lg">Select Game:</label>
            <select
                value={selectedGameId || ''}
                onChange={(e) => setSelectedGameId(e.target.value)}
                className="input-admin mb-4 w-full"
            >
                <option value="" disabled>Select a game</option>
                {games.map(game => (
                    <option key={game.id} value={game.id}>
                        {game.name}
                    </option>
                ))}
            </select>

            <div className="flex gap-2 items-center">
                <input
                    type="text"
                    placeholder="New game name"
                    className="input-admin flex-grow"
                    value={newGameName}
                    onChange={(e) => setNewGameName(e.target.value)}
                />
                <button className="btn-pill-sm" onClick={handleCreate}>+ Create</button>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {games.map(game => (
                    <li key={game.id} className="flex justify-between items-center">
                        <span>{game.name}</span>
                        <button className="text-red-500 hover:underline" onClick={() => handleDelete(game.id)}>
                            Delete
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
