import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, useColorScheme } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, Clock, DollarSign, User } from "lucide-react-native";
import { API_URL } from "@/constants/api";
import { useAuthStore } from "@/stores/auth-store";
import { Service } from "@/types";

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { token } = useAuthStore();
  const colorScheme = useColorScheme();

  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  useEffect(() => {
    fetchServiceDetails();
  }, [id]);

  const fetchServiceDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/services/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch service details");
      }
      
      const data = await response.json();
      setService(data);
    } catch (error) {
      console.error("Error fetching service details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0080FF" />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Service not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: service.imageUrl || "https://images.unsplash.com/photo-1584982751601-97dcc096659c?q=80&w=2072&auto=format&fit=crop" }}
          style={styles.serviceImage}
        />

        <View style={styles.contentContainer}>
          <Text style={styles.serviceName}>{service.name}</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <DollarSign size={16} color={isDark ? "#A5D8FF" : "#0080FF"} />
              <Text style={styles.infoText}>
                ${typeof service.price === 'number' ? service.price.toFixed(2) : Number(service.price).toFixed(2)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Clock size={16} color={isDark ? "#A5D8FF" : "#0080FF"} />
              <Text style={styles.infoText}>{service.duration || "30"} min</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{service.description}</Text>
          </View>

          {service.requirements && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Requirements</Text>
              <Text style={styles.description}>{service.requirements}</Text>
            </View>
          )}

          {service.provider && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Provider</Text>
              <View style={styles.providerContainer}>
                <View style={styles.providerAvatar}>
                  <User size={24} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.providerName}>{service.provider.name}</Text>
                  <Text style={styles.providerSpecialty}>{service.provider.specialty || "Medical Professional"}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => router.push(`/booking/${service.id}`)}
        >
          <Calendar size={20} color="#FFFFFF" />
          <Text style={styles.bookButtonText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: isDark ? "#121212" : "#F8F8F8",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: isDark ? "#FFFFFF" : "#000000",
  },
  backLink: {
    fontSize: 16,
    color: "#0080FF",
  },
  serviceImage: {
    width: "100%",
    height: 250,
    resizeMode: "cover",
  },
  contentContainer: {
    padding: 20,
  },
  serviceName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: isDark ? "#FFFFFF" : "#000000",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
    gap: 6,
  },
  infoText: {
    fontSize: 16,
    fontWeight: "500",
    color: isDark ? "#A5D8FF" : "#0080FF",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: isDark ? "#FFFFFF" : "#000000",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: isDark ? "#BBBBBB" : "#666666",
  },
  providerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? "#333" : "#EEEEEE",
  },
  providerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#0080FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  providerName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: isDark ? "#FFFFFF" : "#000000",
  },
  providerSpecialty: {
    fontSize: 14,
    color: isDark ? "#BBBBBB" : "#666666",
  },
  footer: {
    padding: 20,
    backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: isDark ? "#333" : "#EEEEEE",
  },
  bookButton: {
    backgroundColor: "#0080FF",
    height: 50,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});