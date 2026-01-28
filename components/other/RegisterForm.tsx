"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { registerUser } from "@/app/actions/admin/registerUser";

export default function RegisterForm() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(fd: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await registerUser(fd);

      if (res?.error) {
        setError(res.error);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    });
  }

  if (success) {
    return (
      <Alert className="border-green-500 bg-green-50">
        <AlertTitle className="text-green-700">Account created 🎉</AlertTitle>
        <AlertDescription className="space-y-3 text-green-700">
          <p>Your account has been created successfully.</p>
          <p className="text-sm">
            You’ll be redirected to the login page shortly.
          </p>
          <Button className="mt-2" onClick={() => router.push("/login")}>
            Go to login now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required />
      </div>

      <div className="space-y-1">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        Create account
      </Button>
    </form>
  );
}
