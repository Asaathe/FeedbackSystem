import { useState } from "react";
import { DatabaseCategory } from "../types/form";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CategoryManagerProps {
  categories: DatabaseCategory[];
  customCategories: string[];
  loadingCategoryOperation: boolean;
  onAddCategory: (category: string) => void;
  onRemoveCategory: (category: string) => void;
}

export function CategoryManager({
  categories,
  customCategories,
  loadingCategoryOperation,
  onAddCategory,
  onRemoveCategory,
}: CategoryManagerProps) {
  const [newCategory, setNewCategory] = useState("");

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim());
      setNewCategory("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddCategory();
    }
  };

  return (
    <div className="space-y-4">
      {/* Add New Category */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Add New Category</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Enter category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loadingCategoryOperation}
            aria-label="New category name"
          />
          <Button
            onClick={handleAddCategory}
            disabled={loadingCategoryOperation || !newCategory.trim()}
            size="sm"
            aria-label="Add category"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Existing Categories */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Existing Categories</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categories.length === 0 ? (
            <p className="text-sm text-gray-500">No categories yet</p>
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-2 border rounded-lg bg-gray-50"
              >
                <span className="text-sm">{category.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveCategory(category.name)}
                  disabled={loadingCategoryOperation}
                  className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                  aria-label={`Remove ${category.name}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
