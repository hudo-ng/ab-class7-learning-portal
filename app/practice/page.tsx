import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { topics } from "@/db/schema";
import { ArrowRight } from "lucide-react";

export default async function PracticeIndexPage() {
  const allTopics = await db.select().from(topics);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Practice</h1>
        <p className="text-muted-foreground mt-2">
          Practice questions to prepare for the Alberta Class 7 knowledge test.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {allTopics.map((topic) => (
          <Link key={topic.id} href={`/practice/${topic.slug}`}>
            <Card className="h-full hover:shadow-md transition cursor-pointer">
              <CardHeader>
                <CardTitle>{topic.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between items-end">
                <span className="text-sm text-muted-foreground">
                  Start practicing
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
