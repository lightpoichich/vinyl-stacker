import { AuthForm } from "@/components/auth/auth-form";

export const metadata = {
  title: "Sign Up - Vinyl Stacker",
};

export default function SignUpPage() {
  return <AuthForm mode="signup" />;
}
