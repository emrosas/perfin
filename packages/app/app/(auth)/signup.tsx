import { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Link } from "expo-router";
import { useConvex } from "convex/react";
import { api } from "@perfin/backend/convex";
import { authClient } from "../../lib/authClient";

export default function SignupScreen() {
  const convex = useConvex();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.signUp.email(
        { name, email, password },
        {
          onSuccess: async (ctx) => {
            // Create initial Cash account for the new user
            await convex.mutation(api.auth.createCashAccount, {
              userId: ctx.data.user.id,
            });
            // ConvexBetterAuthProvider detects the session change
            // and the auth layout will reactively redirect to /(app)
          },
          onError: (ctx) => {
            Alert.alert("Sign Up Failed", ctx.error.message);
          },
        }
      );
    } catch (error: any) {
      Alert.alert("Error", error?.message ?? "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-transparent"
    >
      <View className="flex-1 justify-center px-6">
        {/* Logo & Title */}
        <View className="items-center mb-10">
          <Text className="text-5xl font-extrabold text-gray-900 mb-3">
            Perfin
          </Text>
          <Text className="text-base text-gray-500 text-center">
            Create your account to get started.
          </Text>
        </View>

        {/* Name Field */}
        <View className="mb-4">
          <Text className="font-body-medium text-dark mb-2" style={{ fontSize: 15 }}>
            Name
          </Text>
          <TextInput
            className="font-mono text-dark"
            placeholder="John Doe"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
            autoComplete="name"
            style={{
              backgroundColor: "#E2E2E9",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
            }}
          />
        </View>

        {/* Email Field */}
        <View className="mb-4">
          <Text className="font-body-medium text-dark mb-2" style={{ fontSize: 15 }}>
            Email
          </Text>
          <TextInput
            className="font-mono text-dark"
            placeholder="support@shiftm.com"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            style={{
              backgroundColor: "#E2E2E9",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
            }}
          />
        </View>

        {/* Password Field */}
        <View className="mb-6">
          <Text className="font-body-medium text-dark mb-2" style={{ fontSize: 15 }}>
            Password
          </Text>
          <View style={{ position: "relative" }}>
            <TextInput
              className="font-mono text-dark"
              placeholder="********"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              style={{
                backgroundColor: "#E2E2E9",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                paddingRight: 44,
              }}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: 12,
                top: 0,
                bottom: 0,
                justifyContent: "center",
              }}
            >
              <Text className="font-body text-dark" style={{ fontSize: 13 }}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity
          className="bg-brand rounded-2xl py-4 items-center"
          onPress={handleSignup}
          disabled={isLoading}
          style={{ opacity: isLoading ? 0.7 : 1 }}
        >
          <Text className="text-white text-lg font-semibold">
            {isLoading ? "Creating account..." : "Sign Up"}
          </Text>
        </TouchableOpacity>

        {/* Login Link */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-500 text-base">
            Already have an account?{" "}
          </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text className="text-brand text-base font-semibold">
                Log in
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
