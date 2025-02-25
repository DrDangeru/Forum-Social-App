import { useContext } from 'react';
// import { AuthContextType } from './AuthContext'; below line would catch props used here
import { AuthContext } from './AuthContext';

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
