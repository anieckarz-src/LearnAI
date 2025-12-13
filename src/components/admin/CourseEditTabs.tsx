import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseForm } from "./CourseForm";
import { LessonsManager } from "./LessonsManager";
import type { Course } from "@/types";
import { FileText, BookOpen } from "lucide-react";

interface CourseEditTabsProps {
  course: Course;
}

export function CourseEditTabs({ course }: CourseEditTabsProps) {
  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
        <TabsTrigger value="details" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Szczegóły kursu
        </TabsTrigger>
        <TabsTrigger value="lessons" className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Lekcje
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="mt-0">
        <CourseForm course={course} />
      </TabsContent>

      <TabsContent value="lessons" className="mt-0">
        <LessonsManager courseId={course.id} />
      </TabsContent>
    </Tabs>
  );
}
