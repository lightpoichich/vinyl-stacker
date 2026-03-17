import { AuthForm } from "@/components/auth/auth-form";

export const metadata = {
  title: "Sign In - Vinyl Stacker",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
