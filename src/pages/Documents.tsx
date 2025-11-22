import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Folder } from "lucide-react";

const Documents = () => {
  const categories = [
    { name: "Governing Documents", description: "HOA bylaws, rules, and regulations", count: 0 },
    { name: "Meeting Minutes", description: "Board meeting records and notes", count: 0 },
    { name: "Financial Reports", description: "Budget and financial statements", count: 0 },
    { name: "Maintenance & Projects", description: "Building maintenance and improvement plans", count: 0 },
    { name: "Forms", description: "Request forms and applications", count: 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Document Library</h2>
        <p className="text-lg text-muted-foreground">
          Access important community documents and resources
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.name} className="cursor-pointer hover:bg-accent transition-colors">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Folder className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">{category.name}</CardTitle>
                  <CardDescription className="text-base mt-1">
                    {category.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="text-base">
                  {category.count} {category.count === 1 ? "document" : "documents"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Documents;