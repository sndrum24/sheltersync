import { createContext, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  return (
    <AuthContext.Provider
      value={{
        user: {
          id: "1",
          name: "Admin User",
          role: "admin",
          shelter_id: "default"
        },
        isAuthenticated: true,
        isLoadingAuth: false,
        isLoadingPublicSettings: false,
        authError: null,
        logout: () => {},
        navigateToLogin: () => {}
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);