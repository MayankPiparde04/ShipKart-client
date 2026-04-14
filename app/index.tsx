import { useAuth } from "@/contexts/AuthContext";
import StartupSplash from "@/components/ui/StartupSplash";
import { useRouter } from "expo-router";

export default function WelcomeScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading || user) {
    return <StartupSplash statusText="Loading secure workspace" />;
  }

  return (
    <StartupSplash
      statusText="Secure session ready"
      showAction
      actionLabel="Get Started"
      onActionPress={() => router.replace("/login")}
    />
  );
}
