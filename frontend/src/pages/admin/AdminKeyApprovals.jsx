import AdminShell from '../../components/admin/AdminShell';

export default function AdminKeyApprovals() {
  return (
    <AdminShell
      title="Duyệt mã bản quyền"
      description="Đối chiếu chức năng với trạng thái Key hiện có trong backend."
    >
      <section className="rounded-2xl border border-amber-500/20 bg-card p-6">
        <h2 className="mt-0 text-lg font-bold text-amber-300">Hiện không có hàng đợi phê duyệt Key</h2>
        <p className="mb-0 leading-7 text-muted">
          Bảng <code>ACTIVATIONKEY</code> chỉ có các trạng thái <code>Unused</code>, <code>Used</code> và <code>Revoked</code>;
          schema chưa định nghĩa trạng thái chờ duyệt hay thao tác phê duyệt của Admin. Vì vậy màn hình không hiển thị
          dữ liệu giả hoặc cho phép đổi trạng thái ngoài luồng backend. Cần bổ sung trạng thái và API nghiệp vụ trước
          khi triển khai tính năng duyệt Key.
        </p>
      </section>
    </AdminShell>
  );
}
