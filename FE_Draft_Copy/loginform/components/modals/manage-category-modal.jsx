"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";

export default function ManageCategoryModal({
  isOpen,
  onClose,
  categories,
  onUpdateCategories,
}) {
  const { toast } = useToast();
  const [categoryList, setCategoryList] = useState([]);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    setCategoryList(categories);
  }, [categories]);

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }

    if (categoryList.includes(newCategory)) {
      toast({
        title: "Error",
        description: "This category already exists",
        variant: "destructive",
      });
      return;
    }

    const updated = [...categoryList, newCategory];
    setCategoryList(updated);
    setNewCategory("");
    toast({
      title: "Success",
      description: "Category added successfully",
      variant: "default",
    });
  };

  const handleDeleteCategory = (category) => {
    const updated = categoryList.filter((c) => c !== category);
    setCategoryList(updated);
    toast({
      title: "Success",
      description: "Category deleted successfully",
      variant: "default",
    });
  };

  const handleSave = () => {
    onUpdateCategories(categoryList);
    toast({
      title: "Success",
      description: "Categories updated successfully",
      variant: "default",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Add New Category
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Enter category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
              />
              <Button
                onClick={handleAddCategory}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">
              Existing Categories
            </Label>
            <div className="space-y-2 mt-2">
              {categoryList.map((category) => (
                <div
                  key={category}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span className="text-sm text-gray-900">{category}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCategory(category)}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Categories
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
