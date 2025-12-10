export interface User {
    id: string;
    email: string;
    name: string;
}

export const authService = {
    loginWithEmail: async (email: string, password: string): Promise<User> => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (password === 'fail') {
            throw new Error("Invalid credentials");
        }

        return {
            id: 'u_123',
            email,
            name: email.split('@')[0],
        };
    },

    loginWithGoogle: async (): Promise<User> => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Simulate popup behaviour in a real app
        return {
            id: 'u_goo_123',
            email: 'user@gmail.com',
            name: 'Google User',
        };
    }
};
