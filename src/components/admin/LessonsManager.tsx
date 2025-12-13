import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LessonForm } from "./LessonForm";
import { LessonPreview } from "./LessonPreview";
import type { Lesson } from "@/types";
import { Plus, Edit, Trash2, Eye, GripVertical, Loader2 } from "lucide-react";

interface LessonsManagerProps {
  courseId: string;
}

interface SortableLessonItemProps {
  lesson: Lesson;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
}

function SortableLessonItem({ lesson, onEdit, onDelete, onPreview }: SortableLessonItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 rounded-lg bg-slate-700/50 border border-white/10 hover:border-blue-500/50 transition-colors"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-white">
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-white font-medium truncate">{lesson.title}</h4>
        <p className="text-sm text-gray-400">Utworzono: {new Date(lesson.created_at).toLocaleDateString("pl-PL")}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onPreview}>
          <Eye className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function LessonsManager({ courseId }: LessonsManagerProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchLessons();
  }, [courseId]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/lessons?course_id=${courseId}`);
      const result = await response.json();

      if (result.success) {
        setLessons(result.data);
      }
    } catch (error) {
      console.error("Error fetching lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = lessons.findIndex((l) => l.id === active.id);
      const newIndex = lessons.findIndex((l) => l.id === over.id);

      const newLessons = arrayMove(lessons, oldIndex, newIndex);
      setLessons(newLessons);

      // Update order_index for all affected lessons
      try {
        await Promise.all(
          newLessons.map((lesson, index) =>
            fetch(`/api/admin/lessons/${lesson.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ order_index: index }),
            })
          )
        );
      } catch (error) {
        console.error("Error updating lesson order:", error);
        // Revert on error
        fetchLessons();
      }
    }
  };

  const handleDelete = async (lessonId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tę lekcję?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        fetchLessons();
      } else {
        alert(result.error || "Nie udało się usunąć lekcji");
      }
    } catch (error) {
      console.error("Error deleting lesson:", error);
      alert("Wystąpił błąd");
    }
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingLesson(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingLesson(null);
    fetchLessons();
  };

  if (showForm) {
    return (
      <LessonForm
        courseId={courseId}
        lesson={editingLesson || undefined}
        onSave={handleFormClose}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Lekcje</CardTitle>
          <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Dodaj lekcję
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>Brak lekcji w tym kursie.</p>
              <p className="text-sm mt-2">Kliknij &quot;Dodaj lekcję&quot; aby utworzyć pierwszą lekcję.</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {lessons.map((lesson) => (
                    <SortableLessonItem
                      key={lesson.id}
                      lesson={lesson}
                      onEdit={() => handleEdit(lesson)}
                      onDelete={() => handleDelete(lesson.id)}
                      onPreview={() => setPreviewLesson(lesson)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {previewLesson && <LessonPreview lesson={previewLesson} onClose={() => setPreviewLesson(null)} />}
    </div>
  );
}
