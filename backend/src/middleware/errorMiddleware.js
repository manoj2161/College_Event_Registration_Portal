export function notFound(req, res) { res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }); }
export function errorHandler(error, _req, res, _next) {
  console.error(error);
  if (error.code === 11000) return res.status(409).json({ message: "A record with those details already exists." });
  if (error.name === "ValidationError") return res.status(400).json({ message: Object.values(error.errors).map(item => item.message).join(" ") });
  if (error.name === "CastError") return res.status(400).json({ message: "Invalid record ID." });
  const status = error.statusCode || 500;
  res.status(status).json({ message: status === 500 ? "Something went wrong on the server." : error.message });
}