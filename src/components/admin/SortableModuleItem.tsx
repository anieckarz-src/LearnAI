import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { InlineLessonForm } from "./InlineLessonForm";
import { SortableLessonItem } from "./SortableLessonItem";
import type { Lesson, Module } from "@/types";
import { Plus, Edit, Trash2, GripVertical, ChevronDown, ChevronRight, MoreVertical, Copy } from "lucide-react";

interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

export interface SortableModuleItemProps {
  module: ModuleWithLessons;
  courseId: string;
  isExpanded: boolean;
  isAddingLesson: boolean;
  insertPosition: number | null;
  editingLessonId: string | null;
  expandedLessonDetails: Set<string>;
  onToggleExpansion: () => void;
  onAddLesson: () => void;
  onAddLessonAt: (position: number) => void;
  onEditModule: () => void;
  onDeleteModule: () => void;
  onSaveNewLesson: (lesson: Lesson) => void;
  onCancelNewLesson: () => void;
  onToggleLessonExpand: (lessonId: string) => void;
  onEditLesson: (lessonId: string) => void;
  onDeleteLesson: (lessonId: string) => void;
  onSaveEditLesson: (lesson: Lesson) => void;
  onCancelEditLesson: () => void;
  onLessonDragEnd: () => void;
  onDuplicateModule?: () => void;
  onDuplicateLesson?: (lessonId: string) => void;
}

export function SortableModuleItem({
  module,
  courseId,
  isExpanded,
  isAddingLesson,
  insertPosition,
  editingLessonId,
  expandedLessonDetails,
  onToggleExpansion,
  onAddLesson,
  onAddLessonAt,
  onEditModule,
  onDeleteModule,
  onSaveNewLesson,
  onCancelNewLesson,
  onToggleLessonExpand,
  onEditLesson,
  onDeleteLesson,
  onSaveEditLesson,
  onCancelEditLesson,
  onLessonDragEnd,
  onDuplicateModule,
  onDuplicateLesson,
}: SortableModuleItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: module.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Card
          ref={setNodeRef}
          style={style}
          className={`bg-slate-800/50 border-white/10 backdrop-blur-sm transition-all duration-200 mb-3 ${
            isDragging ? "opacity-50 scale-105 shadow-2xl" : "hover:border-white/20"
          }`}
        >
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  {...attributes}
                  {...listeners}
                  className="cursor-move touch-none flex-shrink-0 p-1 rounded hover:bg-white/5 transition-colors"
                >
                  <GripVertical className="w-4 h-4 text-gray-500" />
                </div>

                <button
                  onClick={onToggleExpansion}
                  className="text-gray-400 hover:text-white transition-all duration-200 flex-shrink-0"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-white text-base font-medium truncate">{module.title}</CardTitle>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {module.lessons.length} {module.lessons.length === 1 ? "lekcja" : "lekcji"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onAddLesson}
                  className="text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 h-8 w-8 p-0"
                  title="Dodaj lekcję"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onEditModule}
                  className="text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 h-8 w-8 p-0"
                  title="Edytuj moduł"
                >
                  <Edit className="w-4 h-4" />
                </Button>

                {/* Dropdown menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 h-8 w-8 p-0"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={onEditModule}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edytuj moduł
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onAddLesson}>
                      <Plus className="w-4 h-4 mr-2" />
                      Dodaj lekcję
                    </DropdownMenuItem>
                    {onDuplicateModule && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onDuplicateModule}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplikuj moduł
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDeleteModule} className="text-red-400 focus:text-red-400">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Usuń moduł
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>

          {isExpanded && (
            <CardContent className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 fade-in duration-300">
              <div className="border-t border-white/10 pt-3">
                {/* Lessons list with insert buttons */}
                {module.lessons.length > 0 ? (
                  <SortableContext items={module.lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {module.lessons.map((lesson, index) => (
                        <Fragment key={lesson.id}>
                          {/* Insert button and form before each lesson */}
                          {!isAddingLesson && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onAddLessonAt(index)}
                              className="w-full h-8 border border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 text-gray-500 hover:text-blue-400 transition-all duration-200 mb-1"
                            >
                              <Plus className="w-3 h-3 mr-1.5" />
                              <span className="text-xs">Dodaj lekcję tutaj</span>
                            </Button>
                          )}

                          {/* Show form if adding at this position */}
                          {isAddingLesson && insertPosition === index && (
                            <div className="mb-3 animate-in slide-in-from-top-2 duration-200">
                              <InlineLessonForm
                                courseId={courseId}
                                moduleId={module.id}
                                insertAtIndex={index}
                                onSave={onSaveNewLesson}
                                onCancel={onCancelNewLesson}
                              />
                            </div>
                          )}

                          {/* The lesson itself */}
                          <SortableLessonItem
                            lesson={lesson}
                            courseId={courseId}
                            moduleId={module.id}
                            isExpanded={expandedLessonDetails.has(lesson.id)}
                            isEditing={editingLessonId === lesson.id}
                            onToggleExpand={() => onToggleLessonExpand(lesson.id)}
                            onEdit={() => onEditLesson(lesson.id)}
                            onDelete={() => onDeleteLesson(lesson.id)}
                            onSaveEdit={onSaveEditLesson}
                            onCancelEdit={onCancelEditLesson}
                            onDuplicate={onDuplicateLesson ? () => onDuplicateLesson(lesson.id) : undefined}
                          />
                        </Fragment>
                      ))}

                      {/* Insert button after all lessons */}
                      {!isAddingLesson && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAddLessonAt(module.lessons.length)}
                          className="w-full h-8 border border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 text-gray-500 hover:text-blue-400 transition-all duration-200 mt-1"
                        >
                          <Plus className="w-3 h-3 mr-1.5" />
                          <span className="text-xs">Dodaj lekcję na końcu</span>
                        </Button>
                      )}

                      {/* Show form if adding at the end */}
                      {isAddingLesson && insertPosition === module.lessons.length && (
                        <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
                          <InlineLessonForm
                            courseId={courseId}
                            moduleId={module.id}
                            insertAtIndex={module.lessons.length}
                            onSave={onSaveNewLesson}
                            onCancel={onCancelNewLesson}
                          />
                        </div>
                      )}
                    </div>
                  </SortableContext>
                ) : (
                  // Empty state - show form or add button
                  <>
                    {isAddingLesson && insertPosition === 0 ? (
                      <div className="mb-3 animate-in slide-in-from-top-2 duration-200">
                        <InlineLessonForm
                          courseId={courseId}
                          moduleId={module.id}
                          insertAtIndex={0}
                          onSave={onSaveNewLesson}
                          onCancel={onCancelNewLesson}
                        />
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500 text-sm mb-3">
                          Brak lekcji. Kliknij przycisk aby dodać pierwszą lekcję.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAddLessonAt(0)}
                          className="border-dashed hover:bg-white/5 transition-all duration-200"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Dodaj pierwszą lekcję
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </ContextMenuTrigger>

      {/* Context menu (right-click) */}
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onEditModule}>
          <Edit className="w-4 h-4 mr-2" />
          Edytuj moduł
        </ContextMenuItem>
        <ContextMenuItem onClick={onAddLesson}>
          <Plus className="w-4 h-4 mr-2" />
          Dodaj lekcję
        </ContextMenuItem>
        {onDuplicateModule && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onDuplicateModule}>
              <Copy className="w-4 h-4 mr-2" />
              Duplikuj moduł
            </ContextMenuItem>
          </>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDeleteModule} className="text-red-400 focus:text-red-400">
          <Trash2 className="w-4 h-4 mr-2" />
          Usuń moduł
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
