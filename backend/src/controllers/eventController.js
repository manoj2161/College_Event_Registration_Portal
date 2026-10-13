import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
const departments = ["C.S.E - BCA", "C.S.E - B.Tech", "C.S.E - MCA", "C.S.E - BSc IT", "C.S.E - BSc CS", "Science - Physics", "Science - Chemistry", "Science - Maths", "Science - Zoology", "Law Department", "Pharmacy Department", "HM Department"];
function validDepartments(values) { return Array.isArray(values) && values.length > 0 && values.every(value => departments.includes(value)); }
function dateOnly(value) { const date = new Date(value); return !Number.isNaN(date.getTime()) && date >= new Date(new Date().toDateString()); }
async function withCounts(events) { const ids = events.map(e => e._id); const counts = await Registration.aggregate([{ $match: { event: { $in: ids } } }, { $group: { _id: "$event", count: { $sum: 1 } } }]); const countMap = new Map(counts.map(c => [String(c._id), c.count])); return events.map(event => ({ ...event.toObject(), registrationCount: countMap.get(String(event._id)) || 0 })); }
export async function listEvents(req, res, next) {
 try { const query = req.user.role === "admin" ? {} : req.user.role === "organizer" ? { $or: [{ status: "approved" }, { createdBy: req.user._id }] } : { status: "approved" }; const events = await Event.find(query).populate("createdBy", "name email").sort({ date: 1, createdAt: -1 }); res.json({ events: await withCounts(events) }); } catch(e) { next(e); }
}
export async function createEvent(req, res, next) {
 try {
  const { title, category, description, organizerName, date, time, location, departments: eligible, seats } = req.body;
  if (!title || !description || !organizerName || !date || !time || !location || seats === undefined) return res.status(400).json({ message: "Fill in all required event fields." });
  if (!dateOnly(date)) return res.status(400).json({ message: "Choose today or a future date." });
  if (!validDepartments(eligible)) return res.status(400).json({ message: "Choose at least one valid department." });
  if (!Number.isInteger(Number(seats)) || Number(seats) < 1 || Number(seats) > 5000) return res.status(400).json({ message: "Capacity must be between 1 and 5000." });
  const event = await Event.create({ title, category, description, organizerName, date: new Date(date), time, location, departments: [...new Set(eligible)], seats: Number(seats), status: req.user.role === "admin" ? "approved" : "pending", createdBy: req.user._id });
  await event.populate("createdBy", "name email"); res.status(201).json({ event: { ...event.toObject(), registrationCount: 0 } });
 } catch(e) { next(e); }
}
export async function updateEventStatus(req, res, next) {
 try { const { status } = req.body; if (!["approved", "rejected"].includes(status)) return res.status(400).json({ message: "Status must be approved or rejected." }); const event = await Event.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true }).populate("createdBy", "name email"); if (!event) return res.status(404).json({ message: "Event not found." }); res.json({ event }); } catch(e) { next(e); }
}
export async function removeEvent(req, res, next) { try { const event = await Event.findByIdAndDelete(req.params.id); if (!event) return res.status(404).json({ message: "Event not found." }); await Registration.deleteMany({ event: event._id }); res.json({ message: "Event and registrations deleted." }); } catch(e) { next(e); } }
export async function registerForEvent(req, res, next) {
 try {
  if (req.user.role !== "student") return res.status(403).json({ message: "Only student accounts can register for events." });
  const { name, rollNo, phone, department } = req.body;
  if (!name || !rollNo || !phone || !department) return res.status(400).json({ message: "Fill in all registration fields." });
  const normalizedRoll = String(rollNo).trim().toUpperCase();
  if (!/^H\d{6}$/.test(normalizedRoll) || Number(normalizedRoll.slice(1)) < 220001 || Number(normalizedRoll.slice(1)) > 250999) return res.status(400).json({ message: "Use a valid roll number from H220001 to H250999." });
  if (!/^\d{10}$/.test(String(phone))) return res.status(400).json({ message: "Phone number must contain 10 digits." });
  const event = await Event.findById(req.params.id);
  if (!event || event.status !== "approved") return res.status(404).json({ message: "This event is not available for registration." });
  if (!event.departments.includes(department)) return res.status(400).json({ message: "Your selected department is not eligible for this event." });
  const count = await Registration.countDocuments({ event: event._id }); if (count >= event.seats) return res.status(409).json({ message: "This event has reached capacity." });
  if (await Registration.exists({ event: event._id, user: req.user._id })) return res.status(409).json({ message: "You are already registered for this event." });
  const registration = await Registration.create({ event: event._id, user: req.user._id, name: String(name).trim(), rollNo: normalizedRoll, phone, department });
  res.status(201).json({ registration });
 } catch(e) { next(e); }
}
