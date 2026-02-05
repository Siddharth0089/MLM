import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext(null);

export function UserProvider({ children }) {
    const [user, setUser] = useState(() => {
        // Load user from localStorage on init
        const saved = localStorage.getItem('meeting_user');
        return saved ? JSON.parse(saved) : null;
    });

    const login = (userData) => {
        const userObj = {
            id: userData.id || `user_${Date.now()}`,
            fullName: userData.fullName || userData.name || 'Guest User',
            email: userData.email || `guest_${Date.now()}@example.com`,
            imageUrl: userData.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.fullName || 'user'}`,
        };
        setUser(userObj);
        localStorage.setItem('meeting_user', JSON.stringify(userObj));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('meeting_user');
    };

    const updateUser = (updates) => {
        const updated = { ...user, ...updates };
        setUser(updated);
        localStorage.setItem('meeting_user', JSON.stringify(updated));
    };

    return (
        <UserContext.Provider value={{ user, login, logout, updateUser, isSignedIn: !!user }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within UserProvider');
    }
    return context;
}
