/** Gom dữ liệu request thành một đối tượng truyền xuống tầng Service. */
module.exports = (req) => ({
  ...req.query,
  ...req.params,
  ...req.body,
  user: req.user || null,
  files: req.files || (req.file ? [req.file] : []),
});
