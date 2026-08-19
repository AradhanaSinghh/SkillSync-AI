import { useContext , useEffect} from "react";
import { AuthContext } from "../auth.context.jsx";
import {login,register,logout,getMe} from "../services/auth.api.js"

export const useAuth=()=>{
    const context=useContext(AuthContext);
    const {user,setUser,loading,setLoading}=context;

    const handleLogin=async({email,password})=>{
        setLoading(true)
        const data=await login({email,password});

        setUser(data.user);
        setLoading(false);
    }
    const handleRegister=async({username,email,password})=>{
        setLoading(true)
        const data=await register({username,email,password});
        setUser(data.user);
        setLoading(false);
    }
    const handleLogout=async()=>{
        setLoading(true)
        const data=await logout();
        setUser(null);
        setLoading(false);
    }

    useEffect(() => {
    const getAndSetUser = async () => {
        try {
            const data = await getMe();
            setUser(data.user);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    getAndSetUser();
}, []);
    return {user,loading,handleRegister,handleLogin,handleLogout}
}