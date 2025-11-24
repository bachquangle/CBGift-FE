"use client";

import { useState, useEffect } from "react";
import  apiClient  from "../../../lib/apiClient";
import ManagerSidebar from "@/components/layout/manager/sidebar";
import ManagerHeader from "@/components/layout/manager/header";
import AccountDetailsModal from "@/components/modals/account-details-modal";
import AssignAccountModal from "@/components/modals/assign-account-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  UserPlus,
  Search,
  Filter,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function ManageAccount() {
  const [currentPage, setCurrentPage] = useState("manage-account");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalAccountsCount, setTotalAccountsCount] = useState(0);

  // Popups
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null); // lưu tài khoản đang ban/unban
  const [successMessage, setSuccessMessage] = useState("");

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: itemsPerPage.toString(),
      });

      if (searchTerm) params.append("search", searchTerm);

      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter !== "all")
        params.append("isActive", statusFilter === "active" ? "true" : "false");

      const url = `${apiClient.defaults.baseURL}/api/management/accounts?${params.toString()}`;
      console.log("[v0] Fetching accounts from:", url);

      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("[v0] Accounts fetched:", data);

      // Map API response to component state
      const mappedAccounts = data.items.map((account) => ({
        id: account.id,
        email: account.email,
        fullName: account.fullName || "N/A",
        username: account.email.split("@")[0], // Extract username from email
        role:
          account.roles && account.roles.length > 0
            ? account.roles[0].toLowerCase()
            : "user",
        status: account.isActive ? "active" : "banned",
        createdDate: new Date(
          account.emailConfirmed
            ? account.createdDate || new Date()
            : new Date()
        )
          .toISOString()
          .split("T")[0],
        lastLogin: new Date().toISOString().split("T")[0], // API doesn't provide lastLogin, using current date
      }));

      setAccounts(mappedAccounts);
      setTotalAccountsCount(data.totalItems);
      setSelectedAccounts([]);
      setSelectAll(false);
    } catch (err) {
      console.error("[v0] Error fetching accounts:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [page, itemsPerPage, searchTerm, roleFilter, statusFilter]);

  const totalPages = Math.ceil(totalAccountsCount / itemsPerPage);

  const getRoleBadge = (role) => {
    const roleColors = {
      manager: "bg-purple-500",
      designer: "bg-blue-500",
      qc: "bg-green-500",
      seller: "bg-orange-500",
      staff: "bg-gray-500",
      user: "bg-gray-400",
    };
    return (
      <Badge className={roleColors[role] || "bg-gray-500"}>
        {role.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    return status === "active" ? (
      <Badge className="bg-green-500">Active</Badge>
    ) : (
      <Badge className="bg-red-500">Banned</Badge>
    );
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    if (newSelectAll) {
      setSelectedAccounts(accounts.map((account) => account.id));
    } else {
      setSelectedAccounts([]);
    }
  };

  const handleAccountSelect = (accountId) => {
    if (selectedAccounts.includes(accountId)) {
      setSelectedAccounts(selectedAccounts.filter((id) => id !== accountId));
      setSelectAll(false);
    } else {
      setSelectedAccounts([...selectedAccounts, accountId]);
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleRoleFilterChange = (value) => {
    setRoleFilter(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setPage(1);
  };

  const handleViewDetails = async (account) => {
    try {
      const response = await fetch(
        `${apiClient.defaults.baseURL}/api/management/accounts/${account.id}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const detailedAccount = await response.json();
        // Merge dữ liệu chi tiết từ API vào selectedAccount
        setSelectedAccount({
          ...account,
          ...detailedAccount,
          // đảm bảo roles luôn là mảng (API có thể trả null)
          roles: detailedAccount.roles ?? account.roles ?? [],
          // đảm bảo isActive có mặt
          isActive:
            detailedAccount.isActive ??
            account.isActive ??
            Boolean(account.status === "active"),
          emailConfirmed:
            detailedAccount.emailConfirmed ?? account.emailConfirmed,
        });
      } else {
        // nếu lỗi khi lấy chi tiết thì fallback về account rút gọn
        setSelectedAccount({
          ...account,
          roles: account.roles ?? (account.role ? [account.role] : []),
          isActive: account.status === "active",
        });
      }
    } catch (err) {
      console.error("[v0] Error fetching account details:", err);
      setSelectedAccount({
        ...account,
        roles: account.roles ?? (account.role ? [account.role] : []),
        isActive: account.status === "active",
      });
    }
    setShowDetailsModal(true);
  };

  const handleUpdateRole = async (accountId, newRole) => {
    try {
      // Cập nhật local list nhanh để UI phản hồi ngay
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === accountId
            ? { ...a, role: newRole } // cập nhật hiển thị cột Role
            : a
        )
      );

      // Nếu modal đang mở cho user này thì cập nhật roles trong modal
      if (selectedAccount && selectedAccount.id === accountId) {
        setSelectedAccount((prev) => ({
          ...prev,
          roles: [newRole],
        }));
      }

      // Tùy chọn: fetch lại server để đồng bộ (nếu muốn phản hồi server => uncomment)
      // await fetchAccounts();
    } catch (err) {
      console.error("[v0] Error in handleUpdateRole:", err);
    }
  };

  const confirmToggleBan = (account) => {
    setConfirmTarget(account);
    setShowConfirmDialog(true);
  };

  const handleToggleBan = async (accountId) => {
    try {
      // Tìm user trong list
      const target = accounts.find((a) => a.id === accountId);
      if (!target) return;

      const newIsActive = target.status !== "active";

      const payload = {
        id: target.id,
        fullName: target.fullName,
        email: target.email,
        isActive: newIsActive,
      };

      console.log(
        "[v0] Toggling ban status with PUT to /api/management/accounts:",
        payload
      );

      const response = await fetch(
        `${apiClient.defaults.baseURL}/api/management/accounts`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const responseData = await response.json();
      console.log("[v0] ToggleBan response:", responseData);

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP ${response.status}`);
      }

      // Cập nhật trạng thái trong UI
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === accountId
            ? { ...a, status: newIsActive ? "active" : "banned" }
            : a
        )
      );

      // Nếu modal đang mở cho user này -> cập nhật luôn
      if (selectedAccount && selectedAccount.id === accountId) {
        setSelectedAccount((prev) => ({
          ...prev,
          isActive: newIsActive,
        }));
      }

      // Hiển thị log thành công
      console.log("[v0] Ban/unban updated successfully.");
    } catch (err) {
      console.error("[v0] Error in handleToggleBan:", err);
    } finally {
      // Sau khi đổi xong, reload lại list từ server để đảm bảo sync DB
      await fetchAccounts();
    }
  };

  const handleAssignAccount = (newAccount) => {
    setAccounts((prev) => [...prev, newAccount]);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ManagerHeader />
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            Manage Accounts
          </h1>
          <p className="text-gray-600 mt-1">
            Manage user accounts, roles, and permissions
          </p>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Search and Filter Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col md:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by name, email, or username..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select
                    value={roleFilter}
                    onValueChange={handleRoleFilterChange}
                  >
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="designer">Designer</SelectItem>
                      <SelectItem value="qc">QC</SelectItem>
                      <SelectItem value="seller">Seller</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={statusFilter}
                    onValueChange={handleStatusFilterChange}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="banned">Banned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => setShowAssignModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Account
                </Button>
              </div>
            </div>

            {/* Accounts Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  User Accounts ({totalAccountsCount})
                </h2>
                <p className="text-sm text-gray-600">
                  {selectedAccounts.length > 0 && (
                    <>Selected: {selectedAccounts.length} | </>
                  )}
                  {loading
                    ? "Loading..."
                    : "Manage and monitor all user accounts"}
                </p>
              </div>
              <div className="overflow-x-auto">
                {error && (
                  <div className="p-4 bg-red-50 text-red-700 border-b border-red-200">
                    Error loading accounts: {error}
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-100">
                      <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap w-12">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                          disabled={loading}
                        />
                      </TableHead>
                      {/* <TableHead>Account ID</TableHead> */}
                      <TableHead>Full Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      {/* <TableHead>Created Date</TableHead> */}
                      {/* <TableHead>Last Login</TableHead> */}
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell
                          colSpan="10"
                          className="text-center py-8 text-gray-500"
                        >
                          Loading accounts...
                        </TableCell>
                      </TableRow>
                    ) : accounts.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan="10"
                          className="text-center py-8 text-gray-500"
                        >
                          No accounts found
                        </TableCell>
                      </TableRow>
                    ) : (
                      accounts.map((account) => (
                        <TableRow key={account.id} className="hover:bg-blue-50">
                          <TableCell>
                            <Checkbox
                              checked={selectedAccounts.includes(account.id)}
                              onCheckedChange={() =>
                                handleAccountSelect(account.id)
                              }
                            />
                          </TableCell>
                          {/* <TableCell className="font-medium text-sm">
                            {account.id.substring(0, 8)}...
                          </TableCell> */}
                          <TableCell>{account.fullName}</TableCell>
                          <TableCell>{account.username}</TableCell>
                          <TableCell className="text-sm">
                            {account.email}
                          </TableCell>
                          <TableCell>{getRoleBadge(account.role)}</TableCell>
                          <TableCell>
                            {getStatusBadge(account.status)}
                          </TableCell>
                          {/* <TableCell className="text-sm">
                            {account.createdDate}
                          </TableCell>
                          <TableCell className="text-sm">
                            {account.lastLogin}
                          </TableCell> */}
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(account)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant={
                                  account.status === "active"
                                    ? "destructive"
                                    : "default"
                                }
                                size="sm"
                                onClick={() => confirmToggleBan(account)}
                              >
                                {account.status === "active" ? (
                                  <>
                                    <Ban className="h-4 w-4 mr-1" />
                                    Ban
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Unban
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="bg-blue-100 px-4 py-3 border-t border-blue-200 sm:px-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Items Per Page Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">
                      Items per page:
                    </span>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={handleItemsPerPageChange}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-[70px] bg-white border-blue-200 hover:bg-blue-50">
                        <SelectValue placeholder={itemsPerPage} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Page Info */}
                  <div className="text-sm text-slate-600">
                    Showing{" "}
                    {accounts.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} to{" "}
                    {Math.min(page * itemsPerPage, totalAccountsCount)} of{" "}
                    {totalAccountsCount}
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1 || loading}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-slate-600 min-w-[60px] text-center">
                      Page {page} of {totalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages || loading}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Account Details Modal */}
      <AccountDetailsModal
        account={selectedAccount}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedAccount(null);
        }}
        onUpdateRole={handleUpdateRole}
        onToggleBan={handleToggleBan}
      />

      {/* Assign Account Modal */}
      <AssignAccountModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssignAccount={handleAssignAccount}
      />
      {/* Confirm Dialog */}
      {showConfirmDialog && confirmTarget && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-[400px] text-center">
            <h2 className="text-lg font-semibold mb-2">
              {confirmTarget.status === "active"
                ? "Confirm Ban Account"
                : "Confirm Unban Account"}
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to{" "}
              {confirmTarget.status === "active" ? "ban" : "unban"}{" "}
              <span className="font-medium">{confirmTarget.email}</span>?
            </p>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant={
                  confirmTarget.status === "active" ? "destructive" : "default"
                }
                onClick={async () => {
                  setShowConfirmDialog(false);
                  await handleToggleBan(confirmTarget.id);
                  setSuccessMessage(
                    confirmTarget.status === "active"
                      ? "Account banned successfully"
                      : "Account unbanned successfully"
                  );
                  setShowSuccessDialog(true);
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-[400px] text-center">
            <h2 className="text-lg font-semibold text-green-600 mb-2">
              Success
            </h2>
            <p className="text-gray-700 mb-6">{successMessage}</p>
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  setShowSuccessDialog(false);
                  setConfirmTarget(null);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
