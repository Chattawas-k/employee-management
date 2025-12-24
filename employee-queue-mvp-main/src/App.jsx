import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  ListOrdered, 
  FileText, 
  Users, 
  Calendar, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Download,
  Phone,
  User,
  Trash2,
  Edit2,
  Lock,
  Eye,
  EyeOff,
  Key,
  RefreshCw,
  UserPlus,
  ArrowRightCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ClipboardList,
  Play,
  CheckSquare,
  ShoppingBag,
  Smile,
  Frown,
  Meh,
  Info,
  Settings,
  ArrowUp,
  ArrowDown,
  Timer,
  Tags,
  ChevronUp,
  Power,
  PowerOff,
  AlertTriangle,
  Save,
  CalendarDays,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  UserCheck,
  UserX,
  UserMinus,
  ArrowLeft,
  BellRing,
  Armchair,
  Lamp,
  Bed,
  Sofa
} from 'lucide-react';

// --- UTILS ---

const formatDateThai = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear() + 543;
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  if (hours === '00' && minutes === '00') { return `${day} ${month} ${year}`; }
  return `${day} ${month} ${year} ( ${hours}.${minutes} น. )`;
};

const formatDateThaiFull = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear() + 543;
  return `${day} ${month} ${year}`;
};

const getDurationText = (startDate, endDate = new Date()) => {
  if (!startDate) return "-";
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return "0 นาที";
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (hours > 0) { return `${hours} ชม. ${mins} นาที`; }
  return `${mins} นาที`;
};

// --- MOCK DATA ---

const INITIAL_EMPLOYEES = [
  { id: 1, name: "สมชาย ใจดี (Alice)", role: "พนักงานขาย", dept: "ห้องนั่งเล่น", status: "Active", activeJobs: 1, queuePos: 1, phone: "081-111-1111", username: "alice.j", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" },
  { id: 2, name: "สมศักดิ์ รักงาน (Bob)", role: "พนักงานขาย", dept: "ห้องนอน", status: "Active", activeJobs: 0, queuePos: 2, phone: "082-222-2222", username: "bob.s", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop" },
  { id: 3, name: "วิชัย จัดการ (Charlie)", role: "ผู้จัดการสาขา", dept: "บริหาร", status: "Busy", activeJobs: 3, queuePos: 3, phone: "083-333-3333", username: "charlie.d", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop" },
  { id: 4, name: "ดาริน สวยงาม (Diana)", role: "ออกแบบ", dept: "ตกแต่งภายใน", status: "Inactive", activeJobs: 0, queuePos: 0, phone: "084-444-4444", username: "diana.p", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop" },
  { id: 5, name: "เอกชัย มุ่งมั่น (Ethan)", role: "พนักงานขาย", dept: "ห้องครัว", status: "Active", activeJobs: 0, queuePos: 4, phone: "085-555-5555", username: "ethan.h", avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150&h=150&fit=crop" },
];

const INITIAL_CATEGORIES = [
  { id: 1, name: "โซฟาและห้องนั่งเล่น (Living Room)", status: "Active" },
  { id: 2, name: "ชุดห้องนอน (Bedroom)", status: "Active" },
  { id: 3, name: "ชุดโต๊ะทานข้าว (Dining)", status: "Active" },
  { id: 4, name: "เฟอร์นิเจอร์สำนักงาน (Office)", status: "Active" },
  { id: 5, name: "ของตกแต่งบ้าน (Home Decor)", status: "Active" },
  { id: 6, name: "บริการออกแบบ (Design Service)", status: "Active" },
];

const INITIAL_JOBS = [
  { id: 101, title: "แนะนำชุดโซฟาหนังแท้", customer: "คุณวิภา", assignee: "สมชาย ใจดี (Alice)", status: "In Progress", date: "2023-10-25T09:30:00", priority: "High", description: "ลูกค้าสนใจโซฟา L-Shape หนังแท้ สีน้ำตาล สำหรับห้องรับแขกขนาดใหญ่", 
    statusLogs: [ { status: "Pending", timestamp: "2023-10-25T09:00:00" }, { status: "In Progress", timestamp: "2023-10-25T09:30:00" } ]
  },
  { id: 102, title: "ชุดห้องนอน King Size", customer: "คุณกรณ์", assignee: "สมศักดิ์ รักงาน (Bob)", status: "Pending", date: "2023-10-26T14:00:00", priority: "Normal", description: "สนใจเตียงนอนพร้อมที่นอน รุ่น SleepWell",
    statusLogs: [ { status: "Pending", timestamp: "2023-10-26T14:00:00" } ]
  },
];

// ... (Other initial data remains same) ...
const INITIAL_HOLIDAYS = [
  { id: 1, date: "2025-01-01", name: "วันขึ้นปีใหม่" },
  { id: 2, date: "2025-04-13", name: "วันสงกรานต์" },
];
const INITIAL_LEAVES = [];
const INITIAL_SCHEDULE = [];

// --- UI COMPONENTS ---
const Card = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
    {children}
  </div>
);

const Badge = ({ status }) => {
  const statusMap = {
    'Active': 'พร้อมรับงาน',
    'Available': 'ว่าง',
    'Done': 'ปิดการขาย',
    'Completed': 'เรียบร้อย',
    'In Progress': 'กำลังบริการ',
    'Busy': 'ติดลูกค้า',
    'Pending': 'รอลูกค้า',
    'Unassigned': 'ยังไม่ระบุ',
    'Rejected': 'ปฏิเสธ',
    'Inactive': 'พัก/ลางาน', 
    'Canceled': 'ยกเลิก',
  };
  const styles = {
    'Active': 'bg-emerald-100 text-emerald-700',
    'Available': 'bg-emerald-100 text-emerald-700',
    'Done': 'bg-blue-100 text-blue-700',
    'Completed': 'bg-blue-100 text-blue-700',
    'In Progress': 'bg-indigo-100 text-indigo-700',
    'Busy': 'bg-orange-100 text-orange-700',
    'Pending': 'bg-yellow-100 text-yellow-700',
    'Unassigned': 'bg-slate-100 text-slate-700',
    'Rejected': 'bg-red-100 text-red-700',
    'Inactive': 'bg-slate-200 text-slate-600',
    'Canceled': 'bg-red-100 text-red-700',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${styles[status] || 'bg-gray-100 text-gray-800'}`}>{statusMap[status] || status}</span>;
};

const PriorityBadge = ({ level }) => {
    const levelMap = { 'Critical': 'VIP', 'High': 'ด่วน', 'Normal': 'ทั่วไป' };
    const styles = { 'Critical': 'bg-purple-50 text-purple-600 border-purple-200', 'High': 'bg-orange-50 text-orange-600 border-orange-200', 'Normal': 'bg-blue-50 text-blue-600 border-blue-200' };
    return <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${styles[level] || 'bg-slate-50 text-slate-600'}`}>{levelMap[level] || level}</span>;
};

const Avatar = ({ src, alt, className = "", size = "md" }) => {
  const [imgError, setImgError] = useState(false);
  const sizeClass = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-16 h-16 text-lg", xl: "w-32 h-32 text-4xl" }[size] || "w-10 h-10 text-sm";
  if (src && !imgError) { return <img src={src} alt={alt} className={`object-cover rounded-full border border-slate-200 ${sizeClass} ${className}`} onError={() => setImgError(true)} />; }
  return <div className={`rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold border border-slate-300 ${sizeClass} ${className}`}>{alt?.charAt(0) || '?'}</div>;
};

const Button = ({ children, variant = 'primary', onClick, className = "", icon: Icon, disabled, title }) => {
  const baseStyle = "flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500",
    warning: "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500",
  };
  return <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} disabled={disabled} title={title}>{Icon && <Icon className="w-4 h-4 mr-2" />}{children}</button>;
};

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;
  const maxW = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${maxW} overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col`}>
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-semibold text-slate-800 line-clamp-1">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// --- UPDATED DASHBOARD ---
const Dashboard = ({ employees, jobs, onAssignJob, onRejectJob }) => {
    const [currentViewerId, setCurrentViewerId] = useState(1);
    const [assignmentModal, setAssignmentModal] = useState({ isOpen: false, employee: null, step: 'choice', reason: '', jobData: { title: 'Walk-in Customer', customer: 'ลูกค้าทั่วไป', description: 'ลูกค้าสนใจดูเฟอร์นิเจอร์', priority: 'Normal' } });
    
    const currentUser = employees.find((e) => e.id === Number(currentViewerId)) || employees[0];
    const myJobs = jobs.filter((j) => j.assignee === currentUser.name);
    const myActiveJobs = myJobs.filter((j) => j.status === 'In Progress');
    const myPendingJobs = myJobs.filter((j) => j.status === 'Pending');
    const myDoneJobs = myJobs.filter((j) => j.status === 'Done');

    // Queue Logic
    const activeEmployees = useMemo(() => employees.filter((e) => e.status !== 'Inactive').sort((a, b) => { 
        if (a.queuePos === 0) return 1; 
        if (b.queuePos === 0) return -1; 
        return a.queuePos - b.queuePos; 
    }), [employees]);
    
    const nextUp = activeEmployees[0];
    const isMyTurn = nextUp && currentUser && nextUp.id === currentUser.id;
    const myQueueIndex = activeEmployees.findIndex(e => e.id === currentUser.id);
    const queuesAhead = myQueueIndex > -1 ? myQueueIndex : 0; // 0 means my turn

    // Modal Handlers
    const openAssignModal = () => setAssignmentModal({ 
        isOpen: true, 
        employee: currentUser, 
        step: 'choice', 
        reason: '',
        jobData: { title: 'ลูกค้า Walk-in', customer: 'ลูกค้าหน้าร้าน', description: 'ลูกค้าสนใจดูสินค้าเฟอร์นิเจอร์', priority: 'Normal' } 
    });
    const closeAssignModal = () => setAssignmentModal((prev) => ({ ...prev, isOpen: false }));
    const handleJobDataChange = (field, value) => setAssignmentModal((prev) => ({ ...prev, jobData: { ...prev.jobData, [field]: value } }));
    const handleConfirmAccept = () => { 
        if (onAssignJob) onAssignJob(currentUser.id, assignmentModal.jobData); 
        closeAssignModal(); 
    };
    const handleRejectSubmit = () => { 
        if (!assignmentModal.reason.trim()) { alert("กรุณาระบุเหตุผลในการปฏิเสธงาน"); return; } 
        if (onRejectJob) onRejectJob(assignmentModal.employee.id, assignmentModal.reason); 
        closeAssignModal(); 
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* 1. TOP HEADER: QUEUE STATUS (The most important part) */}
        <div className="bg-white rounded-3xl p-1 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className={`rounded-[20px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 transition-colors duration-500 relative overflow-hidden ${
                isMyTurn 
                ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-900' 
                : 'bg-white text-slate-800'
            }`}>
                {/* Visual Background Elements */}
                {isMyTurn && (
                    <>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-100/50 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3"></div>
                    </>
                )}

                {/* Left Side: Status Text */}
                <div className="relative z-10 flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                        {isMyTurn ? (
                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-2 border border-emerald-200">
                                <BellRing className="w-3 h-3 animate-bounce" /> ถึงคิวคุณแล้ว (Your Turn)
                            </span>
                        ) : (
                            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-2 w-fit">
                                <Clock className="w-3 h-3" /> สถานะคิว (Queue Status)
                            </span>
                        )}
                    </div>
                    
                    {isMyTurn ? (
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black mb-2 leading-tight text-emerald-900">
                                เชิญรับลูกค้าได้เลย!
                            </h1>
                            <p className="text-emerald-700 text-lg opacity-90">
                                มีลูกค้ากำลังรอรับบริการเฟอร์นิเจอร์อยู่ที่หน้าร้าน
                            </p>
                        </div>
                    ) : (
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black mb-2 leading-tight text-slate-800">
                                รออีก <span className="text-indigo-600">{queuesAhead}</span> คิว
                            </h1>
                            <p className="text-slate-500 text-lg">
                                ขณะนี้คุณอยู่ในลำดับที่ <span className="font-bold text-slate-800">#{currentUser.queuePos}</span> ของการรับงาน
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Side: Action Button or Queue Visual */}
                <div className="relative z-10 shrink-0">
                    {isMyTurn ? (
                        <button 
                            onClick={openAssignModal}
                            className="group relative flex items-center justify-center gap-3 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-xl shadow-lg hover:shadow-2xl hover:bg-emerald-700 transition-all duration-300 active:scale-95 ring-4 ring-emerald-100"
                        >
                            <span className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center group-hover:bg-emerald-400 transition-colors">
                                <Armchair className="w-6 h-6 text-white" />
                            </span>
                            รับลูกค้า (Accept)
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="text-right mr-2 hidden md:block">
                                <p className="text-xs text-slate-400 font-bold uppercase">คิวปัจจุบัน</p>
                                <p className="font-bold text-slate-700 truncate max-w-[100px]">{nextUp?.name || '-'}</p>
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center relative">
                                <Avatar src={nextUp?.avatar} size="lg" className="rounded-xl w-full h-full" />
                                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold border-2 border-white">Now</div>
                            </div>
                            <div className="w-8 h-0.5 bg-slate-200 rounded-full"></div>
                            <div className="w-12 h-12 rounded-xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center opacity-60">
                                <span className="text-slate-400 font-bold text-sm">#{currentUser.queuePos}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* 2. MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT: Work Management (Pending & Active) */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* SECTION 1: งานที่ต้องทำ (Tasks To Do / Pending) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <ListOrdered className="w-5 h-5 text-amber-600" />
                            </div>
                            งานที่ต้องทำ (To Do / Pending)
                        </h2>
                        <span className="text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                            {myPendingJobs.length} งาน
                        </span>
                    </div>

                    {myPendingJobs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {myPendingJobs.map(job => (
                                <div key={job.id} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="p-2 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-100 transition-colors">
                                            <AlertCircle className="w-5 h-5" />
                                        </div>
                                        <PriorityBadge level={job.priority} />
                                    </div>
                                    
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-800 text-base mb-1 line-clamp-1">{job.title}</h4>
                                        <p className="text-sm text-slate-500 mb-3 flex items-center gap-1">
                                            <User className="w-3 h-3" /> {job.customer}
                                        </p>
                                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg line-clamp-2 border border-slate-100 h-10 mb-2">
                                            {job.description}
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 mt-2">
                                        <button className="w-full py-2 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                                            <Play className="w-4 h-4" /> เริ่มงาน
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-slate-50/50 rounded-xl p-6 text-center border border-slate-100">
                            <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4" /> ไม่มีงานค้างที่ต้องทำ
                            </p>
                        </div>
                    )}
                </div>

                {/* SECTION 2: งานที่กำลังดำเนินการ (In Progress) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Clock className="w-5 h-5 text-indigo-600 animate-pulse" />
                            </div>
                            งานที่กำลังดำเนินการ (In Progress)
                        </h2>
                        <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                            {myActiveJobs.length} งาน
                        </span>
                    </div>

                    {myActiveJobs.length > 0 ? (
                        myActiveJobs.map(job => (
                            <div key={job.id} className="bg-white rounded-2xl border-l-4 border-indigo-500 shadow-lg shadow-indigo-100/50 overflow-hidden ring-1 ring-slate-100 relative group transition-all hover:-translate-y-1">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                                                <ShoppingBag className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800">{job.title}</h3>
                                                <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-1">
                                                    <User className="w-4 h-4" /> ลูกค้า: <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{job.customer}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100 animate-pulse">
                                                <span className="w-2 h-2 rounded-full bg-blue-500"></span> กำลังบริการ
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1.5 flex items-center justify-end gap-1">
                                                <Timer className="w-3 h-3" /> {getDurationText(job.statusLogs.find(l => l.status === 'In Progress')?.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6 relative">
                                        <div className="absolute top-0 left-4 -translate-y-1/2 bg-white px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border border-slate-100 rounded">รายละเอียด</div>
                                        <p className="text-slate-700 text-sm leading-relaxed">
                                            {job.description}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Button variant="success" className="flex-1 py-3 font-bold text-sm shadow-sm" icon={CheckCircle}>ปิดการขาย (Close)</Button>
                                        <Button variant="secondary" className="flex-1 py-3 font-semibold text-sm" icon={FileText}>บันทึก (Note)</Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center flex flex-col items-center justify-center h-[200px] hover:border-indigo-200 transition-colors">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 shadow-sm">
                                <Armchair className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-base font-bold text-slate-600">ว่างจากงานขาย</h3>
                            <p className="text-slate-400 text-sm mt-1">ยังไม่มีลูกค้าที่กำลังให้บริการในขณะนี้</p>
                        </div>
                    )}
                </div>

            </div>

            {/* RIGHT: Stats & User Control */}
            <div className="space-y-6">
                {/* User Switcher (For Demo) */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">มุมมองพนักงาน (Demo View)</label>
                    <div className="relative">
                        <select 
                            className="appearance-none w-full bg-slate-50 border border-slate-200 text-slate-700 py-2 pl-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                            value={currentViewerId} 
                            onChange={(e) => setCurrentViewerId(Number(e.target.value))}
                        >
                            {employees.map((emp) => (
                                <option key={emp.id} value={emp.id}>{emp.name} ({emp.status})</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Today's Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center hover:border-indigo-100 transition-colors">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <span className="text-2xl font-bold text-slate-800">{myDoneJobs.length}</span>
                        <span className="text-xs text-slate-500">ปิดการขายวันนี้</span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center hover:border-orange-100 transition-colors">
                        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-2">
                            <Clock className="w-5 h-5" />
                        </div>
                        <span className="text-2xl font-bold text-slate-800">{myPendingJobs.length}</span>
                        <span className="text-xs text-slate-500">งานติดตามผล</span>
                    </div>
                </div>

                {/* Queue List Preview */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-700">ลำดับคิวถัดไป</span>
                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{activeEmployees.length} คน</span>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                        {activeEmployees.slice(0, 5).map((emp, index) => (
                            <div key={emp.id} className={`p-3 flex items-center gap-3 ${emp.id === currentUser.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    index === 0 ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
                                }`}>
                                    {index + 1}
                                </div>
                                <Avatar src={emp.avatar} alt={emp.name} size="sm" />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${emp.id === currentUser.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                                        {emp.name} {emp.id === currentUser.id && '(คุณ)'}
                                    </p>
                                    <p className="text-[10px] text-slate-400">{emp.dept}</p>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${emp.status === 'Active' ? 'bg-green-400' : 'bg-orange-400'}`}></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Modal for Job Assignment (Shared Logic) */}
        <Modal isOpen={assignmentModal.isOpen} onClose={closeAssignModal} title={`เปิดใบงานรับลูกค้า: ${assignmentModal.employee?.name}`}>
            {assignmentModal.step === 'choice' && (
            <div className="text-center space-y-6 py-6 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center">
                    <div className="relative mb-4">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                            <Armchair className="w-12 h-12 text-green-600" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-full border-4 border-white shadow-sm">
                            <UserCheck className="w-5 h-5" />
                        </div>
                    </div>
                    <h4 className="text-2xl font-bold text-slate-800">ลูกค้ารอรับบริการ?</h4>
                    <p className="text-slate-500 mt-2 max-w-xs mx-auto">คุณต้องการรับลูกค้าท่านนี้เพื่อแนะนำสินค้าเฟอร์นิเจอร์หรือไม่?</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                    <button onClick={() => setAssignmentModal((prev) => ({ ...prev, step: 'reject' }))} className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-2xl hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all group bg-white shadow-sm hover:shadow-md">
                        <span className="font-bold text-lg text-slate-600 group-hover:text-red-600 mb-1">ไม่สะดวก</span>
                        <span className="text-xs text-slate-400 font-medium">(ข้ามคิว)</span>
                    </button>
                    <button onClick={() => setAssignmentModal((prev) => ({ ...prev, step: 'details' }))} className="flex flex-col items-center justify-center p-6 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200 hover:-translate-y-1 transition-all group">
                        <span className="font-bold text-lg mb-1 flex items-center gap-2"><CheckCircle className="w-5 h-5"/> รับลูกค้า</span>
                        <span className="text-xs text-indigo-200 font-medium">(เปิดใบงาน)</span>
                    </button>
                </div>
            </div>
            )}

            {assignmentModal.step === 'details' && (
            <div className="space-y-5 animate-in slide-in-from-right duration-200">
                <div className="bg-indigo-50 p-4 rounded-xl flex items-start gap-3 border border-indigo-100">
                    <div className="p-2 bg-white rounded-full shrink-0 shadow-sm text-indigo-600">
                        <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-indigo-900 text-base">ข้อมูลความต้องการเบื้องต้น</h4>
                        <p className="text-xs text-indigo-700 mt-1">บันทึกสิ่งที่ลูกค้ามองหาเพื่อช่วยในการแนะนำสินค้า</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">สิ่งที่ลูกค้าสนใจ (Subject)</label>
                        <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none" placeholder="เช่น โซฟา, เตียงนอน, โต๊ะอาหาร..." value={assignmentModal.jobData.title} onChange={(e) => handleJobDataChange('title', e.target.value)} autoFocus />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">ชื่อลูกค้า (ถ้ามี)</label>
                        <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none" placeholder="ระบุชื่อลูกค้า..." value={assignmentModal.jobData.customer} onChange={(e) => handleJobDataChange('customer', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">รายละเอียดเพิ่มเติม</label>
                        <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none min-h-[100px]" placeholder="เช่น งบประมาณ, ขนาดห้อง, สไตล์ที่ชอบ..." value={assignmentModal.jobData.description} onChange={(e) => handleJobDataChange('description', e.target.value)} />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 border-t border-slate-100 pt-5">
                    <Button variant="secondary" onClick={() => setAssignmentModal((prev) => ({ ...prev, step: 'choice' }))}>ย้อนกลับ</Button>
                    <Button variant="primary" onClick={handleConfirmAccept} icon={CheckCircle} className="px-6 py-2.5 rounded-xl">เริ่มบริการลูกค้า</Button>
                </div>
            </div>
            )}

            {/* Reject Step Remains similar... */}
            {assignmentModal.step === 'reject' && (
            <div className="space-y-5 animate-in slide-in-from-left duration-200">
                <div className="bg-red-50 p-4 rounded-xl flex items-start gap-3 border border-red-100">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <div>
                        <h4 className="font-bold text-red-700 text-base">ระบุเหตุผลที่ข้ามคิว</h4>
                        <p className="text-xs text-red-600 mt-1">ระบบจะบันทึกสถานะและเลื่อนคิวของคุณไปลำดับสุดท้าย</p>
                    </div>
                </div>
                <div>
                    <textarea className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all min-h-[120px]" placeholder="เช่น ติดลูกค้าเก่า, พักเบรค, เข้าห้องน้ำ..." value={assignmentModal.reason} onChange={(e) => setAssignmentModal((prev) => ({ ...prev, reason: e.target.value }))} autoFocus></textarea>
                </div>
                <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
                    <Button variant="secondary" onClick={() => setAssignmentModal((prev) => ({ ...prev, step: 'choice' }))}>ย้อนกลับ</Button>
                    <Button variant="danger" onClick={handleRejectSubmit} className="px-6">ยืนยัน</Button>
                </div>
            </div>
            )}
        </Modal>
      </div>
    );
};
  
