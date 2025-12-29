import { notFound } from "next/navigation";
import { getTopicLearning } from "@/db/queries/get-topic-learning";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";

type Params = Promise<{ slug: string }>;

export default async function LearnTopicPage({ params }: { params: Params }) {
  const { slug } = await params;
  if (!slug) return notFound();

  const data = await getTopicLearning(slug);
  if (!data) return notFound();

  const { topic, content } = data;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-10">
      <h1 className="text-3xl font-bold">{topic.title}</h1>

      {content.map((section) => (
        <section key={section.id} className="space-y-2">
          <h2 className="text-xl font-semibold">{section.title}</h2>

          <div
            className="
    prose prose-base max-w-none
    prose-headings:font-semibold
    prose-h2:border-b prose-h2:pb-2
    prose-h3:mt-8
    prose-h4:mt-6
    prose-img:mx-auto
    prose-img:rounded-xl
    prose-img:border
    prose-img:bg-muted/30
    prose-img:p-3
    prose-img:max-h-64
    prose-img:w-auto
    prose-img:object-contain
    prose-img:block
    prose-ul:pl-6
    prose-li:my-1
  "
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ children }) => (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left font-semibold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-300 px-4 py-2">
                    {children}
                  </td>
                ),
              }}
            >
              {section.body}
            </ReactMarkdown>
          </div>
        </section>
      ))}

      <div className="flex gap-4 pt-6">
        <Button asChild>
          <a href={`/practice/${topic.slug}`}>Practice</a>
        </Button>

        <Button variant="outline" asChild>
          <a href={`/mock-exam/${topic.slug}`}>Take Mock Exam</a>
        </Button>
      </div>
    </div>
  );
}
