import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentUser } from '../utils/Api';
import './AuthContext.css';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await getCurrentUser();
                const data = response.data;
                // Normalize user object to always include `id` for consistency
                const normalized = { ...data, id: data.id || data._id };
                setUser(normalized);
            } catch (error) {
                localStorage.removeItem('token');
                setUser(null);
            }
        }
        setLoading(false);
    };

    const login = (token, userData) => {
        localStorage.setItem('token', token);
        // Normalize: always have both id and _id
        const normalized = { ...userData, id: userData.id || userData._id };
        setUser(normalized);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const value = {
        user,
        setUser,
        login,
        logout,
        isAuthenticated: !!user,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};