import { useState } from "react";
import { FormSection, FormQuestion, QuestionTypeConfig } from "../types/form";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Label } from "../../ui/label";
import {
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  GripVertical,
  Plus,
  X,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  Layers,
} from "lucide-react";
import { Separator } from "../../ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../ui/collapsible";
import { QuestionCard } from "./QuestionCard";

interface SectionCardProps {
  section: FormSection;
  questions: FormQuestion[];
  index: number;
  isActive: boolean;
  questionTypes: QuestionTypeConfig[];
  activeQuestion: string | null;
  onUpdateSection: (id: string, updates: Partial<FormSection>) => void;
  onDeleteSection: (id: string) => void;
  onMoveSection: (id: string, direction: "up" | "down") => void;
  onSetActiveSection: (id: string | null) => void;
  onAddQuestion: (sectionId?: string) => void;
  onUpdateQuestion: (id: string, updates: Partial<FormQuestion>) => void;
  onDeleteQuestion: (id: string) => void;
  onDuplicateQuestion: (id: string) => void;
  onMoveQuestion: (id: string, direction: "up" | "down") => void;
  onAddOption: (questionId: string) => void;
  onUpdateOption: (questionId: string, optionIndex: number, value: string) => void;
  onDeleteOption: (questionId: string, optionIndex: number) => void;
  onSetActiveQuestion: (id: string) => void;
}

export function SectionCard({
  section,
  questions,
  index,
  isActive,
  questionTypes,
  activeQuestion,
  onUpdateSection,
  onDeleteSection,
  onMoveSection,
  onSetActiveSection,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onDuplicateQuestion,
  onMoveQuestion,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
  onSetActiveQuestion,
}: SectionCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={`transition-all ${
        isActive ? "border-green-500 border-2 shadow-md" : "border-gray-200"
      }`}
      onClick={() => onSetActiveSection(section.id)}
    >
      <div className="bg-white border rounded-lg overflow-hidden">
        {/* Section Header */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-2 sm:gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="cursor-move h-6 w-6 sm:h-8 sm:w-8 shrink-0"
                aria-label="Drag to reorder"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
              </Button>
              <span className="text-xs sm:text-sm text-gray-500 min-w-[1.5rem] sm:min-w-[2rem]">
                Section {index + 1}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              {isActive ? (
                <Input
                  value={section.title}
                  onChange={(e) =>
                    onUpdateSection(section.id, { title: e.target.value })
                  }
                  placeholder="Enter section title"
                  className="text-sm sm:text-base font-semibold bg-white"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              ) : (
                <h3 className="text-sm sm:text-base font-semibold truncate">
                  {section.title || "Untitled Section"}
                </h3>
              )}
            </div>
            <div className="flex items-center gap-1">
              {isOpen ? (
                <ChevronUpIcon className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {/* Section Description */}
          {isActive && (
            <div className="px-4 pb-3">
              <Input
                value={section.description || ""}
                onChange={(e) =>
                  onUpdateSection(section.id, { description: e.target.value })
                }
                placeholder="Add a description (optional)"
                className="text-sm bg-white"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <Separator className="my-2" />

          {/* Questions in Section */}
          <div className="px-4 pb-4 space-y-2">
            {questions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Layers className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No questions in this section yet</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddQuestion(section.id);
                  }}
                  className="mt-2 text-green-600 hover:text-green-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Question
                </Button>
              </div>
            ) : (
              questions.map((question, qIndex) => (
                <div
                  key={question.id}
                  className="bg-white rounded-lg border shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <QuestionCard
                    question={question}
                    index={qIndex}
                    isActive={activeQuestion === question.id}
                    questionTypes={questionTypes}
                    onUpdate={onUpdateQuestion}
                    onDelete={onDeleteQuestion}
                    onDuplicate={onDuplicateQuestion}
                    onMove={onMoveQuestion}
                    onAddOption={onAddOption}
                    onUpdateOption={onUpdateOption}
                    onDeleteOption={onDeleteOption}
                    onSetActive={onSetActiveQuestion}
                  />
                </div>
              ))
            )}

            {/* Add Question Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAddQuestion(section.id);
              }}
              className="w-full text-green-600 hover:text-green-700 hover:bg-green-50 border-2 border-dashed border-green-200"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Question to Section
            </Button>
          </div>

          {/* Section Actions */}
          {isActive && (
            <div className="flex items-center justify-between p-4 border-t bg-gray-50/50">
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveSection(section.id, "up");
                  }}
                  disabled={index === 0}
                  className="shrink-0"
                  aria-label="Move section up"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveSection(section.id, "down");
                  }}
                  disabled={index === 0}
                  className="shrink-0"
                  aria-label="Move section down"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSection(section.id);
                }}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                aria-label="Delete section"
              >
                <Trash2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Delete Section</span>
              </Button>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
