import AdminActivitiesTable from "@/components/admin/AdminActivitiesTable";
import { RequireSuperUser } from "@/components/auth/require-super-user";
import DashboardPageHeader from "@/components/layout/DashboardPageHeader";

export default function AdminActivitiesPage() {
  return (
    <RequireSuperUser>
      <div className="container-fluid " dir="rtl">
        <DashboardPageHeader
          title="گزارش کل فعالیت‌ها"
          description="مشاهده و مدیریت تمام فعالیت‌های سیستم"
        />
        <AdminActivitiesTable />
      </div>
    </RequireSuperUser>
  );
}