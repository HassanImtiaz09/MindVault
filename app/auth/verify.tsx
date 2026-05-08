import { useEffect, useState } from "react";
import { Text, View, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import * as Auth from "@/lib/_core/auth";

export default function VerifyScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const verifyMutation = trpc.auth.verifyMagicLink.useMutation({
    onSuccess: async (data) => {
      // Store session token and user info
      if (data.sessionToken) {
        await Auth.setSessionToken(data.sessionToken);
      }
      if (data.user) {
        await Auth.setUserInfo({
          id: data.user.id,
          openId: data.user.openId,
          name: data.user.name ?? null,
          email: data.user.email ?? null,
          loginMethod: "magic-link",
          lastSignedIn: new Date(),
        });
      }
      setStatus("success");
      // Navigate to main app after a brief delay
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1500);
    },
    onError: (err) => {
      setStatus("error");
      setErrorMessage(err.message || "Verification failed. The link may have expired.");
    },
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate({ token });
    } else {
      setStatus("error");
      setErrorMessage("No verification token found. Please request a new magic link.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <ScreenContainer className="p-6" edges={["top", "bottom", "left", "right"]}>
      <View className="flex-1 justify-center items-center">
        {status === "verifying" && (
          <>
            <ActivityIndicator size="large" color="#0a7ea4" />
            <Text className="mt-6 text-lg font-semibold text-foreground">
              Verifying your magic link...
            </Text>
            <Text className="mt-2 text-sm text-muted text-center">
              Please wait while we sign you in.
            </Text>
          </>
        )}

        {status === "success" && (
          <>
            <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4">
              <Text className="text-3xl">✓</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground">You&apos;re in!</Text>
            <Text className="mt-2 text-base text-muted text-center">
              Redirecting to DocVault...
            </Text>
          </>
        )}

        {status === "error" && (
          <>
            <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
              <Text className="text-3xl">✗</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground">Verification Failed</Text>
            <Text className="mt-4 text-base text-muted text-center max-w-xs">
              {errorMessage}
            </Text>
            <View className="mt-8">
              <Text
                className="text-primary font-semibold text-base"
                onPress={() => router.replace("/auth/sign-in")}
              >
                Try again
              </Text>
            </View>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}
