import React, { useEffect, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { isRegistrationEnabled } from '../config/features';

export default function Login() {
    const { supabase, user } = useAuthContext();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user) navigate('/map');
    }, [user]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
        }
    };

    return (
        <div className="auth-page page-safe-area min-h-screen-safe">
            <h1 className="text-6xl mb-4">Login</h1>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-gray"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input-gray"
                />
                {error && <p className="text-red-600">{error}</p>}
                <button className="btn-pill2"
                    type="submit"

                >
                    Login
                </button>
            </form>

            {isRegistrationEnabled && (
                <p className="mt-4 text-4xl  text-center">
                    Don't have an account?{' '}
                    <Link
                        to="/register"
                        className="text-blue-600 hover:underline text-4xl"
                    >
                        Register here
                    </Link>
                </p>
            )}

            <p className="mt-8 text-center text-sm text-gray-500">
                <Link to="/privacy" className="hover:underline">
                    Privacy Policy
                </Link>
            </p>
        </div>
    );
}
