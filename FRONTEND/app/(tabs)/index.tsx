import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, TextInput, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, Filter } from "lucide-react-native";
import { API_URL } from "@/constants/api";
import { useAuthStore } from "@/stores/auth-store";
import { Service } from "@/types";

export default function ServicesScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { token } = useAuthStore();
  const colorScheme = useColorScheme();

  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredServices(services);
    } else {
      const filtered = services.filter(
        (service) =>
          service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredServices(filtered);
    }
  }, [searchQuery, services]);

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
      setFilteredServices(data);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderServiceItem = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => router.push(`/service/${item.id}`)}
    >
      <Image
        source={{ uri: item.imageUrl || "https://images.unsplash.com/photo-1584982751601-97dcc096659c?q=80&w=2072&auto=format&fit=crop" }} // Без инета фотка не грузит и пусто в эпоинтментах 
        style={styles.serviceImage}
      />
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{item.name}</Text>
        <Text style={styles.serviceDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.serviceFooter}>
          <Text style={styles.servicePrice}>
            ${typeof item.price === 'number' ? item.price.toFixed(2) : Number(item.price).toFixed(2)}
          </Text>
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={() => router.push(`/booking/${item.id}`)}
          >
            <Text style={styles.bookButtonText}>Book</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
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
        <Text style={styles.title}>Medical Services</Text>
        <Text style={styles.subtitle}>Find and book your medical appointments</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={isDark ? "#BBBBBB" : "#666666"} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            placeholderTextColor={isDark ? "#888" : "#999"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={isDark ? "#FFFFFF" : "#000000"} />
        </TouchableOpacity>
      </View>

      {filteredServices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No services found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredServices}
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
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: isDark ? "#2A2A2A" : "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: isDark ? "#444" : "#E5E5E5",
  },
  searchInput: {
    flex: 1,
    height: 44,
    paddingLeft: 8,
    fontSize: 16,
    color: isDark ? "#FFFFFF" : "#000000",
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: isDark ? "#2A2A2A" : "#FFFFFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: isDark ? "#444" : "#E5E5E5",
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
    marginBottom: 16,
  },
  serviceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: isDark ? "#A5D8FF" : "#0080FF",
  },
  bookButton: {
    backgroundColor: "#0080FF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  bookButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: isDark ? "#BBBBBB" : "#666666",
  },
});