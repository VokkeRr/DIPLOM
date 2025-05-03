import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, useColorScheme, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Upload, DollarSign, Clock } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { API_URL } from "@/constants/api";
import { useAuthStore } from "@/stores/auth-store";
import { Service } from "@/types";

export default function EditServiceScreen() {
  const { id } = useLocalSearchParams();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [requirements, setRequirements] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      
      const data = await response.json() as Service;
      setName(data.name);
      setDescription(data.description);
      setPrice(data.price.toString());
      setDuration(data.duration?.toString() || "30");
      setRequirements(data.requirements || "");
      setImageUrl(data.imageUrl || null);
    } catch (error) {
      console.error("Error fetching service details:", error);
      Alert.alert("Error", "Failed to load service details");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewImageUri(result.assets[0].uri);
    }
  };

  const handleUpdateService = async () => {
    if (!name || !description || !price) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      Alert.alert("Error", "Please enter a valid price");
      return;
    }

    setSaving(true);
    try {
      // In a real app, you would upload the new image to a server first if changed
      // For this demo, we'll just use the existing URL or a placeholder
      
      const serviceData = {
        name,
        description,
        price: parseFloat(price),
        duration: parseInt(duration, 10),
        requirements,
        imageUrl: newImageUri || imageUrl || "https://images.unsplash.com/photo-1584982751601-97dcc096659c?q=80&w=2072&auto=format&fit=crop",
      };

      const response = await fetch(`${API_URL}/services/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(serviceData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update service");
      }

      Alert.alert(
        "Success",
        "Service updated successfully",
        [{ text: "OK", onPress: () => router.replace("/(tabs)/admin") }]
      );
    } catch (error) {
      Alert.alert("Error", (error as Error).message || "Failed to update service");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0080FF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit Service</Text>
          <Text style={styles.subtitle}>Update service details</Text>
        </View>

        <View style={styles.form}>
          <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
            {newImageUri ? (
              <Image
                source={{ uri: newImageUri }}
                style={styles.previewImage}
              />
            ) : imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.previewImage}
              />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Upload size={32} color={isDark ? "#BBBBBB" : "#666666"} />
                <Text style={styles.uploadText}>Change Image</Text>
                <Text style={styles.uploadSubtext}>Tap to select a new image</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Service Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter service name"
              placeholderTextColor={isDark ? "#888" : "#999"}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter service description"
              placeholderTextColor={isDark ? "#888" : "#999"}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Price ($) *</Text>
              <View style={styles.priceInputContainer}>
                <DollarSign size={16} color={isDark ? "#BBBBBB" : "#666666"} style={styles.inputIcon} />
                <TextInput
                  style={styles.priceInput}
                  placeholder="0.00"
                  placeholderTextColor={isDark ? "#888" : "#999"}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.label}>Duration (min)</Text>
              <View style={styles.priceInputContainer}>
                <Clock size={16} color={isDark ? "#BBBBBB" : "#666666"} style={styles.inputIcon} />
                <TextInput
                  style={styles.priceInput}
                  placeholder="30"
                  placeholderTextColor={isDark ? "#888" : "#999"}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Requirements (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter any special requirements or preparations"
              placeholderTextColor={isDark ? "#888" : "#999"}
              value={requirements}
              onChangeText={setRequirements}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdateService}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Update Service</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  form: {
    padding: 20,
  },
  imageUpload: {
    width: "100%",
    height: 200,
    backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: isDark ? "#333" : "#EEEEEE",
    borderStyle: "dashed",
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
    color: isDark ? "#FFFFFF" : "#000000",
  },
  uploadSubtext: {
    fontSize: 14,
    color: isDark ? "#BBBBBB" : "#666666",
    marginTop: 4,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: isDark ? "#FFFFFF" : "#000000",
  },
  input: {
    backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: isDark ? "#333" : "#EEEEEE",
    color: isDark ? "#FFFFFF" : "#000000",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  row: {
    flexDirection: "row",
    marginBottom: 20,
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: isDark ? "#333" : "#EEEEEE",
  },
  inputIcon: {
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: isDark ? "#FFFFFF" : "#000000",
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: isDark ? "#2A2A2A" : "#F5F5F5",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: isDark ? "#BBBBBB" : "#666666",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#0080FF",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginLeft: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});