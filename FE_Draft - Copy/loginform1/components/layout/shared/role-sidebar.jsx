"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";

export default function RoleSidebar({
  currentRole,
  currentPage,
  setCurrentPage,
}) {
  const router = useRouter();
  const [expandedRoles, setExpandedRoles] = useState({ [currentRole]: true });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const roles = {
    seller: {
      label: "Role Seller",
      expandable: true,
      menuItems: [
        { id: "dashboard", label: "Dashboard", path: "/seller/dashboard" },
        {
          id: "manage-order",
          label: "Manage Order",
          path: "/seller/manage-order",
        },
      ],
    },
    designer: {
      label: "Role Designer",
      expandable: true,
      menuItems: [
        { id: "dashboard", label: "Dashboard", path: "/designer/dashboard" },
        {
          id: "design-assign",
          label: "Design Assign by Seller",
          path: "/designer/design-assign",
        },
        {
          id: "manage-fail-design",
          label: "Manager Order Fail Design",
          path: "/designer/manage-fail-design",
        },
      ],
    },
    manager: {
      label: "Role Manager",
      expandable: true,
      menuItems: [
        { id: "dashboard", label: "Dashboard", path: "/manager/dashboard" },
        {
          id: "manage-order",
          label: "Manager Order",
          path: "/manager/manage-order",
        },
        {
          id: "manage-account",
          label: "Manage Account",
          path: "/manager/manage-account",
        },
        {
          id: "manage-relationship",
          label: "Manage Relationship",
          path: "/manager/manage-relationship",
        },
        {
          id: "manage-topup",
          label: "Manage Top Up Money",
          path: "/manager/manage-topup",
        },
        {
          id: "report-analyst",
          label: "Report and Analyst",
          path: "/manager/report-analyst",
        },
      ],
    },
    qc: {
      label: "Role QC",
      expandable: true,
      menuItems: [
        { id: "dashboard", label: "Dashboard", path: "/qc/dashboard" },
        { id: "check-design", label: "Check Design", path: "/qc/check-design" },
        {
          id: "check-product",
          label: "Check Product",
          path: "/qc/check-product",
        },
      ],
    },
    staff: {
      label: "Role Staff",
      expandable: true,
      menuItems: [
        { id: "dashboard", label: "Dashboard", path: "/staff/dashboard" },
        {
          id: "manage-order",
          label: "Manage Order",
          path: "/staff/manage-order",
        },
      ],
    },
  };

  const handleNavigation = (item, role) => {
    setCurrentPage(item.id);
    router.push(item.path);
    setIsMobileMenuOpen(false); // Close mobile menu on navigation
  };

  const handleRoleClick = (roleKey, role) => {
    if (role.expandable) {
      setExpandedRoles((prev) => ({
        ...prev,
        [roleKey]: !prev[roleKey],
      }));
    } else {
      router.push(role.directPath);
    }
  };

  const SidebarContent = () => (
    <>
      {/* Logo/Brand */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">
          CNC - System
        </h1>
      </div>

      {/* Role Navigation Menu */}
      <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
        {Object.entries(roles).map(([roleKey, role]) => (
          <div key={roleKey}>
            {/* Role Header */}
            <Button
              variant="ghost"
              className="w-full justify-between p-2 h-auto text-left"
              onClick={() => handleRoleClick(roleKey, role)}
            >
              <span
                className={`font-medium text-sm sm:text-base ${
                  currentRole === roleKey ? "text-blue-600" : "text-gray-700"
                }`}
              >
                {role.label}
              </span>
              {role.expandable &&
                (expandedRoles[roleKey] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                ))}
            </Button>

            {/* Role Menu Items - Only show for expandable roles when expanded */}
            {role.expandable && expandedRoles[roleKey] && (
              <div className="ml-2 sm:ml-4 mt-1 space-y-1">
                {role.menuItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={
                      currentRole === roleKey && currentPage === item.id
                        ? "default"
                        : "ghost"
                    }
                    className="w-full justify-start text-xs sm:text-sm py-2 px-3"
                    onClick={() => handleNavigation(item, roleKey)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white shadow-md"
        >
          {isMobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-white shadow-lg flex-col">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg flex flex-col">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
