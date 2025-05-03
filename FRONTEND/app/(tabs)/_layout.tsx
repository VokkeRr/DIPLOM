import React from "react";
import { Tabs } from "expo-router";
import { Home, Calendar, User, Settings } from "lucide-react-native";
import { useColorScheme } from "react-native";
import { useAuthStore } from "@/stores/auth-store";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colorScheme === "dark" ? "#A5D8FF" : "#0080FF",
        tabBarInactiveTintColor: colorScheme === "dark" ? "#888" : "#999",
        tabBarStyle: {
          backgroundColor: colorScheme === "dark" ? "#1A1A1A" : "#FFFFFF",
          borderTopColor: colorScheme === "dark" ? "#333" : "#E5E5E5",
        },
        headerStyle: {
          backgroundColor: colorScheme === "dark" ? "#1A1A1A" : "#FFFFFF",
        },
        headerTintColor: colorScheme === "dark" ? "#FFFFFF" : "#000000",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Services",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Appointments",
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      {isAdmin && (
        <Tabs.Screen
          name="admin"
          options={{
            title: "Admin",
            tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}