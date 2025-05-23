import React, { useEffect, useState } from "react";
import { 
  fetchAuthSession,
  signOut,
  getCurrentUser,
  federatedSignIn 
} from 'aws-amplify/auth';

import { Amplify } from 'aws-amplify';

const Login = ({ onLogin }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const currentUser = await getCurrentUser();
                const { tokens } = await fetchAuthSession();
                setUser({
                    ...currentUser,
                    token: tokens.idToken.toString()
                });
                onLogin(currentUser);
            } catch (error) {
                console.log('User not authenticated', error);
                onLogin(null);
            }
        };

        checkUser();
    }, [onLogin]);

    const handleSignIn = async () => {
        try {
            await federatedSignIn({ provider: 'COGNITO' });
        } catch (error) {
            console.log('Error signing in', error);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            setUser(null);
            onLogin(null);
        } catch (error) {
            console.log('Error signing out', error);
        }
    };

    return (
        <div className="container mt-5">
            {user ? (
                <div>
                    <h2>Welcome, {user.username}</h2>
                    <button className="btn btn-danger" onClick={handleSignOut}>
                        Sign Out
                    </button>
                </div>
            ) : (
                <button className="btn btn-primary" onClick={handleSignIn}>
                    Sign In with Cognito
                </button>
            )}
        </div>
    );
};

export default Login;