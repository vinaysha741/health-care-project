// ---------- Settings ----------
const SEATS_PER_SLOT = 5;          // how many people can book one time slot
const STAFF_PIN = "1234";          // demo only! a real site needs a server login
const STORAGE_KEY = "sehatCareRegistrations";

const SLOTS = [
  "9:00 AM – 10:00 AM", "10:00 AM – 11:00 AM", "11:00 AM – 12:00 PM",
  "12:00 PM – 1:00 PM", "2:00 PM – 3:00 PM", "3:00 PM – 4:00 PM"
];

// ---------- Page elements ----------
const form = document.getElementById("registrationForm");
const confirmation = document.getElementById("confirmation");
const confirmationDetails = document.getElementById("confirmationDetails");
const formMessage = document.getElementById("formMessage");
const timeSlot = document.getElementById("timeSlot");
const slotInfo = document.getElementById("slotInfo");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

// ---------- Helper functions ----------
function getRegistrations() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveRegistrations(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function makeId() {
  const time = Date.now().toString(36).toUpperCase().slice(-5);
  const number = Math.floor(100 + Math.random() * 900);
  return "SC-" + time + "-" + number;
}

// stops user text from being treated as HTML
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showError(message) {
  formMessage.textContent = message;
  formMessage.className = "form-message error";
  formMessage.scrollIntoView({ behavior: "smooth", block: "center" });
}

// hide most of a name: "Ravi Kumar" -> "R*** K***"
function maskName(name) {
  return name.split(" ").map(w => w[0] + "***").join(" ");
}

// hide a phone number: keep only the last 3 digits
function maskPhone(phone) {
  return "*******" + phone.slice(-3);
}

// ---------- Menu ----------
menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => navLinks.classList.remove("open"));
});

// ---------- Appointment slots ----------
// Count how many people booked a slot, then show the seats left.
function seatsLeft(slot) {
  const booked = getRegistrations().filter(r => r.timeSlot === slot).length;
  return SEATS_PER_SLOT - booked;
}

function fillSlots() {
  const chosen = timeSlot.value;
  timeSlot.innerHTML = '<option value="">Select time</option>';
  SLOTS.forEach(slot => {
    const left = seatsLeft(slot);
    const option = document.createElement("option");
    option.value = slot;
    option.textContent = left > 0 ? slot + " (" + left + " seats left)" : slot + " (FULL)";
    option.disabled = left <= 0;
    timeSlot.appendChild(option);
  });
  timeSlot.value = chosen;
}

timeSlot.addEventListener("change", () => {
  if (!timeSlot.value) { slotInfo.textContent = "Each time slot has limited seats."; return; }
  slotInfo.textContent = "Only " + seatsLeft(timeSlot.value) + " seat(s) left in this slot.";
});

// ---------- Registration form ----------
form.addEventListener("submit", (e) => {
  e.preventDefault();
  formMessage.className = "form-message";

  if (!form.checkValidity()) {
    showError("Please complete all required fields correctly.");
    form.reportValidity();
    return;
  }

  const phone = document.getElementById("phone").value.trim();
  if (!/^[+0-9 ()-]{7,20}$/.test(phone)) {
    showError("Please enter a valid phone number.");
    return;
  }

  // check again, somebody may have taken the last seat
  if (seatsLeft(timeSlot.value) <= 0) {
    showError("Sorry, this time slot is full. Please choose another one.");
    fillSlots();
    return;
  }

  const wantReminder = document.getElementById("wantReminder").checked;

  const person = {
    id: makeId(),
    fullName: document.getElementById("fullName").value.trim(),
    age: document.getElementById("age").value,
    gender: document.getElementById("gender").value,
    phone: phone,
    email: document.getElementById("email").value.trim(),
    address: document.getElementById("address").value.trim(),
    date: document.getElementById("date").selectedOptions[0].text,
    timeSlot: timeSlot.value,
    concern: document.getElementById("concern").value.trim(),
    conditions: document.getElementById("conditions").value.trim(),
    emergencyName: document.getElementById("emergencyName").value.trim(),
    emergencyPhone: document.getElementById("emergencyPhone").value.trim(),
    wantReminder: wantReminder,
    reminderType: document.getElementById("reminderType").value,
    reminderWhen: document.getElementById("reminderWhen").value,
    reminderSent: false,
    attendance: "Pending",          // Pending / Present / Absent
    createdAt: new Date().toISOString()
  };

  const list = getRegistrations();
  list.push(person);
  saveRegistrations(list);

  let reminderText = "No reminder";
  if (wantReminder) reminderText = person.reminderType + ", " + person.reminderWhen;

  confirmationDetails.innerHTML =
    '<div class="detail"><span>Registration ID</span><strong>' + escapeHTML(person.id) + '</strong></div>' +
    '<div class="detail"><span>Name</span><strong>' + escapeHTML(person.fullName) + '</strong></div>' +
    '<div class="detail"><span>Date</span><strong>' + escapeHTML(person.date) + '</strong></div>' +
    '<div class="detail"><span>Time</span><strong>' + escapeHTML(person.timeSlot) + '</strong></div>' +
    '<div class="detail"><span>Reminder</span><strong>' + escapeHTML(reminderText) + '</strong></div>' +
    '<div class="detail"><span>Location</span><strong>Community Health Center</strong></div>';

  form.classList.add("hidden");
  confirmation.classList.remove("hidden");
  confirmation.scrollIntoView({ behavior: "smooth" });
  fillSlots();
  showStaffTable();
});

