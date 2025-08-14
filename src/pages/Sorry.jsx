import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

export default function Sorry() {
    const { profile } = useAuthContext();
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center h-screen text-center px-4">
            <h1 className="text-4xl font-bold mb-4">Sorry!</h1>
            <p className="text-lg text-gray-600 mb-6">
                You are not currently assigned to any game.
            </p>

            {profile?.is_admin ? (
                <button
                    className="btn-pill2"
                    onClick={() => navigate('/admin')}
                >
                    Go to Admin Panel
                </button>
            ) : (
                <p className="text-gray-500">Please contact your administrator for access.</p>
            )}
        </div>
    );
}
