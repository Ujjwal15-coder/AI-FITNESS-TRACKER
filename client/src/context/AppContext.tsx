import { createContext, useContext, useEffect, useState } from "react";
import { initialState, type ActivityEntry, type Credentials, type FoodEntry, type User } from "../types";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios";

// Helper to determine if onboarding is completed based on user data
const checkOnboarding = (user: any): boolean => {
    return !!(user?.age && user?.weight && user?.goal);
};

const AppContext = createContext(initialState);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User>(null);
    const [isUserFetched, setIsUserFetched] = useState(false);
    const [onboardingCompleted, setOnboardingCompleted] = useState(false);
    const [allFoodLogs, setAllFoodLogs] = useState<FoodEntry[]>([]);
    const [allActivityLogs, setAllActivityLogs] = useState<ActivityEntry[]>([]);

    const signup = async (credentials: Credentials) => {
        try {
            // Strapi v5 register endpoint: POST /api/auth/local/register
            const { data } = await api.post("/auth/local/register", credentials);
            
            localStorage.setItem("token", data.jwt);
            setUser(data.user);
            
            if (checkOnboarding(data.user)) {
                setOnboardingCompleted(true);
            }
        } catch (error: any) {
            console.error("Signup failed:", error);
            throw error;
        }
    };

    const login = async (credentials: Credentials) => {
        try {
            // Strapi v5 login endpoint: POST /api/auth/local
            const { data } = await api.post("/auth/local", {
                identifier: credentials.email, // Strapi uses 'identifier' for email/username
                password: credentials.password,
            });

            localStorage.setItem("token", data.jwt);
            setUser(data.user);

            if (checkOnboarding(data.user)) {
                setOnboardingCompleted(true);
            }
        } catch (error: any) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const fetchUser = async () => {
        try {
            // Strapi v5 me endpoint: GET /api/users/me
            const { data } = await api.get("/users/me");
            
            setUser(data);
            if (checkOnboarding(data)) {
                setOnboardingCompleted(true);
            }
        } catch (error) {
            console.error("Fetch user failed:", error);
            localStorage.removeItem("token");
        } finally {
            setIsUserFetched(true);
        }
    };

    const fetchFoodLogs = async () => {
        try {
            const { data } = await api.get("/food-logs");
            // Map Strapi fields (foodName) to frontend (name)
            const mappedData: FoodEntry[] = (data.data || []).map((item: any) => ({
                ...item,
                id: item.id,
                documentId: item.documentId,
                name: item.name,
                calories: item.calories,
                mealType: item.mealType,
                createdAt: item.createdAt,
            }));
            setAllFoodLogs(mappedData);
        } catch (error) {
            console.error("Fetch food logs failed:", error);
        }
    };

    const fetchActivityLogs = async () => {
        try {
            const { data } = await api.get("/activity-logs");
            // Map Strapi fields (activityName, caloriesBurned) to frontend (name, calories)
            const mappedData: ActivityEntry[] = (data.data || []).map((item: any) => ({
                ...item,
                id: item.id,
                documentId: item.documentId,
                name: item.name,
                duration: item.duration,
                calories: item.calories,
                createdAt: item.createdAt,
            }));
            setAllActivityLogs(mappedData);
        } catch (error) {
            console.error("Fetch activity logs failed:", error);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
        setOnboardingCompleted(false);
        navigate("/");
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        const initApp = async () => {
            if (token) {
                await fetchUser();
                await fetchFoodLogs();
                await fetchActivityLogs();
            } else {
                setIsUserFetched(true);
            }
        };
        initApp();
    }, []);

    const value = {
        user,
        setUser,
        isUserFetched,
        fetchUser,
        signup,
        login,
        logout,
        onboardingCompleted,
        setOnboardingCompleted,
        allFoodLogs,
        allActivityLogs,
        setAllFoodLogs,
        setAllActivityLogs,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
