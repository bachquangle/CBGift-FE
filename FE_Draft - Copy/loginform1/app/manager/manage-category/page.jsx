"use client";

import { useState, useEffect } from "react";
import ManagerSidebar from "@/components/layout/manager/sidebar";
import ManagerHeader from "@/components/layout/manager/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import apiClient from "../../../lib/apiClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit2,
  RotateCcw,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";

export default function ManageCategory() {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState("manage-category");

  const [categories, setCategories] = useState([]);
  const [totalCategories, setTotalCategories] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Add
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");

  // Edit
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingCode, setEditingCode] = useState("");

  // =============================
  // 📌 FETCH CATEGORY LIST
  // =============================
  const fetchCategories = async () => {
    try {
      const url = `${apiClient.defaults.baseURL}/api/Categories/filter?searchTerm=${searchTerm}&page=${page}&pageSize=${itemsPerPage}`;
      const res = await fetch(url);

      if (!res.ok) throw new Error("Failed to fetch categories");

      const data = await res.json();
      setCategories(data.categories);
      setTotalCategories(data.total);
    } catch (err) {
      toast({
        title: "Error",
        description: "Cannot load categories.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page, itemsPerPage, searchTerm]);

  const totalPages = Math.ceil(totalCategories / itemsPerPage);

  // =============================
  // 📌 ADD CATEGORY
  // =============================
  const handleAddCategory = async () => {
    if (!newName.trim() || !newCode.trim()) {
      toast({
        title: "Error",
        description: "Name and Code are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(`${apiClient.defaults.baseURL}/api/Categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryName: newName,
          categoryCode: newCode,
        }),
      });

      if (!res.ok) throw new Error("Failed to add category");

      setShowAddModal(false);
      setNewName("");
      setNewCode("");

      fetchCategories();

      toast({ title: "Success", description: "Category added successfully" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive",
      });
    }
  };

  // =============================
  // 📌 LOAD FOR EDIT
  // =============================
  const handleEditCategory = async (id) => {
    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Categories/${id}`
      );

      if (!res.ok) throw new Error("Cannot load category");

      const data = await res.json();

      setEditingId(data.categoryId);
      setEditingName(data.categoryName);
      setEditingCode(data.categoryCode);

      setShowEditModal(true);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load category",
        variant: "destructive",
      });
    }
  };

  // =============================
  // 📌 SAVE EDIT
  // =============================
  const handleSaveEdit = async () => {
    if (!editingName.trim() || !editingCode.trim()) {
      toast({
        title: "Error",
        description: "Name and Code are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Categories/${editingId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryName: editingName,
            categoryCode: editingCode,
          }),
        }
      );

      if (!res.ok) throw new Error("Update failed");

      setShowEditModal(false);
      fetchCategories();

      toast({ title: "Success", description: "Category updated" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    }
  };

  // =============================
  // 📌 SOFT DELETE → status = 0
  // =============================
  const handleDeleteCategory = async (id) => {
    if (!confirm("Are you sure to deactivate this category?")) return;

    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Categories/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) throw new Error("Deactivate failed");

      fetchCategories();

      toast({ title: "Success", description: "Category deactivated" });
    } catch {
      toast({
        title: "Error",
        description: "Cannot deactivate",
        variant: "destructive",
      });
    }
  };

  // =============================
  // 📌 RESTORE → status = 1
  // =============================
  const handleRestoreCategory = async (id) => {
    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Categories/${id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: 1 }),
        }
      );

      if (!res.ok) throw new Error("Restore failed");

      fetchCategories();

      toast({ title: "Success", description: "Category restored" });
    } catch {
      toast({
        title: "Error",
        description: "Cannot restore category",
        variant: "destructive",
      });
    }
  };

  // =============================
  // RENDER UI
  // =============================
  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ManagerHeader />

        {/* HEADER */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <h1 className="text-2xl font-semibold">Manage Categories</h1>
        </header>

        {/* MAIN */}
        <main className="p-6 overflow-y-auto">
          {/* Search + Add */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />

              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Category
              </Button>
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded shadow">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-100">
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan="5" className="text-center py-8">
                      No categories found
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((c) => (
                    <TableRow key={c.categoryId}>
                      <TableCell>{c.categoryId}</TableCell>
                      <TableCell>{c.categoryName}</TableCell>
                      <TableCell>{c.categoryCode}</TableCell>

                      <TableCell>
                        {c.status === 1 ? (
                          <Badge className="bg-green-600">Active</Badge>
                        ) : (
                          <Badge className="bg-gray-500">Inactive</Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCategory(c.categoryId)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>

                          {c.status === 1 ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-300"
                              onClick={() => handleDeleteCategory(c.categoryId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 border-blue-300"
                              onClick={() =>
                                handleRestoreCategory(c.categoryId)
                              }
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* PAGINATION */}
            <div className="bg-blue-50 p-4 flex justify-between">
              <div>
                Items per page:
                <select
                  className="ml-2 border px-2 py-1"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                </select>
              </div>

              <div>
                Page {page} of {totalPages || 1}
              </div>

              <div className="flex gap-2">
                <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft />
                </Button>
                <Button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ADD MODAL */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>

          <Input
            className="mb-3"
            placeholder="Category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />

          <Input
            placeholder="Category code"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
          />

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory}>Add</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>

          <Input
            className="mb-3"
            placeholder="Category name"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
          />

          <Input
            placeholder="Category code"
            value={editingCode}
            onChange={(e) => setEditingCode(e.target.value)}
          />

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
