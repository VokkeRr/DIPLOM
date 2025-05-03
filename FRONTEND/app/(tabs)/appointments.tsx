import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react-native";
import { API_URL } from "@/constants/api";
import { useAuthStore } from "@/stores/auth-store";
import { formatDate, formatTime } from "@/utils/date-utils";
import { Appointment } from "@/types";

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const { token } = useAuthStore();
  const colorScheme = useColorScheme();

  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`${API_URL}/appointments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }
      
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (id: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/appointments/${id}/cancel`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to cancel appointment");
      }
      
      // Refresh appointments
      fetchAppointments();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return isDark ? "#4CAF50" : "#4CAF50";
      case "pending":
        return isDark ? "#FFC107" : "#FF9800";
      case "cancelled":
        return isDark ? "#F44336" : "#F44336";
      default:
        return isDark ? "#BBBBBB" : "#666666";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle size={16} color={getStatusColor(status)} />;
      case "pending":
        return <AlertCircle size={16} color={getStatusColor(status)} />;
      case "cancelled":
        return <XCircle size={16} color={getStatusColor(status)} />;
      default:
        return null;
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (activeTab === "upcoming") {
      return appointmentDate >= today && appointment.status !== "cancelled";
    } else if (activeTab === "past") {
      return appointmentDate < today || appointment.status === "cancelled";
    }
    return true;
  });

  const renderAppointmentItem = ({ item }: { item: Appointment }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <Text style={styles.serviceName}>{item.service.name}</Text>
        <View style={styles.statusContainer}>
          {getStatusIcon(item.status)}
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
      
      <View style={styles.appointmentDetails}>
        <View style={styles.detailRow}>
          <Calendar size={16} color={isDark ? "#BBBBBB" : "#666666"} />
          <Text style={styles.detailText}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Clock size={16} color={isDark ? "#BBBBBB" : "#666666"} />
          <Text style={styles.detailText}>{formatTime(item.time)}</Text>
        </View>
      </View>
      
      {item.status !== "cancelled" && new Date(item.date) > new Date() && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => cancelAppointment(item.id)}
        >
          <Text style={styles.cancelButtonText}>Cancel Appointment</Text>
        </TouchableOpacity>
      )}
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
        <Text style={styles.title}>My Appointments</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "upcoming" && styles.activeTab]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "upcoming" && styles.activeTabText,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "past" && styles.activeTab]}
          onPress={() => setActiveTab("past")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "past" && styles.activeTabText,
            ]}
          >
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {filteredAppointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No {activeTab} appointments found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAppointments}
          renderItem={renderAppointmentItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.appointmentsList}
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
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: isDark ? "#333" : "#E5E5E5",
  },
  activeTab: {
    borderBottomColor: "#0080FF",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: isDark ? "#BBBBBB" : "#666666",
  },
  activeTabText: {
    color: isDark ? "#FFFFFF" : "#000000",
    fontWeight: "600",
  },
  appointmentsList: {
    padding: 20,
    paddingTop: 0,
  },
  appointmentCard: {
    backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDark ? "#333" : "#EEEEEE",
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: "bold",
    color: isDark ? "#FFFFFF" : "#000000",
    flex: 1,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  appointmentDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: isDark ? "#BBBBBB" : "#666666",
  },
  cancelButton: {
    backgroundColor: isDark ? "#2A2A2A" : "#F5F5F5",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#F44336",
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