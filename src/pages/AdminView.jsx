import React, { useState } from 'react';
import GameAdminTab from '../components/admin/GameAdminTab';
import UserAdminTab from '../components/admin/UserAdminTab';

export default function AdminView() {
    const [activeTab, setActiveTab] = useState('games');

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

            <div className="flex gap-4 mb-6 border-b pb-2">
                <button
                    className={`px-4 py-2 rounded-t font-semibold ${activeTab === 'games' ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'}`}
                    onClick={() => setActiveTab('games')}
                >
                    Games & Locations
                </button>
                <button
                    className={`px-4 py-2 rounded-t font-semibold ${activeTab === 'users' ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'}`}
                    onClick={() => setActiveTab('users')}
                >
                    User Management
                </button>
            </div>

            {activeTab === 'games' && <GameAdminTab />}
            {activeTab === 'users' && <UserAdminTab />}
        </div>
    );
}