const MyWorklist = ({ employees, jobs, onUpdateStatus, categories }) => {
    const [currentViewerId, setCurrentViewerId] = useState(1);
    const [actionModal, setActionModal] = useState({ isOpen: false, job: null, step: 'choice', reason: '' });
    const [finishModal, setFinishModal] = useState({ isOpen: false, job: null, report: { customerName: '', customerContact: '', salesStatus: 'success', reasons: [], productCategory: '', description: '' } });
    const [viewJobModal, setViewJobModal] = useState(null);
    const [, setTick] = useState(0);
    useEffect(() => { const timer = setInterval(() => setTick(t => t + 1), 60000); return () => clearInterval(timer); }, []);
    const currentUser = employees.find((e) => e.id === Number(currentViewerId)) || employees[0];
    const myJobs = useMemo(() => jobs.filter((job) => job.assignee === currentUser.name), [jobs, currentUser]);
    const todoJobs = myJobs.filter((j) => j.status === 'Pending');
    const inProgressJobs = myJobs.filter((j) => j.status === 'In Progress');
    const doneJobs = myJobs.filter((j) => ['Done', 'Rejected'].includes(j.status));
    const handleStartClick = (e, job) => { e.stopPropagation(); setActionModal({ isOpen: true, job: job, step: 'choice', reason: '' }); };
    const handleConfirmStart = () => { onUpdateStatus(actionModal.job.id, 'In Progress'); setActionModal({ ...actionModal, isOpen: false }); };
    const handleConfirmReject = () => { if (!actionModal.reason.trim()) { alert("กรุณาระบุเหตุผล"); return; } onUpdateStatus(actionModal.job.id, 'Rejected', actionModal.reason); setActionModal({ ...actionModal, isOpen: false }); };
    const defaultCategory = categories.length > 0 ? categories[0].name : '';
    const handleFinishClick = (e, job) => { e.stopPropagation(); setFinishModal({ isOpen: true, job: job, report: { customerName: job.customer, customerContact: '', salesStatus: 'success', reasons: [], productCategory: defaultCategory, description: '' } }); };
    const handleReportChange = (field, value) => setFinishModal((prev) => ({ ...prev, report: { ...prev.report, [field]: value } }));
    const toggleReason = (reason) => setFinishModal((prev) => { const currentReasons = prev.report.reasons; const newReasons = currentReasons.includes(reason) ? currentReasons.filter((r) => r !== reason) : [...currentReasons, reason]; return { ...prev, report: { ...prev.report, reasons: newReasons } }; });
    const handleSaveReport = () => { if (!finishModal.report.customerName) { alert("กรุณาระบุชื่อลูกค้า"); return; } onUpdateStatus(finishModal.job.id, 'Done', finishModal.report); setFinishModal({ ...finishModal, isOpen: false }); };
    const handleViewDetails = (job) => setViewJobModal(job);
    const getReasonOptions = (status) => { switch(status) { case 'success': return ['ราคาคุ้มค่า', 'สินค้าคุณภาพดี', 'บริการประทับใจ', 'โปรโมชั่นน่าสนใจ', 'สินค้าตรงความต้องการ']; case 'failed': return ['ราคาสูงเกินไป', 'คู่แข่งข้อเสนอดีกว่า', 'ยังไม่พร้อมซื้อ', 'สินค้าไม่ตรงความต้องการ', 'ไม่มีของในสต็อก']; case 'pending': return ['รอตัดสินใจ', 'รอปรึกษาครอบครัว', 'รอบงบประมาณ', 'เปรียบเทียบราคา', 'ขอข้อมูลเพิ่มเติม']; default: return []; } };
    const TaskCard = ({ job, showStart, showComplete }) => {
        const currentLog = job.statusLogs && job.statusLogs.length > 0 ? job.statusLogs[job.statusLogs.length - 1] : null;
        const durationText = currentLog ? getDurationText(currentLog.timestamp) : "-";
        let totalDuration = null;
        if (job.status === 'Done' && job.statusLogs) { const startLog = job.statusLogs.find((l) => l.status === 'In Progress') || job.statusLogs[0]; const endLog = job.statusLogs.find((l) => l.status === 'Done'); if (startLog && endLog) { totalDuration = getDurationText(startLog.timestamp, endLog.timestamp); } }
        return (
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => handleViewDetails(job)}>
            <div className="flex justify-between items-start mb-2"><span className="text-xs font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">#{job.id}</span><PriorityBadge level={job.priority} /></div>
            <h4 className="font-bold text-slate-800 mb-1">{job.title}</h4><p className="text-sm text-slate-600 mb-3">{job.customer}</p>
            <div className="flex flex-col gap-1 mb-4"><div className="flex items-center gap-2 text-xs text-slate-400"><Clock className="w-3 h-3" /> สร้างเมื่อ: {formatDateThai(job.date)}</div>{(job.status === 'Pending' || job.status === 'In Progress') && (<div className={`flex items-center gap-2 text-xs font-semibold ${job.status === 'In Progress' ? 'text-indigo-600' : 'text-amber-600'}`}><Timer className="w-3 h-3" /> {job.status === 'In Progress' ? 'ทำมาแล้ว' : 'รอมาแล้ว'}: {durationText}</div>)}{job.status === 'Done' && totalDuration && (<div className="flex items-center gap-2 text-xs font-semibold text-green-600"><Timer className="w-3 h-3" /> ใช้เวลาทั้งหมด: {totalDuration}</div>)}</div>
            {job.rejectionReason && <div className="mb-4 bg-red-50 p-2 rounded text-xs text-red-700 border border-red-100"><strong>หมายเหตุ:</strong> {job.rejectionReason}</div>}
            {job.salesReport && (<div className="mb-4 bg-slate-50 p-2 rounded text-xs text-slate-600 border border-slate-100"><div className="flex items-center gap-1 font-bold mb-1">{job.salesReport.salesStatus === 'success' && <span className="text-green-600 flex items-center gap-1"><Smile className="w-3 h-3"/> ขายสำเร็จ</span>}{job.salesReport.salesStatus === 'failed' && <span className="text-red-600 flex items-center gap-1"><Frown className="w-3 h-3"/> ขายไม่ได้</span>}{job.salesReport.salesStatus === 'pending' && <span className="text-orange-600 flex items-center gap-1"><Meh className="w-3 h-3"/> รอตัดสินใจ</span>}</div><p className="truncate opacity-80">{job.salesReport.productCategory}</p></div>)}
            <div className="flex gap-2 mt-auto">{showStart && <Button variant="primary" className="w-full text-xs py-1.5" onClick={(e) => handleStartClick(e, job)} icon={Play}>เริ่มงาน</Button>}{showComplete && <Button variant="success" className="w-full text-xs py-1.5" onClick={(e) => handleFinishClick(e, job)} icon={CheckSquare}>ปิดงาน</Button>}{job.status === 'Done' && !job.salesReport && <div className="w-full text-center text-xs font-bold text-green-600 py-1.5 bg-green-50 rounded">เสร็จสิ้น</div>}{job.status === 'Rejected' && <div className="w-full text-center text-xs font-bold text-red-600 py-1.5 bg-red-50 rounded">ถูกปฏิเสธ</div>}</div>
          </div>
        );
    };
    return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6"><div><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><ClipboardList className="w-7 h-7 text-indigo-600" />งานของฉัน (My Tasks)</h2><p className="text-slate-500 text-sm">จัดการงานที่ได้รับมอบหมายและอัปเดตสถานะ</p></div><div className="flex items-center gap-2 bg-indigo-50 p-2 rounded-lg border border-indigo-100"><span className="text-xs font-bold text-indigo-800 uppercase tracking-wide">ดูในนาม:</span><select className="bg-white border border-indigo-200 text-sm rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={currentViewerId} onChange={(e) => setCurrentViewerId(e.target.value)}>{employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}</select></div></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px]"><div className="bg-slate-50 rounded-xl p-4 border border-slate-200"><h3 className="font-bold text-slate-700 mb-4 flex items-center justify-between"><span>งานที่ต้องทำ (รอดำเนินการ)</span><span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{todoJobs.length}</span></h3><div className="space-y-3">{todoJobs.map((job) => <TaskCard key={job.id} job={job} showStart={true} />)}{todoJobs.length === 0 && <div className="text-center text-slate-400 text-sm py-8">ไม่มีงานค้าง</div>}</div></div><div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100"><h3 className="font-bold text-indigo-700 mb-4 flex items-center justify-between"><span>กำลังดำเนินการ</span><span className="bg-indigo-200 text-indigo-700 text-xs px-2 py-0.5 rounded-full">{inProgressJobs.length}</span></h3><div className="space-y-3">{inProgressJobs.map((job) => <TaskCard key={job.id} job={job} showComplete={true} />)}{inProgressJobs.length === 0 && <div className="text-center text-indigo-300 text-sm py-8">ไม่มีงานที่กำลังทำ</div>}</div></div><div className="bg-green-50/30 rounded-xl p-4 border border-green-100"><h3 className="font-bold text-green-700 mb-4 flex items-center justify-between"><span>ประวัติ (เสร็จสิ้น)</span><span className="bg-green-200 text-green-700 text-xs px-2 py-0.5 rounded-full">{doneJobs.length}</span></h3><div className="space-y-3">{doneJobs.map((job) => <TaskCard key={job.id} job={job} />)}{doneJobs.length === 0 && <div className="text-center text-slate-400 text-sm py-8">ไม่มีงานที่เสร็จสิ้น</div>}</div></div></div>
          {/* ... (Modals remain same) ... */}
           <Modal isOpen={!!viewJobModal} onClose={() => setViewJobModal(null)} title={`รายละเอียดงาน #${viewJobModal?.id}`} size="lg">
              {viewJobModal && (
                  <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-100 pb-4"><div><h3 className="text-xl font-bold text-slate-800">{viewJobModal.title}</h3><div className="flex items-center gap-3 mt-1 text-sm text-slate-500"><span className="flex items-center gap-1"><User className="w-4 h-4"/> {viewJobModal.customer}</span><span>•</span><span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {formatDateThai(viewJobModal.date)}</span></div></div><div className="mt-2 sm:mt-0 flex gap-2"><Badge status={viewJobModal.status} /><PriorityBadge level={viewJobModal.priority} /></div></div>
                      <div><h4 className="text-sm font-bold text-slate-700 mb-2">รายละเอียดงาน (Description)</h4><p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">{viewJobModal.description || "ไม่มีรายละเอียดเพิ่มเติม"}</p></div>
                      {viewJobModal.rejectionReason && <div className="bg-red-50 p-4 rounded-lg border border-red-100"><h4 className="text-sm font-bold text-red-700 mb-1 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> ปฏิเสธงานเนื่องจาก</h4><p className="text-sm text-red-600 ml-6">{viewJobModal.rejectionReason}</p></div>}
                      {viewJobModal.salesReport && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100 space-y-3">
                            <h4 className="text-sm font-bold text-green-800 flex items-center gap-2 border-b border-green-200 pb-2"><CheckCircle className="w-4 h-4"/> รายงานผลการขาย</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm"><div><span className="text-green-700 font-semibold block">สถานะ:</span><span className="capitalize">{viewJobModal.salesReport.salesStatus === 'success' ? 'ขายสำเร็จ' : viewJobModal.salesReport.salesStatus === 'failed' ? 'ขายไม่ได้' : 'รอตัดสินใจ'}</span></div><div><span className="text-green-700 font-semibold block">หมวดสินค้า:</span><span>{viewJobModal.salesReport.productCategory}</span></div><div className="col-span-2"><span className="text-green-700 font-semibold block">เหตุผล:</span><div className="flex flex-wrap gap-1 mt-1">{viewJobModal.salesReport.reasons.map((r, i) => <span key={i} className="bg-white px-2 py-0.5 rounded border border-green-200 text-xs text-green-700">{r}</span>)}</div></div>{viewJobModal.salesReport.description && <div className="col-span-2"><span className="text-green-700 font-semibold block">บันทึกเพิ่มเติม:</span><p className="text-slate-600 mt-1">{viewJobModal.salesReport.description}</p></div>}</div>
                        </div>
                      )}
                      {viewJobModal.statusLogs && viewJobModal.statusLogs.length > 0 && (<div className="bg-slate-50 p-3 rounded-lg border border-slate-200"><h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Timer className="w-4 h-4"/> ประวัติสถานะ (Status Timeline)</h4><div className="space-y-2">{viewJobModal.statusLogs.map((log, idx) => (<div key={idx} className="flex justify-between text-xs text-slate-600 border-b border-slate-100 last:border-0 pb-1 last:pb-0"><span>{log.status}</span><span>{formatDateThai(log.timestamp)}</span></div>))}</div></div>)}
                      <div className="flex justify-end pt-4"><Button variant="secondary" onClick={() => setViewJobModal(null)}>ปิด</Button></div>
                  </div>
              )}
          </Modal>
          {/* ... (Start/Reject Modal) */}
          <Modal isOpen={actionModal.isOpen} onClose={() => setActionModal({ ...actionModal, isOpen: false })} title={`ดำเนินการ: ${actionModal.job?.title}`}>
            {actionModal.step === 'choice' ? (<div className="text-center space-y-6 py-4"><div className="flex flex-col items-center"><div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4"><Play className="w-8 h-8 text-blue-600 ml-1" /></div><h4 className="text-xl font-bold text-slate-800">เริ่มงานนี้เลยไหม?</h4><p className="text-slate-500 mt-2">คุณต้องการเริ่มทำงานนี้ตอนนี้เลยหรือไม่?</p></div><div className="grid grid-cols-2 gap-4"><button onClick={() => setActionModal((prev) => ({ ...prev, step: 'reject' }))} className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-xl hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all group"><ThumbsDown className="w-8 h-8 text-slate-400 mb-2 group-hover:text-red-500" /><span className="font-bold text-slate-600 group-hover:text-red-600">ปฏิเสธงาน</span><span className="text-xs text-slate-400">(Reject)</span></button><button onClick={handleConfirmStart} className="flex flex-col items-center justify-center p-4 border-2 border-indigo-200 bg-indigo-50 rounded-xl hover:bg-indigo-100 hover:border-indigo-300 transition-all group"><Play className="w-8 h-8 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" /><span className="font-bold text-indigo-700">เริ่มงาน</span><span className="text-xs text-indigo-400">(Start)</span></button></div></div>) : (<div className="space-y-4"><div className="bg-red-50 p-4 rounded-lg flex items-start gap-3"><AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" /><div><h4 className="font-bold text-red-700 text-sm">ระบุเหตุผลที่ปฏิเสธงาน</h4><p className="text-xs text-red-600 mt-1">กรุณาระบุเหตุผลเพื่อให้ระบบบันทึกข้อมูล</p></div></div><div><label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> เหตุผล (Reason)</label><textarea className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none min-h-[100px]" placeholder="เช่น อุปกรณ์ไม่พร้อม, ติดงานด่วนอื่น..." value={actionModal.reason} onChange={(e) => setActionModal((prev) => ({ ...prev, reason: e.target.value }))} autoFocus></textarea></div><div className="flex justify-end gap-3 pt-4 border-t border-slate-100"><Button variant="secondary" onClick={() => setActionModal((prev) => ({ ...prev, step: 'choice' }))}>ย้อนกลับ</Button><Button variant="danger" onClick={handleConfirmReject}>ยืนยันปฏิเสธ</Button></div></div>)}
          </Modal>
          <Modal isOpen={finishModal.isOpen} onClose={() => setFinishModal({ ...finishModal, isOpen: false })} title="บันทึกรายงานการขาย (Sales Report)" size="lg">
            <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2"><User className="w-4 h-4" /> ข้อมูลลูกค้า (Customer Info)</h4><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-xs font-medium text-slate-500 mb-1">ชื่อลูกค้า</label><input type="text" className="w-full p-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" value={finishModal.report.customerName} onChange={(e) => handleReportChange('customerName', e.target.value)} /></div><div><label className="block text-xs font-medium text-slate-500 mb-1">เบอร์ติดต่อ / ข้อมูลติดต่อ</label><input type="text" className="w-full p-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="08x-xxx-xxxx" value={finishModal.report.customerContact} onChange={(e) => handleReportChange('customerContact', e.target.value)} /></div></div></div>
                <div><h4 className="text-sm font-bold text-slate-700 mb-3">สถานะปิดการขาย (Closing Status)</h4><div className="grid grid-cols-3 gap-3"><button onClick={() => handleReportChange('salesStatus', 'success')} className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${finishModal.report.salesStatus === 'success' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 hover:border-green-200'}`}><Smile className={`w-6 h-6 mb-1 ${finishModal.report.salesStatus === 'success' ? 'fill-green-200' : 'text-slate-400'}`} /><span className="text-sm font-bold">ปิดการขายสำเร็จ</span><span className="text-[10px]">Success</span></button><button onClick={() => handleReportChange('salesStatus', 'pending')} className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${finishModal.report.salesStatus === 'pending' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 hover:border-orange-200'}`}><Meh className={`w-6 h-6 mb-1 ${finishModal.report.salesStatus === 'pending' ? 'fill-orange-200' : 'text-slate-400'}`} /><span className="text-sm font-bold">ระหว่างตัดสินใจ</span><span className="text-[10px]">Pending</span></button><button onClick={() => handleReportChange('salesStatus', 'failed')} className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${finishModal.report.salesStatus === 'failed' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 hover:border-red-200'}`}><Frown className={`w-6 h-6 mb-1 ${finishModal.report.salesStatus === 'failed' ? 'fill-red-200' : 'text-slate-400'}`} /><span className="text-sm font-bold">ไม่สำเร็จ</span><span className="text-[10px]">Failed</span></button></div></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6"><div><h4 className="text-sm font-bold text-slate-700 mb-2">เหตุผล (Reasons)</h4><div className="space-y-2 max-h-40 overflow-y-auto pr-2">{getReasonOptions(finishModal.report.salesStatus).map((reason) => (<label key={reason} className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors"><input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" checked={finishModal.report.reasons.includes(reason)} onChange={() => toggleReason(reason)} /><span className="text-sm text-slate-600">{reason}</span></label>))}</div></div><div><h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><ShoppingBag className="w-4 h-4"/> สินค้าที่สนใจ</h4><select className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm mb-4" value={finishModal.report.productCategory} onChange={(e) => handleReportChange('productCategory', e.target.value)}>{categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}</select><h4 className="text-sm font-bold text-slate-700 mb-2">คำอธิบายเพิ่มเติม</h4><textarea className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm h-24 resize-none" placeholder="รายละเอียดเพิ่มเติม..." value={finishModal.report.description} onChange={(e) => handleReportChange('description', e.target.value)}></textarea></div></div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100"><Button variant="secondary" onClick={() => setFinishModal({ ...finishModal, isOpen: false })}>ยกเลิก</Button><Button variant="success" onClick={handleSaveReport} icon={CheckCircle}>บันทึกและปิดงาน</Button></div>
            </div>
          </Modal>
        </div>
    );
};

