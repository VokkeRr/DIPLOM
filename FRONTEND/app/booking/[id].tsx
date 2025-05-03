import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, useColorScheme } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, Clock, ChevronLeft, ChevronRight, Check } from "lucide-react-native";
import { API_URL } from "@/constants/api";
import { useAuthStore } from "@/stores/auth-store";
import { formatDate } from "@/utils/date-utils";
import { Service } from "@/types";

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
];

export default function BookingScreen() {
  const { id } = useLocalSearchParams();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const router = useRouter();
  const { token } = useAuthStore();
  const colorScheme = useColorScheme();

  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  useEffect(() => {
    fetchServiceDetails();
    generateAvailableDates();
  }, [id]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableTimeSlots(selectedDate);
    }
  }, [selectedDate]);

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

  const generateAvailableDates = () => {
    const dates: Date[] = [];
    const today = new Date();
    
    // Generate dates for the next 14 days
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date);
      }
    }
    
    setAvailableDates(dates);
    if (dates.length > 0) {
      setSelectedDate(dates[0]);
    }
  };

  const fetchAvailableTimeSlots = async (date: Date) => {
    // In a real app, you would fetch available time slots from the server
    // For this demo, we'll simulate some random availability
    
    // Convert date to YYYY-MM-DD format
    const formattedDate = date.toISOString().split('T')[0];
    
    try {
      const response = await fetch(`${API_URL}/appointments/available-slots?date=${formattedDate}&serviceId=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch available time slots");
      }
      
      const data = await response.json();
      setAvailableTimeSlots(data.availableSlots || []);
    } catch (error) {
      console.error("Error fetching available time slots:", error);
      // Fallback to some random slots for demo purposes
      const randomSlots = TIME_SLOTS.filter(() => Math.random() > 0.3);
      setAvailableTimeSlots(randomSlots);
    }
  };

  const handleDateChange = (direction: string) => {
    if (!selectedDate) return;
    
    const currentIndex = availableDates.findIndex(
      (date) => date.toDateString() === selectedDate.toDateString()
    );
    
    if (direction === "prev" && currentIndex > 0) {
      setSelectedDate(availableDates[currentIndex - 1]);
    } else if (direction === "next" && currentIndex < availableDates.length - 1) {
      setSelectedDate(availableDates[currentIndex + 1]);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert("Error", "Please select both date and time for your appointment");
      return;
    }

    setBookingLoading(true);
    try {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      const response = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId: id,
          date: formattedDate,
          time: selectedTime,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to book appointment");
      }

      const data = await response.json();

      Alert.alert(
        "Appointment Booked",
        "Your appointment has been successfully booked.",
        [{ text: "OK", onPress: () => router.replace("/(tabs)/appointments") }]
      );
    } catch (error) {
      Alert.alert("Booking Failed", (error as Error).message || "Please try again later");
    } finally {
      setBookingLoading(false);
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
        <View style={styles.header}>
          <Text style={styles.title}>Book Appointment</Text>
          <Text style={styles.subtitle}>{service.name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <View style={styles.dateSelector}>
            <TouchableOpacity
              style={styles.dateArrow}
              onPress={() => handleDateChange("prev")}
            >
              <ChevronLeft size={24} color={isDark ? "#FFFFFF" : "#000000"} />
            </TouchableOpacity>
            
            <View style={styles.selectedDateContainer}>
              <Calendar size={20} color={isDark ? "#A5D8FF" : "#0080FF"} />
              <Text style={styles.selectedDateText}>
                {selectedDate ? formatDate(selectedDate.toISOString()) : "Select a date"}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.dateArrow}
              onPress={() => handleDateChange("next")}
            >
              <ChevronRight size={24} color={isDark ? "#FFFFFF" : "#000000"} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.timeSlotGrid}>
            {availableTimeSlots.length > 0 ? (
              availableTimeSlots.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeSlot,
                    selectedTime === time && styles.selectedTimeSlot,
                  ]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      selectedTime === time && styles.selectedTimeSlotText,
                    ]}
                  >
                    {time}
                  </Text>
                  {selectedTime === time && (
                    <Check size={16} color="#FFFFFF" style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noTimeSlotsText}>
                No available time slots for this date
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointment Summary</Text>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service:</Text>
              <Text style={styles.summaryValue}>{service.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Price:</Text>
              <Text style={styles.summaryValue}>
                ${typeof service.price === 'number' ? service.price.toFixed(2) : Number(service.price).toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration:</Text>
              <Text style={styles.summaryValue}>{service.duration || "30"} minutes</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date:</Text>
              <Text style={styles.summaryValue}>
                {selectedDate ? formatDate(selectedDate.toISOString()) : "Not selected"}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time:</Text>
              <Text style={styles.summaryValue}>
                {selectedTime ? selectedTime : "Not selected"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={handleBookAppointment}
          disabled={!selectedDate || !selectedTime || bookingLoading}
        >
          {bookingLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Clock size={20} color="#FFFFFF" />
              <Text style={styles.bookButtonText}>Confirm Booking</Text>
            </>
          )}
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
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: isDark ? "#FFFFFF" : "#000000",
  },
  subtitle: {
    fontSize: 16,
    color: isDark ? "#BBBBBB" : "#666666",
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: isDark ? "#FFFFFF" : "#000000",
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: isDark ? "#333" : "#EEEEEE",
  },
  dateArrow: {
    padding: 8,
  },
  selectedDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: "500",
    color: isDark ? "#FFFFFF" : "#000000",
  },
  timeSlotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  timeSlot: {
    width: "30%",
    backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: isDark ? "#333" : "#EEEEEE",
    marginBottom: 10,
  },
  selectedTimeSlot: {
    backgroundColor: "#0080FF",
    borderColor: "#0080FF",
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: "500",
    color: isDark ? "#FFFFFF" : "#000000",
  },
  selectedTimeSlotText: {
    color: "#FFFFFF",
  },
  checkIcon: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  noTimeSlotsText: {
    fontSize: 16,
    color: isDark ? "#BBBBBB" : "#666666",
    textAlign: "center",
    width: "100%",
    padding: 20,
  },
  summaryContainer: {
    backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: isDark ? "#333" : "#EEEEEE",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? "#333" : "#EEEEEE",
  },
  summaryLabel: {
    fontSize: 16,
    color: isDark ? "#BBBBBB" : "#666666",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "500",
    color: isDark ? "#FFFFFF" : "#000000",
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