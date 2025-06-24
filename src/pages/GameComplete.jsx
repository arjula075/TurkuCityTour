import React, { useEffect, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { fetchUserProfile } from '../services/supabaseService';

export default function GameComplete() {
    const { user } = useAuthContext();
    const [message, setMessage] = useState('');

    useEffect(() => {
        async function loadMessage() {
            if (user?.id) {
                const profile = await fetchUserProfile(user.id);
                setMessage(profile?.message ?? 'Thanks for playing!');
            }
        }
        loadMessage();
    }, [user]);

    return (
        <div className="p-6 text-center">
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
