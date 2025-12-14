import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { LessonDetailsView } from "./LessonDetailsView";
import type { Lesson } from "@/types";
import { GripVertical, Edit, Trash2, MoreVertical, Copy } from "lucide-react";

export interface SortableLessonItemProps {
  lesson: Lesson;
  courseId: string;
  moduleId: string;
  isExpanded: boolean;
  isEditing: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSaveEdit: (lesson: Lesson) => void;
  onCancelEdit: () => void;
  onDuplicate?: () => void;
}

export function SortableLessonItem({
  lesson,
  courseId,
  moduleId,
  isExpanded,
  isEditing,
  onToggleExpand,
  onEdit,
  onDelete,
  onSaveEdit,
  onCancelEdit,
  onDuplicate,
}: SortableLessonItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getLessonTypeIcon = (type: string) => {
    return type === "quiz" ? "❓" : "🎬";
  };

  // If editing, show the form
  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style}>
        <InlineLessonForm
          courseId={courseId}
          moduleId={moduleId}
          lesson={lesson}
          onSave={onSaveEdit}
          onCancel={onCancelEdit}
        />
      </div>
    );
  }

  // If expanded, show details view
  if (isExpanded) {
    return (
      <div ref={setNodeRef} style={style} className="mb-2">
        <LessonDetailsView lesson={lesson} onClose={onToggleExpand} onEdit={onEdit} />
      </div>
    );
  }

  // Regular compact view with context menu
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          ref={setNodeRef}
          style={style}
          className="group flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-white/10 hover:bg-slate-800/50 transition-all duration-200 mb-2"
        >
          <div {...attributes} {...listeners} className="cursor-move touch-none">
            <GripVertical className="w-4 h-4 text-gray-500" />
          </div>
          
          <button
            onClick={onEdit}
            className="flex items-center gap-3 flex-1 text-left"
          >
            <span className="text-lg">{getLessonTypeIcon(lesson.type)}</span>
            <span className="text-white text-sm flex-1">{lesson.title}</span>
            <span className="text-xs text-gray-500 capitalize">{lesson.type}</span>
          </button>

          {/* Quick actions - visible on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
              className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
              title="Edytuj"
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
            
            {/* Dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edytuj lekcję
                </DropdownMenuItem>
                {onDuplicate && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDuplicate}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplikuj lekcję
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-red-400 focus:text-red-400">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Usuń lekcję
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </ContextMenuTrigger>

      {/* Context menu (right-click) */}
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onEdit}>
          <Edit className="w-4 h-4 mr-2" />
          Edytuj lekcję
        </ContextMenuItem>
        {onDuplicate && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onDuplicate}>
              <Copy className="w-4 h-4 mr-2" />
              Duplikuj lekcję
            </ContextMenuItem>
          </>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} className="text-red-400 focus:text-red-400">
          <Trash2 className="w-4 h-4 mr-2" />
          Usuń lekcję
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
