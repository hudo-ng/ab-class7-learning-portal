import RegisterForm from "@/components/other/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm">
            Sign up to unlock practice questions and mock exams.
          </p>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
}
