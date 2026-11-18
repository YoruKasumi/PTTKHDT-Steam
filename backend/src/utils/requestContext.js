/** Gom dữ liệu request thành một đối tượng truyền xuống tầng Service. */
module.exports = (req) => ({
  user: req.user || null,
  ...req.query,
  ...req.params,
  ...req.body,
  files: req.files || (req.file ? [req.file] : []),
});
