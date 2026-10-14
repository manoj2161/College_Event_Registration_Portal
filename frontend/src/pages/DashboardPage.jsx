import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Compass,
  Plus,
  Sparkles,
  Users,
  Menu,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import Sidebar from "../components/layout/Sidebar.jsx";
import Topbar from "../components/layout/Topbar.jsx";
import StatCard from "../components/dashboard/StatCard.jsx";
import { EventCard } from "../components/events/EventCard.jsx";
import EventForm from "../components/events/EventForm.jsx";
import Modal from "../components/ui/Modal.jsx";
import Button from "../components/ui/Button.jsx";
import AIAssistant from "../components/assistant/AIAssistant.jsx";
import { apiRequest } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const notify = useToast();
  const [active, setActive] = useState("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventData, registrationData] = await Promise.all([
        apiRequest("/events"),
        apiRequest(
          user.role === "admin" ? "/registrations" : "/registrations/mine",
        ),
      ]);
      setEvents(eventData.events || []);
      if (user.role === "admin")
        setRegistrations(registrationData.registrations || []);
      else setMyRegistrations(registrationData.registrations || []);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [user.role]);
  useEffect(() => {
    loadData();
  }, [loadData]);
  const registeredIds = useMemo(
    () =>
      new Set(myRegistrations.map((r) => String(r.event?._id || r.eventId))),
    [myRegistrations],
  );
  const visibleEvents = useMemo(
    () =>
      events.filter((event) => {
        const matchesSearch =
          `${event.title} ${event.description} ${event.organizerName} ${event.category}`
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchesFilter =
          filter === "all" ||
          (filter === "upcoming" &&
            new Date(`${event.date.slice(0, 10)}T${event.time || "00:00"}`) >=
              new Date()) ||
          event.status === filter;
        const roleVisible =
          user.role === "admin" ||
          (active === "my-events" && user.role === "organizer"
            ? String(event.createdBy?._id || event.createdBy) ===
              String(user.id || user._id)
            : event.status === "approved");
        return matchesSearch && matchesFilter && roleVisible;
      }),
    [events, search, filter, user, active],
  );
  const approvedEvents = events.filter((e) => e.status === "approved");
  const pendingEvents = events.filter((e) => e.status === "pending");
  async function createEvent(values) {
    setSaving(true);
    try {
      await apiRequest("/events", { method: "POST", body: values });
      notify(
        user.role === "admin"
          ? "Event published successfully."
          : "Event submitted for admin approval.",
      );
      setModal("");
      await loadData();
    } finally {
      setSaving(false);
    }
  }
  async function registerForEvent(event) {
    setSelectedEvent(event);
    setModal("register");
  }
  async function submitRegistration(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await apiRequest(`/events/${selectedEvent._id}/register`, {
        method: "POST",
        body: {
          name: form.get("name"),
          rollNo: form.get("rollNo"),
          phone: form.get("phone"),
          department: form.get("department"),
        },
      });
      notify("You're registered. See you there!");
      setModal("");
      await loadData();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  }
  async function changeStatus(id, status) {
    try {
      await apiRequest(`/events/${id}/status`, {
        method: "PATCH",
        body: { status },
      });
      notify(`Event ${status}.`);
      await loadData();
    } catch (err) {
      notify(err.message, "error");
    }
  }
  async function deleteEvent(id) {
    if (
      !window.confirm(
        "Delete this event and its registrations? This cannot be undone.",
      )
    )
      return;
    try {
      await apiRequest(`/events/${id}`, { method: "DELETE" });
      notify("Event deleted.");
      await loadData();
    } catch (err) {
      notify(err.message, "error");
    }
  }
  async function cancelRegistration(id) {
    if (!window.confirm("Cancel this registration?")) return;
    try {
      await apiRequest(`/registrations/${id}`, { method: "DELETE" });
      notify("Registration cancelled.");
      await loadData();
    } catch (err) {
      notify(err.message, "error");
    }
  }
  async function exportCsv() {
    try {
      const data = await apiRequest("/registrations/export");
      const rows = data.registrations || [];
      const header = [
        "Student",
        "Roll number",
        "Department",
        "Phone",
        "Email",
        "Event",
        "Date",
      ];
      const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
      const csv = [
        header,
        ...rows.map((r) => [
          r.name,
          r.rollNo,
          r.department,
          r.phone,
          r.user?.email,
          r.event?.title,
          r.event?.date,
        ]),
      ]
        .map((row) => row.map(quote).join(","))
        .join("\n");
      const url = URL.createObjectURL(
        new Blob([csv], { type: "text/csv;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "campusly-registrations.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      notify(err.message, "error");
    }
  }
  function navigate(id) {
    setActive(id);
    setSearch("");
    setFilter("all");
  }
  const titleMap = {
    overview: "Your campus, at a glance",
    events: "Discover something new",
    "my-events":
      user.role === "organizer"
        ? "Your event submissions"
        : "Your registered events",
    manage: "Review event submissions",
    registrations: "Registration directory",
    assistant: "Your campus co-pilot",
  };
  const subtitleMap = {
    overview: "Here’s what’s happening in your campus community.",
    events: "Find the next workshop, meetup, or big idea.",
    "my-events": "Keep track of your campus activity.",
    manage: "Approve upcoming events and keep the calendar current.",
    registrations: "Search and export event participant details.",
    assistant: "Get quick answers about events and the portal.",
  };
  const headingEvents =
    active === "manage"
      ? events.filter((e) => e.status === "pending")
      : active === "my-events" && user.role === "student"
        ? events.filter((e) => registeredIds.has(String(e._id)))
        : visibleEvents;
  return (
    <div className="app-shell min-h-screen">
      <Sidebar
        user={user}
        active={active}
        onNavigate={navigate}
        onLogout={logout}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <main className="main-area">
        <Topbar
          user={user}
          onMenu={() => setMobileOpen(true)}
          onAssistant={() => navigate("assistant")}
        />
        <div className="page-content w-full">
          <section className="welcome-banner reveal">
            <div className="welcome-copy">
              <div className="eyebrow">
                <span className="eyebrow-line" /> CAMPUSLY WORKSPACE
              </div>
              <h1>{titleMap[active] || titleMap.overview}</h1>
              <p>{subtitleMap[active] || subtitleMap.overview}</p>
              <div className="welcome-actions flex items-center gap-4">
                {(user.role === "organizer" || user.role === "admin") && (
                  <Button onClick={() => setModal("event")}>
                    <Plus size={17} /> Create an event
                  </Button>
                )}
                {user.role === "student" && (
                  <Button onClick={() => navigate("events")}>
                    <Compass size={17} /> Explore events
                  </Button>
                )}
                <button
                  className="welcome-link"
                  onClick={() => navigate("assistant")}
                >
                  <Sparkles size={16} /> Ask Campus AI{" "}
                  <ArrowUpRight size={15} />
                </button>
              </div>
            </div>
            <div className="welcome-art">
              <div className="welcome-ring ring-one" />
              <div className="welcome-ring ring-two" />
              <div className="welcome-glass">
                <CalendarDays size={36} />
                <span>
                  YOUR NEXT
                  <br />
                  CHAPTER
                </span>
              </div>
              <div className="floating-chip chip-top">
                <span className="chip-dot purple" /> New experiences
              </div>
              <div className="floating-chip chip-bottom">
                <CheckCircle2 size={14} /> Make it count
              </div>
            </div>
          </section>
          {active === "overview" && (
            <>
              <div className="section-heading">
                <div>
                  <h2>Your overview</h2>
                  <p>A quick look at your campus activity.</p>
                </div>
                <span className="updated-label">
                  <span className="status-dot" /> Live workspace
                </span>
              </div>
              <div className="stats-grid grid gap-3">
                {user.role === "student" ? (
                  <>
                    <StatCard
                      label="Upcoming events"
                      value={approvedEvents.length}
                      hint="Approved and open to join"
                      icon={CalendarDays}
                      accent="violet"
                    />
                    <StatCard
                      label="My registrations"
                      value={myRegistrations.length}
                      hint="Events you’re part of"
                      icon={CheckCircle2}
                      accent="green"
                    />
                    <StatCard
                      label="Departments"
                      value="12"
                      hint="Communities across campus"
                      icon={Users}
                      accent="blue"
                    />
                    <StatCard
                      label="Discover more"
                      value={Math.max(
                        0,
                        approvedEvents.length - myRegistrations.length,
                      )}
                      hint="More experiences to explore"
                      icon={Compass}
                      accent="pink"
                    />
                  </>
                ) : user.role === "organizer" ? (
                  <>
                    <StatCard
                      label="Your submissions"
                      value={
                        events.filter(
                          (e) =>
                            String(e.createdBy?._id || e.createdBy) ===
                            String(user.id || user._id),
                        ).length
                      }
                      hint="Events submitted by you"
                      icon={CalendarDays}
                    />
                    <StatCard
                      label="Awaiting review"
                      value={pendingEvents.length}
                      hint="Pending admin approval"
                      icon={Clock3}
                      accent="blue"
                    />
                    <StatCard
                      label="Published events"
                      value={approvedEvents.length}
                      hint="Live on campus"
                      icon={CheckCircle2}
                      accent="green"
                    />
                    <StatCard
                      label="Registrations"
                      value={events.reduce(
                        (n, e) => n + (e.registrationCount || 0),
                        0,
                      )}
                      hint="Across listed events"
                      icon={Users}
                      accent="pink"
                    />
                  </>
                ) : (
                  <>
                    <StatCard
                      label="Total events"
                      value={events.length}
                      hint="All event submissions"
                      icon={CalendarDays}
                    />
                    <StatCard
                      label="Pending review"
                      value={pendingEvents.length}
                      hint="Needs your attention"
                      icon={Clock3}
                      accent="blue"
                    />
                    <StatCard
                      label="Published events"
                      value={approvedEvents.length}
                      hint="Visible to students"
                      icon={CheckCircle2}
                      accent="green"
                    />
                    <StatCard
                      label="Registrations"
                      value={registrations.length}
                      hint="All participants"
                      icon={Users}
                      accent="pink"
                    />
                  </>
                )}
              </div>
              <div className="section-heading section-heading-gap">
                <div>
                  <h2>
                    {user.role === "admin"
                      ? "Needs your review"
                      : "On the campus radar"}
                  </h2>
                  <p>
                    {user.role === "admin"
                      ? "The latest event requests waiting for approval."
                      : "A few events you might want to check out."}
                  </p>
                </div>
                <button
                  className="text-action"
                  onClick={() =>
                    navigate(user.role === "admin" ? "manage" : "events")
                  }
                >
                  View all <ArrowUpRight size={15} />
                </button>
              </div>
              <div className="event-grid grid gap-4">
                {loading ? (
                  <div className="loading-grid">
                    <div />
                    <div />
                    <div />
                  </div>
                ) : (
                  (user.role === "admin" ? pendingEvents : approvedEvents)
                    .slice(0, 3)
                    .map((event) => (
                      <EventCard
                        key={event._id}
                        event={event}
                        registered={registeredIds.has(String(event._id))}
                        onRegister={registerForEvent}
                        canManage={user.role === "admin"}
                        onStatus={changeStatus}
                        onDelete={deleteEvent}
                      />
                    ))
                )}
              </div>
            </>
          )}
          {active === "events" && (
            <>
              <div className="list-toolbar">
                <label className="search-field">
                  <Search size={17} />
                  <input
                    id="event-search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by event, club, or keyword..."
                  />
                </label>
                <label className="filter-field">
                  <SlidersHorizontal size={16} />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All upcoming</option>
                    <option value="upcoming">Future events</option>
                  </select>
                </label>
              </div>
              <div className="event-grid grid gap-4">
                {loading ? (
                  <div className="empty-panel">Loading events…</div>
                ) : (
                  visibleEvents.map((event) => (
                    <EventCard
                      key={event._id}
                      event={event}
                      registered={registeredIds.has(String(event._id))}
                      onRegister={registerForEvent}
                    />
                  ))
                )}
              </div>
              {!loading && !visibleEvents.length && (
                <div className="empty-panel">
                  <Compass size={26} />
                  <h3>No events found</h3>
                  <p>Try a different search or check back soon.</p>
                </div>
              )}
            </>
          )}
          {active === "my-events" && (
            <>
              <div className="list-toolbar">
                <label className="search-field">
                  <Search size={17} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search your events..."
                  />
                </label>
                {user.role === "organizer" && (
                  <Button onClick={() => setModal("event")}>
                    <Plus size={16} /> Submit event
                  </Button>
                )}
              </div>
              <div className="event-grid grid gap-4">
                {headingEvents
                  .filter((e) =>
                    `${e.title} ${e.description}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .map((event) => (
                    <EventCard
                      key={event._id}
                      event={event}
                      registered={registeredIds.has(String(event._id))}
                      onRegister={registerForEvent}
                    />
                  ))}
              </div>
              {user.role === "student" && (
                <div className="glass-panel registrations-list">
                  <h3>Your registrations</h3>
                  {myRegistrations.length ? (
                    myRegistrations.map((reg) => (
                      <div className="registration-row" key={reg._id}>
                        <div className="registration-date">
                          <strong>
                            {reg.event?.date
                              ? new Date(reg.event.date).getDate()
                              : "—"}
                          </strong>
                          <span>
                            {reg.event?.date
                              ? new Date(reg.event.date).toLocaleDateString(
                                  "en",
                                  { month: "short" },
                                )
                              : "TBA"}
                          </span>
                        </div>
                        <div className="registration-info">
                          <strong>
                            {reg.event?.title || "Event no longer available"}
                          </strong>
                          <span>
                            {reg.event?.location} · {reg.department} ·{" "}
                            {reg.rollNo}
                          </span>
                        </div>
                        <button
                          className="text-action danger-text"
                          onClick={() => cancelRegistration(reg._id)}
                        >
                          Cancel
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="muted-copy">
                      Your registrations will appear here after you join an
                      event.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
          {active === "manage" && (
            <>
              <div className="list-toolbar">
                <div className="toolbar-copy">
                  <strong>{pendingEvents.length} requests to review</strong>
                  <span>Only approved events appear in student discovery.</span>
                </div>
                <Button variant="secondary" onClick={() => setModal("event")}>
                  <Plus size={16} /> Publish directly
                </Button>
              </div>
              <div className="event-grid grid gap-4">
                {loading ? (
                  <div className="empty-panel">Loading requests…</div>
                ) : (
                  headingEvents.map((event) => (
                    <EventCard
                      key={event._id}
                      event={event}
                      canManage
                      onStatus={changeStatus}
                      onDelete={deleteEvent}
                    />
                  ))
                )}
              </div>
              {!loading && !headingEvents.length && (
                <div className="empty-panel">
                  <CheckCircle2 size={27} />
                  <h3>All caught up</h3>
                  <p>There are no event submissions waiting for review.</p>
                </div>
              )}
            </>
          )}
          {active === "registrations" && (
            <>
              <div className="list-toolbar">
                <label className="search-field">
                  <Search size={17} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search participant or event..."
                  />
                </label>
                <Button variant="secondary" onClick={exportCsv}>
                  Export CSV ↗
                </Button>
              </div>
              <div className="table-wrap glass-panel">
                <table>
                  <thead>
                    <tr>
                      <th>Participant</th>
                      <th>Roll number</th>
                      <th>Department</th>
                      <th>Phone</th>
                      <th>Event</th>
                      <th>Event date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations
                      .filter((r) =>
                        `${r.name} ${r.rollNo} ${r.department} ${r.event?.title}`
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                      )
                      .map((r) => (
                        <tr key={r._id}>
                          <td>
                            <strong>{r.name}</strong>
                            <span className="table-email">{r.user?.email}</span>
                          </td>
                          <td>{r.rollNo}</td>
                          <td>{r.department}</td>
                          <td>{r.phone}</td>
                          <td>{r.event?.title || "Deleted event"}</td>
                          <td>
                            {r.event?.date
                              ? new Date(r.event.date).toLocaleDateString(
                                  "en-IN",
                                )
                              : "—"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {!registrations.length && (
                  <div className="empty-panel">
                    No registrations have been submitted yet.
                  </div>
                )}
              </div>
            </>
          )}
          {active === "assistant" && (
            <div className="assistant-page-layout">
              <div className="assistant-intro">
                <div className="assistant-large-icon">
                  <Sparkles size={25} />
                </div>
                <h2>A little help goes a long way.</h2>
                <p>
                  Ask questions about the portal, upcoming events, registration
                  steps, or how to plan a campus event.
                </p>
                <div className="assistant-tip">
                  <Sparkles size={16} />
                  <span>
                    Campus AI uses the event portal data as context. Don’t share
                    passwords or private information.
                  </span>
                </div>
              </div>
              <AIAssistant />
            </div>
          )}
        </div>
      </main>
      {modal === "event" && (
        <Modal
          title={
            user.role === "admin"
              ? "Publish a campus event"
              : "Submit a new event"
          }
          subtitle={
            user.role === "admin"
              ? "This event will be published immediately."
              : "Your submission will be reviewed by an administrator."
          }
          onClose={() => setModal("")}
          wide
        >
          <EventForm
            onSubmit={createEvent}
            onClose={() => setModal("")}
            loading={saving}
            admin={user.role === "admin"}
          />
        </Modal>
      )}
      {modal === "register" && selectedEvent && (
        <Modal
          title="Reserve your spot"
          subtitle={`Complete your details for ${selectedEvent.title}.`}
          onClose={() => setModal("")}
        >
          <form className="form-stack grid gap-4" onSubmit={submitRegistration}>
            <label className="field">
              Student name
              <input
                name="name"
                defaultValue={user.name}
                required
                minLength="2"
                maxLength="80"
              />
            </label>
            <label className="field">
              University roll number
              <input
                name="rollNo"
                placeholder="H220001"
                pattern="H\d{6}"
                title="Use H followed by six digits, for example H220001"
                required
              />
            </label>
            <label className="field">
              Phone number
              <input
                name="phone"
                type="tel"
                pattern="[0-9]{10}"
                title="Enter a 10 digit phone number"
                placeholder="10-digit mobile number"
                required
              />
            </label>
            <label className="field">
              Department
              <select name="department" required defaultValue="">
                <option value="" disabled>
                  Select department
                </option>
                {(selectedEvent.departments || []).map((dept) => (
                  <option key={dept}>{dept}</option>
                ))}
              </select>
            </label>
            <div className="form-actions">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setModal("")}
              >
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Confirm registration
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
