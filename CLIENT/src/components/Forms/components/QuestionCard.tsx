import { FormQuestion, QuestionTypeConfig } from "../types/form";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  GripVertical,
  Plus,
  X,
} from "lucide-react";
import { Separator } from "../../ui/separator";

interface QuestionCardProps {
  question: FormQuestion;
  index: number;
  isActive: boolean;
  questionTypes: QuestionTypeConfig[];
  onUpdate: (id: string, updates: Partial<FormQuestion>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onAddOption: (questionId: string) => void;
  onUpdateOption: (questionId: string, optionIndex: number, value: string) => void;
  onDeleteOption: (questionId: string, optionIndex: number) => void;
  onSetActive: (id: string) => void;
}

export function QuestionCard({
  question,
  index,
  isActive,
  questionTypes,
  onUpdate,
  onDelete,
  onDuplicate,
  onMove,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
  onSetActive,
}: QuestionCardProps) {
  return (
    <div
      className={`transition-all bg-gray-50/50 ${
        isActive ? "border-green-500 border-2 shadow-md" : "border-gray-200"
      }`}
      onClick={() => onSetActive(question.id)}
    >
      <div className="pt-6 sm:pt-8 pb-4 sm:pb-6 px-4 sm:px-6">
        <div className="space-y-4">
          {/* Question Header */}
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="flex items-center gap-1 sm:gap-2 mt-2">
              <Button
                variant="ghost"
                size="icon"
                className="cursor-move h-6 w-6 sm:h-8 sm:w-8 shrink-0"
                aria-label="Drag to reorder"
              >
                <GripVertical className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
              </Button>
              <span className="text-xs sm:text-sm text-gray-500 min-w-[1.5rem] sm:min-w-[2rem]">
                Q{index + 1}
              </span>
            </div>
            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex flex-col sm:flex-row gap-2">
                <Textarea
                  value={question.question}
                  onChange={(e) =>
                    onUpdate(question.id, { question: e.target.value })
                  }
                  placeholder="Enter your question"
                  className="text-sm sm:text-base min-h-[unset] resize-y"
                  rows={1}
                  aria-label={`Question ${index + 1} text`}
                />
                <Select
                  value={question.type}
                  onValueChange={(value) => {
                    const newType = value as FormQuestion["type"];
                    const updates: Partial<FormQuestion> = {
                      type: newType,
                    };
                    if (
                      newType === "multiple-choice" ||
                      newType === "checkbox" ||
                      newType === "dropdown"
                    ) {
                      updates.options = ["Option 1"];
                    } else {
                      updates.options = undefined;
                    }
                    onUpdate(question.id, updates);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {questionTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              {isActive && (
                <Input
                  value={question.description || ""}
                  onChange={(e) =>
                    onUpdate(question.id, { description: e.target.value })
                  }
                  placeholder="Add a description (optional)"
                  className="text-sm"
                  aria-label={`Question ${index + 1} description`}
                />
              )}

              {/* Options for choice-based questions */}
              {(question.type === "multiple-choice" ||
                question.type === "checkbox" ||
                question.type === "dropdown") && (
                <div className="space-y-2 pl-0 sm:pl-4">
                  {question.options?.map((option, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 shrink-0 ${
                          question.type === "multiple-choice"
                            ? "rounded-full"
                            : "rounded"
                        } border-2 border-gray-300`}
                      />
                      <Input
                        value={option}
                        onChange={(e) =>
                          onUpdateOption(question.id, optIdx, e.target.value)
                        }
                        placeholder={`Enter option ${optIdx + 1}`}
                        className="flex-1 text-sm"
                        aria-label={`Option ${optIdx + 1}`}
                      />
                      {question.options && question.options.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
                          onClick={() => onDeleteOption(question.id, optIdx)}
                          aria-label={`Remove option ${optIdx + 1}`}
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddOption(question.id)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 text-xs sm:text-sm"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Add Option
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Question Actions */}
          {isActive && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t">
              <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 sm:pb-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMove(question.id, "up")}
                  disabled={index === 0}
                  className="shrink-0"
                  aria-label="Move question up"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMove(question.id, "down")}
                  disabled={index === 0}
                  className="shrink-0"
                  aria-label="Move question down"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Separator
                  orientation="vertical"
                  className="h-6 mx-1 sm:mx-2"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDuplicate(question.id)}
                  className="shrink-0"
                  aria-label="Duplicate question"
                >
                  <Copy className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Duplicate</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(question.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                  aria-label="Delete question"
                >
                  <Trash2 className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2">
                <Label className="text-sm" htmlFor={`required-${question.id}`}>
                  Required
                </Label>
                <input
                  id={`required-${question.id}`}
                  type="checkbox"
                  checked={question.required}
                  onChange={(e) =>
                    onUpdate(question.id, { required: e.target.checked })
                  }
                  className="w-4 h-4"
                  aria-label="Mark question as required"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
