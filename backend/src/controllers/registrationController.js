import Registration from "../models/Registration.js";
export async function listMyRegistrations(req, res, next) {
  try {
    const registrations = await Registration.find({ user: req.user._id })
      .populate({ path: "event", select: "title date time location status" })
      .sort({ createdAt: -1 });
    res.json({ registrations });
  } catch (e) {
    next(e);
  }
}
export async function listRegistrations(req, res, next) {
  try {
    const registrations = await Registration.find()
      .populate("user", "name email")
      .populate("event", "title date time location")
      .sort({ createdAt: -1 });
    res.json({ registrations });
  } catch (e) {
    next(e);
  }
}
export async function cancelRegistration(req, res, next) {
  try {
    const query =
      req.user.role === "admin"
        ? { _id: req.params.id }
        : { _id: req.params.id, user: req.user._id };
    const registration = await Registration.findOneAndDelete(query);
    if (!registration)
      return res.status(404).json({ message: "Registration not found." });
    res.json({ message: "Registration cancelled." });
  } catch (e) {
    next(e);
  }
}
export async function exportRegistrations(req, res, next) {
  try {
    const registrations = await Registration.find()
      .populate("user", "name email")
      .populate("event", "title date")
      .sort({ createdAt: -1 });
    res.json({ registrations });
  } catch (e) {
    next(e);
  }
}
