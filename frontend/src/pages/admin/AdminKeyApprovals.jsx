import AdminShell from '../../components/admin/AdminShell';

export default function AdminKeyApprovals() {
  return (
    <AdminShell
      title="Cơ chế kích hoạt mã bản quyền (Key)"
      description="Hệ thống tự động duyệt và kích hoạt tức thời khi mã hợp lệ, không qua hàng đợi phê duyệt thủ công của Admin."
    >
      <div className="space-y-6">
        {/* Banner thông báo nghiệp vụ */}
        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-xl font-bold text-emerald-400">
              ⚡
            </span>
            <div>
              <h2 className="m-0 text-lg font-bold text-emerald-300">
                Hệ thống tự động kích hoạt mã Key (Auto-Validation)
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Theo đặc tả kiến trúc nghiệp vụ, nền tảng không yêu cầu Admin hay Staff phê duyệt thủ công từng mã kích hoạt.
                Toàn bộ quy trình xác thực tính hợp lệ của mã và cấp quyền sở hữu trò chơi được hệ thống xử lý tự động theo thời gian thực (Real-time Transaction).
              </p>
            </div>
          </div>
        </section>

        {/* 3 Điều kiện tự động duyệt của hệ thống */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-card p-5">
            <div className="flex items-center gap-2">
              <span className="rounded bg-sky-500/20 px-2 py-0.5 text-xs font-bold text-sky-400">Điều kiện 1</span>
              <h3 className="m-0 text-sm font-bold text-white">Mã Key hợp lệ</h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Mã kích hoạt phải tồn tại trong bảng <code className="text-white">ACTIVATIONKEY</code> và có trạng thái <code className="text-emerald-400">Status = 'Unused'</code>.
              Nếu mã đã qua sử dụng (<code className="text-amber-400">Used</code>) hoặc bị thu hồi (<code className="text-rose-400">Revoked</code>), hệ thống tự động từ chối (HTTP 422).
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-card p-5">
            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400">Điều kiện 2</span>
              <h3 className="m-0 text-sm font-bold text-white">Chưa có bản quyền Active</h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Khách hàng chưa từng sở hữu game, hoặc bản quyền trước đó đã bị thu hồi (<code className="text-amber-400">LICENSE.Status = 'Revoked'</code> do hoàn tiền/vi phạm).
              Nếu khách đang có bản quyền <code className="text-emerald-400">Active</code>, hệ thống chặn kích hoạt trùng (HTTP 409).
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-card p-5">
            <div className="flex items-center gap-2">
              <span className="rounded bg-purple-500/20 px-2 py-0.5 text-xs font-bold text-purple-400">Bước 3</span>
              <h3 className="m-0 text-sm font-bold text-white">Cấp License tức thời</h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Trong 1 Database Transaction duy nhất (<code className="text-white">FOR UPDATE</code>): chuyển mã sang <code className="text-white">Used</code> (gắn <code className="text-white">RedeemedBy</code>),
              và tạo ngay bản quyền <code className="text-emerald-400">LICENSE (Active)</code> kèm mã băm SHA-256 AccessToken.
            </p>
          </div>
        </section>

        {/* Bảng trạng thái mã kích hoạt trong CSDL */}
        <section className="rounded-2xl border border-white/10 bg-card p-6">
          <h3 className="m-0 text-base font-bold text-white">Đặc tả trạng thái mã Key trong CSDL (ACTIVATIONKEY)</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-page text-muted">
                <tr>
                  <th className="px-4 py-3">Trạng thái (Status)</th>
                  <th className="px-4 py-3">Ý nghĩa nghiệp vụ</th>
                  <th className="px-4 py-3">Hành vi tự động khi khách Redeem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="px-4 py-3">
                    <span className="rounded bg-emerald-500/20 px-2 py-1 font-mono font-bold text-emerald-400">
                      Unused
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white">
                    Mã mới được Developer sinh ra, sẵn sàng kích hoạt.
                  </td>
                  <td className="px-4 py-3 text-emerald-300">
                    ✓ Chấp thuận kích hoạt nếu người dùng chưa có bản quyền Active.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">
                    <span className="rounded bg-amber-500/20 px-2 py-1 font-mono font-bold text-amber-400">
                      Used
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white">
                    Mã đã được người dùng đổi thành bản quyền thành công.
                  </td>
                  <td className="px-4 py-3 text-rose-300">
                    ✕ Từ chối: <code className="text-xs">KEY_ALREADY_USED</code> (422).
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">
                    <span className="rounded bg-rose-500/20 px-2 py-1 font-mono font-bold text-rose-400">
                      Revoked
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white">
                    Mã bị Developer hoặc hệ thống thu hồi trước khi sử dụng.
                  </td>
                  <td className="px-4 py-3 text-rose-300">
                    ✕ Từ chối: <code className="text-xs">KEY_REVOKED</code> (422).
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
