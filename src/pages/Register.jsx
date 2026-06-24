// src/pages/Register.jsx
import React, { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Register() {
    const { supabase } = useAuthContext();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(null);

        const { data, error: signUpError } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
        });

        if (signUpError) {
            setError(signUpError.message);
            return;
        }

        const userId = data?.user?.id;

        if (!userId) {
            setError('Failed to get user ID from signup');
            return;
        }

        const { error: profileError } = await supabase.rpc('create_user_profile', {
            first_name: form.first_name,
            last_name: form.last_name,
        });

        if (profileError) {
            setError(profileError.message);
            return;
        }


        // Optional: inform user to check email if confirmation is required
        alert('Registered!');

        navigate('/');
    };



    return (
        <div className="auth-page page-safe-area min-h-screen-safe max-w-md mx-auto">
            <h1 className="text-5xl mb-4">Register</h1>
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <input
                    type="text"
                    name="first_name"
                    placeholder="First name"
                    value={form.first_name}
                    onChange={handleChange}
                    required
                    className="input-gray"
                />
                <input
                    type="text"
                    name="last_name"
                    placeholder="Last name"
                    value={form.last_name}
                    onChange={handleChange}
                    required
                    className="input-gray"
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="input-gray"
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="input-gray"
                />
                {error && <p className="text-red-600">{error}</p>}
                <button
                    type="submit"
                    className="btn-pill2"
                >
                    Register
                </button>
            </form>
        </div>
    );
}
