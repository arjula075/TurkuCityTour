// src/pages/Register.jsx
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function Register() {
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const { email, password, firstName, lastName } = form;

        // Register user with Supabase Auth
        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                },
            },
        });

        if (signUpError) {
            setError(signUpError.message);
        } else {
            setSuccess('Registration successful! Check your email to confirm.');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-4 border rounded shadow">
            <h2 className="text-2xl mb-4 font-semibold">Register</h2>
            <form onSubmit={handleRegister} className="space-y-3">
                <input name="firstName" type="text" placeholder="First Name" required className="w-full p-2 border rounded" onChange={handleChange} />
                <input name="lastName" type="text" placeholder="Last Name" required className="w-full p-2 border rounded" onChange={handleChange} />
                <input name="email" type="email" placeholder="Email Address" required className="w-full p-2 border rounded" onChange={handleChange} />
                <input name="password" type="password" placeholder="Password" required className="w-full p-2 border rounded" onChange={handleChange} />
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Register</button>
            </form>
            {error && <p className="text-red-600 mt-2">{error}</p>}
            {success && <p className="text-green-600 mt-2">{success}</p>}
        </div>
    );
}
