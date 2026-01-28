import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="mx-auto max-w-5xl px-4 py-20 space-y-16">

      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Alberta Class 7 Made Simple</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Learn road rules, practice real questions, and pass your Alberta Class
          7 knowledge test with confidence.
        </p>

        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link href="/learn">Start Learning</Link>
          </Button>

          {!session && (
            <Button variant="outline" asChild>
              <Link href="/register">Create Free Account</Link>
            </Button>
          )}
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6 text-center">
        <Feature title="📘 Learn">
          Clear explanations, images, and examples.
        </Feature>
        <Feature title="📝 Practice">
          Practice real exam-style questions.
        </Feature>
        <Feature title="⏱ Mock Exam">
          Timed mock exams like the real test.
        </Feature>
      </section>

      {!session && (
        <section className="rounded-xl border bg-muted/30 p-8 text-center space-y-4">
          <h2 className="text-2xl font-semibold">Ready to test yourself?</h2>
          <p className="text-muted-foreground">
            Create a free account to unlock practice questions and mock exams.
          </p>
          <Button asChild>
            <Link href="/register">Unlock Practice</Link>
          </Button>
        </section>
      )}
    </main>
  );
}

function Feature({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
