import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface QuickFeedbackTag {
  id: string;
  label: string;
  emoji: string;
}

interface QuickFeedbackTagsProps {
  selectedTags: string[];
  onToggleTag: (tagId: string) => void;
  className?: string;
}

const feedbackTags: QuickFeedbackTag[] = [
  { id: "helpful", label: "Helpful", emoji: "👍" },
  { id: "patient", label: "Patient", emoji: "🙏" },
  { id: "expert", label: "Expert", emoji: "⭐" },
  { id: "friendly", label: "Friendly", emoji: "😊" },
  { id: "clear", label: "Clear Explanations", emoji: "💡" },
  { id: "motivating", label: "Motivating", emoji: "🔥" },
  { id: "professional", label: "Professional", emoji: "💼" },
  { id: "responsive", label: "Responsive", emoji: "⚡" },
];

export const QuickFeedbackTags = ({
  selectedTags,
  onToggleTag,
  className,
}: QuickFeedbackTagsProps) => {
  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <h4 className="text-sm font-medium text-foreground mb-1">
          Quick Feedback
        </h4>
        <p className="text-xs text-muted-foreground">
          Select all that apply (optional)
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {feedbackTags.map((tag) => {
          const isSelected = selectedTags.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onToggleTag(tag.id)}
              className={cn(
                "relative transition-all duration-200 hover:scale-105 active:scale-95"
              )}
            >
              <Badge
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "px-3 py-2 text-sm cursor-pointer transition-all",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "hover:bg-primary/10"
                )}
              >
                <span className="mr-2">{tag.emoji}</span>
                {tag.label}
              </Badge>
              {isSelected && (
                <div className="absolute -top-1 -right-1">
                  <CheckCircle2 className="h-4 w-4 fill-success text-white animate-scale-in" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
