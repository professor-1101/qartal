import AdminUsersTable from "@/components/admin/AdminUsersTable";
import { RequireSuperUser } from "@/components/auth/require-super-user";
import DashboardPageHeader from "@/components/layout/DashboardPageHeader";

export default function AdminUsersPage() {
  return (
    <RequireSuperUser>
      <div className="container-fluid" dir="rtl">
        <DashboardPageHeader
          title="مدیریت کاربران"
          description="مدیریت و مشاهده کاربران سیستم"
        />
        <AdminUsersTable />
      </div>
    </RequireSuperUser>
  );
}