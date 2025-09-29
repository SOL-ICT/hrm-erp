"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar as IconCalendar,
  Clock,
  Mail,
  PhoneCall,
  Info,
  FileText,
  Box,
  Briefcase,
  Award,
  ChevronDown,
  MoreVertical,
  Plus,
  Download,
  Settings,
  X,
  Check,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function StaffDashboard() {
  // UI state
  const [clockModalOpen, setClockModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  // Leave form state
  const [leaveMode, setLeaveMode] = useState("single"); // single | multiple
  const [singleRange, setSingleRange] = useState("");
  const [multiStart, setMultiStart] = useState("");
  const [multiEnd, setMultiEnd] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  // Clock-in form state
  const [workFrom, setWorkFrom] = useState("Office");
  const [note, setNote] = useState("");

  // Simulated stats
  const stats = [
    { label: "Completed Projects", value: 51, icon: <FileText className="h-5 w-5" />, tone: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Total Attendance", value: 162, icon: <Box className="h-5 w-5" />, tone: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "Absent", value: 12, icon: <Briefcase className="h-5 w-5" />, tone: "text-slate-600", bg: "bg-slate-200" },
    { label: "Awards", value: 0, icon: <Award className="h-5 w-5" />, tone: "text-rose-600", bg: "bg-rose-100" },
  ];

  // Timer
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Chart data (Attendance + Salary)
  const chartData = useMemo(() => {
    const labels = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return {
      labels,
      datasets: [
        {
          type: "bar",
          label: "Attendance",
          data: [20, 18, 22, 19, 21, 23, 20, 22, 20, 21, 19, 20],
          borderWidth: 1,
        },
        {
          type: "bar",
          label: "Salary (₦k)",
          data: [300, 300, 320, 320, 330, 330, 340, 340, 340, 350, 350, 360],
          borderWidth: 1,
        },
      ],
    };
  }, []);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
        tooltip: { enabled: true },
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true },
      },
    }),
    []
  );

  // Simple calendar (current month grid)
  const CalendarWidget = () => {
    const [current, setCurrent] = useState(new Date());
    const start = new Date(current.getFullYear(), current.getMonth(), 1);
    const end = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    const startDay = start.getDay();
    const daysInMonth = end.getDate();

    const prevMonth = () => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1));
    const nextMonth = () => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1));

    const cells = Array(startDay)
      .fill(null)
      .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="px-2 py-1 rounded hover:bg-slate-100">‹</button>
          <div className="font-semibold">
            {current.toLocaleString(undefined, { month: "long" })} {current.getFullYear()}
          </div>
          <button onClick={nextMonth} className="px-2 py-1 rounded hover:bg-slate-100">›</button>
        </div>
        <div className="grid grid-cols-7 text-center text-xs text-slate-500 mb-2">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => (
            <div
              key={i}
              className={`aspect-square rounded flex items-center justify-center text-sm ${
                d === null ? "bg-transparent" : "bg-slate-50 hover:bg-slate-100"
              } ${d === new Date().getDate() && current.getMonth() === new Date().getMonth() && current.getFullYear() === new Date().getFullYear() ? "ring-2 ring-indigo-500 font-semibold" : ""}`}
            >
              {d ?? ""}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const formatTime = (d) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const selectedDays = useMemo(() => {
    if (leaveMode === "single") return singleRange ? 1 : 0; // simple placeholder
    if (multiStart && multiEnd) {
      const s = new Date(multiStart);
      const e = new Date(multiEnd);
      const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return diff > 0 ? diff : 0;
    }
    return 0;
  }, [leaveMode, singleRange, multiStart, multiEnd]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Employee <span className="text-slate-500 font-normal">Dashboard</span></h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setLeaveModalOpen(true)} className="btn-primary">Apply Leaves</button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="px-2 py-2 bg-white border rounded-lg flex items-center gap-2">
                <IconCalendar className="h-4 w-4" />
                <input type="date" className="outline-none text-sm" />
              </div>
              <div className="px-2 py-2 bg-white border rounded-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <input type="time" className="outline-none text-sm" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setClockModalOpen(true)} className="btn-primary">Clock In</button>
              <IconButton title="E-mail"><Mail className="h-4 w-4" /></IconButton>
              <IconButton title="Contact"><PhoneCall className="h-4 w-4" /></IconButton>
              <IconButton title="Info" variant="primary"><Info className="h-4 w-4" /></IconButton>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm text-slate-600">{s.label}</h5>
                <div className={`text-2xl font-semibold mt-1 ${s.tone}`}>{s.value}</div>
              </div>
              <div className={`rounded-full p-3 ${s.bg}`}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts + Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-6">
        <div className="xl:col-span-2 bg-white border rounded-2xl">
          <div className="flex items-center justify-between p-4 border-b">
            <h4 className="font-semibold">Salary And Attendance chart</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-2 px-2 py-1 border rounded-lg text-sm"><span className="h-2 w-2 rounded-full bg-slate-300"></span>Attendance</span>
              <span className="inline-flex items-center gap-2 px-2 py-1 border rounded-lg text-sm"><span className="h-2 w-2 rounded-full bg-indigo-500"></span>Salary</span>
              <div className="relative">
                <button className="inline-flex items-center gap-1 px-3 py-1 border rounded-lg text-sm">
                  Year <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="h-[380px] p-4">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white border rounded-2xl">
          <div className="p-4 border-b">
            <h4 className="font-semibold">Recent Activity</h4>
          </div>
          <div className="p-2">
            <table className="w-full text-sm">
              <tbody>
                {[
                  {
                    color: "bg-pink-500",
                    title: "You were late today",
                    sub: "Your office in-time is 9:42",
                    meta: "Late time 14min",
                    when: "Just now",
                  },
                  {
                    color: "bg-amber-500",
                    title: "Below for those interested",
                    sub: "Undoubtable source",
                    meta: "",
                    when: "1 hour ago",
                  },
                  {
                    color: "bg-blue-500",
                    title: "Success! your Lunch Time",
                    sub: "Lunch time 1:30 To 2:30",
                    meta: "",
                    when: "4 hours ago",
                  },
                  {
                    color: "bg-emerald-500",
                    title: "Many desktops Publishing The",
                    sub: "versions are evolved",
                    meta: "Page editors now use...",
                    when: "5 hours ago",
                  },
                  {
                    color: "bg-rose-500",
                    title: "Below for those interested",
                    sub: "Birthday on Feb 16",
                    meta: "",
                    when: "11 Jan 2020",
                  },
                ].map((item, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-3">
                      <div className="flex gap-3">
                        <span className={`h-5 w-5 rounded-full ${item.color} mt-1`}></span>
                        <div>
                          <div className="font-medium">{item.title}</div>
                          {item.sub && <div className="text-slate-500 text-xs">{item.sub}</div>}
                          {item.meta && <div className="text-slate-500 text-xs">{item.meta}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right text-slate-500 whitespace-nowrap align-top">{item.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Calendar + Holidays + Leave Balance */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-6">
        <div className="bg-white border rounded-2xl">
          <div className="p-4 border-b">
            <h4 className="font-semibold">Calendar</h4>
          </div>
          <CalendarWidget />
        </div>

        <div className="bg-white border rounded-2xl">
          <div className="p-4 border-b">
            <h4 className="font-semibold">Upcoming Holidays</h4>
          </div>
          <div className="p-4 space-y-5">
            {[
              { d: 3, m: "FEB", title: "Office Off", sub: "Sunday", left: "3 days left", tone: "bg-emerald-100 text-emerald-700" },
              { d: 10, m: "FEB", title: "Public Holiday", sub: "Enjoy your day off", left: "13 days left", tone: "bg-purple-100 text-purple-700" },
              { d: 20, m: "MAR", title: "Office Off", sub: "Sunday", left: "23 days left", tone: "bg-orange-100 text-orange-700" },
              { d: 17, m: "FEB", title: "Optional Holiday", sub: "Sunday", left: "20 days left", tone: "bg-amber-100 text-amber-700" },
              { d: 13, m: "MAR", title: "Conference", sub: "Money Update", left: "35 days left", tone: "bg-pink-100 text-pink-700" },
            ].map((h, i) => (
              <div className="flex items-center gap-3" key={i}>
                <div className={`px-3 py-2 rounded-lg text-center ${h.tone}`}>
                  <div className="text-lg leading-5 font-semibold">{h.d}</div>
                  <div className="text-[10px] tracking-wide">{h.m}</div>
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{h.title}</div>
                  <div className="text-xs text-slate-500">{h.sub}</div>
                </div>
                <div className="text-xs text-slate-500 whitespace-nowrap">{h.left}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-2xl">
          <div className="p-4 border-b flex items-center justify-between">
            <h4 className="font-semibold">Leave Balance</h4>
            <button onClick={() => setLeaveModalOpen(true)} className="btn-primary">Apply For Leave</button>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2">Balance</th>
                    <th className="py-2">Used</th>
                    <th className="py-2 text-center">Available</th>
                    <th className="py-2 text-center">Allowance</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Vacation", used: 16.5, avail: 3.5, allow: 20, dot: "bg-indigo-500" },
                    { name: "Sick Leave", used: 4.5, avail: 16, allow: 20, dot: "bg-orange-500" },
                    { name: "Unpaid leave", used: 5, avail: 360, allow: 365, dot: "bg-amber-500" },
                    { name: "Work from Home", used: 8, avail: 22, allow: 30, dot: "bg-sky-500" },
                  ].map((r) => (
                    <tr key={r.name} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <span className={`h-3 w-3 rounded-full ${r.dot}`}></span>
                          <span className="font-medium">{r.name}</span>
                        </div>
                      </td>
                      <td className="py-3 font-medium">{r.used}</td>
                      <td className="py-3 text-center text-slate-500">{r.avail}</td>
                      <td className="py-3 text-center text-slate-500">{r.allow}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-3 divide-x mt-6">
              {[
                { name: "Vacation", used: 8, total: 16, tone: "text-indigo-600" },
                { name: "Sick leave", used: 4.5, total: 10, tone: "text-rose-600" },
                { name: "Unpaid leave", used: 5, total: 365, tone: "text-slate-700" },
              ].map((x) => (
                <div key={x.name} className="text-center py-5">
                  <h5 className="font-medium mb-1">{x.name}</h5>
                  <div className={`text-xl font-semibold ${x.tone}`}>
                    {x.used} <span className="text-slate-400">/</span> {x.total}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Jobs + Birthdays */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-6">
        <div className="xl:col-span-2 bg-white border rounded-2xl">
          <div className="p-4 border-b flex items-center justify-between">
            <h4 className="font-semibold">Recent Job Application</h4>
            <div className="relative">
              <button className="p-2 rounded hover:bg-slate-100" aria-label="more"><MoreVertical className="h-5 w-5" /></button>
              {/* dropdown placeholder */}
            </div>
          </div>
          <div className="p-4">
            <div className="mb-3">
              <button className="btn-primary inline-flex items-center gap-2"><Plus className="h-4 w-4" /> New Task</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2">S.no</th>
                    <th className="py-2">Project Title</th>
                    <th className="py-2">Assigned to</th>
                    <th className="py-2">Due Date</th>
                    <th className="py-2">Request Status</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      id: 1,
                      title: "Html Business Template",
                      img: "/assets/images/photos/html.png",
                      avatars: [12, 3, 2, 5],
                      due: "19 Feb 2020",
                      status: { text: "Completed", variant: "success" },
                      checked: true,
                    },
                    {
                      id: 2,
                      title: "Adobe xd Education Template",
                      img: "/assets/images/photos/xd.png",
                      avatars: [4, 2, 12, 15],
                      due: "24 Feb 2020",
                      status: { text: "Accept", variant: "primary" },
                    },
                    {
                      id: 3,
                      title: "js recent Plugin Updated",
                      img: "/assets/images/photos/js.png",
                      avatars: [7, 8, 9, 10],
                      due: "5 Mar 2020",
                      status: { text: "Accept", variant: "primary" },
                    },
                    {
                      id: 4,
                      title: "Sass Development Program",
                      img: "/assets/images/photos/sass.png",
                      avatars: [5, 6, 1, 12],
                      due: "14 Mar 2020",
                      status: { text: "Completed", variant: "outline-success" },
                      checked: true,
                    },
                    {
                      id: 5,
                      title: "Angular Development",
                      img: "/assets/images/photos/angular.png",
                      avatars: [6, 11, 14, 1],
                      due: "20 Mar 2020",
                      status: { text: "Accept", variant: "primary" },
                    },
                  ].map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-3">{row.id}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-orange-50 overflow-hidden border">
                            <img src={row.img} alt="img" className="h-full w-full object-cover" />
                          </div>
                          <div className="font-medium">{row.title}</div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex -space-x-2">
                          {row.avatars.map((a) => (
                            <img key={a} className="h-8 w-8 rounded-full border-2 border-white" src={`/assets/images/users/${a}.jpg`} alt="avatar" />
                          ))}
                        </div>
                      </td>
                      <td className="py-3">{row.due}</td>
                      <td className="py-3">
                        <span className={`inline-flex px-2 py-1 rounded-md text-xs border ${
                          row.status.variant === "success"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : row.status.variant === "outline-success"
                            ? "text-emerald-700 border-emerald-300"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200"
                        }`}>{row.status.text}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <button className="p-1 rounded hover:bg-slate-100" title="Email"><Mail className="h-4 w-4 text-indigo-600" /></button>
                          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" className="h-4 w-4 rounded" defaultChecked={row.checked} />
                            <span className="sr-only">Mark</span>
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-2xl">
          <div className="p-4 border-b flex items-center justify-between">
            <h4 className="font-semibold">Upcoming Birthdays</h4>
            <button className="btn-outline">View All</button>
          </div>
          <div className="p-3">
            <table className="w-full text-sm">
              <tbody>
                {[
                  { id: 4, name: "Jennifer Kerr", when: "Today", date: "19 Feb 2020 26 Years Old", today: true },
                  { id: 6, name: "Rebecca Cameron", when: "22 Days To Left", date: "19 Feb 2020 26 Years Old" },
                  { id: 2, name: "Jessica Johnston", when: "22 Days To Left", date: "19 Feb 2020 26 Years Old" },
                  { id: 7, name: "Lily Ball", when: "22 Days To Left", date: "19 Feb 2020 26 Years Old" },
                  { id: 12, name: "Yadira Acklin", when: "22 Days To Left", date: "19 Feb 2020 26 Years Old" },
                ].map((b) => (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <img className="h-10 w-10 rounded-lg" src={`/assets/images/users/${b.id}.jpg`} alt="media" />
                        <div>
                          <div className="font-medium">{b.name}</div>
                          <div className="text-xs text-slate-500">{b.date}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      {b.today ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-emerald-600 text-sm font-medium">Today</span>
                          <button className="btn-outline inline-flex items-center gap-2"><i className="fa fa-birthday-cake"></i> Wish Now</button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">{b.when}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Clock-In Modal */}
      <Modal open={clockModalOpen} onClose={() => setClockModalOpen(false)} title={<div className="inline-flex items-center gap-2"><Clock className="h-5 w-5" /> Clock In</div>}>
        <div className="space-y-4">
          <div>
            <div className="text-3xl font-bold tracking-wider">{formatTime(now)}</div>
            <div className="text-xs text-slate-500 mt-1">Current Time</div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">IP Address</label>
            <input className="input" value="225.192.145.1" disabled />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Working From</label>
            <select className="input" value={workFrom} onChange={(e) => setWorkFrom(e.target.value)}>
              <option>Office</option>
              <option>Home</option>
              <option>Others</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Note</label>
            <textarea className="input min-h-[90px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Some text here..."></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-outline" onClick={() => setClockModalOpen(false)}>Close</button>
            <button className="btn-primary" onClick={() => setClockModalOpen(false)}>Clock In</button>
          </div>
        </div>
      </Modal>

      {/* Apply Leaves Modal */}
      <Modal open={leaveModalOpen} onClose={() => setLeaveModalOpen(false)} title="Apply Leaves">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Leaves Dates</label>
            <select className="input" value={leaveMode} onChange={(e) => setLeaveMode(e.target.value)}>
              <option value="single">Single Leave</option>
              <option value="multiple">Multiple Leaves</option>
            </select>
          </div>

          {leaveMode === "single" ? (
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" className="input" value={singleRange} onChange={(e) => setSingleRange(e.target.value)} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input type="date" className="input" value={multiStart} onChange={(e) => setMultiStart(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input type="date" className="input" value={multiEnd} onChange={(e) => setMultiEnd(e.target.value)} />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Leave Type</label>
            <select className="input" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
              <option value="">Select</option>
              <option>Half Day Leave</option>
              <option>Casual Leaves</option>
              <option>Sick Leaves</option>
              <option>Maternity Leaves</option>
              <option>Paternity Leaves</option>
              <option>Annual Leaves</option>
              <option>Unpaid Leaves</option>
              <option>Other Leaves</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <textarea className="input min-h-[120px]" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="Some text here..."></textarea>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm">
              <span className="font-medium">Selected Days:</span>
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-rose-100 text-rose-700">{selectedDays}</span>
            </div>
            <div className="flex gap-2">
              <button className="btn-outline" onClick={() => setLeaveModalOpen(false)}>Close</button>
              <button className="btn-primary" onClick={() => setLeaveModalOpen(false)}>Submit</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ----------------------------- UI Primitives ----------------------------- */
function IconButton({ children, title, variant = "ghost" }) {
  return (
    <button
      title={title}
      className={`inline-flex items-center justify-center h-10 w-10 rounded-xl border ${
        variant === "primary" ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700" : "bg-white hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-[90vw] max-w-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">{title}</div>
          <button onClick={onClose} className="p-2 rounded hover:bg-slate-100" aria-label="close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ----------------------------- Tailwind Helpers ----------------------------- */
// Add these to your global CSS if you want, but included as classes for convenience
// Buttons & Inputs
const styles = `
.btn-primary{ @apply inline-flex items-center justify-center px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-600; }
.btn-outline{ @apply inline-flex items-center justify-center px-3 py-2 rounded-xl border bg-white hover:bg-slate-100; }
.input{ @apply w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500; }
`;

// Inject helper classes once (Next.js client only)
if (typeof document !== "undefined" && !document.getElementById("dashboard-inline-styles")) {
  const style = document.createElement("style");
  style.id = "dashboard-inline-styles";
  style.innerHTML = styles.replace(/@apply/g, ""); // fallback if @apply isn't available
  document.head.appendChild(style);
}
