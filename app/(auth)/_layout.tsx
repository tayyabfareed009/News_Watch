// app/(auth)/_layout.tsx
import { Stack } from "expo-router";
import React from "react";
import { Platform, StatusBar } from "react-native";

export default function AuthLayout() {
  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={false}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: Platform.OS === "ios" ? "default" : "slide_from_right",
          gestureEnabled: true,
          contentStyle: {
            backgroundColor: "#FFFFFF",
          },
        }}
        initialRouteName="login"
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="otp" />
        <Stack.Screen name="forgot-password" />
      </Stack>
    </>
  );
}