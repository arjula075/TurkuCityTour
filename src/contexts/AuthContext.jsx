// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();
export { AuthContext };

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
      // console.log('User:', sessionUser);

      if (sessionUser) {
        // console.log("sessionUser: ", sessionUser, "")
        const { data, error } = await supabase
            .from('users') // Table name
            .select('first_name, last_name, is_admin, message')
            .eq('id', sessionUser.id)
            .maybeSingle(); // ← allows 0 or 1 result safely

        if (error) {
          console.error('Error fetching user profile:', error.message);
        } else {
         // console.log('User profile:', data);
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
