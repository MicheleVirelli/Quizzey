import { AuthForm } from "@/components/AuthForm";
import { signUp } from "@/lib/actions/auth";

export default function SignUpPage() {
  return <AuthForm mode="sign-up" action={signUp} />;
}
