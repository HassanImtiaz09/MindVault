import { useState } from "react";
import {
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInMutation = trpc.auth.signInWithMagicLink.useMutation({
    onSuccess: () => {
      setSent(true);
      setError(null);
    },
    onError: (err) => {
      setError(err.message || "Failed to send magic link. Please try again.");
    },
  });

  const handleSubmit = () => {
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    signInMutation.mutate({ email: trimmed });
  };

  if (sent) {
    return (
      <ScreenContainer className="p-6" edges={["top", "bottom", "left", "right"]}>
        <View className="flex-1 justify-center items-center">
          <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-6">
            <Text className="text-3xl">✉️</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground text-center">
            Check your email
          </Text>
          <Text className="mt-4 text-base text-muted text-center max-w-xs">
            We sent a magic link to{" "}
            <Text className="font-semibold text-foreground">{email}</Text>.
            {"\n\n"}Tap the link in the email to sign in.
          </Text>
          <Pressable
            onPress={() => {
              setSent(false);
              setError(null);
            }}
            style={({ pressed }) => [
              { marginTop: 32, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text className="text-primary font-semibold">Use a different email</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6" edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center"
      >
        <View className="items-center mb-10">
          <View className="w-16 h-16 rounded-2xl bg-primary items-center justify-center mb-4">
            <Text className="text-white text-2xl font-bold">DV</Text>
          </View>
          <Text className="text-3xl font-bold text-foreground">DocVault</Text>
          <Text className="mt-2 text-base text-muted text-center">
            Sign in with your email to continue
          </Text>
        </View>

        <View className="w-full max-w-sm self-center">
          <Text className="text-sm font-medium text-foreground mb-2">Email address</Text>
          <TextInput
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground text-base"
            placeholder="you@example.com"
            placeholderTextColor="#9BA1A6"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={handleSubmit}
            returnKeyType="done"
            editable={!signInMutation.isPending}
          />

          {error && (
            <Text className="mt-2 text-sm text-error">{error}</Text>
          )}

          <Pressable
            onPress={handleSubmit}
            disabled={signInMutation.isPending}
            style={({ pressed }) => [
              {
                marginTop: 16,
                backgroundColor: "#0a7ea4",
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
                opacity: pressed ? 0.9 : signInMutation.isPending ? 0.6 : 1,
              },
            ]}
          >
            {signInMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Send Magic Link
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
