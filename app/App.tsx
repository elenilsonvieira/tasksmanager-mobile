import { Slot } from "expo-router";
import { View } from "react-native";
import { AuthProvider } from "@/context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
    </AuthProvider>
  );
}