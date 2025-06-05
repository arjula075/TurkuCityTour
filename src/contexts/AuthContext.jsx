// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserAndProfile = async () => {
      const {
        data: { user: sessionUser },
      } = await supabase.auth.getUser();

      setUser(sessionUser);
      console.log('User:', sessionUser);

      if (sessionUser) {
        console.log("sessionUser: ", sessionUser, "")
        const { data, error } = await supabase
            .from('users') // Table name
            .select('first_name, last_name')
            .eq('id', sessionUser.id)
            .maybeSingle(); // ← allows 0 or 1 result safely

        if (error) {
          console.error('Error fetching user profile:', error.message);
        } else {
          console.log('User profile:', data);
          setProfile(data);
        }
      }

      setLoading(false);
    };

    getUserAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      getUserAndProfile();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
      <AuthContext.Provider value={{ user, profile, supabase, loading }}>
        {children}
      </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
