"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Save, X, Calendar, User, Mail, Briefcase } from "lucide-react";

export default function RelationshipDetailsModal({
  isOpen,
  onClose,
  relationship,
  onUpdate,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    status: relationship?.status || "active",
    notes: relationship?.notes || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedRelationship = {
        ...relationship,
        ...editData,
        updatedAt: new Date().toISOString().split("T")[0],
      };

      onUpdate(updatedRelationship);
      setIsEditing(false);

      // Show success message
      alert("Relationship updated successfully!");
    } catch (error) {
      alert("Failed to update relationship. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      status: relationship?.status || "active",
      notes: relationship?.notes || "",
    });
    setIsEditing(false);
  };

  if (!relationship) return null;

  const getStatusBadge = (status) => {
    return status === "active" ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Inactive</Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Relationship Details</span>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={loading}>
                    <Save className="h-4 w-4 mr-1" />
                    {loading ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seller Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Seller Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Name
                </Label>
                <p className="text-sm text-gray-900">
                  {relationship.seller.name}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-900">
                    {relationship.seller.email}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Phone
                </Label>
                <p className="text-sm text-gray-900">
                  {relationship.seller.phone || "N/A"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Company
                </Label>
                <p className="text-sm text-gray-900">
                  {relationship.seller.company || "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Designer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Designer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Name
                </Label>
                <p className="text-sm text-gray-900">
                  {relationship.designer.name}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-900">
                    {relationship.designer.email}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Specialization
                </Label>
                <p className="text-sm text-gray-900">
                  {relationship.designer.specialization || "General Design"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Experience
                </Label>
                <p className="text-sm text-gray-900">
                  {relationship.designer.experience || "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Relationship Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Relationship Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Status
                </Label>
                {isEditing ? (
                  <Select
                    value={editData.status}
                    onValueChange={(value) =>
                      setEditData({ ...editData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1">
                    {getStatusBadge(relationship.status)}
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Projects Count
                </Label>
                <p className="text-sm text-gray-900 mt-1">
                  {relationship.projectsCount}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Created Date
                </Label>
                <p className="text-sm text-gray-900 mt-1">
                  {relationship.createdAt}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Notes</Label>
              {isEditing ? (
                <textarea
                  value={editData.notes}
                  onChange={(e) =>
                    setEditData({ ...editData, notes: e.target.value })
                  }
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md resize-none"
                  rows={3}
                  placeholder="Add notes about this relationship..."
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">
                  {relationship.notes || "No notes available"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {relationship.recentProjects?.length > 0 ? (
                relationship.recentProjects.map((project, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{project.name}</p>
                      <p className="text-xs text-gray-600">{project.date}</p>
                    </div>
                    <Badge
                      variant={
                        project.status === "completed" ? "default" : "secondary"
                      }
                    >
                      {project.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No recent projects found
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
