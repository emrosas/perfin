import { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from "react-native";
import { Link } from "expo-router";
import { authClient } from "../../lib/authClient";
import PasswordHidden from "../../assets/svg/password-hidden.svg";
import PasswordShown from "../../assets/svg/password-shown.svg";
import Remove from "../../assets/svg/remove.svg";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        Alert.alert("Login Failed", result.error.message);
      }
      // On success, ConvexBetterAuthProvider detects the session change
      // and the auth layout will reactively redirect to /(app)
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
          <Image
            source={require("../../assets/images/logo-vertical.png")}
            style={{ width: 172, height: 140 }}
            resizeMode="contain"
          />
          <Text className="text-base text-gray-500 mt-4 text-center leading-8">
            Manage your personal finances{"\n"}without all the complexity.
          </Text>
        </View>

        {/* Email Field */}
        <View className="mb-4">
          <Text className="font-body-medium text-dark mb-2" style={{ fontSize: 15 }}>
            Email
          </Text>
          <View style={{ position: "relative" }}>
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
                paddingRight: 44,
              }}
            />
            {email.length > 0 && (
              <TouchableOpacity
                onPress={() => setEmail("")}
                style={{
                  position: "absolute",
                  right: 12,
                  top: 0,
                  bottom: 0,
                  justifyContent: "center",
                }}
              >
                <Remove width={16} height={16} />
              </TouchableOpacity>
            )}
          </View>
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
              autoComplete="password"
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
              {showPassword ? (
                <PasswordShown width={16} height={16} />
              ) : (
                <PasswordHidden width={16} height={16} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          className="bg-brand rounded-2xl border-b-2 border-brand-alt py-4 items-center"
          onPress={handleLogin}
          disabled={isLoading}
          style={{ opacity: isLoading ? 0.7 : 1 }}
        >
          <Text className="text-white text-lg font-semibold">
            {isLoading ? "Logging in..." : "Login"}
          </Text>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-500 text-base">
            Don't have an account?{" "}
          </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity>
              <Text className="text-brand text-base font-semibold">
                Sign up
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
