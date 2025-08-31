import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/config/firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

interface UserData {
  nome: string;
  cpf: string;
  nascimento: string;
  email: string;
  avatar?: string;
}

interface AuthContextProps {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  updateProfile: (data: Partial<UserData>) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  userData: null,
  loading: true,
  signOut: async () => {},
  refreshUserData: async () => {},
  updateProfile: async () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para carregar dados do Firestore
  const loadUserData = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "usuarios", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData({
          nome: data.nome || '',
          cpf: data.cpf || '',
          nascimento: data.nascimento || '',
          email: data.email || '',
          avatar: data.avatar || ''
        });
      } else {
        console.warn("Documento do usuário não encontrado no Firestore");
      }
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
    }
  };

  // Função para atualizar dados do perfil
  const updateProfile = async (data: Partial<UserData>) => {
    if (!user) throw new Error("Usuário não autenticado");
    
    try {
      // Atualiza no Firestore
      await updateDoc(doc(db, "usuarios", user.uid), data);
      
      // Atualiza localmente
      setUserData(prev => prev ? { ...prev, ...data } : null);
      
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      throw error;
    }
  };

  // Função para recarregar dados do usuário
  const refreshUserData = async () => {
    if (user) {
      await loadUserData(user.uid);
    }
  };

  // Função de logout
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      throw error;
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Usuário logado
        await loadUserData(user.uid);
      } else {
        // Usuário deslogado 
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      loading,
      signOut: handleSignOut,
      refreshUserData,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);