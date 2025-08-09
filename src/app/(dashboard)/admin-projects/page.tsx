import AdminProjectsTable from "@/components/admin/AdminProjectsTable";
import { RequireSuperUser } from "@/components/auth/require-super-user";
import DashboardPageHeader from "@/components/layout/DashboardPageHeader";

export default function AdminProjectsPage() {
  return (
    <RequireSuperUser>
    <div className="container-fluid" dir="rtl">
        <DashboardPageHeader
          title="مدیریت پروژه‌ها"
          description="مدیریت و مشاهده تمام پروژه‌های سیستم"
        />
        <AdminProjectsTable />
      </div>
    </RequireSuperUser>
  );
}