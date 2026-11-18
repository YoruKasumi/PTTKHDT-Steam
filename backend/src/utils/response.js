const ok = (res, data = null, status = 200) => res.status(status).json({ ok: true, data });
module.exports = { ok };
