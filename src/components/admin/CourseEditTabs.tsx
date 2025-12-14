import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseForm } from "./CourseForm";
import { ModulesManager } from "./ModulesManager";
import { LessonsManager } from "./LessonsManager";
import type { Course } from "@/types";
import { FileText, BookOpen, Folder } from "lucide-react";

interface CourseEditTabsProps {
  course: Course;
}

export function CourseEditTabs({ course }: CourseEditTabsProps) {
  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-6">
        <TabsTrigger value="details" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Szczegóły kursu
        </TabsTrigger>
        <TabsTrigger value="modules" className="flex items-center gap-2">
          <Folder className="w-4 h-4" />
          Moduły
        </TabsTrigger>
        <TabsTrigger value="lessons" className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Lekcje
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="mt-0">
        <CourseForm course={course} />
      </TabsContent>

      <TabsContent value="modules" className="mt-0">
        <ModulesManager courseId={course.id} />
      </TabsContent>

      <TabsContent value="lessons" className="mt-0">
        <LessonsManager courseId={course.id} />
      </TabsContent>
    </Tabs>
  );
}