const WorkCalendar = ({ employees, schedules, holidays, leaves, onUpdateEmployeeSchedule }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);

  const getDayKey = (date) => {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return days[date.getDay()];
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleDayClick = (dayInfo) => {
    if (dayInfo.type !== 'day') return;
    
    const dayKey = getDayKey(new Date(dayInfo.fullDate));
    const isHoliday = !!dayInfo.holiday;
    
    const staffStatus = employees.map((emp) => {
      const schedule = schedules.find((s) => s.empId === emp.id);
      let status = schedule ? schedule[dayKey] : 'Inactive';
      let leaveReason = null;
      const leave = leaves.find((l) => l.empId === emp.id && l.date === dayInfo.fullDate);
      if (leave) {
          status = 'Leave';
          leaveReason = leave.reason;
      }

      return { ...emp, currentDayStatus: status, leaveReason };
    });
    
    setSelectedDayDetails({
      date: dayInfo.fullDate,
      dateObj: new Date(dayInfo.fullDate),
      isHoliday,
      holidayName: dayInfo.holiday?.name,
      staffStatus,
      dayKey 
    });
    
    setIsDayDetailOpen(true);
  };

  const toggleDayStatus = (empId, currentStatus) => {
     if (!onUpdateEmployeeSchedule || !selectedDayDetails) return;
     if (currentStatus === 'Leave') {
         alert('พนักงานลางานในวันนี้ ไม่สามารถเปลี่ยนสถานะได้ผ่านหน้านี้');
         return;
     }
     const schedule = schedules.find((s) => s.empId === empId);
     if (!schedule) return; 
     const nextStatus = currentStatus === 'Inactive' ? 'Available' : 'Inactive';
     const updatedSchedule = { ...schedule, [selectedDayDetails.dayKey]: nextStatus };
     onUpdateEmployeeSchedule(updatedSchedule);
     setSelectedDayDetails((prev) => ({
        ...prev,
        staffStatus: prev.staffStatus.map((s) => s.id === empId ? { ...s, currentDayStatus: nextStatus } : s)
     }));
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push({ type: 'pad', key: `pad-${i}` });
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dateObj = new Date(year, month, i);
      
      const holiday = holidays.find((h) => h.date === dateStr);
      const dayKey = getDayKey(dateObj);
      let workingStaff = [];
      
      if (!holiday) {
        workingStaff = schedules
          .filter((sch) => sch[dayKey] === 'Available' || sch[dayKey] === 'Busy')
          .map((sch) => {
            const emp = employees.find((e) => e.id === sch.empId);
            const leave = leaves.find((l) => l.empId === emp.id && l.date === dateStr);
            if (leave) return null; 
            return emp;
          })
          .filter(Boolean);
      }

      days.push({
        type: 'day',
        date: i,
        fullDate: dateStr,
        holiday,
        workingStaff,
        key: dateStr
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthNamesThai = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-indigo-600" />
            ปฏิทินงาน (Work Calendar)
          </h2>
          <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
             <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
             <span className="text-lg font-bold text-slate-800 w-48 text-center">
               {monthNamesThai[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
             </span>
             <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronRightIcon className="w-5 h-5 text-slate-600" /></button>
          </div>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
             {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((day, index) => (
               <div key={day} className={`p-3 text-center font-bold text-sm ${index === 0 || index === 6 ? 'text-red-500' : 'text-slate-600'}`}>
                 {day}
               </div>
             ))}
          </div>

          <div className="grid grid-cols-7 auto-rows-fr">
             {calendarDays.map((day) => {
               if (day.type === 'pad') {
                 return <div key={day.key} className="bg-slate-50/30 border-b border-r border-slate-100 min-h-[120px]"></div>;
               }

               const isHoliday = !!day.holiday;
               const MAX_DISPLAY = 3;
               const displayedStaff = day.workingStaff ? day.workingStaff.slice(0, MAX_DISPLAY) : [];
               const remainingCount = day.workingStaff ? day.workingStaff.length - MAX_DISPLAY : 0;

               return (
                 <div 
                    key={day.key} 
                    className={`border-b border-r border-slate-100 p-2 min-h-[120px] flex flex-col transition-colors hover:bg-slate-50 cursor-pointer ${isHoliday ? 'bg-red-50/50' : ''}`}
                    onClick={() => handleDayClick(day)}
                 >
                    <div className="flex justify-between items-start mb-2">
                       <span className={`text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center ${isHoliday ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
                         {day.date}
                       </span>
                       {isHoliday && (
                         <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded truncate max-w-[80px]" title={day.holiday.name}>
                           {day.holiday.name}
                         </span>
                       )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                       {isHoliday ? (
                         <div className="flex flex-col items-center justify-center h-full mt-2">
                            <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-md text-center w-full">
                               {day.holiday.name}
                            </span>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center justify-center h-full gap-2 pt-1">
                           {/* แสดงรูปคนมาทำงาน */}
                           <div className="flex items-center justify-center -space-x-3 w-full px-1">
                             {day.workingStaff.slice(0, 4).map((emp) => (
                               <div key={emp.id} className="relative hover:z-10 transition-transform hover:scale-110" title={emp.name}>
                                  <Avatar src={emp.avatar} alt={emp.name} size="sm" className="ring-2 ring-white bg-white" />
                               </div>
                             ))}
                             {day.workingStaff.length > 4 && (
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 ring-2 ring-white text-[10px] font-bold text-slate-500 z-0">
                                  +{day.workingStaff.length - 4}
                                </div>
                             )}
                           </div>
                           
                           {/* แสดงจำนวนคนทั้งหมด */}
                           {day.workingStaff.length > 0 ? (
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 shadow-sm">
                                รวม {day.workingStaff.length} คน
                              </span>
                           ) : (
                              <span className="text-[10px] text-slate-300 font-light mt-2">-</span>
                           )}
                         </div>
                       )}
                    </div>
                 </div>
               );
             })}
          </div>
       </div>

       <Modal 
          isOpen={isDayDetailOpen} 
          onClose={() => setIsDayDetailOpen(false)} 
          title={selectedDayDetails ? `รายละเอียดวันที่ ${formatDateThaiFull(selectedDayDetails.date)}` : ""}
          size="lg"
       >
          {selectedDayDetails && (
              <div className="space-y-6">
                 {selectedDayDetails.isHoliday && (
                    <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3 border border-red-100">
                       <CalendarDays className="w-6 h-6 text-red-500" />
                       <div>
                          <h4 className="font-bold text-red-700">วันหยุด: {selectedDayDetails.holidayName}</h4>
                          <p className="text-sm text-red-600">วันนี้เป็นวันหยุดประจำปี</p>
                       </div>
                    </div>
                 )}

                 {!selectedDayDetails.isHoliday && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                         <h4 className="text-sm font-bold text-green-700 mb-3 flex items-center gap-2 border-b border-green-100 pb-2">
                            <UserCheck className="w-4 h-4" /> พนักงานที่มาทำงาน
                         </h4>
                         <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {selectedDayDetails.staffStatus
                               .filter((s) => s.currentDayStatus !== 'Inactive' && s.currentDayStatus !== 'Leave')
                               .map((emp) => (
                                  <div key={emp.id} className="flex justify-between items-center p-2 bg-green-50 rounded-lg border border-green-100">
                                     <div className="flex items-center gap-2">
                                        <Avatar src={emp.avatar} alt={emp.name} size="sm" />
                                        <span className="text-sm font-medium text-slate-700">{emp.name}</span>
                                     </div>
                                     <button 
                                        onClick={() => toggleDayStatus(emp.id, emp.currentDayStatus)}
                                        className="text-xs bg-white border border-slate-200 text-red-500 px-2 py-1 rounded hover:bg-red-50 hover:border-red-200 transition-colors"
                                     >
                                        ให้หยุด
                                     </button>
                                  </div>
                               ))}
                            {selectedDayDetails.staffStatus.filter((s) => s.currentDayStatus !== 'Inactive' && s.currentDayStatus !== 'Leave').length === 0 && (
                               <p className="text-sm text-slate-400 text-center py-4">ไม่มีพนักงานทำงานวันนี้</p>
                            )}
                         </div>
                      </div>

                      <div>
                         <h4 className="text-sm font-bold text-slate-500 mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                            <UserX className="w-4 h-4" /> พนักงานที่หยุด/ไม่มา
                         </h4>
                         <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {selectedDayDetails.staffStatus
                               .filter((s) => s.currentDayStatus === 'Inactive' || s.currentDayStatus === 'Leave')
                               .map((emp) => (
                                  <div key={emp.id} className={`flex justify-between items-center p-2 rounded-lg border ${emp.currentDayStatus === 'Leave' ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
                                     <div className="flex items-center gap-2 opacity-70">
                                        <Avatar src={emp.avatar} alt={emp.name} size="sm" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-600">{emp.name}</span>
                                            {emp.currentDayStatus === 'Leave' && (
                                                <span className="text-[10px] text-orange-600 font-bold">ลา: {emp.leaveReason}</span>
                                            )}
                                        </div>
                                     </div>
                                     {emp.currentDayStatus !== 'Leave' && (
                                        <button 
                                            onClick={() => toggleDayStatus(emp.id, emp.currentDayStatus)}
                                            className="text-xs bg-white border border-indigo-200 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                                        >
                                            ให้มาทำงาน
                                        </button>
                                     )}
                                  </div>
                               ))}
                             {selectedDayDetails.staffStatus.filter((s) => s.currentDayStatus === 'Inactive' || s.currentDayStatus === 'Leave').length === 0 && (
                               <p className="text-sm text-slate-400 text-center py-4">พนักงานทุกคนมาทำงาน</p>
                            )}
                         </div>
                      </div>
                   </div>
                 )}
                 
                 <div className="flex justify-end border-t border-slate-100 pt-4">
                    <Button variant="secondary" onClick={() => setIsDayDetailOpen(false)}>ปิดหน้าต่าง</Button>
                 </div>
              </div>
          )}
       </Modal>
    </div>
  );
};
const EmployeeLeaveManagement = ({ employees, leaves, onAddLeave, onDeleteLeave }) => {
    const [selectedEmpId, setSelectedEmpId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ empId: '', date: '', type: 'ลาป่วย', reason: '' });
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const [filterMonth, setFilterMonth] = useState('All');
    const [filterYear, setFilterYear] = useState(currentYear);

    const months = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    const filterLeavesByDate = (leaveList) => {
        return leaveList.filter((l) => {
            const d = new Date(l.date);
            const matchYear = d.getFullYear() === parseInt(filterYear);
            const matchMonth = filterMonth === 'All' || d.getMonth() === parseInt(filterMonth);
            return matchYear && matchMonth;
        });
    };

    const handleAddClick = () => {
        setFormData({ 
            empId: selectedEmpId || employees[0]?.id || '', 
            date: '', 
            type: 'ลาป่วย', 
            reason: '' 
        });
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (formData.empId && formData.date && formData.reason) {
            onAddLeave({
                ...formData,
                empId: parseInt(formData.empId)
            });
            setIsModalOpen(false);
        } else {
            alert("กรุณากรอกข้อมูลให้ครบถ้วน");
        }
    };

    const getEmpName = (id) => {
        const emp = employees.find((e) => e.id === id);
        return emp ? emp.name : 'Unknown';
    };

    const getLeaveCount = (empId) => {
        const empLeaves = leaves.filter((l) => l.empId === empId);
        return filterLeavesByDate(empLeaves).length;
    };

    const employeeLeaves = useMemo(() => {
        if (!selectedEmpId) return [];
        const empLeaves = leaves.filter((l) => l.empId === selectedEmpId);
        return filterLeavesByDate(empLeaves);
    }, [leaves, selectedEmpId, filterMonth, filterYear]);

    const selectedEmployee = useMemo(() => {
        return employees.find((e) => e.id === selectedEmpId);
    }, [employees, selectedEmpId]);

    const FilterControls = () => (
        <div className="flex gap-2">
            <select 
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
            >
                <option value="All">ทุกเดือน</option>
                {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select 
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
            >
                {years.map(y => <option key={y} value={y}>{y + 543}</option>)}
            </select>
        </div>
    );

    // --- OVERVIEW MODE ---
    if (selectedEmpId === null) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">วันหยุดพนักงาน (Employee Leave)</h2>
                        <p className="text-slate-500 text-sm">ภาพรวมวันลาของพนักงานแต่ละคน</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto flex-wrap">
                        <FilterControls />
                        <Button variant="primary" icon={Plus} onClick={handleAddClick}>บันทึกการลา</Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employees.map((emp) => (
                        <div 
                            key={emp.id} 
                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                            onClick={() => setSelectedEmpId(emp.id)}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <Avatar src={emp.avatar} alt={emp.name} size="lg" />
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{emp.name}</h3>
                                    <p className="text-sm text-slate-500">{emp.role} • {emp.dept}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                <span className="text-sm text-slate-500">วันลา (ตามที่เลือก)</span>
                                <span className="text-lg font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                                    {getLeaveCount(emp.id)} วัน
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Add Modal (Global) */}
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="บันทึกการลาพนักงาน">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">พนักงาน</label>
                            <select 
                                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.empId}
                                onChange={(e) => setFormData({ ...formData, empId: e.target.value })}
                            >
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">วันที่ลา</label>
                            <input 
                                type="date" 
                                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">ประเภทการลา</label>
                            <select 
                                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option>ลาป่วย</option>
                                <option>ลากิจ</option>
                                <option>ลาพักร้อน</option>
                                <option>อื่นๆ</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">เหตุผล</label>
                            <textarea 
                                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                                placeholder="ระบุสาเหตุการลา..."
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            ></textarea>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>ยกเลิก</Button>
                            <Button variant="primary" onClick={handleSave}>บันทึก</Button>
                        </div>
                    </div>
                </Modal>
            </div>
        );
    }

    // --- DETAIL MODE ---
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button 
                        onClick={() => setSelectedEmpId(null)}
                        className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Avatar src={selectedEmployee?.avatar} size="sm" />
                            ประวัติการลา: {selectedEmployee?.name}
                        </h2>
                        <p className="text-slate-500 text-sm">รายการวันหยุดทั้งหมดของพนักงาน</p>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto flex-wrap justify-end">
                    <FilterControls />
                    <Button variant="primary" icon={Plus} onClick={handleAddClick}>เพิ่มวันลา</Button>
                </div>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 text-sm font-semibold text-slate-600">วันที่</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">ประเภท</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">เหตุผล</th>
                                <th className="p-4 text-sm font-semibold text-slate-600 text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employeeLeaves.map((leave) => (
                                <tr key={leave.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-4 text-slate-600 font-medium">
                                        <div className="flex items-center gap-2">
                                            <CalendarDays className="w-4 h-4 text-indigo-500" />
                                            {formatDateThaiFull(leave.date)}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            leave.type === 'ลาป่วย' ? 'bg-red-100 text-red-700' :
                                            leave.type === 'ลากิจ' ? 'bg-orange-100 text-orange-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {leave.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600">{leave.reason}</td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => { if(window.confirm('ยืนยันลบรายการลา?')) onDeleteLeave(leave.id); }} 
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                            title="ลบ"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {employeeLeaves.length === 0 && (
                                <tr><td colSpan={4} className="p-12 text-center text-slate-400 italic">ไม่พบข้อมูลการลาตามเงื่อนไขที่เลือก</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Add Modal (Scoped to current employee) */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`บันทึกการลา: ${selectedEmployee?.name}`}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">วันที่ลา</label>
                        <input 
                            type="date" 
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">ประเภทการลา</label>
                        <select 
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option>ลาป่วย</option>
                            <option>ลากิจ</option>
                            <option>ลาพักร้อน</option>
                            <option>อื่นๆ</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">เหตุผล</label>
                        <textarea 
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                            placeholder="ระบุสาเหตุการลา..."
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>ยกเลิก</Button>
                        <Button variant="primary" onClick={handleSave}>บันทึก</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const StaffQueue = ({ employees, onAssignJob, onRejectJob, onReorderQueue }) => {
  const [currentViewerId, setCurrentViewerId] = useState(1);
  const [assignmentModal, setAssignmentModal] = useState({ isOpen: false, employee: null, step: 'choice', reason: '', jobData: { title: 'Walk-in Customer', customer: 'ลูกค้าทั่วไป', description: 'บริการลูกค้าหน้าร้าน', priority: 'Normal' } });
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [tempQueue, setTempQueue] = useState([]);
  
  const currentUser = employees.find((e) => e.id === Number(currentViewerId));
  const queue = useMemo(() => employees.filter((e) => e.status !== 'Inactive').sort((a, b) => { if (a.queuePos === 0) return 1; if (b.queuePos === 0) return -1; return a.queuePos - b.queuePos; }), [employees]);
  const nextUp = queue[0];
  const upcoming = queue.slice(1);
  const isMyTurn = nextUp && currentUser && nextUp.id === currentUser.id;

  const openAssignModal = (emp) => setAssignmentModal({ 
      isOpen: true, 
      employee: emp, 
      step: 'choice', 
      reason: '',
      jobData: { title: 'Walk-in Customer', customer: 'ลูกค้าทั่วไป', description: 'บริการลูกค้าหน้าร้าน', priority: 'Normal' } 
  });
  
  const closeAssignModal = () => setAssignmentModal({ ...assignmentModal, isOpen: false });
  const handleJobDataChange = (field, value) => setAssignmentModal((prev) => ({ ...prev, jobData: { ...prev.jobData, [field]: value } }));
  
  const handleConfirmAccept = () => { 
      onAssignJob(assignmentModal.employee.id, assignmentModal.jobData); 
      closeAssignModal(); 
  };
  
  const handleRejectSubmit = () => { 
      if (!assignmentModal.reason.trim()) { alert("กรุณาระบุเหตุผลในการปฏิเสธงาน"); return; } 
      onRejectJob(assignmentModal.employee.id, assignmentModal.reason); 
      closeAssignModal(); 
  };

  const handleOpenManageModal = () => { setTempQueue([...queue]); setIsManageModalOpen(true); };
  const handleMoveUp = (index) => { if (index === 0) return; const newQueue = [...tempQueue]; [newQueue[index], newQueue[index - 1]] = [newQueue[index - 1], newQueue[index]]; setTempQueue(newQueue); };
  const handleMoveDown = (index) => { if (index === tempQueue.length - 1) return; const newQueue = [...tempQueue]; [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]]; setTempQueue(newQueue); };
  const handleSaveOrder = () => { const newOrderIds = tempQueue.map(e => e.id); onReorderQueue(newOrderIds); setIsManageModalOpen(false); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h2 className="text-2xl font-bold text-slate-800">คิวพนักงาน (Staff Queue)</h2><p className="text-slate-500 text-sm">ลำดับการรับลูกค้าหน้าร้าน (Walk-in)</p></div>
        <div className="flex gap-2 w-full sm:w-auto items-center">
            <div className="flex items-center gap-2 bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                <span className="text-xs font-bold text-indigo-800 uppercase tracking-wide">มุมมอง:</span>
                <select className="bg-white border border-indigo-200 text-sm rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={currentViewerId} onChange={(e) => setCurrentViewerId(e.target.value)}>
                    {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
            </div>
            <Button variant="secondary" icon={Settings} onClick={handleOpenManageModal}>จัดการลำดับ</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
            <div className={`relative rounded-2xl p-6 shadow-xl h-full flex flex-col justify-between overflow-hidden transition-all duration-500 ${isMyTurn ? 'bg-gradient-to-br from-green-600 to-emerald-800 ring-8 ring-green-200 ring-offset-2 scale-[1.02]' : 'bg-gradient-to-br from-indigo-600 to-indigo-800'}`}>
                {isMyTurn && (
                    <div className="absolute top-0 left-0 right-0 bg-yellow-400 text-yellow-900 font-bold text-center py-2 text-sm animate-pulse flex items-center justify-center gap-2 z-20 shadow-md">
                        <BellRing className="w-5 h-5 animate-bounce" /> 🔔 ถึงคิวคุณแล้ว! (It's Your Turn)
                    </div>
                )}
                
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                
                <div className="relative z-10 pt-8">
                    <div className="flex items-center gap-2 mb-2 opacity-90 justify-center">
                        <div className={`w-3 h-3 rounded-full animate-pulse ${isMyTurn ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-green-400'}`}></div>
                        <span className="text-sm font-bold tracking-wider uppercase text-white/90">คิวปัจจุบัน (Current Turn)</span>
                    </div>
                    {nextUp ? (
                        <div className="mt-4 flex flex-col items-center text-center">
                            <div className="mb-6 relative">
                                <Avatar src={nextUp.avatar} alt={nextUp.name} size="xl" className={`w-32 h-32 border-4 shadow-2xl ${isMyTurn ? 'border-yellow-400' : 'border-white/20'}`} />
                                <div className={`absolute bottom-0 right-2 w-8 h-8 border-4 border-indigo-700 rounded-full flex items-center justify-center ${isMyTurn ? 'bg-green-500' : 'bg-slate-400'}`}>
                                    {isMyTurn && <CheckCircle className="w-5 h-5 text-white" />}
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold mb-1 text-white">{nextUp.name}</h3>
                            <p className="text-indigo-100 text-lg mb-4">{nextUp.role}</p>
                            
                            {isMyTurn ? (
                                <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 mb-6 border border-white/30 w-full animate-in zoom-in duration-300">
                                    <p className="text-white font-bold text-lg mb-1">ลูกค้ารอรับบริการอยู่</p>
                                    <p className="text-green-100 text-sm">กรุณากดปุ่มเพื่อรับงาน หรือปฏิเสธ</p>
                                </div>
                            ) : (
                                <div className="flex gap-2 text-sm bg-black/20 px-4 py-2 rounded-full mb-6">
                                    <span className="text-indigo-200">แผนก:</span>
                                    <span className="font-semibold text-white">{nextUp.dept}</span>
                                </div>
                            )}

                            <div className="w-full mt-auto">
                                <Button 
                                    variant={isMyTurn ? "success" : "secondary"} 
                                    className={`w-full shadow-xl border-0 h-16 text-xl font-bold rounded-2xl ${isMyTurn ? 'animate-pulse ring-4 ring-white/30' : ''}`} 
                                    icon={isMyTurn ? Play : CheckCircle} 
                                    onClick={() => openAssignModal(nextUp)}
                                >
                                    {isMyTurn ? "กดเพื่อรับลูกค้า (Action)" : "รับลูกค้า (Accept)"}
                                </Button>
                                {isMyTurn && <p className="text-white/80 text-xs mt-3 bg-black/10 py-1 px-3 rounded-full inline-block">กดปุ่มเพื่อเลือก: รับงาน หรือ ปฏิเสธงาน</p>}
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-indigo-200">
                            <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                            <p>ไม่มีพนักงานที่พร้อมทำงาน</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        <div className="lg:col-span-2"><Card className="h-full flex flex-col"><div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"><h3 className="font-semibold text-slate-800 flex items-center gap-2"><ListOrdered className="w-5 h-5 text-slate-500" />คิวถัดไป (Upcoming Queue)</h3><span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">รออยู่ {upcoming.length} คน</span></div><div className="flex-1 overflow-y-auto p-2">{upcoming.length > 0 ? (<div className="space-y-2">{upcoming.map((emp, index) => (<div key={emp.id} className={`flex items-center p-3 rounded-xl border transition-all group ${emp.id === currentUser?.id ? 'bg-indigo-50 border-indigo-200' : 'border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30'}`}><div className={`w-8 h-8 flex items-center justify-center font-bold rounded-lg mr-4 transition-colors ${emp.id === currentUser?.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>{index + 2}</div><div className="mr-4"><Avatar src={emp.avatar} alt={emp.name} size="md" /></div><div className="flex-1"><h4 className={`font-semibold ${emp.id === currentUser?.id ? 'text-indigo-900' : 'text-slate-800'}`}>{emp.name} {emp.id === currentUser?.id && '(คุณ)'}</h4><p className="text-xs text-slate-500">{emp.role} • {emp.dept}</p></div><div className="flex items-center gap-4"><div className="text-right hidden sm:block"><p className="text-xs text-slate-400">สถานะ</p><Badge status={emp.status} /></div><div className="text-right hidden sm:block"><p className="text-xs text-slate-400">งานปัจจุบัน</p><p className="text-sm font-medium text-slate-700">{emp.activeJobs}</p></div></div></div>))}</div>) : (<div className="h-full flex flex-col items-center justify-center text-slate-400 py-12"><p>หมดคิว</p></div>)}</div></Card></div>
      </div>
      
      <Modal isOpen={assignmentModal.isOpen} onClose={closeAssignModal} title={`ดำเนินการ: ${assignmentModal.employee?.name}`}>
        {assignmentModal.step === 'choice' && (
          <div className="text-center space-y-6 py-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center">
                <div className="relative">
                    <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4 overflow-hidden border-4 border-indigo-200 shadow-md">
                        <Avatar src={assignmentModal.employee?.avatar} alt={assignmentModal.employee?.name} size="xl" className="w-full h-full rounded-none" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1.5 rounded-full border-2 border-white shadow-sm">
                        <UserCheck className="w-5 h-5" />
                    </div>
                </div>
                <h4 className="text-2xl font-bold text-slate-800">ยืนยันการรับลูกค้า (Walk-in)?</h4>
                <p className="text-slate-500 mt-2 max-w-xs mx-auto">คุณต้องการรับงานนี้เพื่อให้บริการลูกค้า หรือต้องการปฏิเสธงาน?</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
                <button onClick={() => setAssignmentModal((prev) => ({ ...prev, step: 'reject' }))} className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 rounded-2xl hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all group bg-white shadow-sm hover:shadow-md">
                    <div className="bg-slate-100 p-3 rounded-full mb-3 group-hover:bg-red-100 transition-colors">
                        <ThumbsDown className="w-8 h-8 text-slate-400 group-hover:text-red-500" />
                    </div>
                    <span className="font-bold text-lg text-slate-700 group-hover:text-red-700">ปฏิเสธงาน</span>
                    <span className="text-xs text-slate-400 font-medium">(Reject)</span>
                </button>
                <button onClick={() => setAssignmentModal((prev) => ({ ...prev, step: 'details' }))} className="flex flex-col items-center justify-center p-6 border-2 border-indigo-200 bg-indigo-50/50 rounded-2xl hover:bg-indigo-100 hover:border-indigo-400 hover:text-indigo-700 transition-all group shadow-sm hover:shadow-md hover:-translate-y-1">
                    <div className="bg-indigo-100 p-3 rounded-full mb-3 group-hover:bg-indigo-200 transition-colors">
                        <CheckCircle className="w-8 h-8 text-indigo-600" />
                    </div>
                    <span className="font-bold text-lg text-indigo-800">รับงาน</span>
                    <span className="text-xs text-indigo-500 font-medium">(Accept & Start)</span>
                </button>
            </div>
          </div>
        )}

        {assignmentModal.step === 'details' && (
          <div className="space-y-5 animate-in slide-in-from-right duration-200">
             <div className="bg-green-50 p-4 rounded-xl flex items-start gap-3 border border-green-100">
                <div className="p-2 bg-green-100 rounded-full shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                   <h4 className="font-bold text-green-800 text-base">เปิดใบงานใหม่ (Open New Job)</h4>
                   <p className="text-sm text-green-700 mt-1">กรุณากรอกข้อมูลลูกค้าเบื้องต้นเพื่อบันทึกเข้าระบบ</p>
                </div>
             </div>
             <div className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">ชื่องาน (Job Title)</label>
                    <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" value={assignmentModal.jobData.title} onChange={(e) => handleJobDataChange('title', e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">ชื่อลูกค้า (Customer Name)</label>
                    <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" placeholder="ระบุชื่อลูกค้า..." value={assignmentModal.jobData.customer} onChange={(e) => handleJobDataChange('customer', e.target.value)} autoFocus />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">รายละเอียดเพิ่มเติม</label>
                    <textarea className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all min-h-[100px]" placeholder="รายละเอียดงานเบื้องต้น..." value={assignmentModal.jobData.description} onChange={(e) => handleJobDataChange('description', e.target.value)} />
                </div>
             </div>
             <div className="flex justify-end gap-3 mt-6 border-t border-slate-100 pt-5">
                <Button variant="secondary" onClick={() => setAssignmentModal((prev) => ({ ...prev, step: 'choice' }))}>ย้อนกลับ</Button>
                <Button variant="primary" onClick={handleConfirmAccept} icon={CheckCircle} className="px-6">ยืนยันรับงาน (Confirm)</Button>
             </div>
          </div>
        )}

        {assignmentModal.step === 'reject' && (
          <div className="space-y-5 animate-in slide-in-from-left duration-200">
            <div className="bg-red-50 p-4 rounded-xl flex items-start gap-3 border border-red-100">
                <div className="p-2 bg-red-100 rounded-full shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                    <h4 className="font-bold text-red-700 text-base">ยืนยันการปฏิเสธงาน</h4>
                    <p className="text-sm text-red-600 mt-1">ระบบจะบันทึกสถานะปฏิเสธและเลื่อนคิวของคุณไปลำดับสุดท้าย</p>
                </div>
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> เหตุผล (Reason)
                </label>
                <textarea className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all min-h-[120px]" placeholder="เช่น ติดงานค้าง, ลาพัก, ป่วย..." value={assignmentModal.reason} onChange={(e) => setAssignmentModal((prev) => ({ ...prev, reason: e.target.value }))} autoFocus></textarea>
            </div>
            <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
                <Button variant="secondary" onClick={() => setAssignmentModal((prev) => ({ ...prev, step: 'choice' }))}>ย้อนกลับ</Button>
                <Button variant="danger" onClick={handleRejectSubmit} className="px-6">ยืนยันปฏิเสธ (Confirm Reject)</Button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Manage Queue Modal remains the same */}
      <Modal isOpen={isManageModalOpen} onClose={() => setIsManageModalOpen(false)} title="จัดการลำดับคิว (Manage Queue Order)" size="md">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">ปรับเปลี่ยนลำดับการรับงานของพนักงานโดยการเลื่อนขึ้นหรือลง</p>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {tempQueue.map((emp, index) => (
              <div key={emp.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3"><div className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded flex items-center justify-center text-xs font-bold">{index + 1}</div><Avatar src={emp.avatar} alt={emp.name} size="sm" /><div><p className="text-sm font-bold text-slate-700">{emp.name}</p><p className="text-[10px] text-slate-500">{emp.dept}</p></div></div>
                <div className="flex gap-1"><button onClick={() => handleMoveUp(index)} disabled={index === 0} className="p-1.5 rounded hover:bg-white hover:shadow text-slate-500 hover:text-indigo-600 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button><button onClick={() => handleMoveDown(index)} disabled={index === tempQueue.length - 1} className="p-1.5 rounded hover:bg-white hover:shadow text-slate-500 hover:text-indigo-600 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button></div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100"><Button variant="secondary" onClick={() => setIsManageModalOpen(false)}>ยกเลิก</Button><Button variant="primary" onClick={handleSaveOrder}>บันทึกลำดับ</Button></div>
        </div>
      </Modal>
    </div>
  );
};

const JobAssignment = ({ employees, jobs, onAssignJob, onRejectJob }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [assignModal, setAssignModal] = useState({ isOpen: false, employee: null, step: 'choice', reason: '', jobData: { title: '', customer: '', priority: 'Normal' } });
  const filteredEmployees = employees.filter((emp) => emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.dept.toLowerCase().includes(searchTerm.toLowerCase()));
  const openAssignModal = (emp) => setAssignModal({ isOpen: true, employee: emp, step: 'choice', reason: '', jobData: { title: '', customer: '', priority: 'Normal' } });
  const closeAssignModal = () => setAssignModal({ ...assignModal, isOpen: false });
  const handleJobDataChange = (field, value) => setAssignModal((prev) => ({ ...prev, jobData: { ...prev.jobData, [field]: value } }));
  const handleConfirmAssign = () => { onAssignJob(assignModal.employee.id, assignModal.jobData); closeAssignModal(); };
  const handleConfirmReject = () => { if (!assignModal.reason.trim()) { alert("กรุณาระบุเหตุผล"); return; } onRejectJob(assignModal.employee.id, assignModal.reason); closeAssignModal(); };
  const handleAccept = () => setAssignModal((prev) => ({ ...prev, step: 'details' }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><h2 className="text-2xl font-bold text-slate-800">มอบหมายงาน (Job Assignment)</h2><div className="relative w-full sm:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" placeholder="ค้นหาพนักงาน..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((emp) => (
          <Card key={emp.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4"><div className="flex items-center space-x-3"><Avatar src={emp.avatar} alt={emp.name} size="md" /><div className="min-w-0"><h3 className="font-bold text-slate-800 truncate">{emp.name}</h3><p className="text-xs text-slate-500 truncate">{emp.role}</p></div></div><Badge status={emp.status} /></div>
            <div className="space-y-3 mb-6"><div className="flex justify-between text-sm"><span className="text-slate-500">งานที่ทำอยู่</span><span className="font-semibold text-slate-800">{emp.activeJobs}</span></div><div className="flex justify-between text-sm"><span className="text-slate-500">ลำดับคิว</span><span className="font-semibold text-slate-800">#{emp.queuePos}</span></div><div className="flex justify-between text-sm"><span className="text-slate-500">แผนก</span><span className="text-slate-800">{emp.dept}</span></div></div>
            <Button variant="primary" className="w-full" onClick={() => openAssignModal(emp)} icon={CheckCircle}>รับลูกค้า</Button>
          </Card>
        ))}
      </div>
      <Modal isOpen={assignModal.isOpen} onClose={closeAssignModal} title={`มอบหมายงานให้: ${assignModal.employee?.name}`}>
        {assignModal.step === 'choice' && (
          <div className="text-center space-y-6 py-4">
            <div className="flex flex-col items-center"><div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-4 overflow-hidden border-4 border-indigo-200"><Avatar src={assignModal.employee?.avatar} alt={assignModal.employee?.name} size="xl" className="w-full h-full rounded-none" /></div><h4 className="text-xl font-bold text-slate-800">ยืนยันการรับลูกค้า?</h4><p className="text-slate-500 mt-2">พนักงานคนนี้พร้อมรับงานหรือไม่?</p></div>
            <div className="grid grid-cols-2 gap-4"><button onClick={() => setAssignModal((prev) => ({ ...prev, step: 'reject' }))} className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-xl hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all group"><ThumbsDown className="w-8 h-8 text-slate-400 mb-2 group-hover:text-red-500" /><span className="font-bold text-slate-600 group-hover:text-red-600">ปฏิเสธงาน</span><span className="text-xs text-slate-400">(Reject Job)</span></button><button onClick={() => setAssignModal((prev) => ({ ...prev, step: 'details' }))} className="flex flex-col items-center justify-center p-4 border-2 border-indigo-200 bg-indigo-50 rounded-xl hover:bg-indigo-100 hover:border-indigo-300 transition-all group"><ThumbsUp className="w-8 h-8 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" /><span className="font-bold text-indigo-700">รับงาน</span><span className="text-xs text-indigo-400">(Accept & Fill Details)</span></button></div>
          </div>
        )}
        {assignModal.step === 'details' && (
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">ชื่องาน (Job Title)</label><input type="text" className="w-full p-2 border border-slate-300 rounded-md" placeholder="ระบุชื่องาน..." value={assignModal.jobData.title} onChange={(e) => handleJobDataChange('title', e.target.value)} /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">ลูกค้า (Customer)</label><input type="text" className="w-full p-2 border border-slate-300 rounded-md" placeholder="ชื่อลูกค้า" value={assignModal.jobData.customer} onChange={(e) => handleJobDataChange('customer', e.target.value)} /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">รายละเอียดงาน (Description)</label><textarea className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]" placeholder="รายละเอียดเพิ่มเติม..." value={assignModal.jobData.description} onChange={(e) => handleJobDataChange('description', e.target.value)} /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">ความสำคัญ (Priority)</label><select className="w-full p-2 border border-slate-300 rounded-md bg-white" value={assignModal.jobData.priority} onChange={(e) => handleJobDataChange('priority', e.target.value)}><option value="Normal">ปกติ (Normal)</option><option value="High">ด่วน (High)</option><option value="Critical">ด่วนที่สุด (Critical)</option></select></div>
            <div className="flex justify-end gap-3 mt-6 border-t border-slate-100 pt-4"><Button variant="secondary" onClick={() => setAssignModal((prev) => ({ ...prev, step: 'choice' }))}>ย้อนกลับ</Button><Button variant="primary" onClick={handleConfirmAssign}>ยืนยันรับงาน</Button></div>
          </div>
        )}
        {assignModal.step === 'reject' && (
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg flex items-start gap-3"><AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" /><div><h4 className="font-bold text-red-700 text-sm">การปฏิเสธงาน (Job Rejection)</h4><p className="text-xs text-red-600 mt-1">กรุณาระบุเหตุผลที่พนักงานไม่สามารถรับงานได้ เพื่อบันทึกในระบบ</p></div></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> เหตุผล (Reason)</label><textarea className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none min-h-[100px]" placeholder="เช่น ติดงานค้าง, ลาพัก..." value={assignModal.reason} onChange={(e) => setAssignModal((prev) => ({ ...prev, reason: e.target.value }))} autoFocus></textarea></div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100"><Button variant="secondary" onClick={() => setAssignModal((prev) => ({ ...prev, step: 'choice' }))}>ย้อนกลับ</Button><Button variant="danger" onClick={handleConfirmReject}>ยืนยันปฏิเสธ</Button></div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const QueueSummary = ({ employees, jobs }) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const employeeQueues = employees.map((emp) => ({ ...emp, jobs: jobs.filter((job) => job.assignee === emp.name) }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">สรุปคิวงาน (Job Queue Summary)</h2>
      <div className="space-y-4">
        {employeeQueues.map((emp) => (
          <Card key={emp.id} className="overflow-hidden">
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors gap-4" onClick={() => setExpandedRow(expandedRow === emp.id ? null : emp.id)}>
              <div className="flex items-center gap-4"><div className={`transform transition-transform ${expandedRow === emp.id ? 'rotate-90' : ''}`}><ChevronRight className="w-5 h-5 text-slate-400" /></div><div><h3 className="font-semibold text-slate-800">{emp.name}</h3><p className="text-sm text-slate-500">{emp.activeJobs} งานที่ทำอยู่ • {emp.jobs.length} งานทั้งหมด</p></div></div>
              <div className="flex gap-2 pl-9 sm:pl-0 overflow-x-auto pb-1 sm:pb-0">{emp.jobs.slice(0, 5).map((job, i) => (<div key={i} className={`w-2 h-8 rounded-full shrink-0 ${job.status === 'Done' ? 'bg-green-400' : job.status === 'In Progress' ? 'bg-blue-400' : 'bg-slate-300'}`} title={job.status} />))}</div>
            </div>
            {expandedRow === emp.id && (
              <div className="border-t border-slate-100 bg-slate-50 p-4"><h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">คิวงาน (FIFO)</h4>
                 {emp.jobs.length > 0 ? (
                   <div className="space-y-2">{emp.jobs.map((job) => (<div key={job.id} className="bg-white p-3 rounded border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2"><div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2"><span className="font-medium text-slate-700">{job.title}</span><span className="hidden sm:inline text-slate-400 text-sm mx-2">•</span><span className="text-slate-500 text-sm">{job.customer}</span><PriorityBadge level={job.priority} /></div><div className="flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0"><span className="text-xs text-slate-400">{formatDateThai(job.date)}</span><Badge status={job.status} /></div></div>))}</div>
                 ) : (<div className="text-center py-4 text-slate-400 italic">ยังไม่มีงานที่ได้รับมอบหมาย</div>)}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

const JobReports = ({ employees, jobs }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ status: 'All', employee: 'All', search: '' });
  const uniqueStatuses = useMemo(() => ['All', ...new Set(jobs.map((j) => j.status))], [jobs]);
  const uniqueEmployees = useMemo(() => ['All', ...employees.map((e) => e.name)], [employees]);
  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const resetFilters = () => setFilters({ status: 'All', employee: 'All', search: '' });
  const filteredJobs = useMemo(() => jobs.filter((job) => { const matchStatus = filters.status === 'All' || job.status === filters.status; const matchEmployee = filters.employee === 'All' || job.assignee === filters.employee; const searchLower = filters.search.toLowerCase(); const matchSearch = filters.search === '' || job.title.toLowerCase().includes(searchLower) || job.customer.toLowerCase().includes(searchLower) || job.id.toString().includes(searchLower); return matchStatus && matchEmployee && matchSearch; }), [filters, jobs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><h2 className="text-2xl font-bold text-slate-800">รายงาน (Reports)</h2><div className="flex gap-2 w-full sm:w-auto"><Button variant={isFilterOpen ? "primary" : "secondary"} icon={Filter} onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex-1 sm:flex-none">ตัวกรอง</Button><Button variant="secondary" icon={Download} className="flex-1 sm:flex-none">ส่งออก</Button></div></div>
      {isFilterOpen && (<Card className="p-4 bg-slate-50 border-indigo-100 animate-in slide-in-from-top-2 duration-200"><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">ค้นหา</label><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" placeholder="ชื่องาน, ลูกค้า, รหัสงาน..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} /></div></div><div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">สถานะ</label><select className="w-full py-2 px-3 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>{uniqueStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></div><div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">พนักงาน</label><div className="flex gap-2"><select className="w-full py-2 px-3 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" value={filters.employee} onChange={(e) => handleFilterChange('employee', e.target.value)}>{uniqueEmployees.map((emp) => <option key={emp} value={emp}>{emp}</option>)}</select><button onClick={resetFilters} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-md border border-slate-200" title="Reset Filters"><RefreshCw className="w-4 h-4" /></button></div></div></div></Card>)}
      <Card className="overflow-hidden">
        <div className="hidden md:block overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-slate-50 border-b border-slate-200"><th className="p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">รหัสงาน</th><th className="p-4 font-semibold text-slate-600 text-sm">ชื่องาน</th><th className="p-4 font-semibold text-slate-600 text-sm">ลูกค้า</th><th className="p-4 font-semibold text-slate-600 text-sm">พนักงาน</th><th className="p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">วันที่</th><th className="p-4 font-semibold text-slate-600 text-sm">สถานะ</th></tr></thead><tbody>{filteredJobs.length > 0 ? filteredJobs.map((job) => (<tr key={job.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-4 text-slate-500 text-sm">#{job.id}</td><td className="p-4 font-medium text-slate-800 text-sm">{job.title}</td><td className="p-4 text-slate-600 text-sm">{job.customer}</td><td className="p-4 text-slate-600 text-sm">{job.assignee || <span className="text-slate-400 italic">ยังไม่มอบหมาย</span>}</td><td className="p-4 text-slate-500 text-sm whitespace-nowrap">{formatDateThai(job.date)}</td><td className="p-4"><Badge status={job.status} /></td></tr>)) : <tr><td colSpan={6} className="p-8 text-center text-slate-500 italic bg-slate-50">ไม่พบข้อมูลงานที่ตรงกับเงื่อนไข</td></tr>}</tbody></table></div>
        <div className="md:hidden">{filteredJobs.length > 0 ? filteredJobs.map((job) => (<div key={job.id} className="p-4 border-b border-slate-100 hover:bg-slate-50 flex flex-col gap-2"><div className="flex justify-between items-start"><div className="flex flex-col"><span className="text-xs text-slate-400 mb-1">#{job.id} • {formatDateThai(job.date)}</span><span className="font-semibold text-slate-800">{job.title}</span><span className="text-sm text-slate-600">{job.customer}</span></div><Badge status={job.status} /></div><div className="flex justify-between items-center text-sm pt-2 mt-2 border-t border-slate-50"><span className="text-slate-500">ผู้รับผิดชอบ:</span><span className="font-medium text-slate-700">{job.assignee || 'ยังไม่มอบหมาย'}</span></div></div>)) : <div className="p-8 text-center text-slate-500 italic bg-slate-50">ไม่พบข้อมูลงานที่ตรงกับเงื่อนไข</div>}</div>
        <div className="p-4 border-t border-slate-200 flex justify-between items-center text-sm text-slate-500"><span>ผลลัพธ์ {filteredJobs.length} รายการ</span><div className="flex gap-2"><button className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50" disabled>ก่อนหน้า</button><button className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50" disabled>ถัดไป</button></div></div>
      </Card>
    </div>
  );
};

const EmployeeManagement = ({ employees, onAddEmployee, onUpdateEmployee, onDeleteEmployee }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const initialFormState = { name: '', dept: 'ซ่อมบำรุง', role: 'ช่างเทคนิค', phone: '', status: 'Active', username: '', password: '' };
  const [formData, setFormData] = useState(initialFormState);
  const handleAddClick = () => { setEditingId(null); setFormData(initialFormState); setShowPassword(false); setIsModalOpen(true); };
  const handleEditClick = (emp) => { setEditingId(emp.id); setFormData({ name: emp.name, dept: emp.dept, role: emp.role, phone: emp.phone, status: emp.status, username: emp.username || '', password: '' }); setShowPassword(false); setIsModalOpen(true); };
  const handleInputChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  const handleSave = (e) => { e.preventDefault(); if (editingId) { const updateData = { ...formData }; if (!updateData.password) { delete (updateData).password; } onUpdateEmployee(editingId, updateData); } else { onAddEmployee(formData); } setIsModalOpen(false); };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">พนักงาน (Employees)</h2><Button variant="primary" icon={Plus} onClick={handleAddClick}>เพิ่มพนักงาน</Button></div>
      <Card className="overflow-hidden">
        <div className="hidden md:block overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-slate-50 border-b border-slate-200"><th className="p-4 text-sm font-semibold text-slate-600">ชื่อ / ชื่อผู้ใช้</th><th className="p-4 text-sm font-semibold text-slate-600">แผนก</th><th className="p-4 text-sm font-semibold text-slate-600">ตำแหน่ง</th><th className="p-4 text-sm font-semibold text-slate-600">เบอร์โทร</th><th className="p-4 text-sm font-semibold text-slate-600">สถานะ</th><th className="p-4 text-sm font-semibold text-slate-600 text-right">จัดการ</th></tr></thead><tbody>{employees.map((emp) => (<tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-4"><div className="flex items-center gap-3"><Avatar src={emp.avatar} alt={emp.name} size="md" /><div><div className="font-medium text-slate-800 whitespace-nowrap">{emp.name}</div><div className="text-xs text-slate-500">@{emp.username}</div></div></div></td><td className="p-4 text-slate-600 text-sm">{emp.dept}</td><td className="p-4 text-slate-600 text-sm">{emp.role}</td><td className="p-4 text-slate-600 text-sm whitespace-nowrap">{emp.phone}</td><td className="p-4"><Badge status={emp.status} /></td><td className="p-4 text-right"><div className="flex items-center justify-end gap-2"><button onClick={() => handleEditClick(emp)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" title="แก้ไข"><Edit2 className="w-4 h-4" /></button><button onClick={() => onDeleteEmployee(emp.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="ลบ"><Trash2 className="w-4 h-4" /></button></div></td></tr>))}</tbody></table></div>
        <div className="md:hidden">{employees.map((emp) => (<div key={emp.id} className="p-4 border-b border-slate-100 hover:bg-slate-50"><div className="flex justify-between items-start mb-3"><div className="flex items-center gap-3"><Avatar src={emp.avatar} alt={emp.name} size="md" /><div><h3 className="font-bold text-slate-800">{emp.name}</h3><p className="text-xs text-slate-500">@{emp.username} • {emp.role}</p></div></div><div className="flex gap-1"><button onClick={() => handleEditClick(emp)} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg"><Edit2 className="w-4 h-4" /></button><button onClick={() => onDeleteEmployee(emp.id)} className="p-2 text-red-600 bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></div></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {emp.phone}</span><Badge status={emp.status} /></div></div>))}</div>
      </Card>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่"}>
        <form className="space-y-4" onSubmit={handleSave}>
            <div className="space-y-4"><h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">ข้อมูลส่วนตัว</h4><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล</label><input name="name" type="text" value={formData.name} onChange={handleInputChange} required className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">เบอร์โทรศัพท์</label><input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white" /></div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">แผนก</label><select name="dept" value={formData.dept} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white"><option value="ซ่อมบำรุง">ซ่อมบำรุง</option><option value="ติดตั้ง">ติดตั้ง</option><option value="บริหาร">บริหาร</option><option value="บริการลูกค้า">บริการลูกค้า</option></select></div><div><label className="block text-sm font-medium text-slate-700 mb-1">ตำแหน่ง</label><select name="role" value={formData.role} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white"><option value="ช่างเทคนิค">ช่างเทคนิค</option><option value="ช่างอาวุโส">ช่างอาวุโส</option><option value="ผู้ดูแลระบบ">ผู้ดูแลระบบ</option><option value="ผู้จัดการ">ผู้จัดการ</option></select></div></div></div>
            <div className="space-y-4 pt-2"><h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2"><Key className="w-4 h-4" /> บัญชีผู้ใช้</h4><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">ชื่อผู้ใช้ (Username)</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input name="username" type="text" value={formData.username} onChange={handleInputChange} placeholder="johndoe" required className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white" /></div></div><div><label className="block text-sm font-medium text-slate-700 mb-1">{editingId ? "รหัสผ่านใหม่ (เลือกใส่)" : "รหัสผ่าน"}</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleInputChange} required={!editingId} placeholder={editingId ? "เว้นว่างเพื่อใช้รหัสเดิม" : "••••••"} className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div></div></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">สถานะบัญชี</label><div className="flex flex-wrap gap-4 mt-2"><label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200"><input type="radio" name="status" value="Active" checked={formData.status === 'Active'} onChange={handleInputChange} className="text-indigo-600 focus:ring-indigo-500" /><span className="text-sm text-slate-700">ใช้งาน (Active)</span></label><label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200"><input type="radio" name="status" value="Inactive" checked={formData.status === 'Inactive'} onChange={handleInputChange} className="text-indigo-600 focus:ring-indigo-500" /><span className="text-sm text-slate-700">ระงับ (Inactive)</span></label></div></div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-slate-100"><Button variant="secondary" onClick={(e) => {e.preventDefault(); setIsModalOpen(false)}} className="w-full sm:w-auto">ยกเลิก</Button><Button variant="primary" onClick={handleSave} className="w-full sm:w-auto">{editingId ? "อัปเดตข้อมูล" : "สร้างบัญชี"}</Button></div>
        </form>
      </Modal>
    </div>
  );
};

const Schedules = ({ employees, schedules, onUpdateEmployeeSchedule }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const dayLabels = { mon: 'จันทร์', tue: 'อังคาร', wed: 'พุธ', thu: 'พฤหัส', fri: 'ศุกร์', sat: 'เสาร์', sun: 'อาทิตย์' };
  
  // Helper to get employee name from ID
  const getEmpName = (id) => {
      const emp = employees.find((e) => e.id === id);
      return emp ? emp.name : 'Unknown';
  };

  const handleEditClick = (sch) => {
      // Create a copy to edit
      setEditingSchedule({ ...sch });
      setIsEditModalOpen(true);
  };

  const handleStatusChange = (day, newStatus) => {
      setEditingSchedule((prev) => ({
          ...prev,
          [day]: newStatus
      }));
  };

  const handleSave = () => {
      if (onUpdateEmployeeSchedule && editingSchedule) {
          onUpdateEmployeeSchedule(editingSchedule);
      }
      setIsEditModalOpen(false);
  };

  const getStatusColor = (status) => {
      switch(status) {
          case 'Available': return 'bg-green-100 text-green-700 border-green-200';
          case 'Busy': return 'bg-orange-100 text-orange-700 border-orange-200';
          default: return 'bg-slate-100 text-slate-500 border-slate-200';
      }
  };

  const getStatusLabel = (status) => {
      switch(status) {
          case 'Available': return 'ว่าง';
          case 'Busy': return 'ไม่ว่าง';
          default: return 'หยุด';
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">ตารางงาน (Schedules)</h2>
        <div className="flex gap-2 items-center text-sm text-slate-500">
            <span className="flex items-center"><div className="w-3 h-3 bg-green-100 rounded-full mr-1 border border-green-200"></div> ว่าง</span>
            <span className="flex items-center"><div className="w-3 h-3 bg-orange-100 rounded-full mr-1 border border-orange-200"></div> ไม่ว่าง</span>
            <span className="flex items-center"><div className="w-3 h-3 bg-slate-100 rounded-full mr-1 border border-slate-200"></div> หยุด</span>
        </div>
      </div>
      
      <Card className="overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-left min-w-[150px] font-semibold text-slate-600 sticky left-0 bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">พนักงาน</th>
                {days.map(day => (
                  <th key={day} className="p-4 min-w-[80px] font-semibold text-slate-600">{dayLabels[day]}</th>
                ))}
                <th className="p-4 min-w-[60px] font-semibold text-slate-600">แก้ไข</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((sch) => { 
                const emp = employees.find((e) => e.id === sch.empId); 
                if (!emp) return null; 
                return (
                  <tr key={sch.empId} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 text-left font-medium text-slate-800 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] whitespace-nowrap">
                        <div className="flex items-center gap-3">
                            <Avatar src={emp.avatar} alt={emp.name} size="sm" />
                            <span>{emp.name}</span>
                        </div>
                    </td>
                    {days.map(key => { 
                        const status = sch[key]; 
                        return (
                            <td key={key} className="p-2">
                                <div className={`w-full py-1.5 rounded text-xs font-medium border ${getStatusColor(status)}`}>
                                    {getStatusLabel(status)}
                                </div>
                            </td>
                        ); 
                    })}
                    <td className="p-2">
                        <button 
                            onClick={() => handleEditClick(sch)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    </td>
                  </tr>
                ); 
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Schedule Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title={`แก้ไขตารางงาน: ${editingSchedule ? getEmpName(editingSchedule.empId) : ''}`}
        size="md"
      >
          {editingSchedule && (
              <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-lg mb-4 text-sm text-slate-600">
                      กำหนดสถานะการทำงานในแต่ละวันของพนักงาน (รายสัปดาห์)
                  </div>
                  
                  <div className="space-y-3">
                      {days.map(day => (
                          <div key={day} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                              <span className="font-medium text-slate-700 w-20">{dayLabels[day]}</span>
                              <div className="flex gap-2">
                                  {['Available', 'Busy', 'Inactive'].map(statusOption => (
                                      <button
                                          key={statusOption}
                                          type="button"
                                          onClick={() => handleStatusChange(day, statusOption)}
                                          className={`px-3 py-1.5 rounded text-xs border transition-all ${
                                              editingSchedule[day] === statusOption
                                              ? getStatusColor(statusOption) + ' ring-2 ring-offset-1 ring-indigo-100 font-bold'
                                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                          }`}
                                      >
                                          {getStatusLabel(statusOption)}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-100">
                      <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>ยกเลิก</Button>
                      <Button variant="primary" onClick={handleSave} icon={Save}>บันทึกตารางงาน</Button>
                  </div>
              </div>
          )}
      </Modal>
    </div>
  );
};

const HolidayManagement = ({ holidays, onAddHoliday, onDeleteHoliday, onEditHoliday }) => {
  const currentYear = new Date().getFullYear();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [formData, setFormData] = useState({ date: '', name: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Extract unique years for filter
  const uniqueYears = useMemo(() => {
    const years = new Set(holidays.map((h) => new Date(h.date).getFullYear()));
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [holidays, currentYear]);

  const filteredHolidays = useMemo(() => {
    return holidays.filter((h) => new Date(h.date).getFullYear() === parseInt(selectedYear));
  }, [holidays, selectedYear]);

  const handleAddClick = () => {
    setEditingHoliday(null);
    setFormData({ date: '', name: '' });
    setIsModalOpen(true);
  };

  const handleEditClick = (holiday) => {
    setEditingHoliday(holiday);
    setFormData({ date: holiday.date, name: holiday.name });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (formData.date && formData.name.trim()) {
      if (editingHoliday) {
        onEditHoliday(editingHoliday.id, formData);
      } else {
        onAddHoliday(formData);
      }
      setIsModalOpen(false);
    }
  };

  const confirmDelete = (id) => {
     setDeleteConfirm({ isOpen: true, id });
  };

  const handleDelete = () => {
     onDeleteHoliday(deleteConfirm.id);
     setDeleteConfirm({ isOpen: false, id: null });
  };

  const getThaiDatePreview = (dateStr) => {
    if (!dateStr) return "-";
    return formatDateThaiFull(dateStr);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">วันหยุดประจำปี (Annual Holidays)</h2>
        <div className="flex gap-2 w-full sm:w-auto">
           <select 
              className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
           >
              {uniqueYears.map((year) => (
                 <option key={year} value={year}>ปี พ.ศ. {year + 543}</option>
              ))}
           </select>
           <Button variant="primary" icon={Plus} onClick={handleAddClick}>เพิ่มวันหยุด</Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-sm font-semibold text-slate-600">วันที่</th>
                <th className="p-4 text-sm font-semibold text-slate-600">ชื่อวันหยุด</th>
                <th className="p-4 text-sm font-semibold text-slate-600 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredHolidays.map((holiday) => (
                <tr key={holiday.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 text-slate-600 font-medium">
                     <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-indigo-500" />
                        {formatDateThaiFull(holiday.date)}
                     </div>
                  </td>
                  <td className="p-4 text-slate-800">{holiday.name}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditClick(holiday)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        title="แก้ไข"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => confirmDelete(holiday.id)} 
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredHolidays.length === 0 && (
                <tr><td colSpan={3} className="p-8 text-center text-slate-500">ไม่มีข้อมูลวันหยุดในปีนี้</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingHoliday ? "แก้ไขวันหยุด" : "เพิ่มวันหยุดประจำปี"}>
         <div className="space-y-4">
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">วันที่</label>
               <input 
                 type="date" 
                 className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                 value={formData.date}
                 onChange={(e) => setFormData({ ...formData, date: e.target.value })}
               />
               {formData.date && (
                  <p className="text-xs text-indigo-600 mt-1 ml-1">
                     แสดงผล: {getThaiDatePreview(formData.date)}
                  </p>
               )}
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อวันหยุด</label>
               <input 
                 type="text" 
                 className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                 placeholder="ตัวอย่าง: วันสงกรานต์"
                 value={formData.name}
                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
               />
            </div>
            <div className="flex justify-end gap-2 pt-4">
               <Button variant="secondary" onClick={() => setIsModalOpen(false)}>ยกเลิก</Button>
               <Button variant="primary" onClick={handleSave}>{editingHoliday ? "บันทึกการแก้ไข" : "เพิ่มวันหยุด"}</Button>
            </div>
         </div>
      </Modal>

      <Modal isOpen={deleteConfirm.isOpen} onClose={() => setDeleteConfirm({ isOpen: false, id: null })} title="ยืนยันการลบ">
         <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg flex items-start gap-3">
               <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
               <div>
                  <h4 className="font-bold text-red-700">ต้องการลบวันหยุดนี้ใช่หรือไม่?</h4>
                  <p className="text-sm text-red-600 mt-1">การดำเนินการนี้ไม่สามารถเรียกคืนได้</p>
               </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
               <Button variant="secondary" onClick={() => setDeleteConfirm({ isOpen: false, id: null })}>ยกเลิก</Button>
               <Button variant="danger" onClick={handleDelete}>ยืนยันลบ</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

const ProductCategoryManagement = ({ categories, onAddCategory, onEditCategory, onToggleCategoryStatus, onDeleteCategory }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

  const handleAddClick = () => {
    setEditingCategory(null);
    setFormData({ name: '' });
    setIsModalOpen(true);
  };

  const handleEditClick = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (formData.name.trim()) {
      if (editingCategory) {
        onEditCategory(editingCategory.id, formData.name);
      } else {
        onAddCategory(formData.name);
      }
      setIsModalOpen(false);
    }
  };

  const confirmDelete = (id) => {
     setDeleteConfirm({ isOpen: true, id });
  };

  const handleDelete = () => {
     onDeleteCategory(deleteConfirm.id);
     setDeleteConfirm({ isOpen: false, id: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">หมวดหมู่สินค้า (Product Categories)</h2>
        <Button variant="primary" icon={Plus} onClick={handleAddClick}>เพิ่มหมวดหมู่</Button>
      </div>
      
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-sm font-semibold text-slate-600">ID</th>
                <th className="p-4 text-sm font-semibold text-slate-600">ชื่อหมวดหมู่</th>
                <th className="p-4 text-sm font-semibold text-slate-600">สถานะ</th>
                <th className="p-4 text-sm font-semibold text-slate-600 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 text-slate-500">#{cat.id}</td>
                  <td className="p-4 font-medium text-slate-800">{cat.name}</td>
                  <td className="p-4">
                     <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cat.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {cat.status === 'Active' ? 'ใช้งานอยู่' : 'ไม่ได้ใช้งาน'}
                     </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditClick(cat)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        title="แก้ไขชื่อ"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onToggleCategoryStatus(cat.id)} 
                        className={`p-2 rounded-full transition-colors ${cat.status === 'Active' ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                        title={cat.status === 'Active' ? "ปิดการใช้งาน" : "เปิดการใช้งาน"}
                      >
                        {cat.status === 'Active' ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => confirmDelete(cat.id)} 
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">ยังไม่มีข้อมูลหมวดหมู่สินค้า</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategory ? "แก้ไขหมวดหมู่สินค้า" : "เพิ่มหมวดหมู่สินค้าใหม่"}>
         <form className="space-y-4" onSubmit={handleSave}>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อหมวดหมู่</label>
               <input 
                 type="text" 
                 className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                 placeholder="ตัวอย่าง: เครื่องใช้ไฟฟ้า"
                 value={formData.name}
                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                 autoFocus
               />
            </div>
            <div className="flex justify-end gap-2 pt-4">
               <Button variant="secondary" onClick={(e) => { e.preventDefault(); setIsModalOpen(false); }}>ยกเลิก</Button>
               <Button variant="primary" onClick={handleSave}>{editingCategory ? "บันทึกการแก้ไข" : "เพิ่มหมวดหมู่"}</Button>
            </div>
         </form>
      </Modal>

      <Modal isOpen={deleteConfirm.isOpen} onClose={() => setDeleteConfirm({ isOpen: false, id: null })} title="ยืนยันการลบ">
         <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg flex items-start gap-3">
               <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
               <div>
                  <h4 className="font-bold text-red-700">ต้องการลบหมวดหมู่นี้ใช่หรือไม่?</h4>
                  <p className="text-sm text-red-600 mt-1">การดำเนินการนี้ไม่สามารถเรียกคืนได้ และอาจส่งผลกระทบต่อข้อมูลการขายที่อ้างอิงหมวดหมู่นี้</p>
               </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
               <Button variant="secondary" onClick={() => setDeleteConfirm({ isOpen: false, id: null })}>ยกเลิก</Button>
               <Button variant="danger" onClick={handleDelete}>ยืนยันลบ</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

// --- MAIN LAYOUT & NAV ---

export default function EmployeeQueueApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [jobs, setJobs] = useState(INITIAL_JOBS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [schedules, setSchedules] = useState(INITIAL_SCHEDULE);
  const [holidays, setHolidays] = useState(INITIAL_HOLIDAYS);
  const [leaves, setLeaves] = useState(INITIAL_LEAVES); // Added state for leaves
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Employee CRUD Logic
  const addEmployee = (newEmpData) => { const newId = Math.max(...employees.map(e => e.id), 0) + 1; const newEmployee = { id: newId, ...newEmpData, activeJobs: 0, queuePos: 0 }; setEmployees([...employees, newEmployee]); };
  const updateEmployee = (id, updatedData) => { setEmployees(employees.map(emp => emp.id === id ? { ...emp, ...updatedData } : emp)); };
  const deleteEmployee = (id) => { if (window.confirm("คุณแน่ใจหรือไม่ที่จะลบข้อมูลพนักงานนี้?")) { setEmployees(employees.filter(emp => emp.id !== id)); } };

  // Category CRUD Logic
  const addCategory = (name) => {
    const newId = Math.max(...categories.map(c => c.id), 0) + 1;
    setCategories([...categories, { id: newId, name, status: 'Active' }]);
  };
  const editCategory = (id, newName) => {
    setCategories(categories.map(cat => cat.id === id ? { ...cat, name: newName } : cat));
  };
  const toggleCategoryStatus = (id) => {
    setCategories(categories.map(cat => cat.id === id ? { ...cat, status: cat.status === 'Active' ? 'Inactive' : 'Active' } : cat));
  };
  const deleteCategory = (id) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  // Holiday CRUD Logic
  const addHoliday = (holiday) => {
    const newId = Math.max(...holidays.map(h => h.id), 0) + 1;
    setHolidays([...holidays, { id: newId, ...holiday }]);
  };
  const updateHoliday = (id, updatedData) => {
    setHolidays(holidays.map(h => h.id === id ? { ...h, ...updatedData } : h));
  };
  const deleteHoliday = (id) => {
    setHolidays(holidays.filter(h => h.id !== id));
  };

  // Leave CRUD Logic
  const addLeave = (leave) => {
    const newId = Math.max(...leaves.map(l => l.id), 0) + 1;
    setLeaves([...leaves, { id: newId, ...leave }]);
  };
  const deleteLeave = (id) => {
    setLeaves(leaves.filter(l => l.id !== id));
  };
  
  // Schedule Update Logic (Updated to handle bulk update)
  const handleUpdateEmployeeSchedule = (updatedSchedule) => {
     setSchedules(prev => prev.map(sch => sch.empId === updatedSchedule.empId ? updatedSchedule : sch));
  };

  // --- JOB ACTIONS ---
  const handleUpdateJobStatus = (jobId, newStatus, data = null) => {
    const now = new Date().toISOString();
    setJobs(prevJobs => prevJobs.map(job => {
        if (job.id === jobId) {
            const updatedLogs = [...(job.statusLogs || []), { status: newStatus, timestamp: now }];
            if (newStatus === 'Done' && data) { return { ...job, status: newStatus, salesReport: data, statusLogs: updatedLogs }; }
            if (newStatus === 'Rejected' && data) { return { ...job, status: newStatus, rejectionReason: data, statusLogs: updatedLogs }; }
            return { ...job, status: newStatus, statusLogs: updatedLogs };
        }
        return job;
    }));
    if (newStatus === 'Done' || newStatus === 'Rejected') {
        const job = jobs.find(j => j.id === jobId);
        if (job) { setEmployees(prev => prev.map(e => { if (e.name === job.assignee && e.activeJobs > 0) { return { ...e, activeJobs: e.activeJobs - 1 }; } return e; })); }
    }
  };
  
  const handleAssignJob = (empId, customJobData = null) => {
    const maxQueuePos = Math.max(...employees.map(e => e.queuePos), 0);
    const employee = employees.find(e => e.id === empId);
    const now = new Date().toISOString();
    const newJob = {
        id: Math.max(...jobs.map(j => j.id), 100) + 1,
        title: customJobData?.title || "บริการลูกค้า Walk-in",
        customer: customJobData?.customer || "ลูกค้า Walk-in",
        assignee: employee.name,
        status: "Pending",
        date: now,
        priority: customJobData?.priority || "Normal",
        description: customJobData?.description || "มอบหมายผ่านระบบคิว",
        statusLogs: [ { status: "Pending", timestamp: now } ]
    };
    setJobs([...jobs, newJob]);
    setEmployees(prevEmployees => prevEmployees.map(emp => { if (emp.id === empId) { return { ...emp, activeJobs: emp.activeJobs + 1, queuePos: maxQueuePos + 1 }; } return emp; }));
    alert(`✅ มอบหมายงาน '${newJob.title}' ให้คุณ ${employee.name} เรียบร้อยแล้ว`);
  };

  const handleRejectJob = (empId, reason) => {
    const maxQueuePos = Math.max(...employees.map(e => e.queuePos), 0);
    setEmployees(prevEmployees => prevEmployees.map(emp => { if (emp.id === empId) { return { ...emp, queuePos: maxQueuePos + 1 }; } return emp; }));
    console.log(`User ${empId} rejected job. Reason: ${reason}`);
    alert(`⚠️ ปฏิเสธงานเรียบร้อย บันทึกเหตุผล: "${reason}"`);
  };

  const handleReorderQueue = (newOrderIds) => {
    setEmployees(prev => {
      const newEmpState = [...prev];
      newOrderIds.forEach((id, index) => {
        const empIndex = newEmpState.findIndex(e => e.id === id);
        if (empIndex > -1) { newEmpState[empIndex] = { ...newEmpState[empIndex], queuePos: index + 1 }; }
      });
      return newEmpState;
    });
  };

  const NavItem = ({ id, label, icon: Icon, hasSubmenu, isOpen, onToggle }) => (
    <button
      onClick={() => { 
        if (hasSubmenu) {
           onToggle();
        } else {
           setActiveTab(id); 
           setIsMobileMenuOpen(false); 
        }
      }}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
        activeTab === id && !hasSubmenu
        ? 'bg-indigo-50 text-indigo-700 font-medium' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <span>{label}</span>
      </div>
      {hasSubmenu && (
        isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
      )}
    </button>
  );

  const SubNavItem = ({ id, label }) => (
    <button
       onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }}
       className={`w-full flex items-center pl-12 pr-4 py-2 text-sm transition-colors ${
         activeTab === id ? 'text-indigo-600 font-medium bg-indigo-50/50' : 'text-slate-500 hover:text-slate-800'
       }`}
    >
       <div className={`w-1.5 h-1.5 rounded-full mr-3 ${activeTab === id ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
       {label}
    </button>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard employees={employees} jobs={jobs} onAssignJob={handleAssignJob} onRejectJob={handleRejectJob} />;
      case 'my-tasks': return <MyWorklist employees={employees} jobs={jobs} onUpdateStatus={handleUpdateJobStatus} categories={categories} />;
      case 'work-calendar': return <WorkCalendar employees={employees} schedules={schedules} holidays={holidays} leaves={leaves} onUpdateEmployeeSchedule={handleUpdateEmployeeSchedule} />;
      case 'staff-queue': return (
        <StaffQueue 
          employees={employees} 
          onAssignJob={handleAssignJob}
          onRejectJob={handleRejectJob}
          onReorderQueue={handleReorderQueue}
        />
      );
      case 'assignment': return <JobAssignment employees={employees} jobs={jobs} onAssignJob={handleAssignJob} onRejectJob={handleRejectJob} />;
      case 'queue': return <QueueSummary employees={employees} jobs={jobs} />;
      case 'reports': return <JobReports employees={employees} jobs={jobs} />;
      
      // System Settings Sub-pages
      case 'employees': return <EmployeeManagement employees={employees} onAddEmployee={addEmployee} onUpdateEmployee={updateEmployee} onDeleteEmployee={deleteEmployee} />;
      case 'schedule': return <Schedules employees={employees} schedules={schedules} onUpdateEmployeeSchedule={handleUpdateEmployeeSchedule} />;
      case 'categories': return (
        <ProductCategoryManagement 
          categories={categories} 
          onAddCategory={addCategory} 
          onEditCategory={editCategory} 
          onToggleCategoryStatus={toggleCategoryStatus}
          onDeleteCategory={deleteCategory} 
        />
      );
      case 'holidays': return <HolidayManagement holidays={holidays} onAddHoliday={addHoliday} onEditHoliday={updateHoliday} onDeleteHoliday={deleteHoliday} />;
      case 'leaves': return <EmployeeLeaveManagement employees={employees} leaves={leaves} onAddLeave={addLeave} onDeleteLeave={deleteLeave} />;
      
      default: return <Dashboard employees={employees} jobs={jobs} onAssignJob={handleAssignJob} onRejectJob={handleRejectJob} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex text-slate-900">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col fixed h-full z-10 shadow-sm">
        <div className="p-6 border-b border-slate-100"><h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2"><LayoutDashboard className="w-6 h-6" />JobQueue<span className="text-slate-400">Sys</span></h1></div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
           <NavItem id="dashboard" label="แดชบอร์ด" icon={LayoutDashboard} />
           <NavItem id="staff-queue" label="คิวพนักงาน" icon={UserPlus} />
           <NavItem id="my-tasks" label="งานของฉัน" icon={ClipboardList} />
           <NavItem id="work-calendar" label="ปฏิทินงาน" icon={Calendar} />
           <NavItem id="assignment" label="มอบหมายงาน" icon={Briefcase} />
           <NavItem id="queue" label="สรุปคิวงาน" icon={ListOrdered} />
           <NavItem id="reports" label="รายงาน" icon={FileText} />
           
           <div className="pt-4 mt-4 border-t border-slate-100">
              <p className="px-4 text-xs font-semibold text-slate-400 uppercase mb-2">การตั้งค่า</p>
              <NavItem 
                 id="settings" 
                 label="ตั้งค่าระบบ" 
                 icon={Settings} 
                 hasSubmenu 
                 isOpen={isSettingsOpen} 
                 onToggle={() => setIsSettingsOpen(!isSettingsOpen)} 
              />
              {isSettingsOpen && (
                 <div className="mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    <SubNavItem id="employees" label="พนักงาน" />
                    <SubNavItem id="schedule" label="ตารางงาน" />
                    <SubNavItem id="categories" label="หมวดหมู่สินค้า" />
                    <SubNavItem id="holidays" label="วันหยุดประจำปี" />
                    <SubNavItem id="leaves" label="วันหยุดพนักงาน" />
                 </div>
              )}
           </div>
        </nav>
        <div className="p-4 border-t border-slate-100"><div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50"><div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">A</div><div><p className="text-sm font-medium text-slate-800">Admin User</p><p className="text-xs text-slate-500">System Admin</p></div></div></div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl p-4 flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex justify-between items-center mb-6"><h1 className="text-xl font-bold text-indigo-600">JobQueueSys</h1><button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-full"><X className="text-slate-500 w-5 h-5" /></button></div>
            <nav className="space-y-1">
               <NavItem id="dashboard" label="แดชบอร์ด" icon={LayoutDashboard} />
               <NavItem id="staff-queue" label="คิวพนักงาน" icon={UserPlus} />
               <NavItem id="my-tasks" label="งานของฉัน" icon={ClipboardList} />
               <NavItem id="work-calendar" label="ปฏิทินงาน" icon={Calendar} />
               <NavItem id="assignment" label="มอบหมายงาน" icon={Briefcase} />
               <NavItem id="queue" label="สรุปคิวงาน" icon={ListOrdered} />
               <NavItem id="reports" label="รายงาน" icon={FileText} />
               
               <div className="pt-4 mt-4 border-t border-slate-100">
                  <p className="px-4 text-xs font-semibold text-slate-400 uppercase mb-2">การตั้งค่า</p>
                  <NavItem 
                     id="settings" 
                     label="ตั้งค่าระบบ" 
                     icon={Settings} 
                     hasSubmenu 
                     isOpen={isSettingsOpen} 
                     onToggle={() => setIsSettingsOpen(!isSettingsOpen)} 
                  />
                  {isSettingsOpen && (
                     <div className="mt-1 space-y-1">
                        <SubNavItem id="employees" label="พนักงาน" />
                        <SubNavItem id="schedule" label="ตารางงาน" />
                        <SubNavItem id="categories" label="หมวดหมู่สินค้า" />
                        <SubNavItem id="holidays" label="วันหยุดประจำปี" />
                        <SubNavItem id="leaves" label="วันหยุดพนักงาน" />
                     </div>
                  )}
               </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-20 shadow-sm"><div className="flex items-center gap-3"><button onClick={() => setIsMobileMenuOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg"><Menu className="text-slate-600 w-6 h-6" /></button><span className="font-bold text-indigo-600 text-lg">JobQueueSys</span></div><div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center"><User className="w-5 h-5 text-slate-500" /></div></header>
        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">{renderContent()}</div>
      </main>
    </div>
  );
}