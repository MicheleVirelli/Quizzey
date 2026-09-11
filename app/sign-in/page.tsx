import { AuthForm } from "@/components/AuthForm";
import { signIn } from "@/lib/actions/auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AuthForm mode="sign-in" action={signIn} next={next} />;
}
