/**
 * RegisterPage.
 *
 * Password rules below MUST stay in sync with
 * backend/app/schemas/validators.py (validate_password_strength).
 * Client-side validation here is purely UX — the backend remains the
 * authority and re-validates on every request regardless.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Code2 } from "lucide-react";

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useAuth } from "@/store/authStore";

const registerSchema = z.object({
  full_name: z.string().min(1, "Full name is required.").max(255),
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[0-9]/, "Password must contain at least one digit.")
    .regex(
      /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/;'~`]/,
      "Password must contain at least one special character.",
    ),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    try {
      await registerUser(values);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Registration failed. Please try again.";
      setServerError(message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4 dark:bg-surface-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600">
            <Code2 className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50">
            Create your CodeTrack account
          </h1>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-800 dark:bg-surface-900"
        >
          {serverError && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger dark:bg-red-950/40">
              {serverError}
            </div>
          )}

          <Input
            label="Full name"
            autoComplete="name"
            error={errors.full_name?.message}
            {...register("full_name")}
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <p className="text-xs text-surface-500 dark:text-surface-400">
            At least 8 characters, with uppercase, lowercase, a digit, and a special character.
          </p>

          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            Create account
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-surface-500 dark:text-surface-400">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
