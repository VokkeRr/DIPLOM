import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function AuthLayout() {
  const colorScheme = useColorScheme();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colorScheme === "dark" ? "#1A1A1A" : "#FFFFFF",
        },
        headerTintColor: colorScheme === "dark" ? "#FFFFFF" : "#000000",
        contentStyle: {
          backgroundColor: colorScheme === "dark" ? "#121212" : "#F8F8F8",
        },
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: "Sign In",
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: "Create Account",
        }}
      />
    </Stack>
  );
}