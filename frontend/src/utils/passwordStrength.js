/** Đánh giá độ an toàn mật khẩu để hiện thanh "Độ an toàn mật khẩu" (Figma: node 8:317). */
export function passwordStrength(pw) {
  if (!pw) return { level: 0, label: '', width: 0, color: 'bg-line', text: 'text-muted' };
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  if (score <= 1) return { level: 1, label: 'Yếu', width: 25, color: 'bg-red-500', text: 'text-red-400' };
  if (score === 2) return { level: 2, label: 'Trung bình', width: 50, color: 'bg-amber-500', text: 'text-amber-400' };
  if (score === 3) return { level: 3, label: 'Mạnh', width: 75, color: 'bg-ok', text: 'text-ok' };
  return { level: 4, label: 'Rất mạnh', width: 100, color: 'bg-ok', text: 'text-ok' };
}