document.getElementById("printBtn").addEventListener("click", () => window.print());

document.getElementById("newRegistrationBtn").addEventListener("click", () => {
  form.reset();
  slotInfo.textContent = "Each time slot has limited seats.";
  confirmation.classList.add("hidden");
  form.classList.remove("hidden");
  document.getElementById("register").scrollIntoView({ behavior: "smooth" });
});

// ---------- Staff panel ----------
const lockBox = document.getElementById("lockBox");
const staffBox = document.getElementById("staffBox");
const hideDetails = document.getElementById("hideDetails");
const regTable = document.getElementById("regTable");

document.getElementById("unlockBtn").addEventListener("click", () => {
  if (document.getElementById("pinInput").value === STAFF_PIN) {
    lockBox.classList.add("hidden");
    staffBox.classList.remove("hidden");
    document.getElementById("pinMessage").textContent = "";
    showStaffTable();
  } else {
    document.getElementById("pinMessage").textContent = "Wrong PIN. Try again.";
  }
});

document.getElementById("lockBtn").addEventListener("click", () => {
  staffBox.classList.add("hidden");
  lockBox.classList.remove("hidden");
  document.getElementById("pinInput").value = "";
});

hideDetails.addEventListener("change", showStaffTable);

// Draw the table of registrations
function showStaffTable() {
  const list = getRegistrations();
  const hide = hideDetails.checked;
  let present = 0, absent = 0;
  regTable.innerHTML = "";

  list.forEach((p, index) => {
    if (p.attendance === "Present") present++;
    if (p.attendance === "Absent") absent++;

    const name = hide ? maskName(p.fullName) : p.fullName;
    const phone = hide ? maskPhone(p.phone) : p.phone;
    const reminder = !p.wantReminder ? "Not wanted" : (p.reminderSent ? "Sent" : "Waiting");

    const row = document.createElement("tr");
    row.innerHTML =
      "<td>" + escapeHTML(p.id) + "</td>" +
      "<td>" + escapeHTML(name) + "</td>" +
      "<td>" + escapeHTML(phone) + "</td>" +
      "<td>" + escapeHTML(p.timeSlot) + "</td>" +
      '<td><span class="tag">' + reminder + "</span></td>" +
      "<td><select data-index=\"" + index + "\">" +
        ["Pending", "Present", "Absent"].map(o =>
          "<option" + (o === p.attendance ? " selected" : "") + ">" + o + "</option>").join("") +
      "</select></td>";
    regTable.appendChild(row);
  });

  document.getElementById("summary").textContent =
    "Total: " + list.length + " | Present: " + present + " | Absent: " + absent +
    " | Pending: " + (list.length - present - absent);
}

// Save attendance when staff changes the dropdown
regTable.addEventListener("change", (e) => {
  const list = getRegistrations();
  list[e.target.dataset.index].attendance = e.target.value;
  saveRegistrations(list);
  showStaffTable();
});

// Reminders (demo): we only mark them as sent. A real site needs an SMS/email service.
document.getElementById("remindBtn").addEventListener("click", () => {
  const list = getRegistrations();
  let count = 0;
  list.forEach(p => {
    if (p.wantReminder && !p.reminderSent) { p.reminderSent = true; count++; }
  });
  saveRegistrations(list);
  showStaffTable();
  alert("Demo: " + count + " reminder(s) marked as sent. No real message was sent.");
});

// CSV report. Health details are never included. Names/phones follow the hide checkbox.
document.getElementById("csvBtn").addEventListener("click", () => {
  const hide = hideDetails.checked;
  let csv = "ID,Name,Phone,Date,Time slot,Attendance\n";
  getRegistrations().forEach(p => {
    const name = hide ? maskName(p.fullName) : p.fullName;
    const phone = hide ? maskPhone(p.phone) : p.phone;
    csv += [p.id, name, phone, p.date, p.timeSlot, p.attendance]
      .map(v => '"' + String(v).replace(/"/g, '""') + '"').join(",") + "\n";
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = "camp-report.csv";
  link.click();
});

document.getElementById("deleteBtn").addEventListener("click", () => {
  if (confirm("Delete ALL registrations from this browser?")) {
    localStorage.removeItem(STORAGE_KEY);
    showStaffTable();
    fillSlots();
  }
});

// ---------- Start ----------
fillSlots();
