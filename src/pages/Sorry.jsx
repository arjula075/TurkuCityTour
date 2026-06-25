import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { isAdminEnabled } from '../config/features';

export default function Sorry() {
    const { profile } = useAuthContext();
    const navigate = useNavigate();
    const showAdminLink = isAdminEnabled && profile?.is_platform_admin;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen-safe page-safe-area text-center">
            <h1 className="text-4xl font-bold mb-4">Sorry!</h1>
            <p className="text-lg text-gray-600 mb-6">
                You are not currently assigned to any game.
            </p>

            {showAdminLink ? (
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
