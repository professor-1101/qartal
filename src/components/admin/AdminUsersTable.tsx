"use client";
import { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns-jalali";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isSuper: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function AdminUsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [page, pageSize, search]);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search: search.trim(),
      });
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("خطا در دریافت کاربران");
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch (e: any) {
      setError(e.message || "خطای ناشناخته");
    } finally {
      setLoading(false);
    }
  }



  async function toggleUserActiveStatus(userId: string) {
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}&action=toggle-active`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error("خطا در تغییر وضعیت کاربر");
      await fetchUsers(); // رفرش لیست
    } catch (e: any) {
      setError(e.message || "خطای ناشناخته");
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm("آیا از حذف این کاربر اطمینان دارید؟")) return;
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error("خطا در حذف کاربر");
      await fetchUsers(); // رفرش لیست
    } catch (e: any) {
      setError(e.message || "خطای ناشناخته");
    }
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2" dir="rtl">
        <Input
          placeholder="جستجو بر اساس نام، نام خانوادگی یا ایمیل..."
          value={search}
          onChange={handleSearchChange}
          className="max-w-xs text-right"
        />
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">نام</TableHead>
              <TableHead className="text-right">نام خانوادگی</TableHead>
              <TableHead className="text-right">ایمیل</TableHead>
              <TableHead className="text-right">وضعیت</TableHead>
              <TableHead className="text-right">تاریخ ایجاد</TableHead>
              <TableHead className="text-right">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">در حال بارگذاری...</TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-destructive">{error}</TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">کاربری یافت نشد</TableCell>
              </TableRow>
            ) : (
              users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.firstName || "-"}</TableCell>
                  <TableCell>{user.lastName || "-"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.isActive ? <Badge variant="default">فعال</Badge> : <Badge variant="outline">غیرفعال</Badge>}
                  </TableCell>
                  <TableCell>{format(new Date(user.createdAt), "yyyy/MM/dd HH:mm")}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => toggleUserActiveStatus(user.id)}
                        disabled={loading}
                      >
                        {user.isActive ? "غیرفعال" : "فعال"}
                      </Button>

                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => deleteUser(user.id)}
                        disabled={loading}
                      >
                        حذف
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          نمایش {((page - 1) * pageSize) + 1} تا {Math.min(page * pageSize, total)} از {total} کاربر
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page === 1 || loading}
            variant="outline"
          >
            صفحه قبل
          </Button>
          <span className="text-sm">
            صفحه {page} از {Math.ceil(total / pageSize)}
          </span>
          <Button 
            size="sm" 
            onClick={() => setPage(p => (p * pageSize < total ? p + 1 : p))} 
            disabled={page * pageSize >= total || loading}
            variant="outline"
          >
            صفحه بعد
          </Button>
        </div>
      </div>
    </div>
  );
}