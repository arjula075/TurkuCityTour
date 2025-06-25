import React, { useEffect, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { fetchUserProfile, fetchProfileImageUrl } from '../services/supabaseService';
import { adminImages } from '../services/adminImages';

export default function GameComplete() {
    const { user } = useAuthContext();
    const [message, setMessage] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState(null);

    useEffect(() => {
        async function loadData() {
            if (!user?.id) return;

            try {
                // Load user message
                const profile = await fetchUserProfile(user.id);
                setMessage(profile?.message ?? 'Thanks for playing!');

                // Load user's profile image (thumbnail or full)
                const signedUrl = await fetchProfileImageUrl(user.id);
                if (signedUrl) setProfileImageUrl(signedUrl);
            } catch (err) {
                console.warn('Error loading data in GameComplete:', err.message);
            }
        }

        loadData();
    }, [user]);

    return (
        <div className="p-6 text-center">
            {profileImageUrl && (
                <img
                    src={profileImageUrl}
                    alt="User profile"
                    className="mx-auto mb-4 w-28 h-28 object-cover rounded-full border-4 border-white shadow"
                />
            )}
            <h1 className="text-5xl font-bold mb-4">🎉 Game Complete!</h1>
            <p className="text-4xl mb-6 whitespace-pre-line">{message}</p>
            <button
                className="btn-pill2"
                onClick={() => window.location.href = '/'}
            >
                Back to Start
            </button>
        </div>
    );
}
