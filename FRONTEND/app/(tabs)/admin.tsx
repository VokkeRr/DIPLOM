import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus, Edit, Trash2 } from "lucide-react-native";
import { API_URL } from "@/constants/api";
import { useAuthStore } from "@/stores/auth-store";
import { Service } from "@/types";

export default function AdminScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { token, user } = useAuthStore();
  const colorScheme = useColorScheme();

  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  useEffect(() => {
    if (user?.role !== "admin") {
      Alert.alert("Unauthorized", "You don't have permission to access this page");
      router.replace("/(tabs)");
      return;
    }
    
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch(`${API_URL}/services`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }
      
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteService = async (id: number) => {
    Alert.alert(
      "Delete Service",
      "Are you sure you want to delete this service?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const response = await fetch(`${API_URL}/services/${id}`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              
              if (!response.ok) {
                throw new Error("Failed to delete service");
              }
              
              // Refresh services
              fetchServices();
            } catch (error) {
              console.error("Error deleting service:", error);
              Alert.alert("Error", "Failed to delete service");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderServiceItem = ({ item }: { item: Service }) => (
    <View style={styles.serviceCard}>
      <Image
        source={{ uri: item.imageUrl || "https://images.unsplash.com/photo-1584982751601-97dcc096659c?q=80&w=2072&auto=format&fit=crop" }}
        style={styles.serviceImage}
      />
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{item.name}</Text>
        <Text style={styles.serviceDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.servicePrice}>${item.price.toFixed(2)}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => router.push(`/admin/edit-service/${item.id}`)}
        >
          <Edit size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteService(item.id)}
        >
          <Trash2 size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0080FF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Manage your medical services</Text>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/admin/add-service")}
      >
        <Plus size={20} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add New Service</Text>
      </TouchableOpacity>

      {services.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No services found</Text>
          <Text style={styles.emptySubtext}>
            Add a new service to get started
          </Text>
        </View>
      ) : (
        <FlatList
          data={services}
          renderItem={renderServiceItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.servicesList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? "#121212" : "#F8F8F8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: isDark ? "#121212" : "#F8F8F8",
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    color: isDark ? "#FFFFFF" : "#000000",
  },
  subtitle: {
    fontSize: 16,
    color: isDark ? "#BBBBBB" : "#666666",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0080FF",
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  servicesList: {
    padding: 20,
    paddingTop: 0,
  },
  serviceCard: {
    backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: isDark ? "#333" : "#EEEEEE",
  },
  serviceImage: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  serviceInfo: {
    padding: 16,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: isDark ? "#FFFFFF" : "#000000",
  },
  serviceDescription: {
    fontSize: 14,
    color: isDark ? "#BBBBBB" : "#666666",
    marginBottom: 8,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: isDark ? "#A5D8FF" : "#0080FF",
  },
  actionButtons: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: isDark ? "#333" : "#EEEEEE",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    backgroundColor: "#0080FF",
  },
  deleteButton: {
    backgroundColor: "#F44336",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: isDark ? "#FFFFFF" : "#000000",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: isDark ? "#BBBBBB" : "#666666",
    textAlign: "center",
  },
});