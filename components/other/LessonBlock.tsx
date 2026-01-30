import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import ReactMarkdown from "react-markdown";

export function LessonBlock({ block }: { block: any }) {
  switch (block.type) {
    case "intro":
      return (
        <Card className="bg-muted/30">
          <CardContent className="prose max-w-none p-6">
            <ReactMarkdown>{block.body}</ReactMarkdown>
          </CardContent>
        </Card>
      );

    case "concept":
      return (
        <Card>
          <CardHeader>
            <CardTitle>{block.title}</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <ReactMarkdown>{block.body}</ReactMarkdown>
          </CardContent>
        </Card>
      );

    case "visual":
      return (
        <Card>
          <CardHeader>
            <CardTitle>{block.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-6">
            <div className="prose flex-1">
              <ReactMarkdown>{block.body}</ReactMarkdown>
            </div>
            {block.imageUrl && (
              <img
                src={block.imageUrl}
                className="w-full md:w-1/3 rounded-lg border object-contain"
                alt=""
              />
            )}
          </CardContent>
        </Card>
      );

    case "rules":
      return (
        <Card className="border-l-4 border-yellow-500 bg-yellow-50">
          <CardHeader>
            <CardTitle>{block.title}</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <ReactMarkdown>{block.body}</ReactMarkdown>
          </CardContent>
        </Card>
      );

    case "mistakes":
      return (
        <Card className="border-l-4 border-red-500 bg-red-50">
          <CardHeader>
            <CardTitle>{block.title}</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <ReactMarkdown>{block.body}</ReactMarkdown>
          </CardContent>
        </Card>
      );

    default:
      return null;
  }
}
