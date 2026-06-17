import { Redirect } from "expo-router";

import { AuthScreen } from "@/components/auth/AuthScreen";
import { useAuth } from "@/contexts/auth";

export default function LoginPage() {
  const { token } = useAuth();

  if (token) return <Redirect href="/" />;

  return <AuthScreen />;
}