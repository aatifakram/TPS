// Global variables for data (will be populated from Supabase)
let students = [];
let teachers = [];
let payrollEntries = [];
let invoices = [];
let announcements = [];
let notifications = []; // Client-side for simplicity
let auditLogs = [];
let backups = []; // Client-side for simplicity
let attendanceRecords = [];
let teacherAttendanceRecords = [];
let profiles = []; // New global variable for profiles
let exams = []; // Global variable for exams
let homeworkAssignments = []; // Global variable for homework
let holidays = []; // Global variable for holidays
let currentInvoiceId = null; // New global variable for tracking the invoice being edited

// Supabase Client Initialization (Replace with your actual keys)
const SUPABASE_URL = 'https://zyvwttzwjweeslvjbatg.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dnd0dHp3andlZXNsdmpiYXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NTQwODMsImV4cCI6MjA2OTUzMDA4M30.pgzB45XBJAyGBlkKUJF4Jr0yVNunXjwa8p8JOaX7Nso'; // Replace with your actual Supabase Anon Key
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global variable for QR Scanner instances
let html5QrCodeScanner = null;
let html5QrCodeScannerTeacher = null; // For teacher QR scanner

// Ensure html5-qrcode is available. It's expected to be loaded via <script> tag in index.html
// This check is for robustness, but the primary loading mechanism is the HTML script tag.
function checkHtml5QrCodeAvailability() {
    if (typeof Html5QrcodeScanner === 'undefined') {
        console.error('Html5QrcodeScanner is not defined. Ensure html5-qrcode.min.js is loaded correctly.');
        alert('QR scanner library not loaded. Please check your internet connection or script path.');
        return false;
    }
    return true;
}


// --- IMPORTANT RLS NOTE ---
// If you are still getting 403 errors after this, ensure your Row Level Security (RLS) policies
// in Supabase are configured to allow 'SELECT', 'INSERT', 'UPDATE', 'DELETE' for the 'authenticated'
// and/or 'anon' roles on ALL tables your application interacts with.
//
// For testing, you can temporarily set very permissive policies like:
// CREATE POLICY "Allow all for authenticated users" ON your_table FOR ALL TO authenticated USING (true);
// CREATE POLICY "Allow all for anon users" ON your_table FOR ALL TO anon USING (true);
//
// Remember to refine these for production security!
//
// If you are getting 403 errors for attendance, specifically check:
// 1. RLS is ENABLED on the 'attendance' and 'teacher_attendance' tables.
// 2. There is a 'SELECT' policy for the 'authenticated' role (or 'anon' if needed before login)
//    on both 'attendance' and 'teacher_attendance' tables, with a 'USING' expression of 'true'.


// --- UI Utilities: Dark Mode and Exports ---
function applyDarkModeFromStorage() {
    const dark = localStorage.getItem('darkMode');
    const body = document.body;
    const darkModeIcon = document.getElementById('darkModeToggle')?.querySelector('i');

    if (dark === 'true') {
        body.classList.add('dark-mode');
        if (darkModeIcon) darkModeIcon.classList.replace('fa-moon', 'fa-sun');
    } else {
        body.classList.remove('dark-mode');
        if (darkModeIcon) darkModeIcon.classList.replace('fa-sun', 'fa-moon');
    }
}

function toggleDarkMode() {
    const body = document.body;
    const darkModeIcon = document.getElementById('darkModeToggle')?.querySelector('i');
    const isDark = body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark ? 'true' : 'false');

    if (darkModeIcon) {
        if (isDark) {
            darkModeIcon.classList.replace('fa-moon', 'fa-sun');
        } else {
            darkModeIcon.classList.replace('fa-sun', 'fa-moon');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggleBtn = document.getElementById('darkModeToggle');
    if (darkModeToggleBtn) {
        darkModeToggleBtn.addEventListener('click', toggleDarkMode);
    }
    applyDarkModeFromStorage();
});

// Export utilities
function exportChartAsPNG(chartCanvasId, filename = 'chart.png') {
    const canvas = document.getElementById(chartCanvasId);
    if (!canvas) {
        console.error(`Canvas with ID ${chartCanvasId} not found.`);
        return;
    }
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = filename;
    link.click();
}

function exportArrayToCSV(array, filename = 'export.csv') {
    if (!Array.isArray(array) || array.length === 0) { alert('No data to export'); return; }
    const keys = Object.keys(array[0]);
    const lines = [keys.join(',')].concat(array.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Placeholder for Excel export functions (requires XLSX.js)
function exportStudentsToExcel() {
    if (students.length === 0) {
        alert('No student data to export.');
        return;
    }
    const ws = XLSX.utils.json_to_sheet(students);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "students_data.xlsx");
    console.log('Students data exported to Excel.');
}

function exportTeachersToExcel() {
    if (teachers.length === 0) {
        alert('No teacher data to export.');
        return;
    }
    const ws = XLSX.utils.json_to_sheet(teachers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Teachers");
    XLSX.writeFile(wb, "teachers_data.xlsx");
    console.log('Teachers data exported to Excel.');
}

function exportHomeworkToExcel() {
    if (homeworkAssignments.length === 0) {
        alert('No homework data to export.');
        return;
    }
    const ws = XLSX.utils.json_to_sheet(homeworkAssignments);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Homework");
    XLSX.writeFile(wb, "homework_data.xlsx");
    console.log('Homework data exported to Excel.');
}

function exportStudentAttendanceToExcel() {
    if (attendanceRecords.length === 0) {
        alert('No student attendance data to export.');
        return;
    }
    const dataToExport = attendanceRecords.map(record => ({
        'Student Name': record.students?.name || 'N/A',
        'Roll No.': record.students?.roll_no || 'N/A',
        'Class': record.students?.class || 'N/A',
        'Date': record.date,
        'Status': record.status,
        'Remarks': record.remarks || ''
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "StudentAttendance");
    XLSX.writeFile(wb, "student_attendance_data.xlsx");
    console.log('Student attendance data exported to Excel.');
}

function exportTeacherAttendanceToExcel() {
    if (teacherAttendanceRecords.length === 0) {
        alert('No teacher attendance data to export.');
        return;
    }
    const dataToExport = teacherAttendanceRecords.map(record => ({
        'Teacher Name': record.teachers?.name || 'N/A',
        'Subject': record.teachers?.subject || 'N/A',
        'Date': record.date,
        'Status': record.status,
        'Remarks': record.remarks || ''
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TeacherAttendance");
    XLSX.writeFile(wb, "teachers_attendance_data.xlsx");
    console.log('Teacher attendance data exported to Excel.');
}

// Placeholder for PDF export functions (requires jspdf)
function exportReportsToPdf() {
    alert('Generating reports PDF...');
    // Implement jspdf logic here to generate a PDF of the reports dashboard
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("School Reports", 10, 10);
    // Add content from charts and tables
    doc.save("school_reports.pdf");
    console.log('Reports PDF generation initiated.');
}

function generateHomeworkReport() {
    alert('Generating homework report PDF...');
    // Implement jspdf logic here to generate a PDF of homework assignments
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Homework Assignments Report", 10, 10);
    // Add homework data
    doc.save("homework_report.pdf");
    console.log('Homework report PDF generation initiated.');
}

function exportStudentAttendanceToPdf() {
    alert('Generating student attendance PDF...');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Student Attendance Report", 10, 10);
    const tableColumn = ["Student Name", "Roll No.", "Class", "Date", "Status", "Remarks"];
    const tableRows = [];

    attendanceRecords.forEach(record => {
        const studentData = [
            record.students?.name || 'N/A',
            record.students?.roll_no || 'N/A',
            record.students?.class || 'N/A',
            record.date,
            record.status,
            record.remarks || ''
        ];
        tableRows.push(studentData);
    });

    doc.autoTable(tableColumn, tableRows, { startY: 20 });
    doc.save("student_attendance_report.pdf");
    console.log('Student attendance PDF generation initiated.');
}

function exportTeacherAttendanceToPdf() {
    alert('Generating teacher attendance PDF...');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Teacher Attendance Report", 10, 10);
    const tableColumn = ["Teacher Name", "Subject", "Date", "Status", "Remarks"];
    const tableRows = [];

    teacherAttendanceRecords.forEach(record => {
        const teacherData = [
            record.teachers?.name || 'N/A',
            record.teachers?.subject || 'N/A',
            record.date,
            record.status,
            record.remarks || ''
        ];
        tableRows.push(teacherData);
    });

    doc.autoTable(tableColumn, tableRows, { startY: 20 });
    doc.save("teacher_attendance_report.pdf");
    console.log('Teacher attendance PDF generation initiated.');
}

// --- Utility Functions ---

/**
 * Generates a unique UUID.
 * @returns {string} A UUID string.
 */
function generateUniqueId() {
    return crypto.randomUUID();
}

/**
 * Adds an entry to the audit_logs table in Supabase.
 * @param {string} userEmail - The email of the user performing the action.
 * @param {string} action - The action performed (e.g., 'Logged In', 'Added Student').
 * @param {string} module - The module where the action occurred (e.g., 'Authentication', 'Students').
 * @param {string} details - More specific details about the action.
 */
async function addAuditLog(userEmail, action, module, details) {
    try {
        const emailToLog = userEmail || 'anonymous@example.com';

        const { data, error } = await supabase.from('audit_logs').insert([
            {
                user_email: emailToLog,
                action: action,
                module: module,
                details: details,
                timestamp: new Date().toISOString()
            }
        ]);
        if (error) {
            console.error('Audit Log Error: Error adding audit log:', error);
            // Log the full error object for debugging RLS issues
            console.error('Audit Log Error: Supabase RLS or DB error details:', error.message, error.details, error.hint);
        } else {
            console.log('Audit Log Success: Audit log added:', data);
        }
    } catch (err) {
        console.error('Audit Log Unexpected Error:', err);
    }
}

/**
 * Converts an ArrayBuffer to a Base64 string.
 * Used for storing WebAuthn credentials.
 * @param {ArrayBuffer} buffer - The ArrayBuffer to convert.
 * @returns {string} The Base64 encoded string.
 */
function arrayBufferToBase64(buffer) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
}

/**
 * Converts a Base64 string to an ArrayBuffer.
 * Used for retrieving WebAuthn credentials.
 * @param {string} base64 - The Base64 string to convert.
 * @returns {ArrayBuffer} The ArrayBuffer.
 */
function base64ToArrayBuffer(base64) {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

// Placeholder for voice assistant
function startVoiceAssistant() {
    alert('Voice assistant functionality is not yet implemented.');
    console.log('Voice assistant started.');
}

// FIX: Corrected typing effect function
function initTypedWelcome() {
    const typedWelcomeElement = document.getElementById('typed-welcome');
    if (typedWelcomeElement) {
        const text = "Welcome to Tapowan Public School Management System";
        let i = 0;
        typedWelcomeElement.textContent = ''; // Clear content initially

        function typeWriter() {
            if (i < text.length) {
                typedWelcomeElement.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50); // Typing speed (50ms per character)
            }
        }
        typeWriter();
    }
}


// --- Data Fetching Functions (from Supabase) ---

async function fetchStudents() {
    console.log('Fetching students...');
    try {
        // Fetch students from the 'students' table
        const { data, error } = await supabase.from('students').select('*');
        if (error) throw error;
        students = data;
        console.log('Students fetched successfully:', students.length);
    } catch (error) {
        console.error('Error fetching students:', error);
        students = [];
    } finally {
        renderStudentTable();
        updateDashboardStats();
    }
}

async function fetchTeachers() {
    console.log('Fetching teachers...');
    try {
        const { data, error } = await supabase.from('teachers').select('*');
        if (error) throw error;
        teachers = data;
        console.log('Teachers fetched successfully:', teachers.length);
    } catch (error) {
        console.error('Error fetching teachers:', error);
        teachers = [];
    } finally {
        renderTeacherTable();
        updateDashboardStats();
    }
}

async function fetchPayrollEntries() {
    console.log('Fetching payroll entries...');
    try {
        const { data, error } = await supabase.from('payroll').select('*');
        if (error) throw error;
        payrollEntries = data;
        console.log('Payroll entries fetched successfully:', payrollEntries.length);
    } catch (error) {
        console.error('Error fetching payroll entries:', error);
        payrollEntries = [];
    } finally {
        renderPayrollTable();
    }
}

async function fetchInvoices() {
    console.log('Fetching invoices...');
    try {
        const { data, error } = await supabase.from('finance').select(`
            *,
            students (
                id,
                name,
                class,
                father_name
            )
        `);
        if (error) throw error;
        invoices = data;
        console.log('Invoices fetched successfully:', invoices.length);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        invoices = [];
    } finally {
        renderFinanceTable();
        updateDashboardStats();
    }
}

async function fetchAnnouncements() {
    console.log('Fetching announcements...');
    try {
        const { data, error } = await supabase.from('announcements').select('*');
        if (error) throw error;
        announcements = data;
        console.log('Announcements fetched successfully:', announcements.length);
    } catch (error) {
        console.error('Error fetching announcements:', error);
        announcements = [];
    } finally {
        renderAnnouncementTable();
    }
}

async function fetchNotifications() {
    console.log('Fetching notifications (client-side simulation)...');
    // Notifications are still client-side for simplicity, but could be fetched from DB
    notifications = JSON.parse(localStorage.getItem('notifications')) || [
        { id: 1, title: "New student enrolled!", description: "Emily Johnson joined Grade 10.", time: "5 minutes ago", unread: true },
        { id: 2, title: "Payroll processed", description: "March payroll completed for all staff.", time: "1 hour ago", unread: true },
        { id: 3, title: "Event Reminder", description: "Parent-Teacher meeting tomorrow at 3 PM.", time: "Yesterday", unread: true },
        { id: 4, title: "System Update", description: "System maintenance scheduled for Sunday.", time: "2 days ago", unread: false },
    ];
    renderDropdownNotifications();
    console.log('Notifications loaded:', notifications.length);
}

async function fetchAuditLogs() {
    console.log('Fetching audit logs...');
    try {
        const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
        if (error) throw error;
        auditLogs = data;
        console.log('Audit logs fetched successfully:', auditLogs.length);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        auditLogs = [];
    } finally {
        renderAuditLogs();
        renderRecentActivity();
    }
}

async function fetchBackups() {
    console.log('Fetching backups (client-side simulation)...');
    // Backups are simulated, but could be fetched from a storage service
    backups = JSON.parse(localStorage.getItem('backups')) || [
        { id: 'B001', backup_id: 'BK20231026-001', date: '2023-10-26 02:00:00', size: '150 MB', type: 'Full' },
        { id: 'B002', backup_id: 'BK20231025-001', date: '2023-10-25 02:00:00', size: '148 MB', type: 'Full' }
    ];
    renderBackupTable();
    console.log('Backups loaded:', backups.length);
}

async function fetchAttendanceRecords() {
    console.log('Fetching student attendance records...');
    try {
        // Fetch attendance records and join with students table to get student details
        const { data, error } = await supabase
            .from('attendance')
            .select(`
                *,
                students (
                    id,
                    name,
                    class,
                    roll_no
                )
            `);
        if (error) {
            console.error('Error fetching student attendance records:', error);
            console.error('Supabase RLS or DB error details for student attendance:', error.message, error.details, error.hint);
            if (error.code === '403') {
                console.error("Received 403 Forbidden for student attendance. Check RLS policies for 'attendance' table.");
            }
            throw error; // Re-throw to ensure finally block is reached
        }
        attendanceRecords = data;
        console.log('Student attendance records fetched successfully:', attendanceRecords.length);
    } catch (error) {
        console.error('Caught error fetching student attendance, setting attendanceRecords to empty array.');
        attendanceRecords = [];
    } finally {
        // Ensure renderAttendanceTable is called after data is fetched
        renderAttendanceTable();
        // Also update dashboard stats that rely on attendance
        updateDashboardStats();
    }
}

async function fetchTeacherAttendanceRecords() {
    console.log('Fetching teacher attendance records...');
    try {
        // Fetch teacher attendance records and join with teachers table to get teacher details
        const { data, error } = await supabase
            .from('teacher_attendance')
            .select(`
                *,
                teachers (
                    id,
                    name,
                    subject
                )
            `);
        if (error) {
            console.error('Error fetching teacher attendance records:', error);
            console.error('Supabase RLS or DB error details for teacher attendance:', error.message, error.details, error.hint);
            if (error.code === '403') {
                console.error("Received 403 Forbidden for teacher attendance. Check RLS policies for 'teacher_attendance' table.");
            }
            throw error; // Re-throw to ensure finally block is reached
        }
        teacherAttendanceRecords = data;
        console.log('Teacher attendance records fetched successfully:', teacherAttendanceRecords.length);
    }
    catch (error) {
        console.error('Caught error fetching teacher attendance, setting teacherAttendanceRecords to empty array.');
        teacherAttendanceRecords = [];
    } finally {
        renderTeacherAttendanceTable();
        updateDashboardStats();
    }
}

async function fetchProfiles() {
    console.log('Fetching user profiles...');
    try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        profiles = data;
        console.log('User profiles fetched successfully:', profiles.length);
    } catch (error) {
        console.error('Error fetching profiles:', error);
        profiles = [];
    } finally {
        renderUserTable();
    }
}

async function fetchExams() {
    console.log('Fetching exams...');
    try {
        const { data, error } = await supabase.from('exams').select('*');
        if (error) throw error;
        exams = data;
        console.log('Exams fetched successfully:', exams.length);
    } catch (error) {
        console.error('Error fetching exams:', error);
        exams = [];
    } finally {
        renderExams();
    }
}

async function fetchHomework() {
    console.log('Fetching homework assignments...');
    try {
        const { data, error } = await supabase.from('homework').select('*');
        if (error) throw error;
        homeworkAssignments = data;
        console.log('Homework assignments fetched successfully:', homeworkAssignments.length);
    } catch (error) {
        console.error('Error fetching homework:', error);
        homeworkAssignments = [];
    } finally {
        renderHomeworkTable();
    }
}

async function fetchHolidays() {
    console.log('Fetching holidays...');
    try {
        const { data, error } = await supabase.from('holidays').select('*');
        if (error) throw error;
        holidays = data;
        console.log('Holidays fetched successfully:', holidays.length);
    } catch (error) {
        console.error('Error fetching holidays:', error);
        holidays = [];
    } finally {
        renderHolidayList();
    }
}

/**
 * Fetches the role of a specific user from the 'profiles' table.
 * @param {string} userId - The UUID of the user.
 * @returns {Promise<string|null>} The role of the user (e.g., 'admin', 'teacher', 'student') or null if not found.
 */
async function fetchUserRole(userId) {
    console.log(`Fetching role for user ID: ${userId}`);
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user role:', error);
            return null;
        }

        if (data) {
            console.log(`User role for ${userId}: ${data.role}`);
            return data.role;
        } else {
            console.warn(`No profile found for user ID: ${userId}`);
            return null;
        }
    } catch (err) {
        console.error('Unexpected error in fetchUserRole:', err);
        return null;
    }
}

// --- Initial Data Load ---
async function loadAllData() {
    console.log('Loading all initial data...');
    await Promise.all([
        fetchStudents(),
        fetchTeachers(),
        fetchPayrollEntries(),
        fetchInvoices(),
        fetchAnnouncements(),
        fetchNotifications(), // Still local
        fetchAuditLogs(),
        fetchBackups(), // Still local
        fetchAttendanceRecords(), // Ensure this is awaited
        fetchTeacherAttendanceRecords(), // Ensure this is awaited
        fetchProfiles(),
        fetchExams(), // Fetch exams
        fetchHomework(), // Fetch homework
        fetchHolidays() // Fetch holidays
    ]);
    console.log('All initial data loaded.');
    updateDashboardStats();
    renderHolidayList();
}

// --- UI Element References ---

// Login UI Elements
const loginUi = document.getElementById('login-ui');
const schoolSiteUi = document.getElementById('school-site-ui');
const roleButtons = document.querySelectorAll('.role-button');
const selectedRoleInput = document.getElementById('selectedRole');
const loginForm = document.getElementById('loginForm');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const forgotPasswordModal = document.getElementById('forgotPasswordModal');
const closeForgotPasswordModal = document.getElementById('closeForgotPasswordModal');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const signUpButton = document.getElementById('signUpButton');
const signUpModal = document.getElementById('signUpModal');
const closeSignUpModal = document.getElementById('closeSignUpModal');
const signUpForm = document.getElementById('signUpForm');

// School Site UI Elements
const logoutButton = document.getElementById('logoutButton');
const notificationButton = document.getElementById('notificationButton');
const notificationDropdown = document.getElementById('notificationDropdown');
const markAllReadBtn = document.getElementById('markAllReadBtn');
const viewAllNotificationsLink = document.getElementById('viewAllNotificationsLink');
const notificationList = document.getElementById("notificationList");
const notificationCount = document.getElementById("notificationCount");
const newCount = document.getElementById("newCount");
const loggedInUserName = document.getElementById('loggedInUserName');
const currentModuleTitle = document.getElementById('currentModuleTitle');

const viewAllModal = document.getElementById("viewAllModal");
const viewAllNotificationList = document.getElementById("viewAllNotificationList");
const closeViewAllModal = document.getElementById("closeViewAllModal");
const modalMarkAllReadBtn = document.getElementById("modalMarkAllReadBtn");

const openPayrollModalBtn = document.getElementById('openPayrollModalBtn');
const payrollModal = document.getElementById('payrollModal');
const closePayrollModalBtn = document.getElementById('closePayrollModalBtn');
const payrollForm = document.getElementById('payrollForm');
const payrollTableBody = document.getElementById('payrollTableBody');
const searchPayrollPeriodInput = document.getElementById('searchPayrollPeriod');
const applyPayrollSearchButton = document.getElementById('applyPayrollSearch');

const openAddInvoiceModalBtn = document.getElementById('openAddInvoiceModalBtn');
const addInvoiceModal = document.getElementById('addInvoiceModal');
const closeAddInvoiceModalBtn = document.getElementById('closeAddInvoiceModalBtn');
const addInvoiceForm = document.getElementById('addInvoiceForm');
const financeTableBody = document.getElementById('financeTableBody');
const searchInvoiceNumberInput = document.getElementById('searchInvoiceNumber');
const applyInvoiceSearchButton = document.getElementById('applyInvoiceSearch');
const invoiceStudentSelect = document.getElementById('invoiceStudentId');

const userProfileToggle = document.getElementById('userProfileToggle');
const userDropdown = document.getElementById('userDropdown');

const searchStudentNameInput = document.getElementById('searchStudentName');
const searchRollInput = document.getElementById('searchRoll');
const searchClassSelect = document.getElementById('searchClass');
const applyStudentSearchButton = document.getElementById('applyStudentSearch');
const studentTableBody = document.getElementById('studentTableBody');

const studentModal = document.getElementById('studentModal');
const closeStudentModal = document.getElementById('closeStudentModal');
const studentForm = document.getElementById('studentForm');
const studentModalTitle = document.getElementById('studentModalTitle');
const studentFormSubmitBtn = document.getElementById('studentFormSubmitBtn');
const studentDetailsModal = document.getElementById('studentDetailsModal');
const closeStudentDetailsModal = document.getElementById('closeStudentDetailsModal');
const studentDetailsContent = document.getElementById('studentDetailsContent');


const searchTeacherNameInput = document.getElementById('searchTeacherName');
const searchTeacherSubjectSelect = document.getElementById('searchTeacherSubject');
const applyTeacherSearchButton = document.getElementById('applyTeacherSearch');
const teacherModal = document.getElementById('teacherModal');
const closeTeacherModal = document.getElementById('closeTeacherModal');
const teacherForm = document.getElementById('teacherForm');
const teacherTableBody = document.getElementById('teacherTableBody');
const teacherModalTitle = document.getElementById('teacherModalTitle');
const teacherFormSubmitBtn = document.getElementById('teacherFormSubmitBtn');
const teacherDetailsModal = document.getElementById('teacherDetailsModal');
const closeTeacherDetailsModal = document.getElementById('closeTeacherDetailsModal');
const teacherDetailsContent = document.getElementById('teacherDetailsContent');

const userModal = document.getElementById('userModal');
const closeUserModal = document.getElementById('closeUserModal');
const userForm = document.getElementById('userForm');
const userTableBody = document.getElementById('userTableBody');
const userModalTitle = document.getElementById('userModalTitle');
const userFormSubmitBtn = document.getElementById('userFormSubmitBtn');

const announcementModal = document.getElementById('announcementModal');
const closeAnnouncementModal = document.getElementById('closeAnnouncementModal');
const announcementForm = document.getElementById('announcementForm');
const announcementTableBody = document.getElementById('announcementTableBody');
const announcementModalTitle = document.getElementById('announcementModalTitle');
const announcementFormSubmitBtn = document.getElementById('announcementFormSubmitBtn');

const auditLogTableBody = document.getElementById('auditLogTableBody');
const backupTableBody = document.getElementById('backupTableBody');
const recentActivityList = document.getElementById('recentActivityList');

// Dashboard Stats Elements
const totalStudentsCount = document.getElementById('totalStudentsCount');
const totalTeachersCount = document.getElementById('totalTeachersCount');
const monthlyRevenue = document.getElementById('monthlyRevenue');
const upcomingEventsCount = document.getElementById('upcomingEventsCount');
const studentsPresentToday = document.getElementById('studentsPresentToday');
const teachersPresentToday = document.getElementById('teachersPresentToday');

// Chart.js instances (These are for dashboard charts, not reports)
// Centralized chart update scheduler to avoid multiple re-initializations
let chartUpdateScheduled = false;
function scheduleChartUpdate() {
    if (chartUpdateScheduled) return;
    chartUpdateScheduled = true;
    // Use requestAnimationFrame to batch DOM work and avoid layout thrash
    requestAnimationFrame(() => {
        try {
            initCharts(); // Call initCharts directly here
        } finally {
            chartUpdateScheduled = false;
        }
    });
}
/** Utility to safely destroy a Chart.js instance **/
function safeDestroy(chartInstance) {
    try {
        if (chartInstance && typeof chartInstance.destroy === 'function') {
            chartInstance.destroy();
        }
    } catch (e) {
        console.warn('Error destroying chart instance:', e);
    }
}

let financeOverviewChartInstance = null;
let studentAttendanceChartInstance = null;
let teacherAttendanceChartInstance = null;
let monthlyAttendanceTrendChartInstance = null;

// Student Attendance Module Elements
const attendanceModal = document.getElementById('attendanceModal');
const closeAttendanceModal = document.getElementById('closeAttendanceModal');
const attendanceForm = document.getElementById('attendanceForm');
const attendanceModalTitle = document.getElementById('attendanceModalTitle');
const attendanceFormSubmitBtn = document.getElementById('attendanceFormSubmitBtn');
const attendanceStudentSelect = document.getElementById('attendanceStudentSelect');
const attendanceTableBody = document.getElementById('attendanceTableBody');
const attendanceClassFilter = document.getElementById('attendanceClassFilter');
const attendanceDateFilter = document.getElementById('attendanceDateFilter');
const attendanceStudentNameFilter = document.getElementById('attendanceStudentNameFilter');
const applyAttendanceFilter = document.getElementById('applyAttendanceFilter');
const attendanceTotalStudents = document.getElementById('attendanceTotalStudents');
const attendanceTotalPresent = document.getElementById('attendanceTotalPresent');
const attendanceTotalAbsent = document.getElementById('attendanceTotalAbsent');
const registerStudentFingerprintBtn = document.getElementById('registerStudentFingerprintBtn');
const verifyStudentFingerprintBtn = document.getElementById('verifyStudentFingerprintBtn');
const qrScannerSection = document.getElementById('qrScannerSection');
const qrVideo = document.getElementById('qrVideo');
const classAttendanceSelect = document.getElementById('classAttendanceSelect');
const classAttendanceDate = document.getElementById('classAttendanceDate');
const loadClassStudentsBtn = document.getElementById('loadClassStudentsBtn');
const markAllPresentBtn = document.getElementById('markAllPresentBtn'); // Corrected ID
const classAttendanceTableBody = document.getElementById('classAttendanceTableBody');

// Teacher Attendance Module Elements
const teacherAttendanceModal = document.getElementById('teacherAttendanceModal');
const closeTeacherAttendanceModal = document.getElementById('closeTeacherAttendanceModal');
const teacherAttendanceForm = document.getElementById('teacherAttendanceForm');
const teacherAttendanceModalTitle = document.getElementById('teacherAttendanceModalTitle');
const teacherAttendanceFormSubmitBtn = document.getElementById('teacherAttendanceFormSubmitBtn');
const teacherAttendanceTeacherSelect = document.getElementById('teacherAttendanceTeacherSelect');
const teacherAttendanceRecordsTableBody = document.getElementById('teacherAttendanceTableBody');
const teacherAttendanceSubjectFilter = document.getElementById('teacherAttendanceSubjectFilter');
const teacherAttendanceDateFilter = document.getElementById('teacherAttendanceDateFilter');
const teacherAttendanceNameFilter = document.getElementById('teacherAttendanceNameFilter');
const applyTeacherAttendanceFilter = document.getElementById('applyTeacherAttendanceFilter');
const teacherAttendanceTotalTeachers = document.getElementById('teacherAttendanceTotalTeachers');
const teacherAttendanceTotalPresent = document.getElementById('teacherAttendanceTotalPresent');
const teacherAttendanceTotalAbsent = document.getElementById('teacherAttendanceTotalAbsent');
const registerTeacherFingerprintBtn = document.getElementById('registerTeacherFingerprintBtn');
const verifyTeacherFingerprintBtn = document.getElementById('verifyTeacherFingerprintBtn');
const teacherQrScannerSection = document.getElementById('teacherQrScannerSection');
const teacherQrVideo = document.getElementById('teacherQrVideo');

// QR Code Modal Elements
const studentQrCodeModal = document.getElementById('studentQrCodeModal');
const closeStudentQrCodeModal = document.getElementById('closeStudentQrCodeModal');
const studentQrCodeCanvas = document.getElementById('studentQrCodeCanvas');
const qrCodeStudentIdDisplay = document.getElementById('qrCodeStudentIdDisplay');
const downloadQrCodeLink = document.getElementById('downloadQrCodeLink');

// Exam Module Elements
const examTableBody = document.getElementById('examTableBody');
const examModal = document.getElementById('examModal');
const closeExamModal = document.getElementById('closeExamModal');
const examForm = document.getElementById('examForm');
const examModalTitle = document.getElementById('examModalTitle');
const examFormSubmitBtn = document.getElementById('examFormSubmitBtn');
let currentExamId = null;

// Generate Exam Results Modal elements
const generateResultsModal = document.getElementById('generateResultsModal');
const closeGenerateResultsModal = document.getElementById('closeGenerateResultsModal');
const generateResultsForm = document.getElementById('generateResultsForm');
const resultsClassFilter = document.getElementById('resultsClassFilter');
const resultsExamTypeFilter = document.getElementById('resultsExamTypeFilter');

// Chart instances for reports
let reportsAttendanceChart = null;
let reportsPerformanceChart = null;
let reportsStudentStatusChart = null;
let reportsClassPerformanceChart = null;

// Calendar Module Elements
const calendarEl = document.getElementById('calendar-full');
let calendar;
const holidayListContainer = document.getElementById('holidayList');
const addHolidayModal = document.getElementById('addHolidayModal');
const closeAddHolidayModal = document.getElementById('closeAddHolidayModal');
const addHolidayForm = document.getElementById('addHolidayForm');

// Invoice Details Modal
const invoiceDetailsModal = document.getElementById('invoiceDetailsModal');
const closeInvoiceDetailsModal = document.getElementById('closeInvoiceDetailsModal');
const invoiceContent = document.getElementById('invoiceContent');

// Homework Module Elements
const homeworkTableBody = document.getElementById('homeworkTableBody');
const addHomeworkModal = document.getElementById('addHomeworkModal');
const closeAddHomeworkModal = document.getElementById('closeAddHomeworkModal');
const homeworkForm = document.getElementById('homeworkForm');
const homeworkModalTitle = document.getElementById('addHomeworkModalTitle');
const homeworkFormSubmitBtn = document.getElementById('homeworkFormSubmitBtn');
const filterHomeworkClass = document.getElementById('filterHomeworkClass');
const filterHomeworkSubject = document.getElementById('filterHomeworkSubject');
const filterHomeworkDueDate = document.getElementById('filterHomeworkDueDate');
const applyHomeworkFilter = document.getElementById('applyHomeworkFilter');
const homeworkDetailsModal = document.getElementById('homeworkDetailsModal');
const closeHomeworkDetailsModal = document.getElementById('closeHomeworkDetailsModal');
const homeworkDetailsContent = document.getElementById('homeworkDetailsContent');

// Teacher QR Code Modal Elements
const teacherQrCodeModal = document.getElementById('teacherQrCodeModal');
const closeTeacherQrCodeModal = document.getElementById('closeTeacherQrCodeModal');
const teacherQrCodeCanvas = document.getElementById('teacherQrCodeCanvas');
const qrCodeTeacherIdDisplay = document.getElementById('qrCodeTeacherIdDisplay');
const downloadTeacherQrCodeLink = document.getElementById('downloadTeacherQrCodeLink');

// Reports Module Elements
const reportTypeSelect = document.getElementById('reportType');
const reportClassFilterSelect = document.getElementById('reportClassFilter');
const reportStartDateInput = document.getElementById('reportStartDate');
const reportEndDateInput = document.getElementById('reportEndDate');
const reportDisplayArea = document.getElementById('reportDisplayArea');


// --- Initial UI State Management ---

/**
 * Shows the login UI and hides the main school site UI.
 */
function showLoginUi() {
    console.log('Showing login UI.');
    if (loginUi) {
        loginUi.style.display = 'flex';
    }
    if (schoolSiteUi) {
        schoolSiteUi.style.display = 'none';
    }
    document.body.style.justifyContent = 'center';
    document.body.style.alignItems = 'center';
    document.body.style.minHeight = '100vh';
    document.body.style.backgroundColor = 'var(--light)';
    document.body.style.overflow = 'hidden';
    initTypedWelcome(); // Initialize typing effect on login page
}

/**
 * Shows the main school site UI and hides the login UI.
 * Loads all initial data and updates UI elements.
 */
async function showSchoolSiteUi() {
    console.log('Showing school site UI.');
    if (loginUi) {
        loginUi.style.display = 'none';
    }
    if (schoolSiteUi) {
        schoolSiteUi.style.display = 'flex';
    }
    document.body.style.justifyContent = 'flex-start';
    document.body.style.alignItems = 'flex-start';
    document.body.style.minHeight = 'auto';
    document.body.style.backgroundColor = 'var(--light)';
    document.body.style.overflow = 'auto';

    const { data: { session } } = await supabase.auth.getSession();
    console.log("showSchoolSiteUi: Current session status:", session ? "Authenticated" : "Not Authenticated");
    if (session && session.user) {
        console.log("showSchoolSiteUi: Authenticated user email:", session.user.email);
    }

    await loadAllData(); // Load all data from Supabase

    updateLoggedInUserName();
    updateUIAccess(); // Adjust UI based on role

    if (calendarEl && typeof FullCalendar !== 'undefined' && !calendar) {
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            themeSystem: 'standard',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listWeek'
            },
            editable: true,
            selectable: true,
            dayMaxEvents: true,
            firstDay: 1,
            eventColor: '#4F46E5',
            eventTextColor: '#ffffff',
            height: 'auto',
            events: [
                {
                    title: 'Parent-Teacher Meeting',
                    start: new Date().toISOString().split('T')[0],
                    backgroundColor: '#4F46E5',
                    borderColor: '#4F46E5'
                },
                {
                    title: 'Sports Day',
                    start: new Date(new Date().getTime() + 86400000 * 5).toISOString().split('T')[0],
                    backgroundColor: '#10B981',
                    borderColor: '#10B981'
                },
                {
                    title: 'End of Term Exams',
                    start: new Date(new Date().getTime() + 86400000 * 14).toISOString().split('T')[0],
                    end: new Date(new Date().getTime() + 86400000 * 18).toISOString().split('T')[0],
                    backgroundColor: '#F59E0B',
                    borderColor: '#F59E0B'
                }
            ],
            eventSources: [
                {
                    events: holidays.map(holiday => ({
                        title: holiday.name,
                        start: holiday.date,
                        allDay: true,
                        classNames: ['holiday'],
                        display: 'background'
                    }))
                }
            ],
            eventDidMount: function(info) {
                info.el.title = info.event.title;
            }
        });
        calendar.render();
    } else if (calendar) {
        calendar.render(); // Re-render if already initialized
    }
}

/**
 * Updates UI elements (navigation, buttons) to be fully visible.
 * All role-based restrictions are removed from the frontend JS.
 * Backend RLS should enforce actual permissions.
 */
function updateUIAccess() {
    console.log('Updating UI access: showing all elements. Backend RLS will enforce permissions.');
    // Show all elements with data-role attributes
    document.querySelectorAll('[data-role]').forEach(el => {
        el.style.display = 'block';
    });

    // Show all navigation items
    document.querySelectorAll('.nav-item').forEach(navItem => {
        navItem.classList.remove('hidden');
    });

    // Show all specific buttons/forms
    // These elements are now correctly referenced by their IDs from index.html
    document.querySelector('#studentsModule button[onclick="showAddStudentForm()"]')?.classList.remove('hidden');
    document.querySelector('#teachersModule button[onclick="showAddTeacherForm()"]')?.classList.remove('hidden');
    document.querySelector('#user-managementModule button[onclick="showAddUserForm()"]')?.classList.remove('hidden');
    openPayrollModalBtn?.classList.remove('hidden');
    openAddInvoiceModalBtn?.classList.remove('hidden');
}


// Check login status on load
document.addEventListener('DOMContentLoaded', () => {
    // Always show the login UI initially to prevent auto-login on refresh
    // This ensures a clean login flow.
    showLoginUi();

    // If you want to automatically log in if a session exists on refresh,
    // uncomment the block below. However, the current setup requires manual login
    // after a refresh for security and clarity.
    /*
    supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session) {
            console.log("DOMContentLoaded: Existing session found. Attempting to show school site UI.");
            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('loggedInUser', JSON.stringify(session.user));
            showSchoolSiteUi();
        } else {
            console.log("DOMContentLoaded: No existing session. Showing login UI.");
            localStorage.removeItem('loggedIn');
            localStorage.removeItem('loggedInUser');
            showLoginUi();
        }
    });
    */

    // In script.js, after DOMContentLoaded listener
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.flex-1.overflow-auto'); // Your main content area

    if (menuToggle && sidebar && mainContent) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            // Optional: Add an overlay or disable scrolling on main content when sidebar is open
            if (sidebar.classList.contains('active')) {
                document.body.style.overflow = 'hidden'; // Prevent scrolling on body
                mainContent.style.pointerEvents = 'none'; // Disable interaction with main content
            } else {
                document.body.style.overflow = 'auto';
                mainContent.style.pointerEvents = 'auto';
            }
        });

        // Close sidebar if clicking outside on mobile
        mainContent.addEventListener('click', () => {
            if (sidebar.classList.contains('active') && window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                document.body.style.overflow = 'auto';
                mainContent.style.pointerEvents = 'auto';
            }
        });

        // Close sidebar when a navigation item is clicked on mobile
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                    document.body.style.overflow = 'auto';
                    mainContent.style.pointerEvents = 'auto';
                }
            });
        });

        // Adjust sidebar visibility on window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                sidebar.classList.remove('active'); // Ensure it's visible on larger screens
                document.body.style.overflow = 'auto';
                mainContent.style.pointerEvents = 'auto';
            }
        });
    }
});

// --- Login UI Logic ---

roleButtons.forEach(button => {
    button.addEventListener('click', function() {
        roleButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        if (selectedRoleInput) {
            selectedRoleInput.value = this.dataset.role;
        }
        console.log(`Role selected: ${this.dataset.role}`);
    });
});

/**
 * Handles user login authentication with Supabase.
 * Verifies selected role against user_metadata.
 */
async function handleLogin() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const selectedRoleElement = document.getElementById('selectedRole');

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';
    const selectedRole = selectedRoleElement ? selectedRoleElement.value : '';

    // Ensure all fields are filled and a role is selected
    if (!email || !password || !selectedRole) {
        alert('Please fill in all fields and select a role.');
        console.warn('Login attempt failed: Missing email, password, or role.');
        return;
    }

    console.log(`Attempting login for ${email} with role ${selectedRole}...`);
    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) {
            alert('Login failed: ' + authError.message);
            console.error('Supabase signInWithPassword error:', authError);
            await addAuditLog(email, 'Login Failed', 'Authentication', `Error: ${authError.message}`);
            return;
        }

        if (authData.user) {
            // Determine the user's actual role from Supabase metadata
            const userRole = authData.user.user_metadata?.role || authData.user.app_metadata?.role || 'admin';
            console.log(`User ${authData.user.email} logged in. Actual role: ${userRole}`);

            // Frontend role check (optional, backend RLS is primary)
            // If you want to strictly enforce that the selected role matches the user's actual role:
            // if (selectedRole !== userRole && userRole !== 'admin') { // Allow admin to bypass for testing
            //     alert(`You logged in as ${userRole}, but selected ${selectedRole}. Please select your correct role.`);
            //     await supabase.auth.signOut(); // Force logout if role mismatch
            //     await addAuditLog(email, 'Login Failed (Role Mismatch)', 'Authentication', `User ${email} tried to log in as ${selectedRole} but is ${userRole}.`);
            //     return;
            // }

            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('loggedInUser', JSON.stringify(authData.user)); // Store the full user object
            alert('Login successful! Redirecting...');
            await addAuditLog(authData.user.email, 'Logged In', 'Authentication', `Successful login for role: ${userRole}`);
            showSchoolSiteUi(); // Only call this on successful login
        } else {
            // This case should ideally be covered by authError, but as a fallback
            alert('Login failed: No user data returned.');
            console.error('Login failed: No user data returned from signInWithPassword.');
            await addAuditLog(email, 'Login Failed (No User Data)', 'Authentication', 'No user data returned from signInWithPassword.');
        }
    } catch (err) {
        console.error('Unexpected error during login:', err);
        alert('An unexpected error occurred: ' + err.message);
        await addAuditLog(email, 'Login Failed (Unexpected)', 'Authentication', `Unexpected error: ${err.message}`);
    }
}

// Event listener for the login form submission
if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        await handleLogin();
    });
}

// Forgot Password Modal Logic
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', function(event) {
        event.preventDefault();
        if (forgotPasswordModal) {
            forgotPasswordModal.classList.add('active');
            forgotPasswordModal.style.display = 'flex'; // Ensure it's visible
        }
        console.log('Forgot password modal opened.');
    });
}

if (closeForgotPasswordModal) {
    closeForgotPasswordModal.addEventListener('click', function() {
        if (forgotPasswordModal) {
            forgotPasswordModal.classList.remove('active');
            forgotPasswordModal.style.display = 'none'; // Ensure it's hidden
        }
        if (forgotPasswordForm) {
            forgotPasswordForm.reset();
        }
        console.log('Forgot password modal closed.');
    });
}

if (forgotPasswordModal) {
    forgotPasswordModal.addEventListener('click', function(event) {
        if (event.target === forgotPasswordModal) {
            forgotPasswordModal.classList.remove('active');
            forgotPasswordModal.style.display = 'none'; // Ensure it's hidden
            if (forgotPasswordForm) {
                forgotPasswordForm.reset();
            }
            console.log('Forgot password modal closed by outside click.');
        }
    });
}

if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const forgotEmailInput = document.getElementById('forgotEmail');
        const email = forgotEmailInput ? forgotEmailInput.value : '';
        if (!email) {
            alert('Please enter your email address.');
            console.warn('Forgot password attempt: No email entered.');
            return;
        }
        console.log(`Sending password reset link to ${email}...`);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) {
                alert('Error sending reset link: ' + error.message);
                console.error('Supabase resetPasswordForEmail error:', error);
                await addAuditLog(email, 'Forgot Password Failed', 'Authentication', `Failed to send reset link: ${error.message}`);
            } else {
                alert('If an account with that email exists, a password reset link has been sent to ' + email + '.');
                console.log('Password reset link sent successfully (if email exists).');
                await addAuditLog(email, 'Forgot Password Initiated', 'Authentication', 'Password reset link sent.');
            }
        } catch (err) {
            console.error('Unexpected error during password reset:', err);
            alert('An unexpected error occurred: ' + err.message);
            await addAuditLog(email, 'Forgot Password (Unexpected)', 'Authentication', `Unexpected error: ${err.message}`);
        } finally {
            if (forgotPasswordModal) {
                forgotPasswordModal.classList.remove('active');
                forgotPasswordModal.style.display = 'none'; // Ensure it's hidden
            }
            if (forgotPasswordForm) {
                forgotPasswordForm.reset();
            }
        }
    });
}

// Sign Up Modal Logic
if (signUpButton) {
    signUpButton.addEventListener('click', function() {
        if (signUpModal) {
            signUpModal.classList.remove('hidden');
            signUpModal.style.display = 'flex';
        }
        if (signUpForm) {
            signUpForm.reset();
        }
        console.log('Sign Up modal opened.');
    });
}

if (closeSignUpModal) {
    closeSignUpModal.addEventListener('click', function() {
        if (signUpModal) {
            signUpModal.classList.add('hidden');
            signUpModal.style.display = 'none';
        }
        if (signUpForm) {
            signUpForm.reset();
        }
        console.log('Sign Up modal closed.');
    });
}

if (signUpModal) {
    signUpModal.addEventListener('click', function(event) {
        if (event.target === signUpModal) {
            signUpModal.classList.add('hidden');
            signUpModal.style.display = 'none';
            if (signUpForm) {
                signUpForm.reset();
            }
            console.log('Sign Up modal closed by outside click.');
        }
    });
}

if (signUpForm) {
    signUpForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const signUpFullNameInput = document.getElementById('signUpFullName');
        const signUpEmailInput = document.getElementById('signUpEmail');
        const signUpPasswordInput = document.getElementById('signUpPassword');
        const signUpRoleSelect = document.getElementById('signUpRole');

        const fullName = signUpFullNameInput ? signUpFullNameInput.value.trim() : '';
        const email = signUpEmailInput ? signUpEmailInput.value.trim() : '';
        const password = signUpPasswordInput ? signUpPasswordInput.value.trim() : '';
        const role = signUpRoleSelect ? signUpRoleSelect.value : '';

        if (!fullName || !email || !password || !role) {
            alert('Please fill in all fields.');
            console.warn('Sign Up attempt failed: Missing fields.');
            return;
        }

        console.log(`Attempting to sign up new user: ${email} with role: ${role}`);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role
                    }
                }
            });

            if (error) {
                alert('Sign Up failed: ' + error.message);
                console.error('Supabase signUp error:', error);
                await addAuditLog(email, 'Sign Up Failed', 'Authentication', `Error: ${error.message}`);
                return;
            }

            if (data.user) {
                // Insert into profiles table
                const { error: profileError } = await supabase.from('profiles').insert([
                    {
                        id: data.user.id,
                        full_name: fullName,
                        email: email,
                        role: role,
                        status: 'Active'
                    }
                ]);

                if (profileError) {
                    console.error('Error inserting profile:', profileError);
                    alert('Sign Up successful, but failed to create user profile. Please contact support.');
                    await addAuditLog(email, 'Sign Up Partial Success', 'Authentication', `Profile creation failed: ${profileError.message}`);
                    // Optionally, you might want to delete the auth user here if profile creation is critical
                } else {
                    alert('Sign Up successful! Please check your email to confirm your account.');
                    await addAuditLog(email, 'Sign Up Successful', 'Authentication', `New user signed up with role: ${role}`);
                }
                if (signUpModal) {
                    signUpModal.classList.add('hidden');
                    signUpModal.style.display = 'none';
                }
                if (signUpForm) {
                    signUpForm.reset();
                }
            } else {
                alert('Sign Up failed: No user data returned.');
                await addAuditLog(email, 'Sign Up Failed (No User Data)', 'Authentication', 'No user data returned from signUp.');
            }
        } catch (err) {
            console.error('Unexpected error during sign up:', err);
            alert('An unexpected error occurred: ' + err.message);
            await addAuditLog(email, 'Sign Up Failed (Unexpected)', 'Authentication', `Unexpected error: ${err.message}`);
        }
    });
}


// --- School Site UI Logic ---

// Logout functionality
if (logoutButton) {
    logoutButton.addEventListener('click', async function() {
        if (confirm('Are you sure you want to logout?')) {
            const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
            console.log(`Logging out user: ${loggedInUser ? loggedInUser.email : 'Unknown'}`);
            try {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;

                await addAuditLog(loggedInUser ? loggedInUser.email : 'Unknown', 'Logged Out', 'Authentication', 'User logged out');
                localStorage.clear(); // Clear all local storage on logout

                // Reset UI elements to default dashboard view
                document.querySelectorAll('.module-content').forEach(m => m.classList.add('hidden'));
                document.getElementById('dashboardMainContent')?.classList.remove('hidden');
                document.getElementById('moduleTabs')?.classList.remove('hidden');
                document.getElementById('modulesContainer')?.classList.add('hidden');
                document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
                document.querySelector('.nav-item[data-module="dashboard"]')?.classList.add('active');
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelector('.tab[data-tab="dashboard"]')?.classList.add('active');

                // Destroy all chart instances to prevent memory leaks and re-render issues
                safeDestroy(financeOverviewChartInstance);
                safeDestroy(studentAttendanceChartInstance);
                safeDestroy(teacherAttendanceChartInstance);
                safeDestroy(monthlyAttendanceTrendChartInstance);
                safeDestroy(reportsAttendanceChart);
                safeDestroy(reportsPerformanceChart);
                safeDestroy(reportsStudentStatusChart);
                safeDestroy(reportsClassPerformanceChart);

                // Reset global data arrays
                students = [];
                teachers = [];
                payrollEntries = [];
                invoices = [];
                announcements = [];
                notifications = [];
                auditLogs = [];
                backups = [];
                attendanceRecords = [];
                teacherAttendanceRecords = [];
                profiles = [];
                exams = [];
                homeworkAssignments = [];
                holidays = [];

                // Stop QR scanners if they are active
                if (html5QrCodeScanner && html5QrCodeScanner.isScanning) {
                    await html5QrCodeScanner.stop();
                    html5QrCodeScanner = null; // Clear the instance
                }
                if (html5QrCodeScannerTeacher && html5QrCodeScannerTeacher.isScanning) {
                    await html5QrCodeScannerTeacher.stop();
                    html5QrCodeScannerTeacher = null; // Clear the instance
                }

                // Show login UI after all cleanup
                showLoginUi();
                console.log('Logout successful. UI reset and data cleared.');

            } catch (error) {
                console.error('Error logging out:', error);
                alert('Error logging out: ' + error.message);
                await addAuditLog(loggedInUser ? loggedInUser.email : 'Unknown', 'Logout Failed', 'Authentication', `Error: ${error.message}`);
            }
        }
    });
}


function renderHolidayList() {
    if (!holidayListContainer) return;
    holidayListContainer.innerHTML = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingHolidays = holidays
        .filter(holiday => new Date(holiday.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort ascending to show nearest first

    if (upcomingHolidays.length === 0) {
        holidayListContainer.innerHTML = '<p class="text-gray-500 text-center py-4">No upcoming holidays.</p>';
        return;
    }

    upcomingHolidays.slice(0, 5).forEach(holiday => {
        const holidayDate = new Date(holiday.date);
        const formattedDate = holidayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const listItem = document.createElement('div');
        listItem.className = 'holiday-list-item module-card';
        listItem.innerHTML = `
            <span class="date">${formattedDate}</span>
            <span class="name">${holiday.name}</span>
            <i class="fas fa-star text-red-500"></i>
        `;
        holidayListContainer.appendChild(listItem);
    });
    console.log('Holiday list rendered.');
}

window.showAddHolidayModal = function() {
    if (addHolidayModal) {
        addHolidayModal.classList.remove('hidden');
        addHolidayModal.style.display = 'flex';
    }
    if (addHolidayForm) {
        addHolidayForm.reset();
    }
    console.log('Add Holiday modal opened.');
}

if (closeAddHolidayModal) {
    closeAddHolidayModal.addEventListener('click', () => {
        if (addHolidayModal) {
            addHolidayModal.classList.add('hidden');
            addHolidayModal.style.display = 'none';
        }
        console.log('Add Holiday modal closed.');
    });
}

if (addHolidayModal) {
    addHolidayModal.addEventListener('click', (e) => {
        if (e.target === addHolidayModal) {
            addHolidayModal.classList.add('hidden');
            addHolidayModal.style.display = 'none';
            if (addHolidayForm) {
                addHolidayForm.reset();
            }
            console.log('Add Holiday modal closed by outside click.');
        }
    });
}

if (addHolidayForm) {
    addHolidayForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const holidayNameInput = document.getElementById('holidayName');
        const holidayDateInput = document.getElementById('holidayDate');

        const holidayName = holidayNameInput ? holidayNameInput.value : '';
        const holidayDate = holidayDateInput ? holidayDateInput.value : '';

        if (!holidayName || !holidayDate) {
            alert('Please fill in all fields.');
            console.warn('Add Holiday failed: Missing name or date.');
            return;
        }

        try {
            const { data, error } = await supabase.from('holidays').insert([
                { name: holidayName, date: holidayDate }
            ]).select();

            if (error) throw error;

            alert('Holiday added successfully!');
            await fetchHolidays(); // Re-fetch holidays to update the list and calendar
            if (calendar) {
                calendar.addEvent({
                    title: holidayName,
                    start: holidayDate,
                    allDay: true,
                    classNames: ['holiday'],
                    display: 'background'
                });
            }
            if (addHolidayModal) {
                addHolidayModal.classList.add('hidden');
                addHolidayModal.style.display = 'none';
            }
            if (addHolidayForm) {
                addHolidayForm.reset();
            }
            const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
            await addAuditLog(loggedInUser?.email || 'admin', 'Added Holiday', 'Calendar', `Added holiday: ${holidayName} on ${holidayDate}`);
            console.log(`Holiday "${holidayName}" added.`);
        } catch (error) {
            alert('Error adding holiday: ' + error.message);
            console.error('Supabase error adding holiday:', error);
            const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
            await addAuditLog(loggedInUser?.email || 'admin', 'Add Holiday Failed', 'Calendar', `Error: ${error.message}`);
        }
    });
}


/**
 * Shows the specified module content and updates active navigation/tab states.
 * All modules are accessible.
 * @param {string} moduleName - The name of the module to show (e.g., 'dashboard', 'students').
 */
window.showModule = async function(moduleName) {
    console.log(`Showing module: ${moduleName}`);
    const dashboardMainContent = document.getElementById('dashboardMainContent');
    const modulesContainer = document.getElementById('modulesContainer');
    const moduleTabs = document.getElementById('moduleTabs');
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role || 'admin' : null;

    if (currentModuleTitle) {
        currentModuleTitle.textContent = moduleName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    document.querySelectorAll('.module-content').forEach(m => m.classList.add('hidden'));
    if (dashboardMainContent) {
        dashboardMainContent.classList.add('hidden');
    }
    if (modulesContainer) {
        modulesContainer.classList.remove('hidden');
    }

    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    // Stop QR scanner if active when switching modules
    if (html5QrCodeScanner && html5QrCodeScanner.isScanning) {
        await stopQrAttendance();
    }
    if (html5QrCodeScannerTeacher && html5QrCodeScannerTeacher.isScanning) {
        await stopTeacherQrAttendance();
    }

    if (moduleName === 'dashboard') {
        if (dashboardMainContent) {
            dashboardMainContent.classList.remove('hidden');
        }
        if (modulesContainer) {
            modulesContainer.classList.add('hidden');
        }
        if (moduleTabs) {
            moduleTabs.classList.remove('hidden');
        }
        document.querySelector('.tab[data-tab="dashboard"]')?.classList.add('active');
        document.querySelector('.nav-item[data-module="dashboard"]')?.classList.add('active');
        if (currentModuleTitle) {
            currentModuleTitle.textContent = 'Dashboard';
        }
        updateDashboardStats();
        scheduleChartUpdate();
    } else {
        const moduleElement = document.getElementById(`${moduleName}Module`);
        if (moduleElement) {
            moduleElement.classList.remove('hidden');
        }
        const tabElement = document.querySelector(`.tab[data-tab="${moduleName}"]`);
        if (tabElement) {
            tabElement.classList.add('active');
        }
        const activeNavItem = document.querySelector(`.nav-item[data-module="${moduleName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // Re-fetch data for the module when it's opened
        switch (moduleName) {
            case 'students': await fetchStudents(); break;
            case 'teachers': await fetchTeachers(); break;
            case 'payroll': await fetchPayrollEntries(); break;
            case 'finance': await fetchInvoices(); populateInvoiceStudentSelect(); break;
            case 'attendance': await fetchAttendanceRecords(); populateStudentSelect(); break;
            case 'teacher-attendance': await fetchTeacherAttendanceRecords(); populateTeacherSelect(); break;
            case 'announcements': await fetchAnnouncements(); break;
            case 'audit-logs': await fetchAuditLogs(); break;
            case 'backup-restore': await fetchBackups(); break;
            case 'user-management': await fetchProfiles(); break;
            case 'exams': await fetchExams(); break;
            case 'reports': initReportsCharts(); break; // Initialize reports charts when reports module is opened
            case 'homework': await fetchHomework(); break;
            case 'calendar': await fetchHolidays(); if(calendar) calendar.render(); break;
            default: console.warn(`No specific data fetch defined for module: ${moduleName}`);
        }
    }
    if (notificationDropdown) notificationDropdown.classList.add('hidden');
    if (userDropdown) userDropdown.classList.add('hidden');
}

document.querySelectorAll('.open-module, .tab, .nav-item').forEach(el => {
    el.addEventListener('click', async (e) => {
        e.preventDefault();
        const moduleName = el.dataset.module || el.dataset.tab;
        if (moduleName) {
            await showModule(moduleName); // Ensure showModule is awaited
        }
    });
});

// User Dropdown Toggle
if (userProfileToggle) {
    userProfileToggle.addEventListener('click', function() {
        if (userDropdown) userDropdown.classList.toggle('hidden');
        if (notificationDropdown) notificationDropdown.classList.add('hidden');
        console.log('User profile dropdown toggled.');
    });
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    if (notificationDropdown && !notificationDropdown.contains(event.target) && (!notificationButton || !notificationButton.contains(event.target))) {
        notificationDropdown.classList.add('hidden');
    }
    if (userDropdown && !userDropdown.contains(event.target) && (!userProfileToggle || !userProfileToggle.contains(event.target))) {
        userDropdown.classList.add('hidden');
    }
});


function renderDropdownNotifications() {
    if (!notificationList || !notificationCount || !newCount) return;
    notificationList.innerHTML = "";
    let unreadCount = 0;
    notifications.slice(0, 3).forEach((notif) => {
        if (notif.unread) unreadCount++;
        const div = document.createElement("div");
        div.className = "notification-item" + (notif.unread ? " unread" : "");
        div.dataset.id = notif.id;
        div.innerHTML = `
            <div class="title">${notif.title}</div>
            <p class="text-sm text-gray-600">${notif.description}</p>
            <div class="time">${notif.time}</div>
        `;
        div.addEventListener("click", () => {
            markNotificationRead(notif.id);
        });
        notificationList.appendChild(div);
    });
    notificationCount.textContent = unreadCount > 0 ? unreadCount : "";
    newCount.textContent = unreadCount > 0 ? `${unreadCount} New` : "No new";
    localStorage.setItem('notifications', JSON.stringify(notifications));
    console.log('Dropdown notifications rendered.');
}

function renderModalNotifications() {
    if (!viewAllNotificationList) return;
    viewAllNotificationList.innerHTML = "";
    notifications.forEach((notif) => {
        const div = document.createElement("div");
        div.className = "view-all-notification" + (notif.unread ? " unread" : "");
        div.dataset.id = notif.id;
        div.innerHTML = `
            <div class="title">${notif.title}</div>
            <p class="text-sm text-gray-600">${notif.description}</p>
            <div class="time">${notif.time}</div>
        `;
        div.addEventListener("click", () => {
            markNotificationRead(notif.id);
            div.classList.remove("unread");
        });
        viewAllNotificationList.appendChild(div);
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));
    console.log('Modal notifications rendered.');
}

async function markNotificationRead(id) {
    const notif = notifications.find((n) => n.id === id);
    if (notif && notif.unread) {
        notif.unread = false;
        renderDropdownNotifications();
        renderModalNotifications();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        await addAuditLog(loggedInUser?.email || 'System', 'Notification Read', 'Notifications', `Notification "${notif.title}" marked as read.`);
        console.log(`Notification ID ${id} marked as read.`);
    }
}

async function markAllAsRead() {
    notifications.forEach((n) => (n.unread = false));
    renderDropdownNotifications();
    renderModalNotifications();
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    await addAuditLog(loggedInUser?.email || 'System', 'Notifications', 'Notifications', 'All notifications marked as read.');
    console.log('All notifications marked as read.');
}

if (notificationButton) {
    notificationButton.addEventListener('click', function(event) {
        event.stopPropagation();
        if (notificationDropdown) {
            notificationDropdown.classList.toggle('hidden');
        }
        if (userDropdown) {
            userDropdown.classList.add('hidden');
        }
        console.log('Notification dropdown toggled.');
    });
}


if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', markAllAsRead);
}

if (viewAllNotificationsLink) {
    viewAllNotificationsLink.addEventListener('click', function(event) {
        event.preventDefault();
        if (notificationDropdown) notificationDropdown.classList.add("hidden");
        if (viewAllModal) {
            viewAllModal.classList.remove("hidden");
            viewAllModal.style.display = 'flex';
        }
        renderModalNotifications();
        console.log('View All Notifications modal opened.');
    });
}

if (closeViewAllModal) {
    closeViewAllModal.addEventListener("click", () => {
        if (viewAllModal) {
            viewAllModal.classList.add("hidden");
            viewAllModal.style.display = 'none';
        }
        console.log('View All Notifications modal closed.');
    });
}

if (viewAllModal) {
    viewAllModal.addEventListener("click", (e) => {
        if (e.target === viewAllModal) {
            viewAllModal.classList.add("hidden");
            viewAllModal.style.display = 'none';
            console.log('View All Notifications modal closed by outside click.');
        }
    });
}

if (modalMarkAllReadBtn) {
    modalMarkAllReadBtn.addEventListener("click", markAllAsRead);
}

// Payroll Module Specific JavaScript
function renderPayrollTable(filteredPayroll = payrollEntries) {
    if (!payrollTableBody) return;
    payrollTableBody.innerHTML = '';
    if (filteredPayroll.length === 0) {
        payrollTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No payroll entries found.</td></tr>';
        return;
    }
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for rendering
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;

    filteredPayroll.forEach(entry => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        let statusBgClass = '';
        let statusTextColorClass = '';
        switch (entry.status) {
            case 'Paid': statusBgClass = 'bg-green-100'; statusTextColorClass = 'text-green-800'; break;
            case 'Processing': statusBgClass = 'bg-yellow-100'; statusTextColorClass = 'text-yellow-800'; break;
            case 'Pending': statusBgClass = 'bg-blue-100'; statusTextColorClass = 'text-blue-800'; break;
            default: statusBgClass = 'bg-gray-100'; statusTextColorClass = 'text-gray-800'; break;
        }
        newRow.innerHTML = `
            <td class="py-3 px-4">${entry.period}</td>
            <td class="py-3 px-4">${entry.staff_count}</td>
            <td class="py-3 px-4">₹${parseFloat(entry.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 ${statusBgClass} ${statusTextColorClass} text-xs rounded-full">${entry.status}</span>
            </td>
            <td class="py-3 px-4">
                <button class="text-blue-600 hover:text-blue-800 mr-3" title="View Details" onclick="alert('Viewing details for payroll ${entry.period}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="text-red-600 hover:text-red-800" title="Download PDF" onclick="alert('Downloading PDF for payroll ${entry.period}')">
                    <i class="fas fa-file-pdf"></i>
                </button>
            </td>
        `;
        payrollTableBody.prepend(newRow);
    });
    console.log('Payroll table rendered.');
}

function filterPayroll() {
    const periodQuery = searchPayrollPeriodInput ? searchPayrollPeriodInput.value.toLowerCase() : '';
    const filtered = payrollEntries.filter(entry => {
        return entry.period.toLowerCase().includes(periodQuery);
    });
    renderPayrollTable(filtered);
    console.log('Payroll filtered.');
}

if (applyPayrollSearchButton) applyPayrollSearchButton.addEventListener('click', filterPayroll);
if (searchPayrollPeriodInput) searchPayrollPeriodInput.addEventListener('keyup', filterPayroll);


if (openPayrollModalBtn) {
    openPayrollModalBtn.addEventListener('click', () => {
        if (payrollModal) {
            payrollModal.classList.remove('hidden');
            payrollModal.style.display = 'flex';
            console.log('Payroll modal opened.');
        }
    });
}

if (closePayrollModalBtn) {
    closePayrollModalBtn.addEventListener('click', () => {
        if (payrollModal) {
            payrollModal.classList.add('hidden');
            payrollModal.style.display = 'none';
        }
        if (payrollForm) payrollForm.reset();
        console.log('Payroll modal closed.');
    });
}

if (payrollModal) {
    payrollModal.addEventListener('click', (e) => {
        if (e.target === payrollModal) {
            payrollModal.classList.add('hidden');
            payrollModal.style.display = 'none';
            if (payrollForm) payrollForm.reset();
            console.log('Payroll modal closed by outside click.');
        }
    });
}

if (payrollForm) {
    payrollForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';

        const payrollPeriodInput = document.getElementById('payrollPeriod');
        const staffCountInput = document.getElementById('staffCount');
        const totalAmountInput = document.getElementById('totalAmount');

        const periodInput = payrollPeriodInput ? payrollPeriodInput.value : '';
        const staffCount = staffCountInput ? staffCountInput.value : '';
        const totalAmount = totalAmountInput ? parseFloat(totalAmountInput.value) : NaN;

        if (!periodInput || !staffCount || isNaN(totalAmount)) {
            alert('Please fill in all fields correctly.');
            console.warn('Payroll form submission failed: Missing or invalid fields.');
            return;
        }

        const [year, monthNum] = periodInput.split('-');
        const date = new Date(year, monthNum - 1);
        const formattedPeriod = date.toLocaleString('default', { month: 'long', year: 'numeric' });

        console.log(`Submitting payroll for ${formattedPeriod}...`);
        try {
            const { data, error } = await supabase.from('payroll').insert([
                {
                    period: formattedPeriod,
                    staff_count: parseInt(staffCount),
                    total_amount: totalAmount,
                    status: 'Processing'
                }
            ]).select();

            if (error) throw error;

            alert('Payroll processing initiated successfully!');
            await addAuditLog(userEmail, 'Processed Payroll', 'Payroll', `Processed payroll for ${formattedPeriod}, amount: ₹${totalAmount}`);
            await fetchPayrollEntries();
            if (payrollModal) {
                payrollModal.classList.add('hidden');
                payrollModal.style.display = 'none';
            }
            if (payrollForm) {
                payrollForm.reset();
            }
            console.log('Payroll submitted successfully.');
        } catch (error) {
            alert('Error processing payroll: ' + error.message);
            console.error('Supabase error processing payroll:', error);
            await addAuditLog(userEmail, 'Payroll Processing Failed', 'Payroll', `Error: ${error.message}`);
        }
    });
}

// Finance Module Specific JavaScript
function renderFinanceTable(filteredInvoices = invoices) {
    if (!financeTableBody) return;
    financeTableBody.innerHTML = '';
    if (filteredInvoices.length === 0) {
        financeTableBody.innerHTML = '<tr><td colspan="11" class="text-center py-4 text-gray-500">No invoices found.</td></tr>';
        return;
    }
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for rendering
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;

    filteredInvoices.forEach(invoice => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        let statusBgClass = '';
        let statusTextColorClass = '';
        switch (invoice.status) {
            case 'Paid': statusBgClass = 'bg-blue-100'; statusTextColorClass = 'text-blue-800'; break;
            case 'Pending': statusBgClass = 'bg-yellow-100'; statusTextColorClass = 'text-yellow-800'; break;
            case 'Overdue': statusBgClass = 'bg-red-100'; statusTextColorClass = 'text-red-800'; break;
            default: statusBgClass = 'bg-gray-100'; statusTextColorClass = 'text-gray-800'; break;
        }

        const studentName = invoice.students ? invoice.students.name : 'N/A';
        const studentClass = invoice.students ? invoice.students.class : 'N/A';
        const fatherName = invoice.students ? invoice.students.father_name : 'N/A';
        const dueAmount = parseFloat(invoice.amount) - parseFloat(invoice.paid_amount || 0);

        newRow.innerHTML = `
            <td class="py-3 px-4">${invoice.invoice_number}</td>
            <td class="py-3 px-4">${studentName}</td>
            <td class="py-3 px-4">${studentClass}</td>
            <td class="py-3 px-4">${fatherName}</td>
            <td class="py-3 px-4">₹${parseFloat(invoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="py-3 px-4">₹${parseFloat(invoice.paid_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="py-3 px-4">₹${dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="py-3 px-4">${invoice.date}</td>
            <td class="py-3 px-4">${invoice.due_date || 'N/A'}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 ${statusBgClass} ${statusTextColorClass} text-xs rounded-full">${invoice.status}</span>
            </td>
            <td class="py-3 px-4 table-actions">
                <button class="text-blue-600 mr-3" title="Edit Invoice" onclick="editInvoice('${invoice.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 mr-3" title="Delete Invoice" onclick="deleteInvoice('${invoice.id}')">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="text-blue-600 hover:text-blue-800 mr-3" title="View Details" onclick="showInvoiceDetailsModal('${invoice.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="text-red-600 hover:text-red-800" title="Download PDF" onclick="alert('Downloading PDF for invoice ${invoice.invoice_number}')">
                    <i class="fas fa-file-pdf"></i>
                </button>
            </td>
        `;
        financeTableBody.prepend(newRow);
    });
    console.log('Finance table rendered.');
}

function filterInvoices() {
    const invoiceNumberQueryInput = document.getElementById('searchInvoiceNumber');
    const studentNameQueryInput = document.getElementById('searchInvoiceStudent');

    const invoiceNumberQuery = invoiceNumberQueryInput ? invoiceNumberQueryInput.value.toLowerCase() : '';
    const studentNameQuery = studentNameQueryInput ? studentNameQueryInput.value.toLowerCase() : '';

    const filtered = invoices.filter(invoice => {
        const invoiceMatch = invoice.invoice_number.toLowerCase().includes(invoiceNumberQuery);
        const studentMatch = studentNameQuery === '' || (invoice.students && invoice.students.name.toLowerCase().includes(studentNameQuery));
        return invoiceMatch && studentMatch;
    });
    renderFinanceTable(filtered);
    console.log('Invoices filtered.');
}

if (applyInvoiceSearchButton) applyInvoiceSearchButton.addEventListener('click', filterInvoices);
if (searchInvoiceNumberInput) searchInvoiceNumberInput.addEventListener('keyup', filterInvoices);
if (document.getElementById('searchInvoiceStudent')) document.getElementById('searchInvoiceStudent').addEventListener('keyup', filterInvoices);


if (openAddInvoiceModalBtn) {
    openAddInvoiceModalBtn.addEventListener('click', () => {
        if (addInvoiceModal) {
            addInvoiceModal.classList.remove('hidden');
            addInvoiceModal.style.display = 'flex';
        }
        currentInvoiceId = null; // Reset for new invoice
        if (document.getElementById('addInvoiceModalTitle')) {
            document.getElementById('addInvoiceModalTitle').textContent = 'Add New Invoice';
        }
        if (document.getElementById('invoiceFormSubmitBtn')) {
            document.getElementById('invoiceFormSubmitBtn').textContent = 'Add Invoice';
        }
        if (addInvoiceForm) addInvoiceForm.reset();
        populateInvoiceStudentSelect();
        console.log('Add Invoice modal opened.');
    });
}

if (closeAddInvoiceModalBtn) {
    closeAddInvoiceModalBtn.addEventListener('click', () => {
        if (addInvoiceModal) {
            addInvoiceModal.classList.add('hidden');
            addInvoiceModal.style.display = 'none';
        }
        if (addInvoiceForm) addInvoiceForm.reset();
        console.log('Add Invoice modal closed.');
    });
}

if (addInvoiceModal) {
    addInvoiceModal.addEventListener('click', (e) => {
        if (e.target === addInvoiceModal) {
            addInvoiceModal.classList.add('hidden');
            addInvoiceModal.style.display = 'none';
            if (addInvoiceForm) addInvoiceForm.reset();
            console.log('Add Invoice modal closed by outside click.');
        }
    });
}

// Function to populate the student select dropdown in the Add Invoice modal
async function populateInvoiceStudentSelect(selectedStudentId = '') {
    if (!invoiceStudentSelect) return;

    if (students.length === 0) {
        await fetchStudents(); // Ensure students data is available
    }

    invoiceStudentSelect.innerHTML = '<option value="">Select Student</option>';
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.name} (Class: ${student.class})`;
        if (student.id === selectedStudentId) {
            option.selected = true;
        }
        invoiceStudentSelect.appendChild(option);
    });
    console.log('Invoice student select populated.');
}

// New function to edit an invoice
window.editInvoice = async function(id) {
    console.log(`Editing invoice ID: ${id}`);
    const invoice = invoices.find(inv => inv.id === id);
    if (invoice) {
        currentInvoiceId = invoice.id;
        if (document.getElementById('addInvoiceModalTitle')) {
            document.getElementById('addInvoiceModalTitle').textContent = 'Edit Invoice';
        }
        if (document.getElementById('invoiceFormSubmitBtn')) {
            document.getElementById('invoiceFormSubmitBtn').textContent = 'Save Changes';
        }

        document.getElementById('invoiceNumber').value = invoice.invoice_number;
        document.getElementById('invoiceTotalAmount').value = invoice.amount;
        document.getElementById('invoicePaidAmount').value = invoice.paid_amount || 0;
        document.getElementById('invoiceIssueDate').value = invoice.date;
        document.getElementById('invoiceDueDate').value = invoice.due_date || '';
        document.getElementById('invoiceStatus').value = invoice.status;

        await populateInvoiceStudentSelect(invoice.student_id); // Pre-select student, ensure awaited

        if (addInvoiceModal) {
            addInvoiceModal.classList.remove('hidden');
            addInvoiceModal.style.display = 'flex';
        }
        console.log(`Invoice ${id} data loaded for editing.`);
    } else {
        alert('Invoice not found.');
        console.error(`Invoice with ID ${id} not found for editing.`);
    }
};

// New function to delete an invoice
window.deleteInvoice = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userEmail = loggedInUser?.email || 'admin';
    if (confirm('Are you sure you want to delete this invoice?')) {
        console.log(`Deleting invoice ID: ${id}`);
        try {
            const { error } = await supabase.from('finance').delete().eq('id', id);
            if (error) throw error;

            const deletedInvoice = invoices.find(inv => inv.id === id);
            await addAuditLog(userEmail, 'Deleted Invoice', 'Finance', `Deleted invoice ${deletedInvoice?.invoice_number || id}`);
            alert('Invoice deleted successfully!');
            await fetchInvoices(); // Re-fetch to update the table
            console.log(`Invoice ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting invoice: ' + error.message);
            console.error('Supabase error deleting invoice:', error);
            await addAuditLog(userEmail, 'Delete Invoice Failed', 'Finance', `Error: ${error.message}`);
        }
    }
};


if (addInvoiceForm) {
    addInvoiceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';

        const studentIdInput = document.getElementById('invoiceStudentId');
        const invoiceNumberInput = document.getElementById('invoiceNumber');
        const invoiceTotalAmountInput = document.getElementById('invoiceTotalAmount');
        const invoicePaidAmountInput = document.getElementById('invoicePaidAmount');
        const invoiceIssueDateInput = document.getElementById('invoiceIssueDate');
        const invoiceDueDateInput = document.getElementById('invoiceDueDate');
        const invoiceStatusInput = document.getElementById('invoiceStatus');

        const studentId = studentIdInput ? studentIdInput.value : '';
        const invoiceNumber = invoiceNumberInput ? invoiceNumberInput.value : '';
        const invoiceTotalAmount = invoiceTotalAmountInput ? parseFloat(invoiceTotalAmountInput.value) : NaN;
        const invoicePaidAmount = invoicePaidAmountInput ? parseFloat(invoicePaidAmountInput.value) : NaN;
        const invoiceIssueDate = invoiceIssueDateInput ? invoiceIssueDateInput.value : '';
        const invoiceDueDate = invoiceDueDateInput ? invoiceDueDateInput.value : '';
        const invoiceStatus = invoiceStatusInput ? invoiceStatusInput.value : '';

        if (!studentId || !invoiceNumber || isNaN(invoiceTotalAmount) || isNaN(invoicePaidAmount) || !invoiceIssueDate || !invoiceDueDate || !invoiceStatus) {
            alert('Please fill in all fields correctly.');
            console.warn('Add/Edit Invoice form submission failed: Missing or invalid fields.');
            return;
        }

        const invoiceData = {
            student_id: studentId,
            invoice_number: invoiceNumber,
            amount: invoiceTotalAmount,
            paid_amount: invoicePaidAmount,
            date: invoiceIssueDate,
            due_date: invoiceDueDate,
            status: invoiceStatus
        };

        try {
            let result;
            if (currentInvoiceId) {
                // Update existing invoice
                console.log(`Updating invoice ${currentInvoiceId}...`);
                result = await supabase.from('finance').update(invoiceData).eq('id', currentInvoiceId).select();
                await addAuditLog(userEmail, 'Updated Invoice', 'Finance', `Updated invoice ${invoiceNumber}`);
                alert('Invoice updated successfully!');
            } else {
                // Add new invoice
                console.log(`Adding new invoice ${invoiceNumber}...`);
                result = await supabase.from('finance').insert([invoiceData]).select();
                await addAuditLog(userEmail, 'Added Invoice', 'Finance', `Added invoice ${invoiceNumber}`);
                alert('Invoice added successfully!');
            }

            if (result.error) throw result.error;

            await fetchInvoices(); // Re-fetch to update the table
            if (addInvoiceModal) {
                addInvoiceModal.classList.add('hidden');
                addInvoiceModal.style.display = 'none';
            }
            if (addInvoiceForm) {
                addInvoiceForm.reset();
            }
            console.log('Invoice operation completed successfully.');
        } catch (error) {
            alert('Error saving invoice: ' + error.message);
            console.error('Supabase error saving invoice:', error);
            await addAuditLog(userEmail, 'Save Invoice Failed', 'Finance', `Error: ${error.message}`);
        }
    });
}

window.showInvoiceDetailsModal = async function(invoiceId) {
    console.log(`Showing details for invoice ID: ${invoiceId}`);
    // Ensure invoices data is up-to-date before searching
    if (invoices.length === 0) {
        await fetchInvoices();
    }

    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
        alert('Invoice not found.');
        console.error(`Invoice with ID ${invoiceId} not found in current data.`);
        return;
    }

    // Ensure students data is up-to-date before searching
    if (students.length === 0) {
        await fetchStudents();
    }
    const student = students.find(s => s.id === invoice.student_id);

    if (invoiceContent) {
        document.getElementById('invoiceDetailNumber').textContent = invoice.invoice_number;
        document.getElementById('invoiceDetailDate').textContent = invoice.date;
        document.getElementById('invoiceDetailStatus').textContent = invoice.status;
        document.getElementById('invoiceDetailStatus').className = `font-bold ${invoice.status === 'Paid' ? 'text-blue-800' : invoice.status === 'Pending' ? 'text-yellow-800' : 'text-red-800'}`;
        document.getElementById('invoiceDetailTotalAmount').textContent = `₹${parseFloat(invoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('invoiceDetailTotalAmountSummary').textContent = `₹${parseFloat(invoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('invoiceDetailPaidAmount').textContent = `₹${parseFloat(invoice.paid_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('invoiceDetailPaidAmountSummary').textContent = `₹${parseFloat(invoice.paid_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const dueAmount = parseFloat(invoice.amount) - parseFloat(invoice.paid_amount || 0);
        document.getElementById('invoiceDetailDueAmount').textContent = `₹${dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('invoiceDetailDueAmountSummary').textContent = `₹${dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('invoiceDetailDueDate').textContent = invoice.due_date || 'N/A';


        if (student) {
            document.getElementById('invoiceDetailStudentName').textContent = student.name;
            document.getElementById('invoiceDetailStudentClass').textContent = `Class: ${student.class}`;
            document.getElementById('invoiceDetailFatherName').textContent = `Father: ${student.father_name}`;
        } else {
            document.getElementById('invoiceDetailStudentName').textContent = 'N/A';
            document.getElementById('invoiceDetailStudentClass').textContent = '';
            document.getElementById('invoiceDetailFatherName').textContent = '';
        }
    }

    if (invoiceDetailsModal) {
        invoiceDetailsModal.classList.remove('hidden');
        invoiceDetailsModal.style.display = 'flex';
        console.log('Invoice details modal opened.');
    }
};

if (closeInvoiceDetailsModal) {
    closeInvoiceDetailsModal.addEventListener('click', () => {
        if (invoiceDetailsModal) {
            invoiceDetailsModal.classList.add('hidden');
            invoiceDetailsModal.style.display = 'none';
        }
        console.log('Invoice details modal closed.');
    });
}

if (invoiceDetailsModal) {
    invoiceDetailsModal.addEventListener('click', (e) => {
        if (e.target === invoiceDetailsModal) {
            invoiceDetailsModal.classList.add('hidden');
            invoiceDetailsModal.style.display = 'none';
            console.log('Invoice details modal closed by outside click.');
        }
    });
}

window.printInvoice = function() {
    console.log('Printing invoice...');
    const printArea = document.getElementById('invoiceDetailsModal')?.querySelector('.print-area');
    if (!printArea) {
        console.error('Print area not found.');
        return;
    }
    const printContents = printArea.innerHTML;
    const originalContents = document.body.innerHTML;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Print Invoice</title>');
    // Copy styles from the main document
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        printWindow.document.write(`<link rel="stylesheet" href="${link.href}">`);
    });
    printWindow.document.write('<style>.print-hide { display: none !important; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContents);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    console.log('Invoice print initiated.');
}


async function updateLoggedInUserName() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (loggedInUser && loggedInUserName) {
        loggedInUserName.textContent = loggedInUser.user_metadata?.name || loggedInUser.email;
        console.log(`Logged in user name updated to: ${loggedInUserName.textContent}`);
    }
}


// Student Search and Render Functionality
function renderStudentTable(filteredStudents = students) {
    if (!studentTableBody) return;
    studentTableBody.innerHTML = '';
    if (filteredStudents.length === 0) {
        studentTableBody.innerHTML = '<tr><td colspan="15" class="text-center py-4 text-gray-500">No students found matching your criteria.</td></tr>';
        return;
    }
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for rendering
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;

    filteredStudents.forEach(student => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        let statusBgClass = '';
        let statusTextColorClass = '';
        switch (student.status) {
            case 'Active': statusBgClass = 'bg-green-100'; statusTextColorClass = 'text-green-800'; break;
            case 'Inactive': statusBgClass = 'bg-yellow-100'; statusTextColorClass = 'text-yellow-800'; break;
            default: statusBgClass = 'bg-gray-100'; statusTextColorClass = 'text-gray-800'; break;
        }
        newRow.innerHTML = `
            <td class="py-3 px-4">${student.id}</td>
            <td class="py-3 px-4">${student.name}</td>
            <td class="py-3 px-4">${student.father_name}</td>
            <td class="py-3 px-4">${student.mother_name}</td>
            <td class="py-3 px-4">${student.class}</td>
            <td class="py-3 px-4">${student.roll_no}</td>
            <td class="py-3 px-4">${student.aadhar_no}</td>
            <td class="py-3 px-4">${student.blood_group || 'N/A'}</td>
            <td class="py-3 px-4">${student.admission_no || 'N/A'}</td>
            <td class="py-3 px-4">${student.admission_date || 'N/A'}</td>
            <td class="py-3 px-4">${student.father_aadhar || 'N/A'}</td>
            <td class="py-3 px-4">${student.mother_aadhar || 'N/A'}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 ${statusBgClass} ${statusTextColorClass} text-xs rounded-full">${student.status}</span>
            </td>
            <td class="py-3 px-4 table-actions">
                <button class="text-blue-600 mr-3" title="Edit Student" onclick="editStudent('${student.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 mr-3" title="Delete Student" onclick="deleteStudent('${student.id}')">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="text-purple-600 mr-3" title="Show QR Code" onclick="showStudentQrCodeModal('${student.id}')">
                    <i class="fas fa-qrcode"></i>
                </button>
                <button class="text-green-600" title="View Details" onclick="showStudentDetailsModal('${student.id}')">
                    <i class="fas fa-info-circle"></i>
                </button>
            </td>
        `;
        studentTableBody.appendChild(newRow);
    });
    console.log('Student table rendered.');
}

function filterStudents() {
    const nameQuery = searchStudentNameInput ? searchStudentNameInput.value.toLowerCase() : '';
    const rollQuery = searchRollInput ? searchRollInput.value.toLowerCase() : '';
    const classQuery = searchClassSelect ? searchClassSelect.value.toLowerCase() : '';

    const filtered = students.filter(student => {
        const nameMatch = student.name.toLowerCase().includes(nameQuery);
        const rollMatch = student.roll_no.toLowerCase().includes(rollQuery);
        const classMatch = classQuery === '' || student.class.toLowerCase() === classQuery;
        return nameMatch && rollMatch && classMatch;
    });
    renderStudentTable(filtered);
    console.log('Students filtered.');
}

if (applyStudentSearchButton) applyStudentSearchButton.addEventListener('click', filterStudents);
if (searchStudentNameInput) searchStudentNameInput.addEventListener('keyup', filterStudents);
if (searchRollInput) searchRollInput.addEventListener('keyup', filterStudents);
if (searchClassSelect) searchClassSelect.addEventListener('change', filterStudents);

// Teacher Render Functionality
function renderTeacherTable(filteredTeachers = teachers) {
    if (!teacherTableBody) return;
    teacherTableBody.innerHTML = '';
    if (filteredTeachers.length === 0) {
        teacherTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No teachers found.</td></tr>';
        return;
    }
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for rendering
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;

    filteredTeachers.forEach(teacher => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        newRow.innerHTML = `
            <td class="py-3 px-4">${teacher.id}</td>
            <td class="py-3 px-4">${teacher.name}</td>
            <td class="py-3 px-4">${teacher.subject}</td>
            <td class="py-3 px-4">${teacher.classes}</td>
            <td class="py-3 px-4 table-actions">
                <button class="text-blue-600 mr-3" title="Edit Teacher" onclick="editTeacher('${teacher.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 mr-3" title="Delete Teacher" onclick="deleteTeacher('${teacher.id}')">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="text-purple-600 mr-3" title="Show QR Code" onclick="showTeacherQrCodeModal('${teacher.id}')">
                    <i class="fas fa-qrcode"></i>
                </button>
                <button class="text-green-600" title="View Details" onclick="showTeacherDetailsModal('${teacher.id}')">
                    <i class="fas fa-info-circle"></i>
                </button>
            </td>
        `;
        teacherTableBody.appendChild(newRow);
    });
    console.log('Teacher table rendered.');
}

function filterTeachers() {
    const nameQuery = searchTeacherNameInput ? searchTeacherNameInput.value.toLowerCase() : '';
    const subjectQuery = searchTeacherSubjectSelect ? searchTeacherSubjectSelect.value.toLowerCase() : '';

    const filtered = teachers.filter(teacher => {
        const nameMatch = teacher.name.toLowerCase().includes(nameQuery);
        const subjectMatch = subjectQuery === '' || teacher.subject.toLowerCase() === subjectQuery;
        return nameMatch && subjectMatch;
    });
    renderTeacherTable(filtered);
    console.log('Teachers filtered.');
}

if (applyTeacherSearchButton) applyTeacherSearchButton.addEventListener('click', filterTeachers);
if (searchTeacherNameInput) searchTeacherNameInput.addEventListener('keyup', filterTeachers);
if (searchTeacherSubjectSelect) searchTeacherSubjectSelect.addEventListener('change', filterTeachers);


// User Render Functionality (Now uses profiles data)
function renderUserTable() {
    if (!userTableBody) return;
    userTableBody.innerHTML = '';
    if (profiles.length === 0) {
        userTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">No user profiles found.</td></tr>';
        return;
    }
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for rendering
    // const currentUserRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;

    profiles.forEach(profile => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        newRow.innerHTML = `
            <td class="py-3 px-4">${profile.id}</td>
            <td class="py-3 px-4">${profile.full_name || 'N/A'}</td>
            <td class="py-3 px-4">${profile.email || 'N/A'}</td>
            <td class="py-3 px-4">${profile.role || 'N/A'}</td>
            <td class="py-3 px-4">${profile.status || 'N/A'}</td>
            <td class="py-3 px-4 table-actions">
                <button class="text-blue-600 mr-3" title="Edit User" onclick="editUser('${profile.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600" title="Delete User" onclick="deleteUser('${profile.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        userTableBody.appendChild(newRow);
    });
    console.log('User table rendered.');
}

// Announcement Render Functionality
function renderAnnouncementTable() {
    if (!announcementTableBody) return;
    announcementTableBody.innerHTML = '';
    if (announcements.length === 0) {
        announcementTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No announcements found.</td></tr>';
        return;
    }
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for rendering
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;

    announcements.forEach(announcement => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        let statusBgClass = '';
        let statusTextColorClass = '';
        switch (announcement.status) {
            case 'Active': statusBgClass = 'bg-green-100'; statusTextColorClass = 'text-green-800'; break;
            case 'Archived': statusBgClass = 'bg-yellow-100'; statusTextColorClass = 'text-yellow-800'; break;
            default: statusBgClass = 'bg-gray-100'; statusTextColorClass = 'text-gray-800'; break;
        }
        newRow.innerHTML = `
            <td class="py-3 px-4">${announcement.title}</td>
            <td class="py-3 px-4">${announcement.content.substring(0, 50)}${announcement.content.length > 50 ? '...' : ''}</td>
            <td class="py-3 px-4">${announcement.date_posted}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 ${statusBgClass} ${statusTextColorClass} text-xs rounded-full">${announcement.status}</span>
            </td>
            <td class="py-3 px-4 table-actions">
                <button class="text-blue-600 mr-3" title="Edit Announcement" onclick="editAnnouncement('${announcement.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600" title="Delete Announcement" onclick="deleteAnnouncement('${announcement.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        announcementTableBody.appendChild(newRow);
    });
    console.log('Announcement table rendered.');
}

// Audit Log Render Functionality
function renderAuditLogs() {
    if (!auditLogTableBody) return;
    auditLogTableBody.innerHTML = '';
    if (auditLogs.length === 0) {
        auditLogTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No audit logs found.</td></tr>';
        return;
    }
    auditLogs.forEach(log => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        newRow.innerHTML = `
            <td class="py-3 px-4">${new Date(log.timestamp).toLocaleString()}</td>
            <td class="py-3 px-4">${log.user_email}</td>
            <td class="py-3 px-4">${log.action}</td>
            <td class="py-3 px-4">${log.module}</td>
            <td class="py-3 px-4">${log.details}</td>
        `;
        auditLogTableBody.appendChild(newRow);
    });
    console.log('Audit logs rendered.');
}

// Backup Render Functionality
function renderBackupTable() {
    if (!backupTableBody) return;
    backupTableBody.innerHTML = '';
    if (backups.length === 0) {
        backupTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No backups found.</td></tr>';
        return;
    }
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for rendering
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;

    backups.forEach(backup => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        newRow.innerHTML = `
            <td class="py-3 px-4">${backup.backup_id}</td>
            <td class="py-3 px-4">${new Date(backup.date).toLocaleString()}</td>
            <td class="py-3 px-4">${backup.size}</td>
            <td class="py-3 px-4">${backup.type}</td>
            <td class="py-3 px-4 table-actions">
                <button class="text-blue-600 mr-3" title="Download Backup" onclick="alert('Downloading backup ${backup.backup_id}...')">
                    <i class="fas fa-download"></i>
                </button>
                <button class="text-green-600 mr-3" title="Restore from this Backup" onclick="alert('Restoring from backup ${backup.backup_id}...')">
                    <i class="fas fa-undo"></i>
                </button>
                <button class="text-red-600" title="Delete Backup" onclick="alert('Deleting backup ${backup.backup_id}...')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        backupTableBody.appendChild(newRow);
    });
    console.log('Backup table rendered.');
}

// Student Attendance Module Functions
function renderAttendanceTable(filteredAttendance = attendanceRecords) {
    if (!attendanceTableBody) return;
    attendanceTableBody.innerHTML = '';

    let uniqueStudentsPresent = new Set(); // Track unique students present
    let uniqueStudentsAbsent = new Set(); // Track unique students absent
    let uniqueStudentsTotal = new Set(); // Track all unique students in records

    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for rendering
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;

    if (filteredAttendance.length === 0) {
        attendanceTableBody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-gray-500">No attendance records found for the selected criteria.</td></tr>';
    } else {
        filteredAttendance.forEach(record => {
            // Access student details directly from the joined 'students' object
            const student = record.students;
            if (!student) {
                console.warn(`Student data not found for attendance record ID: ${record.id}. Skipping row.`);
                return; // Skip if student data is not found (e.g., if the student was deleted)
            }

            uniqueStudentsTotal.add(student.id); // Add student to total unique count

            if (record.status === 'Present') {
                uniqueStudentsPresent.add(student.id); // Count unique present students
            } else if (record.status === 'Absent') {
                uniqueStudentsAbsent.add(student.id); // Count unique absent students
            }

            const newRow = document.createElement('tr');
            newRow.className = 'border-b hover:bg-gray-50';
            let statusBgClass = '';
            let statusTextColorClass = '';
            switch (record.status) {
                case 'Present': statusBgClass = 'bg-green-100'; statusTextColorClass = 'text-green-800'; break;
                case 'Absent': statusBgClass = 'bg-red-100'; statusTextColorClass = 'text-red-800'; break;
                case 'Leave': statusBgClass = 'bg-yellow-100'; statusTextColorClass = 'text-yellow-800'; break;
                default: statusBgClass = 'bg-gray-100'; statusTextColorClass = 'text-gray-800'; break;
            }
            newRow.innerHTML = `
                <td class="py-3 px-4">${student.name}</td>
                <td class="py-3 px-4">${student.roll_no}</td>
                <td class="py-3 px-4">${student.class}</td>
                <td class="py-3 px-4">${record.date}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 ${statusBgClass} ${statusTextColorClass} text-xs rounded-full">${record.status}</span>
                </td>
                <td class="py-3 px-4">${record.arrival_time || '-'}</td>
                <td class="py-3 px-4">${record.departure_time || '-'}</td>
                <td class="py-3 px-4">${record.remarks || '-'}</td>
                <td class="py-3 px-4 table-actions">
                    <button class="text-blue-600 mr-3" title="Edit Attendance" onclick="editAttendance('${record.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-600" title="Delete Attendance" onclick="deleteAttendance('${record.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            attendanceTableBody.appendChild(newRow);
        });
    }

    // Update the summary counts based on unique students
    if (attendanceTotalStudents) attendanceTotalStudents.textContent = uniqueStudentsTotal.size;
    if (attendanceTotalPresent) attendanceTotalPresent.textContent = uniqueStudentsPresent.size;
    if (attendanceTotalAbsent) attendanceTotalAbsent.textContent = uniqueStudentsAbsent.size;
    console.log('Student attendance table rendered.');
}

function filterAttendance() {
    const classFilter = attendanceClassFilter ? attendanceClassFilter.value.toLowerCase() : '';
    const dateFilter = attendanceDateFilter ? attendanceDateFilter.value : '';
    const studentNameFilter = attendanceStudentNameFilter ? attendanceStudentNameFilter.value.toLowerCase() : '';

    const filtered = attendanceRecords.filter(record => {
        // Access student details directly from the joined 'students' object
        const student = record.students;
        if (!student) return false; // Skip if student data is missing

        const classMatch = classFilter === '' || student.class.toLowerCase() === classFilter;
        const dateMatch = dateFilter === '' || record.date === dateFilter;
        const nameMatch = studentNameFilter === '' || student.name.toLowerCase().includes(studentNameFilter);

        return classMatch && dateMatch && nameMatch;
    });
    renderAttendanceTable(filtered);
    console.log('Student attendance filtered.');
}

if (applyAttendanceFilter) applyAttendanceFilter.addEventListener('click', filterAttendance);
if (attendanceClassFilter) attendanceClassFilter.addEventListener('change', filterAttendance);
if (attendanceDateFilter) attendanceDateFilter.addEventListener('change', filterAttendance);
if (attendanceStudentNameFilter) attendanceStudentNameFilter.addEventListener('keyup', filterAttendance);

// Class-wise Attendance Functions
if (loadClassStudentsBtn) {
    loadClassStudentsBtn.addEventListener('click', async () => {
        const selectedClass = classAttendanceSelect ? classAttendanceSelect.value : '';
        const selectedDate = classAttendanceDate ? classAttendanceDate.value : '';

        if (!selectedClass || !selectedDate) {
            alert('Please select both a class and a date.');
            console.warn('Load Class Students failed: Missing class or date.');
            return;
        }
        console.log(`Loading students for class ${selectedClass} on ${selectedDate}...`);

        const studentsInClass = students.filter(s => s.class === selectedClass);
        const classAttendanceBody = document.getElementById('classAttendanceTableBody');
        if (!classAttendanceBody) return;
        classAttendanceBody.innerHTML = '';

        if (studentsInClass.length === 0) {
            classAttendanceBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No students found in this class.</td></tr>';
            console.log(`No students found in class ${selectedClass}.`);
            return;
        }

        for (const student of studentsInClass) {
            // Fetch the specific record for this student and date
            const { data: existingRecords, error: fetchError } = await supabase
                .from('attendance')
                .select('*')
                .eq('student_id', student.id)
                .eq('date', selectedDate);

            if (fetchError) {
                console.error('Error fetching existing attendance record for class-wise attendance:', fetchError);
                // Fallback to default if there's an error fetching
            }

            const existingRecord = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;
            const status = existingRecord ? existingRecord.status : 'Absent'; // Default to Absent if no record
            const remarks = existingRecord ? existingRecord.remarks : '';

            const newRow = document.createElement('tr');
            newRow.className = 'border-b hover:bg-gray-50';
            newRow.innerHTML = `
                <td class="py-3 px-4">${student.name}</td>
                <td class="py-3 px-4">${student.roll_no}</td>
                <td class="py-3 px-4">
                    <select class="p-2 border border-gray-300 rounded-lg status-select" data-student-id="${student.id}">
                        <option value="Present" ${status === 'Present' ? 'selected' : ''}>Present</option>
                        <option value="Absent" ${status === 'Absent' ? 'selected' : ''}>Absent</option>
                        <option value="Leave" ${status === 'Leave' ? 'selected' : ''}>Leave</option>
                    </select>
                </td>
                <td class="py-3 px-4">
                    <input type="text" class="w-full p-2 border border-gray-300 rounded-lg remarks-input" value="${remarks}" placeholder="Remarks">
                </td>
                <td class="py-3 px-4">
                    <button class="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 save-attendance-btn" data-student-id="${student.id}">Save</button>
                </td>
            `;
            classAttendanceBody.appendChild(newRow);
        }

        // Add event listeners for individual save buttons
        document.querySelectorAll('.save-attendance-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const studentId = event.target.dataset.studentId;
                const row = event.target.closest('tr');
                const statusSelect = row?.querySelector('.status-select');
                const remarksInput = row?.querySelector('.remarks-input');

                const status = statusSelect ? statusSelect.value : 'Absent';
                const remarks = remarksInput ? remarksInput.value : '';
                await markIndividualAttendance(studentId, selectedDate, status, remarks);
            });
        });
        console.log(`Students for class ${selectedClass} loaded into class attendance table.`);
    });
}

if (markAllPresentBtn) {
    markAllPresentBtn.addEventListener('click', async () => {
        const selectedClass = classAttendanceSelect ? classAttendanceSelect.value : '';
        const selectedDate = classAttendanceDate ? classAttendanceDate.value : '';

        if (!selectedClass || !selectedDate) {
            alert('Please select both a class and a date.');
            console.warn('Mark Class Attendance failed: Missing class or date.');
            return;
        }

        if (!confirm(`Are you sure you want to mark all students in ${selectedClass} as PRESENT for ${selectedDate}?`)) {
            return;
        }
        console.log(`Marking all students in ${selectedClass} as PRESENT for ${selectedDate}...`);

        const studentsInClass = students.filter(s => s.class === selectedClass);
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'System';

        for (const student of studentsInClass) {
            const attendanceData = {
                student_id: student.id,
                date: selectedDate,
                status: 'Present',
                remarks: 'Marked Present (Class-wise)'
            };

            try {
                await supabase.from('attendance').upsert(
                    { ...attendanceData },
                    { onConflict: ['student_id', 'date'] }
                );
                await addAuditLog(userEmail, 'Marked Class Attendance', 'Attendance', `Marked Present for ${student.name} (Class: ${selectedClass}) on ${selectedDate}`);
            } catch (error) {
                console.error(`Error marking attendance for ${student.name}:`, error);
                await addAuditLog(userEmail, 'Class Attendance Failed', 'Attendance', `Failed to mark attendance for ${student.name} (Class: ${selectedClass}) on ${selectedDate}: ${error.message}`);
            }
        }
        alert(`All students in ${selectedClass} marked as Present for ${selectedDate}.`);
        await fetchAttendanceRecords(); // Refresh the main attendance table and summary counts
        loadClassStudentsBtn?.click(); // Reload the class-wise table to show updated statuses
        console.log('Class attendance marked successfully.');
    });
}

async function markIndividualAttendance(studentId, date, status, remarks) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userEmail = loggedInUser?.email || 'System';
    const student = students.find(s => s.id === studentId);
    console.log(`Marking individual attendance for ${student ? student.name : studentId} as ${status} on ${date}...`);

    const attendanceData = {
        student_id: studentId,
        date: date,
        status: status,
        arrival_time: new Date().toTimeString().split(' ')[0].substring(0, 5), // Capture current time
        departure_time: null, // Clear departure time if marking present
        remarks: remarks
    };

    try {
        await supabase.from('attendance').upsert(
            { ...attendanceData },
            { onConflict: ['student_id', 'date'] }
        );
        alert(`Attendance for ${student ? student.name : 'student'} updated to ${status} for ${date}.`);
        await addAuditLog(userEmail, 'Marked Individual Attendance', 'Attendance', `Marked ${status} for ${student ? student.name : studentId} on ${date}`);
        await fetchAttendanceRecords(); // Refresh the main attendance table and summary counts
        console.log(`Individual attendance for ${student ? student.name : studentId} updated successfully.`);
    } catch (error) {
        console.error(`Error marking attendance for ${student ? student.name : studentId}:`, error);
        alert(`Error marking attendance for ${student ? student.name : studentId}: ${error.message}`);
        await addAuditLog(userEmail, 'Individual Attendance Failed', 'Attendance', `Failed to mark attendance for ${student ? student.name : studentId} on ${date}: ${error.message}`);
    }
}


// Teacher Attendance Module Functions
function renderTeacherAttendanceTable(filteredRecords = teacherAttendanceRecords) {
    if (!teacherAttendanceRecordsTableBody) return;
    teacherAttendanceRecordsTableBody.innerHTML = '';

    let uniqueTeachersPresent = new Set(); // Track unique teachers present
    let uniqueTeachersAbsent = new Set(); // Track unique teachers absent
    let uniqueTeachersTotal = new Set(); // Track all unique teachers in records

    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for rendering
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;

    if (filteredRecords.length === 0) {
        teacherAttendanceRecordsTableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-gray-500">No teacher attendance records found for the selected criteria.</td></tr>';
    } else {
        filteredRecords.forEach(record => {
            // Access teacher details directly from the joined 'teachers' object
            const teacher = record.teachers;
            if (!teacher) {
                console.warn(`Teacher data not found for teacher attendance record ID: ${record.id}. Skipping row.`);
                return; // Skip if teacher data is not found
            }

            uniqueTeachersTotal.add(teacher.id); // Add teacher to total unique count

            if (record.status === 'Present') {
                uniqueTeachersPresent.add(teacher.id); // Count unique present teachers
            } else if (record.status === 'Absent') {
                uniqueTeachersAbsent.add(teacher.id); // Count unique absent teachers
            }

            const newRow = document.createElement('tr');
            newRow.className = 'border-b hover:bg-gray-50';
            let statusBgClass = '';
            let statusTextColorClass = '';
            switch (record.status) {
                case 'Present': statusBgClass = 'bg-green-100'; statusTextColorClass = 'text-green-800'; break;
                case 'Absent': statusBgClass = 'bg-red-100'; statusTextColorClass = 'text-red-800'; break;
                case 'Leave': statusBgClass = 'bg-yellow-100'; statusTextColorClass = 'text-yellow-800'; break;
                default: statusBgClass = 'bg-gray-100'; statusTextColorClass = 'text-gray-800'; break;
            }
            newRow.innerHTML = `
                <td class="py-3 px-4">${teacher.name}</td>
                <td class="py-3 px-4">${teacher.subject}</td>
                <td class="py-3 px-4">${record.date}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 ${statusBgClass} ${statusTextColorClass} text-xs rounded-full">${record.status}</span>
                </td>
                <td class="py-3 px-4">${record.arrival_time || '-'}</td>
                <td class="py-3 px-4">${record.departure_time || '-'}</td>
                <td class="py-3 px-4">${record.remarks || '-'}</td>
                <td class="py-3 px-4 table-actions">
                    <button class="text-blue-600 mr-3" title="Edit Attendance" onclick="editTeacherAttendance('${record.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-600" title="Delete Attendance" onclick="deleteTeacherAttendance('${record.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            teacherAttendanceRecordsTableBody.appendChild(newRow);
        });
    }

    // Update the summary counts based on unique teachers
    if (teacherAttendanceTotalTeachers) teacherAttendanceTotalTeachers.textContent = uniqueTeachersTotal.size;
    if (teacherAttendanceTotalPresent) teacherAttendanceTotalPresent.textContent = uniqueTeachersPresent.size;
    if (teacherAttendanceTotalAbsent) teacherAttendanceTotalAbsent.textContent = uniqueTeachersAbsent.size;
    console.log('Teacher attendance table rendered.');
}

function filterTeacherAttendance() {
    const nameFilter = teacherAttendanceNameFilter ? teacherAttendanceNameFilter.value.toLowerCase() : '';
    const subjectFilter = teacherAttendanceSubjectFilter ? teacherAttendanceSubjectFilter.value.toLowerCase() : '';
    const dateFilter = teacherAttendanceDateFilter ? teacherAttendanceDateFilter.value : '';

    const filtered = teacherAttendanceRecords.filter(record => {
        const teacher = record.teachers;
        if (!teacher) return false;

        const nameMatch = nameFilter === '' || teacher.name.toLowerCase().includes(nameFilter);
        const subjectMatch = subjectFilter === '' || teacher.subject.toLowerCase().includes(subjectFilter);
        const dateMatch = dateFilter === '' || record.date === dateFilter;

        return nameMatch && subjectMatch && dateMatch;
    });
    renderTeacherAttendanceTable(filtered);
    console.log('Teacher attendance filtered.');
}

if (applyTeacherAttendanceFilter) applyTeacherAttendanceFilter.addEventListener('click', filterTeacherAttendance);
if (teacherAttendanceNameFilter) teacherAttendanceNameFilter.addEventListener('keyup', filterTeacherAttendance);
if (teacherAttendanceSubjectFilter) teacherAttendanceSubjectFilter.addEventListener('change', filterTeacherAttendance);
if (teacherAttendanceDateFilter) teacherAttendanceDateFilter.addEventListener('change', filterTeacherAttendance);

// Populate Teacher Select for Attendance Modal
async function populateTeacherSelect(selectedTeacherId = '') {
    if (!teacherAttendanceTeacherSelect) return;

    if (teachers.length === 0) {
        await fetchTeachers(); // Ensure teachers data is available
    }

    teacherAttendanceTeacherSelect.innerHTML = '<option value="">Select Teacher</option>';
    teachers.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher.id;
        option.textContent = `${teacher.name} (${teacher.subject})`;
        if (teacher.id === selectedTeacherId) {
            option.selected = true;
        }
        teacherAttendanceTeacherSelect.appendChild(option);
    });
    console.log('Teacher select populated for attendance.');
}

// Add/Edit Teacher Attendance Modal Functions
window.showAddTeacherAttendanceModal = function() {
    if (teacherAttendanceModal) {
        teacherAttendanceModal.classList.remove('hidden');
        teacherAttendanceModal.style.display = 'flex';
    }
    if (teacherAttendanceForm) {
        teacherAttendanceForm.reset();
        document.getElementById('teacherAttendanceId').value = ''; // Clear ID for new entry
    }
    if (teacherAttendanceModalTitle) {
        teacherAttendanceModalTitle.textContent = 'Mark Teacher Attendance';
    }
    if (teacherAttendanceFormSubmitBtn) {
        teacherAttendanceFormSubmitBtn.textContent = 'Mark Attendance';
    }
    populateTeacherSelect();
    console.log('Add Teacher Attendance modal opened.');
};

window.editTeacherAttendance = async function(id) {
    console.log(`Editing teacher attendance ID: ${id}`);
    const record = teacherAttendanceRecords.find(rec => rec.id === id);
    if (record) {
        document.getElementById('teacherAttendanceId').value = record.id;
        document.getElementById('teacherAttendanceDate').value = record.date;
        document.getElementById('teacherAttendanceStatus').value = record.status;
        document.getElementById('teacherArrivalTime').value = record.arrival_time || '';
        document.getElementById('teacherDepartureTime').value = record.departure_time || '';
        document.getElementById('teacherAttendanceRemarks').value = record.remarks || '';

        await populateTeacherSelect(record.teacher_id); // Pre-select teacher

        if (teacherAttendanceModalTitle) {
            teacherAttendanceModalTitle.textContent = 'Edit Teacher Attendance';
        }
        if (teacherAttendanceFormSubmitBtn) {
            teacherAttendanceFormSubmitBtn.textContent = 'Save Changes';
        }
        if (teacherAttendanceModal) {
            teacherAttendanceModal.classList.remove('hidden');
            teacherAttendanceModal.style.display = 'flex';
        }
        console.log(`Teacher attendance ${id} data loaded for editing.`);
    } else {
        alert('Teacher attendance record not found.');
        console.error(`Teacher attendance record with ID ${id} not found for editing.`);
    }
};

window.deleteTeacherAttendance = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userEmail = loggedInUser?.email || 'admin';
    if (confirm('Are you sure you want to delete this teacher attendance record?')) {
        console.log(`Deleting teacher attendance ID: ${id}`);
        try {
            const { error } = await supabase.from('teacher_attendance').delete().eq('id', id);
            if (error) throw error;

            const deletedRecord = teacherAttendanceRecords.find(rec => rec.id === id);
            await addAuditLog(userEmail, 'Deleted Teacher Attendance', 'Teacher Attendance', `Deleted attendance for teacher ID ${deletedRecord?.teacher_id || id} on ${deletedRecord?.date || 'N/A'}`);
            alert('Teacher attendance record deleted successfully!');
            await fetchTeacherAttendanceRecords(); // Re-fetch to update the table
            console.log(`Teacher attendance record ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting teacher attendance record: ' + error.message);
            console.error('Supabase error deleting teacher attendance record:', error);
            await addAuditLog(userEmail, 'Delete Teacher Attendance Failed', 'Teacher Attendance', `Error: ${error.message}`);
        }
    }
};

if (closeTeacherAttendanceModal) {
    closeTeacherAttendanceModal.addEventListener('click', () => {
        if (teacherAttendanceModal) {
            teacherAttendanceModal.classList.add('hidden');
            teacherAttendanceModal.style.display = 'none';
        }
        if (teacherAttendanceForm) teacherAttendanceForm.reset();
        console.log('Teacher Attendance modal closed.');
    });
}

if (teacherAttendanceModal) {
    teacherAttendanceModal.addEventListener('click', (e) => {
        if (e.target === teacherAttendanceModal) {
            teacherAttendanceModal.classList.add('hidden');
            teacherAttendanceModal.style.display = 'none';
            if (teacherAttendanceForm) teacherAttendanceForm.reset();
            console.log('Teacher Attendance modal closed by outside click.');
        }
    });
}

if (teacherAttendanceForm) {
    teacherAttendanceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';

        const id = document.getElementById('teacherAttendanceId').value;
        const teacherId = document.getElementById('teacherAttendanceTeacherSelect').value;
        const date = document.getElementById('teacherAttendanceDate').value;
        const status = document.getElementById('teacherAttendanceStatus').value;
        const arrivalTime = document.getElementById('teacherArrivalTime').value;
        const departureTime = document.getElementById('teacherDepartureTime').value;
        const remarks = document.getElementById('teacherAttendanceRemarks').value;

        if (!teacherId || !date || !status) {
            alert('Please fill in all required fields.');
            console.warn('Teacher attendance form submission failed: Missing required fields.');
            return;
        }

        const attendanceData = {
            teacher_id: teacherId,
            date: date,
            status: status,
            arrival_time: arrivalTime || null,
            departure_time: departureTime || null,
            remarks: remarks || null
        };

        try {
            let result;
            if (id) {
                // Update existing record
                console.log(`Updating teacher attendance record ${id}...`);
                result = await supabase.from('teacher_attendance').update(attendanceData).eq('id', id).select();
                await addAuditLog(userEmail, 'Updated Teacher Attendance', 'Teacher Attendance', `Updated attendance for teacher ID ${teacherId} on ${date}`);
                alert('Teacher attendance record updated successfully!');
            } else {
                // Add new record
                console.log(`Adding new teacher attendance record for teacher ID ${teacherId}...`);
                result = await supabase.from('teacher_attendance').insert([attendanceData]).select();
                await addAuditLog(userEmail, 'Added Teacher Attendance', 'Teacher Attendance', `Added attendance for teacher ID ${teacherId} on ${date}`);
                alert('Teacher attendance record added successfully!');
            }

            if (result.error) throw result.error;

            await fetchTeacherAttendanceRecords(); // Re-fetch to update the table
            if (teacherAttendanceModal) {
                teacherAttendanceModal.classList.add('hidden');
                teacherAttendanceModal.style.display = 'none';
            }
            if (teacherAttendanceForm) {
                teacherAttendanceForm.reset();
            }
            console.log('Teacher attendance operation completed successfully.');
        } catch (error) {
            alert('Error saving teacher attendance record: ' + error.message);
            console.error('Supabase error saving teacher attendance record:', error);
            await addAuditLog(userEmail, 'Save Teacher Attendance Failed', 'Teacher Attendance', `Error: ${error.message}`);
        }
    });
}

// Fingerprint Integration (Placeholders)
if (registerStudentFingerprintBtn) {
    registerStudentFingerprintBtn.addEventListener('click', () => {
        alert('Fingerprint registration for students is not yet implemented.');
        console.log('Student fingerprint registration initiated.');
    });
}

if (verifyStudentFingerprintBtn) {
    verifyStudentFingerprintBtn.addEventListener('click', () => {
        alert('Fingerprint verification for students is not yet implemented.');
        console.log('Student fingerprint verification initiated.');
    });
}

if (registerTeacherFingerprintBtn) {
    registerTeacherFingerprintBtn.addEventListener('click', () => {
        alert('Fingerprint registration for teachers is not yet implemented.');
        console.log('Teacher fingerprint registration initiated.');
    });
}

if (verifyTeacherFingerprintBtn) {
    verifyTeacherFingerprintBtn.addEventListener('click', () => {
        alert('Fingerprint verification for teachers is not yet implemented.');
        console.log('Teacher fingerprint verification initiated.');
    });
}

// QR Code Scanning for Student Attendance
window.startQrAttendance = function() {
    if (!checkHtml5QrCodeAvailability()) return;

    if (qrScannerSection) qrScannerSection.classList.remove('hidden');
    if (qrVideo) qrVideo.innerHTML = ''; // Clear previous content

    html5QrCodeScanner = new Html5QrcodeScanner(
        "qrVideo",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
    );

    html5QrCodeScanner.render(onScanSuccess, onScanError);
    console.log('Student QR attendance scanner started.');
};

async function onScanSuccess(decodedText, decodedResult) {
    console.log(`QR Code scanned: ${decodedText}`);
    alert(`QR Code scanned: ${decodedText}`);
    // Assuming decodedText is a student ID
    const studentId = decodedText;
    const student = students.find(s => s.id === studentId);
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userEmail = loggedInUser?.email || 'System';

    if (student) {
        const today = new Date().toISOString().split('T')[0];
        const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

        const attendanceData = {
            student_id: student.id,
            date: today,
            status: 'Present',
            arrival_time: currentTime,
            remarks: 'Marked via QR Scan'
        };

        try {
            // Use upsert to either insert a new record or update an existing one for the same student and date
            const { data, error } = await supabase.from('attendance').upsert(
                { ...attendanceData },
                { onConflict: ['student_id', 'date'] } // Define conflict keys
            );

            if (error) throw error;

            alert(`Attendance marked for ${student.name} (ID: ${student.id}) as Present.`);
            await addAuditLog(userEmail, 'QR Attendance Marked', 'Attendance', `Marked Present for ${student.name} (ID: ${student.id}) via QR scan.`);
            await fetchAttendanceRecords(); // Refresh attendance table
        } catch (error) {
            alert('Error marking attendance: ' + error.message);
            console.error('Supabase error marking attendance via QR:', error);
            await addAuditLog(userEmail, 'QR Attendance Failed', 'Attendance', `Failed to mark attendance for ${student.id} via QR: ${error.message}`);
        }
    } else {
        alert('Student not found for scanned QR code.');
        await addAuditLog(userEmail, 'QR Attendance Failed', 'Attendance', `Student not found for scanned QR: ${studentId}`);
    }

    // Optionally stop the scanner after a successful scan
    await stopQrAttendance();
}

function onScanError(errorMessage) {
    // console.warn(`QR Scan Error: ${errorMessage}`); // Too verbose, only log if needed for debugging
}

window.stopQrAttendance = async function() {
    if (html5QrCodeScanner && html5QrCodeScanner.isScanning) {
        try {
            await html5QrCodeScanner.stop();
            console.log('Student QR attendance scanner stopped.');
        } catch (err) {
            console.error('Error stopping student QR scanner:', err);
        }
    }
    if (qrScannerSection) qrScannerSection.classList.add('hidden');
    if (qrVideo) qrVideo.innerHTML = ''; // Clear video element
};

// QR Code Scanning for Teacher Attendance
window.startTeacherQrAttendance = function(type) {
    if (!checkHtml5QrCodeAvailability()) return;

    if (teacherQrScannerSection) teacherQrScannerSection.classList.remove('hidden');
    if (teacherQrVideo) teacherQrVideo.innerHTML = ''; // Clear previous content

    const titleElement = document.getElementById('teacherQrScannerTitle');
    if (titleElement) {
        titleElement.textContent = `Scan QR Code for Teacher ${type === 'arrival' ? 'Arrival' : 'Departure'} Attendance`;
    }

    html5QrCodeScannerTeacher = new Html5QrcodeScanner(
        "teacherQrVideo",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
    );

    html5QrCodeScannerTeacher.render(
        (decodedText, decodedResult) => onTeacherScanSuccess(decodedText, decodedResult, type),
        onScanError // Use the same error handler
    );
    console.log(`Teacher QR attendance scanner started for ${type}.`);
};

async function onTeacherScanSuccess(decodedText, decodedResult, type) {
    console.log(`Teacher QR Code scanned for ${type}: ${decodedText}`);
    alert(`Teacher QR Code scanned for ${type}: ${decodedText}`);
    // Assuming decodedText is a teacher ID
    const teacherId = decodedText;
    const teacher = teachers.find(t => t.id === teacherId);
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userEmail = loggedInUser?.email || 'System';

    if (teacher) {
        const today = new Date().toISOString().split('T')[0];
        const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

        let attendanceData = {
            teacher_id: teacher.id,
            date: today,
            status: 'Present', // Default to present on scan
            remarks: `Marked via QR Scan (${type})`
        };

        if (type === 'arrival') {
            attendanceData.arrival_time = currentTime;
            attendanceData.departure_time = null; // Clear departure time on arrival scan
        } else if (type === 'departure') {
            attendanceData.departure_time = currentTime;
            // Fetch existing record to preserve arrival_time if it exists
            const { data: existingRecord, error: fetchError } = await supabase
                .from('teacher_attendance')
                .select('arrival_time')
                .eq('teacher_id', teacher.id)
                .eq('date', today)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
                console.error('Error fetching existing teacher attendance for departure:', fetchError);
            }
            if (existingRecord) {
                attendanceData.arrival_time = existingRecord.arrival_time;
            }
        }

        try {
            const { data, error } = await supabase.from('teacher_attendance').upsert(
                { ...attendanceData },
                { onConflict: ['teacher_id', 'date'] }
            );

            if (error) throw error;

            alert(`Teacher attendance marked for ${teacher.name} (ID: ${teacher.id}) for ${type}.`);
            await addAuditLog(userEmail, `QR Teacher Attendance Marked (${type})`, 'Teacher Attendance', `Marked ${type} for ${teacher.name} (ID: ${teacher.id}) via QR scan.`);
            await fetchTeacherAttendanceRecords(); // Refresh teacher attendance table
        } catch (error) {
            alert('Error marking teacher attendance: ' + error.message);
            console.error('Supabase error marking teacher attendance via QR:', error);
            await addAuditLog(userEmail, `QR Teacher Attendance Failed (${type})`, 'Teacher Attendance', `Failed to mark ${type} for ${teacher.id} via QR: ${error.message}`);
        }
    } else {
        alert('Teacher not found for scanned QR code.');
        await addAuditLog(userEmail, `QR Teacher Attendance Failed (${type})`, 'Teacher Attendance', `Teacher not found for scanned QR: ${teacherId}`);
    }

    await stopTeacherQrAttendance();
}

window.stopTeacherQrAttendance = async function() {
    if (html5QrCodeScannerTeacher && html5QrCodeScannerTeacher.isScanning) {
        try {
            await html5QrCodeScannerTeacher.stop();
            console.log('Teacher QR attendance scanner stopped.');
        } catch (err) {
            console.error('Error stopping teacher QR scanner:', err);
        }
    }
    if (teacherQrScannerSection) teacherQrScannerSection.classList.add('hidden');
    if (teacherQrVideo) teacherQrVideo.innerHTML = '';
};

// QR Code Generation for Students
window.showStudentQrCodeModal = function(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) {
        alert('Student not found.');
        console.error(`Student with ID ${studentId} not found for QR code generation.`);
        return;
    }

    if (studentQrCodeModal) {
        studentQrCodeModal.classList.remove('hidden');
        studentQrCodeModal.style.display = 'flex';
    }

    if (studentQrCodeCanvas) {
        const qr = new QRious({
            element: studentQrCodeCanvas,
            value: student.id, // The data to encode in the QR code (student ID)
            size: 200,
            padding: 10
        });
        console.log(`QR code generated for student ID: ${student.id}`);

        // Update download link
        if (downloadQrCodeLink) {
            downloadQrCodeLink.href = studentQrCodeCanvas.toDataURL('image/png');
            downloadQrCodeLink.download = `student_${student.id}_qr_code.png`;
        }
        if (qrCodeStudentIdDisplay) {
            qrCodeStudentIdDisplay.textContent = `Student ID: ${student.id}`;
        }
    }
};

if (closeStudentQrCodeModal) {
    closeStudentQrCodeModal.addEventListener('click', () => {
        if (studentQrCodeModal) {
            studentQrCodeModal.classList.add('hidden');
            studentQrCodeModal.style.display = 'none';
        }
        console.log('Student QR code modal closed.');
    });
}

if (studentQrCodeModal) {
    studentQrCodeModal.addEventListener('click', (e) => {
        if (e.target === studentQrCodeModal) {
            studentQrCodeModal.classList.add('hidden');
            studentQrCodeModal.style.display = 'none';
            console.log('Student QR code modal closed by outside click.');
        }
    });
}

window.printStudentQrCode = function() {
    console.log('Printing student QR code...');
    const printContents = studentQrCodeCanvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Print Student QR Code</title>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(`<img src="${printContents}" style="max-width: 100%; height: auto;">`);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    console.log('Student QR code print initiated.');
};

// QR Code Generation for Teachers
window.showTeacherQrCodeModal = function(teacherId) {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) {
        alert('Teacher not found.');
        console.error(`Teacher with ID ${teacherId} not found for QR code generation.`);
        return;
    }

    if (teacherQrCodeModal) {
        teacherQrCodeModal.classList.remove('hidden');
        teacherQrCodeModal.style.display = 'flex';
    }

    if (teacherQrCodeCanvas) {
        const qr = new QRious({
            element: teacherQrCodeCanvas,
            value: teacher.id, // The data to encode in the QR code (teacher ID)
            size: 200,
            padding: 10
        });
        console.log(`QR code generated for teacher ID: ${teacher.id}`);

        // Update download link
        if (downloadTeacherQrCodeLink) {
            downloadTeacherQrCodeLink.href = teacherQrCodeCanvas.toDataURL('image/png');
            downloadTeacherQrCodeLink.download = `teacher_${teacher.id}_qr_code.png`;
        }
        if (qrCodeTeacherIdDisplay) {
            qrCodeTeacherIdDisplay.textContent = `Teacher ID: ${teacher.id}`;
        }
    }
};

if (closeTeacherQrCodeModal) {
    closeTeacherQrCodeModal.addEventListener('click', () => {
        if (teacherQrCodeModal) {
            teacherQrCodeModal.classList.add('hidden');
            teacherQrCodeModal.style.display = 'none';
        }
        console.log('Teacher QR code modal closed.');
    });
}

if (teacherQrCodeModal) {
    teacherQrCodeModal.addEventListener('click', (e) => {
        if (e.target === teacherQrCodeModal) {
            teacherQrCodeModal.classList.add('hidden');
            teacherQrCodeModal.style.display = 'none';
            console.log('Teacher QR code modal closed by outside click.');
        }
    });
}

window.printTeacherQrCode = function() {
    console.log('Printing teacher QR code...');
    const printContents = teacherQrCodeCanvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Print Teacher QR Code</title>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(`<img src="${printContents}" style="max-width: 100%; height: auto;">`);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    console.log('Teacher QR code print initiated.');
};


// Dashboard Stats Update
function updateDashboardStats() {
    if (totalStudentsCount) totalStudentsCount.textContent = students.length;
    if (totalTeachersCount) totalTeachersCount.textContent = teachers.length;

    // Calculate monthly revenue (sum of paid amounts from invoices)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenueAmount = invoices.reduce((sum, invoice) => {
        const invoiceDate = new Date(invoice.date);
        if (invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear) {
            return sum + (parseFloat(invoice.paid_amount) || 0);
        }
        return sum;
    }, 0);
    if (monthlyRevenue) monthlyRevenue.textContent = `₹${monthlyRevenueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Calculate upcoming events (from calendar events, excluding holidays already handled)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingEvents = (calendar?.getEvents() || []).filter(event => {
        const eventStart = event.start;
        return eventStart && eventStart >= today && !event.classNames.includes('holiday');
    }).length;
    if (upcomingEventsCount) upcomingEventsCount.textContent = upcomingEvents;

    // Calculate students present today
    const todayDate = new Date().toISOString().split('T')[0];
    const studentsPresent = attendanceRecords.filter(rec => rec.date === todayDate && rec.status === 'Present').length;
    if (studentsPresentToday) studentsPresentToday.textContent = studentsPresent;

    // Check if today is a holiday
    const isHolidayToday = holidays.some(holiday => holiday.date === todayDate);
    const holidayIndicator = document.getElementById('holidayIndicator');
    const studentsPresentLabel = document.getElementById('studentsPresentLabel');

    if (isHolidayToday) {
        if (holidayIndicator) holidayIndicator.classList.remove('hidden');
        if (studentsPresentLabel) studentsPresentLabel.textContent = 'Students Present Today (Holiday)';
    } else {
        if (holidayIndicator) holidayIndicator.classList.add('hidden');
        if (studentsPresentLabel) studentsPresentLabel.textContent = 'Students Present Today';
    }

    // Calculate teachers present today
    const teachersPresent = teacherAttendanceRecords.filter(rec => rec.date === todayDate && rec.status === 'Present').length;
    if (teachersPresentToday) teachersPresentToday.textContent = teachersPresent;

    console.log('Dashboard stats updated.');
}

// Dashboard Charts (Chart.js)
function initCharts() {
    console.log('Initializing dashboard charts...');

    // Destroy existing chart instances to prevent duplicates
    safeDestroy(financeOverviewChartInstance);
    safeDestroy(studentAttendanceChartInstance);
    safeDestroy(teacherAttendanceChartInstance);
    safeDestroy(monthlyAttendanceTrendChartInstance);

    // Finance Overview Chart
    const financeCtx = document.getElementById('financeOverviewChart')?.getContext('2d');
    if (financeCtx) {
        const totalRevenue = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
        const totalPaid = invoices.reduce((sum, inv) => sum + (parseFloat(inv.paid_amount) || 0), 0);
        const totalDue = totalRevenue - totalPaid;

        financeOverviewChartInstance = new Chart(financeCtx, {
            type: 'pie',
            data: {
                labels: ['Total Paid', 'Total Due'],
                datasets: [{
                    data: [totalPaid, totalDue],
                    backgroundColor: ['#4CAF50', '#FFC107'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Finance Overview',
                        font: { size: 16 }
                    },
                    legend: {
                        position: 'bottom',
                    }
                }
            }
        });
    }

    // Student Attendance Chart (Last 7 days)
    const studentAttendanceCtx = document.getElementById('studentAttendanceChart')?.getContext('2d');
    if (studentAttendanceCtx) {
        const attendanceData = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            attendanceData[dateStr] = { present: 0, absent: 0 };
        }

        attendanceRecords.forEach(record => {
            if (attendanceData[record.date]) {
                if (record.status === 'Present') attendanceData[record.date].present++;
                else if (record.status === 'Absent') attendanceData[record.date].absent++;
            }
        });

        const labels = Object.keys(attendanceData).map(date => moment(date).format('MMM D'));
        const presentData = Object.values(attendanceData).map(data => data.present);
        const absentData = Object.values(attendanceData).map(data => data.absent);

        studentAttendanceChartInstance = new Chart(studentAttendanceCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Present',
                        data: presentData,
                        backgroundColor: '#4CAF50'
                    },
                    {
                        label: 'Absent',
                        data: absentData,
                        backgroundColor: '#F44336'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Student Attendance (Last 7 Days)',
                        font: { size: 16 }
                    },
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                }
            }
        });
    }

    // Teacher Attendance Chart (Last 7 days)
    const teacherAttendanceCtx = document.getElementById('teacherAttendanceChart')?.getContext('2d');
    if (teacherAttendanceCtx) {
        const attendanceData = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            attendanceData[dateStr] = { present: 0, absent: 0 };
        }

        teacherAttendanceRecords.forEach(record => {
            if (attendanceData[record.date]) {
                if (record.status === 'Present') attendanceData[record.date].present++;
                else if (record.status === 'Absent') attendanceData[record.date].absent++;
            }
        });

        const labels = Object.keys(attendanceData).map(date => moment(date).format('MMM D'));
        const presentData = Object.values(attendanceData).map(data => data.present);
        const absentData = Object.values(attendanceData).map(data => data.absent);

        teacherAttendanceChartInstance = new Chart(teacherAttendanceCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Present',
                        data: presentData,
                        backgroundColor: '#2196F3'
                    },
                    {
                        label: 'Absent',
                        data: absentData,
                        backgroundColor: '#FF9800'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Teacher Attendance (Last 7 Days)',
                        font: { size: 16 }
                    },
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                }
            }
        });
    }

    // Monthly Attendance Trend (Students)
    const monthlyAttendanceCtx = document.getElementById('monthlyAttendanceTrendChart')?.getContext('2d');
    if (monthlyAttendanceCtx) {
        const monthlyData = {};
        const currentYear = new Date().getFullYear();
        for (let i = 0; i < 12; i++) {
            const monthName = moment().month(i).format('MMM');
            monthlyData[monthName] = { totalDays: 0, presentDays: 0 };
        }

        // Populate total days for each month (simplified, assumes 30 days for all months for trend)
        // For more accuracy, you'd calculate actual school days per month
        Object.keys(monthlyData).forEach(month => {
            monthlyData[month].totalDays = 20; // Example: 20 school days per month
        });

        attendanceRecords.forEach(record => {
            const recordDate = new Date(record.date);
            if (recordDate.getFullYear() === currentYear) {
                const monthName = moment(recordDate).format('MMM');
                if (monthlyData[monthName]) {
                    if (record.status === 'Present') {
                        monthlyData[monthName].presentDays++;
                    }
                }
            }
        });

        const labels = Object.keys(monthlyData);
        const attendancePercentage = labels.map(month => {
            const total = monthlyData[month].totalDays * students.length; // Total possible attendance days for all students
            const present = monthlyData[month].presentDays;
            return total > 0 ? (present / total * 100).toFixed(2) : 0;
        });

        monthlyAttendanceTrendChartInstance = new Chart(monthlyAttendanceCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Student Attendance (%)',
                    data: attendancePercentage,
                    borderColor: '#03A9F4',
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Student Attendance Trend (${currentYear})`,
                        font: { size: 16 }
                    },
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Attendance Percentage'
                        }
                    }
                }
            }
        });
    }
    console.log('Dashboard charts initialized.');
}

// Recent Activity
function renderRecentActivity() {
    if (!recentActivityList) return;
    recentActivityList.innerHTML = '';
    const recentLogs = auditLogs.slice(0, 5); // Show last 5 activities
    if (recentLogs.length === 0) {
        recentActivityList.innerHTML = '<p class="text-gray-500 text-center py-4">No recent activity.</p>';
        return;
    }
    recentLogs.forEach(log => {
        const div = document.createElement('div');
        div.className = 'flex items-center space-x-3 p-3 rounded-lg bg-gray-50';
        div.innerHTML = `
            <div class="icon-wrapper bg-blue-100 text-blue-600">
                <i class="fas fa-info-circle"></i>
            </div>
            <div>
                <p class="font-medium">${log.action} in ${log.module}</p>
                <p class="text-sm text-gray-600">${log.details}</p>
                <p class="text-xs text-gray-500">${moment(log.timestamp).fromNow()}</p>
            </div>
        `;
        recentActivityList.appendChild(div);
    });
    console.log('Recent activity rendered.');
}

// Exams Module Functions
function renderExams(filteredExams = exams) {
    if (!examTableBody) return;
    examTableBody.innerHTML = '';
    if (filteredExams.length === 0) {
        examTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">No exams found.</td></tr>';
        return;
    }
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for rendering
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;

    filteredExams.forEach(exam => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        newRow.innerHTML = `
            <td class="py-3 px-4">${exam.name}</td>
            <td class="py-3 px-4">${exam.class}</td>
            <td class="py-3 px-4">${exam.subject}</td>
            <td class="py-3 px-4">${exam.date}</td>
            <td class="py-3 px-4">${exam.max_marks}</td>
            <td class="py-3 px-4 table-actions">
                <button class="text-blue-600 mr-3" title="Edit Exam" onclick="editExam('${exam.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600" title="Delete Exam" onclick="deleteExam('${exam.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        examTableBody.appendChild(newRow);
    });
    console.log('Exams table rendered.');
}

window.showAddExamModal = function() {
    if (examModal) {
        examModal.classList.remove('hidden');
        examModal.style.display = 'flex';
    }
    if (examForm) {
        examForm.reset();
        document.getElementById('examId').value = ''; // Clear ID for new entry
    }
    if (examModalTitle) {
        examModalTitle.textContent = 'Add New Exam';
    }
    if (examFormSubmitBtn) {
        examFormSubmitBtn.textContent = 'Save Exam';
    }
    console.log('Add Exam modal opened.');
};

window.editExam = async function(id) {
    console.log(`Editing exam ID: ${id}`);
    const exam = exams.find(ex => ex.id === id);
    if (exam) {
        document.getElementById('examId').value = exam.id;
        document.getElementById('examName').value = exam.name;
        document.getElementById('examClass').value = exam.class;
        document.getElementById('examSubject').value = exam.subject;
        document.getElementById('examDate').value = exam.date;
        document.getElementById('examMaxMarks').value = exam.max_marks;

        if (examModalTitle) {
            examModalTitle.textContent = 'Edit Exam';
        }
        if (examFormSubmitBtn) {
            examFormSubmitBtn.textContent = 'Save Changes';
        }
        if (examModal) {
            examModal.classList.remove('hidden');
            examModal.style.display = 'flex';
        }
        console.log(`Exam ${id} data loaded for editing.`);
    } else {
        alert('Exam not found.');
        console.error(`Exam with ID ${id} not found for editing.`);
    }
};

window.deleteExam = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userEmail = loggedInUser?.email || 'admin';
    if (confirm('Are you sure you want to delete this exam?')) {
        console.log(`Deleting exam ID: ${id}`);
        try {
            const { error } = await supabase.from('exams').delete().eq('id', id);
            if (error) throw error;

            const deletedExam = exams.find(ex => ex.id === id);
            await addAuditLog(userEmail, 'Deleted Exam', 'Exams', `Deleted exam: ${deletedExam?.name || id}`);
            alert('Exam deleted successfully!');
            await fetchExams(); // Re-fetch to update the table
            console.log(`Exam ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting exam: ' + error.message);
            console.error('Supabase error deleting exam:', error);
            await addAuditLog(userEmail, 'Delete Exam Failed', 'Exams', `Error: ${error.message}`);
        }
    }
};

if (closeExamModal) {
    closeExamModal.addEventListener('click', () => {
        if (examModal) {
            examModal.classList.add('hidden');
            examModal.style.display = 'none';
        }
        if (examForm) examForm.reset();
        console.log('Exam modal closed.');
    });
}

if (examModal) {
    examModal.addEventListener('click', (e) => {
        if (e.target === examModal) {
            examModal.classList.add('hidden');
            examModal.style.display = 'none';
            if (examForm) examForm.reset();
            console.log('Exam modal closed by outside click.');
        }
    });
}

if (examForm) {
    examForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';

        const id = document.getElementById('examId').value;
        const name = document.getElementById('examName').value;
        const examClass = document.getElementById('examClass').value;
        const subject = document.getElementById('examSubject').value;
        const date = document.getElementById('examDate').value;
        const maxMarks = document.getElementById('examMaxMarks').value;

        if (!name || !examClass || !subject || !date || !maxMarks) {
            alert('Please fill in all required fields.');
            console.warn('Exam form submission failed: Missing required fields.');
            return;
        }

        const examData = {
            name: name,
            class: examClass,
            subject: subject,
            date: date,
            max_marks: parseInt(maxMarks)
        };

        try {
            let result;
            if (id) {
                // Update existing record
                console.log(`Updating exam record ${id}...`);
                result = await supabase.from('exams').update(examData).eq('id', id).select();
                await addAuditLog(userEmail, 'Updated Exam', 'Exams', `Updated exam: ${name}`);
                alert('Exam updated successfully!');
            } else {
                // Add new record
                console.log(`Adding new exam: ${name}...`);
                result = await supabase.from('exams').insert([examData]).select();
                await addAuditLog(userEmail, 'Added Exam', 'Exams', `Added exam: ${name}`);
                alert('Exam added successfully!');
            }

            if (result.error) throw result.error;

            await fetchExams(); // Re-fetch to update the table
            if (examModal) {
                examModal.classList.add('hidden');
                examModal.style.display = 'none';
            }
            if (examForm) {
                examForm.reset();
            }
            console.log('Exam operation completed successfully.');
        } catch (error) {
            alert('Error saving exam: ' + error.message);
            console.error('Supabase error saving exam:', error);
            await addAuditLog(userEmail, 'Save Exam Failed', 'Exams', `Error: ${error.message}`);
        }
    });
}

// Generate Exam Results Modal
window.showGenerateResultsModal = function() {
    if (generateResultsModal) {
        generateResultsModal.classList.remove('hidden');
        generateResultsModal.style.display = 'flex';
    }
    if (generateResultsForm) {
        generateResultsForm.reset();
    }
    console.log('Generate Exam Results modal opened.');
};

if (closeGenerateResultsModal) {
    closeGenerateResultsModal.addEventListener('click', () => {
        if (generateResultsModal) {
            generateResultsModal.classList.add('hidden');
            generateResultsModal.style.display = 'none';
        }
        if (generateResultsForm) generateResultsForm.reset();
        console.log('Generate Exam Results modal closed.');
    });
}

if (generateResultsModal) {
    generateResultsModal.addEventListener('click', (e) => {
        if (e.target === generateResultsModal) {
            generateResultsModal.classList.add('hidden');
            generateResultsModal.style.display = 'none';
            if (generateResultsForm) generateResultsForm.reset();
            console.log('Generate Exam Results modal closed by outside click.');
        }
    });
}

if (generateResultsForm) {
    generateResultsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedClass = document.getElementById('resultsClassFilter').value;
        const selectedExamType = document.getElementById('resultsExamTypeFilter').value;

        if (!selectedClass || !selectedExamType) {
            alert('Please select both Class and Exam Type.');
            return;
        }

        alert(`Generating PDF report for ${selectedExamType} exams in ${selectedClass}. (Functionality to be implemented)`);
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        await addAuditLog(loggedInUser?.email || 'admin', 'Generated Exam Report', 'Exams', `Generated PDF for ${selectedExamType} exams in ${selectedClass}`);

        // Here you would typically fetch exam results data based on selectedClass and selectedExamType
        // and then use jsPDF to generate a detailed report.
        // For now, it's a placeholder.

        if (generateResultsModal) {
            generateResultsModal.classList.add('hidden');
            generateResultsModal.style.display = 'none';
        }
        if (generateResultsForm) generateResultsForm.reset();
    });
}

// Reports Module Charts (Chart.js)
function initReportsCharts() {
    console.log('Initializing reports charts...');

    // Destroy existing chart instances
    safeDestroy(reportsAttendanceChart);
    safeDestroy(reportsPerformanceChart);
    safeDestroy(reportsStudentStatusChart);
    safeDestroy(reportsClassPerformanceChart);

    // Example: Student Attendance Report Chart
    const attendanceReportCtx = document.getElementById('attendanceReportChart')?.getContext('2d');
    if (attendanceReportCtx) {
        reportsAttendanceChart = new Chart(attendanceReportCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Average Attendance %',
                    data: [90, 88, 92, 85, 95, 90],
                    borderColor: '#4CAF50',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Overall Student Attendance Trend',
                        font: { size: 16 }
                    }
                }
            }
        });
    }

    // Example: Student Performance Report Chart
    const performanceReportCtx = document.getElementById('performanceReportChart')?.getContext('2d');
    if (performanceReportCtx) {
        reportsPerformanceChart = new Chart(performanceReportCtx, {
            type: 'bar',
            data: {
                labels: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'],
                datasets: [{
                    label: 'Average Score',
                    data: [75, 80, 70, 85, 78],
                    backgroundColor: '#2196F3'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Average Performance by Grade',
                        font: { size: 16 }
                    }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    // Example: Student Status Distribution Chart
    const studentStatusCtx = document.getElementById('studentStatusChart')?.getContext('2d');
    if (studentStatusCtx) {
        const activeStudents = students.filter(s => s.status === 'Active').length;
        const inactiveStudents = students.filter(s => s.status === 'Inactive').length;
        reportsStudentStatusChart = new Chart(studentStatusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Active', 'Inactive'],
                datasets: [{
                    data: [activeStudents, inactiveStudents],
                    backgroundColor: ['#FFC107', '#9E9E9E'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Student Status Distribution',
                        font: { size: 16 }
                    },
                    legend: {
                        position: 'bottom',
                    }
                }
            }
        });
    }

    // Example: Class Performance Comparison Chart
    const classPerformanceCtx = document.getElementById('classPerformanceChart')?.getContext('2d');
    if (classPerformanceCtx) {
        reportsClassPerformanceChart = new Chart(classPerformanceCtx, {
            type: 'radar',
            data: {
                labels: ['Math', 'Science', 'English', 'History', 'Art'],
                datasets: [
                    {
                        label: 'Grade 10 A',
                        data: [65, 59, 90, 81, 56],
                        fill: true,
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgb(255, 99, 132)',
                        pointBackgroundColor: 'rgb(255, 99, 132)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgb(255, 99, 132)'
                    },
                    {
                        label: 'Grade 10 B',
                        data: [28, 48, 40, 19, 96],
                        fill: true,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgb(54, 162, 235)',
                        pointBackgroundColor: 'rgb(54, 162, 235)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgb(54, 162, 235)'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Class Performance Comparison',
                        font: { size: 16 }
                    }
                },
                elements: {
                    line: {
                        borderWidth: 3
                    }
                }
            }
        });
    }
    console.log('Reports charts initialized.');
}

// Reports Module Generate Report
window.generateReport = function() {
    const reportType = reportTypeSelect ? reportTypeSelect.value : '';
    const reportClass = reportClassFilterSelect ? reportClassFilterSelect.value : '';
    const startDate = reportStartDateInput ? reportStartDateInput.value : '';
    const endDate = reportEndDateInput ? reportEndDateInput.value : '';
    const displayArea = reportDisplayArea;

    if (!displayArea) return;

    displayArea.innerHTML = ''; // Clear previous report

    if (!reportType) {
        displayArea.innerHTML = '<p class="text-red-500">Please select a report type.</p>';
        return;
    }

    let reportContent = `
        <h4 class="text-lg font-semibold mb-3">Generated Report: ${reportType.replace(/_/g, ' ').toUpperCase()}</h4>
        <p><strong>Filters:</strong> Class: ${reportClass || 'All'}, Start Date: ${startDate || 'N/A'}, End Date: ${endDate || 'N/A'}</p>
        <hr class="my-4" style="border-color: var(--border-color);">
    `;

    switch (reportType) {
        case 'student_performance':
            reportContent += `<p>This is a detailed student performance report. (Data to be dynamically loaded)</p>`;
            // Example: Add a table for student performance
            reportContent += `
                <table class="min-w-full mt-4">
                    <thead>
                        <tr>
                            <th class="text-left py-2 px-3">Student Name</th>
                            <th class="text-left py-2 px-3">Class</th>
                            <th class="text-left py-2 px-3">Subject</th>
                            <th class="text-left py-2 px-3">Score</th>
                            <th class="text-left py-2 px-3">Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td class="py-2 px-3">John Doe</td><td class="py-2 px-3">Grade 10</td><td class="py-2 px-3">Math</td><td class="py-2 px-3">85</td><td class="py-2 px-3">A</td></tr>
                        <tr><td class="py-2 px-3">Jane Smith</td><td class="py-2 px-3">Grade 10</td><td class="py-2 px-3">Science</td><td class="py-2 px-3">78</td><td class="py-2 px-3">B</td></tr>
                    </tbody>
                </table>
            `;
            break;
        case 'attendance_summary':
            reportContent += `<p>This is an attendance summary report. (Data to be dynamically loaded)</p>`;
            // Example: Add a summary of attendance
            const totalStudents = students.length;
            const totalPresent = attendanceRecords.filter(rec => rec.status === 'Present').length;
            const totalAbsent = attendanceRecords.filter(rec => rec.status === 'Absent').length;
            reportContent += `
                <div class="grid grid-cols-3 gap-4 mt-4">
                    <div class="module-card p-4 text-center">Total Students: ${totalStudents}</div>
                    <div class="module-card p-4 text-center">Total Present: ${totalPresent}</div>
                    <div class="module-card p-4 text-center">Total Absent: ${totalAbsent}</div>
                </div>
            `;
            break;
        case 'financial_overview':
            reportContent += `<p>This is a financial overview report. (Data to be dynamically loaded)</p>`;
            const totalInvoiced = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
            const totalCollected = invoices.reduce((sum, inv) => sum + (parseFloat(inv.paid_amount) || 0), 0);
            const totalOutstanding = totalInvoiced - totalCollected;
            reportContent += `
                <div class="grid grid-cols-3 gap-4 mt-4">
                    <div class="module-card p-4 text-center">Total Invoiced: ₹${totalInvoiced.toLocaleString('en-IN')}</div>
                    <div class="module-card p-4 text-center">Total Collected: ₹${totalCollected.toLocaleString('en-IN')}</div>
                    <div class="module-card p-4 text-center">Total Outstanding: ₹${totalOutstanding.toLocaleString('en-IN')}</div>
                </div>
            `;
            break;
        case 'teacher_load':
            reportContent += `<p>This is a teacher load report. (Data to be dynamically loaded)</p>`;
            reportContent += `
                <table class="min-w-full mt-4">
                    <thead>
                        <tr>
                            <th class="text-left py-2 px-3">Teacher Name</th>
                            <th class="text-left py-2 px-3">Subject</th>
                            <th class="text-left py-2 px-3">Classes Taught</th>
                            <th class="text-left py-2 px-3">Total Students</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td class="py-2 px-3">Mr. Sharma</td><td class="py-2 px-3">Math</td><td class="py-2 px-3">3</td><td class="py-2 px-3">90</td></tr>
                        <tr><td class="py-2 px-3">Ms. Khan</td><td class="py-2 px-3">English</td><td class="py-2 px-3">4</td><td class="py-2 px-3">120</td></tr>
                    </tbody>
                </table>
            `;
            break;
        default:
            reportContent += `<p>No report content available for this type.</p>`;
            break;
    }
    displayArea.innerHTML = reportContent;
    console.log(`Report generated: ${reportType}`);
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    addAuditLog(loggedInUser?.email || 'admin', 'Generated Report', 'Reports', `Generated ${reportType} report.`);
};

// Homework Module Functions
function renderHomeworkTable(filteredHomework = homeworkAssignments) {
    if (!homeworkTableBody) return;
    homeworkTableBody.innerHTML = '';
    if (filteredHomework.length === 0) {
        homeworkTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">No homework assignments found.</td></tr>';
        return;
    }
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for rendering
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;

    filteredHomework.forEach(assignment => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        newRow.innerHTML = `
            <td class="py-3 px-4">${assignment.id}</td>
            <td class="py-3 px-4">${assignment.title}</td>
            <td class="py-3 px-4">${assignment.class}</td>
            <td class="py-3 px-4">${assignment.subject}</td>
            <td class="py-3 px-4">${assignment.assigned_date}</td>
            <td class="py-3 px-4">${assignment.due_date}</td>
            <td class="py-3 px-4 table-actions">
                <button class="text-blue-600 mr-3" title="Edit Homework" onclick="editHomework('${assignment.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 mr-3" title="Delete Homework" onclick="deleteHomework('${assignment.id}')">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="text-green-600" title="View Details" onclick="showHomeworkDetailsModal('${assignment.id}')">
                    <i class="fas fa-info-circle"></i>
                </button>
            </td>
        `;
        homeworkTableBody.appendChild(newRow);
    });
    console.log('Homework table rendered.');
}

window.showAddHomeworkModal = function() {
    if (addHomeworkModal) {
        addHomeworkModal.classList.remove('hidden');
        addHomeworkModal.style.display = 'flex';
    }
    if (homeworkForm) {
        homeworkForm.reset();
        document.getElementById('homeworkId').value = ''; // Clear ID for new entry
    }
    if (homeworkModalTitle) {
        homeworkModalTitle.textContent = 'Add New Homework';
    }
    if (homeworkFormSubmitBtn) {
        homeworkFormSubmitBtn.textContent = 'Add Homework';
    }
    console.log('Add Homework modal opened.');
};

window.editHomework = async function(id) {
    console.log(`Editing homework ID: ${id}`);
    const assignment = homeworkAssignments.find(hw => hw.id === id);
    if (assignment) {
        document.getElementById('homeworkId').value = assignment.id;
        document.getElementById('homeworkTitle').value = assignment.title;
        document.getElementById('homeworkClass').value = assignment.class;
        document.getElementById('homeworkSubject').value = assignment.subject;
        document.getElementById('homeworkAssignedDate').value = assignment.assigned_date;
        document.getElementById('homeworkDueDate').value = assignment.due_date;
        document.getElementById('homeworkDescription').value = assignment.description || '';

        if (homeworkModalTitle) {
            homeworkModalTitle.textContent = 'Edit Homework';
        }
        if (homeworkFormSubmitBtn) {
            homeworkFormSubmitBtn.textContent = 'Save Changes';
        }
        if (addHomeworkModal) {
            addHomeworkModal.classList.remove('hidden');
            addHomeworkModal.style.display = 'flex';
        }
        console.log(`Homework ${id} data loaded for editing.`);
    } else {
        alert('Homework assignment not found.');
        console.error(`Homework assignment with ID ${id} not found for editing.`);
    }
};

window.deleteHomework = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userEmail = loggedInUser?.email || 'admin';
    if (confirm('Are you sure you want to delete this homework assignment?')) {
        console.log(`Deleting homework ID: ${id}`);
        try {
            const { error } = await supabase.from('homework').delete().eq('id', id);
            if (error) throw error;

            const deletedAssignment = homeworkAssignments.find(hw => hw.id === id);
            await addAuditLog(userEmail, 'Deleted Homework', 'Homework', `Deleted homework: ${deletedAssignment?.title || id}`);
            alert('Homework assignment deleted successfully!');
            await fetchHomework(); // Re-fetch to update the table
            console.log(`Homework assignment ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting homework assignment: ' + error.message);
            console.error('Supabase error deleting homework assignment:', error);
            await addAuditLog(userEmail, 'Delete Homework Failed', 'Homework', `Error: ${error.message}`);
        }
    }
};

if (closeAddHomeworkModal) {
    closeAddHomeworkModal.addEventListener('click', () => {
        if (addHomeworkModal) {
            addHomeworkModal.classList.add('hidden');
            addHomeworkModal.style.display = 'none';
        }
        if (homeworkForm) homeworkForm.reset();
        console.log('Add Homework modal closed.');
    });
}

if (addHomeworkModal) {
    addHomeworkModal.addEventListener('click', (e) => {
        if (e.target === addHomeworkModal) {
            addHomeworkModal.classList.add('hidden');
            addHomeworkModal.style.display = 'none';
            if (homeworkForm) homeworkForm.reset();
            console.log('Add Homework modal closed by outside click.');
        }
    });
}

if (homeworkForm) {
    homeworkForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';

        const id = document.getElementById('homeworkId').value;
        const title = document.getElementById('homeworkTitle').value;
        const homeworkClass = document.getElementById('homeworkClass').value;
        const subject = document.getElementById('homeworkSubject').value;
        const assignedDate = document.getElementById('homeworkAssignedDate').value;
        const dueDate = document.getElementById('homeworkDueDate').value;
        const description = document.getElementById('homeworkDescription').value;

        if (!title || !homeworkClass || !subject || !assignedDate || !dueDate) {
            alert('Please fill in all required fields.');
            console.warn('Homework form submission failed: Missing required fields.');
            return;
        }

        const homeworkData = {
            title: title,
            class: homeworkClass,
            subject: subject,
            assigned_date: assignedDate,
            due_date: dueDate,
            description: description || null
        };

        try {
            let result;
            if (id) {
                // Update existing record
                console.log(`Updating homework record ${id}...`);
                result = await supabase.from('homework').update(homeworkData).eq('id', id).select();
                await addAuditLog(userEmail, 'Updated Homework', 'Homework', `Updated homework: ${title}`);
                alert('Homework updated successfully!');
            } else {
                // Add new record
                console.log(`Adding new homework: ${title}...`);
                result = await supabase.from('homework').insert([homeworkData]).select();
                await addAuditLog(userEmail, 'Added Homework', 'Homework', `Added homework: ${title}`);
                alert('Homework added successfully!');
            }

            if (result.error) throw result.error;

            await fetchHomework(); // Re-fetch to update the table
            if (addHomeworkModal) {
                addHomeworkModal.classList.add('hidden');
                addHomeworkModal.style.display = 'none';
            }
            if (homeworkForm) {
                homeworkForm.reset();
            }
            console.log('Homework operation completed successfully.');
        } catch (error) {
            alert('Error saving homework: ' + error.message);
            console.error('Supabase error saving homework:', error);
            await addAuditLog(userEmail, 'Save Homework Failed', 'Homework', `Error: ${error.message}`);
        }
    });
}

window.filterHomework = function() {
    const classFilter = filterHomeworkClass ? filterHomeworkClass.value : '';
    const subjectFilter = filterHomeworkSubject ? filterHomeworkSubject.value : '';
    const dueDateFilter = filterHomeworkDueDate ? filterHomeworkDueDate.value : '';

    const filtered = homeworkAssignments.filter(hw => {
        const classMatch = classFilter === '' || hw.class === classFilter;
        const subjectMatch = subjectFilter === '' || hw.subject === subjectFilter;
        const dueDateMatch = dueDateFilter === '' || hw.due_date === dueDateFilter;
        return classMatch && subjectMatch && dueDateMatch;
    });
    renderHomeworkTable(filtered);
    console.log('Homework filtered.');
};

window.showHomeworkDetailsModal = function(id) {
    const assignment = homeworkAssignments.find(hw => hw.id === id);
    if (!assignment) {
        alert('Homework assignment not found.');
        console.error(`Homework assignment with ID ${id} not found for details.`);
        return;
    }

    if (homeworkDetailsContent) {
        homeworkDetailsContent.innerHTML = `
            <p><strong>Title:</strong> ${assignment.title}</p>
            <p><strong>Class:</strong> ${assignment.class}</p>
            <p><strong>Subject:</strong> ${assignment.subject}</p>
            <p><strong>Assigned Date:</strong> ${assignment.assigned_date}</p>
            <p><strong>Due Date:</strong> ${assignment.due_date}</p>
            <p><strong>Description:</strong> ${assignment.description || 'N/A'}</p>
        `;
    }

    if (homeworkDetailsModal) {
        homeworkDetailsModal.classList.remove('hidden');
        homeworkDetailsModal.style.display = 'flex';
    }
    console.log(`Homework details modal opened for ID: ${id}`);
};

if (closeHomeworkDetailsModal) {
    closeHomeworkDetailsModal.addEventListener('click', () => {
        if (homeworkDetailsModal) {
            homeworkDetailsModal.classList.add('hidden');
            homeworkDetailsModal.style.display = 'none';
        }
        console.log('Homework details modal closed.');
    });
}

if (homeworkDetailsModal) {
    homeworkDetailsModal.addEventListener('click', (e) => {
        if (e.target === homeworkDetailsModal) {
            homeworkDetailsModal.classList.add('hidden');
            homeworkDetailsModal.style.display = 'none';
            console.log('Homework details modal closed by outside click.');
        }
    });
}

// Student Management Functions
window.showAddStudentForm = function() {
    if (studentModal) {
        studentModal.classList.remove('hidden');
        studentModal.style.display = 'flex';
    }
    if (studentForm) {
        studentForm.reset();
        document.getElementById('studentId').value = ''; // Clear ID for new entry
    }
    if (studentModalTitle) {
        studentModalTitle.textContent = 'Add New Student';
    }
    if (studentFormSubmitBtn) {
        studentFormSubmitBtn.textContent = 'Add Student';
    }
    console.log('Add Student modal opened.');
};

window.editStudent = async function(id) {
    console.log(`Editing student ID: ${id}`);
    const student = students.find(s => s.id === id);
    if (student) {
        document.getElementById('studentId').value = student.id;
        document.getElementById('studentFullName').value = student.name;
        document.getElementById('studentFatherName').value = student.father_name;
        document.getElementById('studentMotherName').value = student.mother_name;
        document.getElementById('studentClass').value = student.class;
        document.getElementById('studentRollNo').value = student.roll_no;
        document.getElementById('studentAadharNo').value = student.aadhar_no;
        document.getElementById('studentBloodGroup').value = student.blood_group || '';
        document.getElementById('studentAdmissionNo').value = student.admission_no || '';
        document.getElementById('studentAdmissionDate').value = student.admission_date || '';
        document.getElementById('studentFatherAadhar').value = student.father_aadhar || '';
        document.getElementById('studentMotherAadhar').value = student.mother_aadhar || '';
        document.getElementById('studentEmail').value = student.email || '';
        document.getElementById('studentPhone').value = student.phone || '';
        document.getElementById('studentStatus').value = student.status;

        if (studentModalTitle) {
            studentModalTitle.textContent = 'Edit Student';
        }
        if (studentFormSubmitBtn) {
            studentFormSubmitBtn.textContent = 'Save Changes';
        }
        if (studentModal) {
            studentModal.classList.remove('hidden');
            studentModal.style.display = 'flex';
        }
        console.log(`Student ${id} data loaded for editing.`);
    } else {
        alert('Student not found.');
        console.error(`Student with ID ${id} not found for editing.`);
    }
};

window.deleteStudent = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userEmail = loggedInUser?.email || 'admin';
    if (confirm('Are you sure you want to delete this student?')) {
        console.log(`Deleting student ID: ${id}`);
        try {
            const { error } = await supabase.from('students').delete().eq('id', id);
            if (error) throw error;

            const deletedStudent = students.find(s => s.id === id);
            await addAuditLog(userEmail, 'Deleted Student', 'Students', `Deleted student: ${deletedStudent?.name || id}`);
            alert('Student deleted successfully!');
            await fetchStudents(); // Re-fetch to update the table
            console.log(`Student ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting student: ' + error.message);
            console.error('Supabase error deleting student:', error);
            await addAuditLog(userEmail, 'Delete Student Failed', 'Students', `Error: ${error.message}`);
        }
    }
};

if (closeStudentModal) {
    closeStudentModal.addEventListener('click', () => {
        if (studentModal) {
            studentModal.classList.add('hidden');
            studentModal.style.display = 'none';
        }
        if (studentForm) studentForm.reset();
        console.log('Student modal closed.');
    });
}

if (studentModal) {
    studentModal.addEventListener('click', (e) => {
        if (e.target === studentModal) {
            studentModal.classList.add('hidden');
            studentModal.style.display = 'none';
            if (studentForm) studentForm.reset();
            console.log('Student modal closed by outside click.');
        }
    });
}

if (studentForm) {
    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';

        const id = document.getElementById('studentId').value;
        const name = document.getElementById('studentFullName').value;
        const fatherName = document.getElementById('studentFatherName').value;
        const motherName = document.getElementById('studentMotherName').value;
        const studentClass = document.getElementById('studentClass').value;
        const rollNo = document.getElementById('studentRollNo').value;
        const aadharNo = document.getElementById('studentAadharNo').value;
        const bloodGroup = document.getElementById('studentBloodGroup').value;
        const admissionNo = document.getElementById('studentAdmissionNo').value;
        const admissionDate = document.getElementById('studentAdmissionDate').value;
        const fatherAadhar = document.getElementById('studentFatherAadhar').value;
        const motherAadhar = document.getElementById('studentMotherAadhar').value;
        const email = document.getElementById('studentEmail').value;
        const phone = document.getElementById('studentPhone').value;
        const status = document.getElementById('studentStatus').value;

        if (!name || !fatherName || !motherName || !studentClass || !rollNo || !aadharNo || !status) {
            alert('Please fill in all required fields.');
            console.warn('Student form submission failed: Missing required fields.');
            return;
        }

        const studentData = {
            name: name,
            father_name: fatherName,
            mother_name: motherName,
            class: studentClass,
            roll_no: rollNo,
            aadhar_no: aadharNo,
            blood_group: bloodGroup || null,
            admission_no: admissionNo || null,
            admission_date: admissionDate || null,
            father_aadhar: fatherAadhar || null,
            mother_aadhar: motherAadhar || null,
            email: email || null,
            phone: phone || null,
            status: status
        };

        try {
            let result;
            if (id) {
                // Update existing record
                console.log(`Updating student record ${id}...`);
                result = await supabase.from('students').update(studentData).eq('id', id).select();
                await addAuditLog(userEmail, 'Updated Student', 'Students', `Updated student: ${name}`);
                alert('Student updated successfully!');
            } else {
                // Add new record
                console.log(`Adding new student: ${name}...`);
                result = await supabase.from('students').insert([studentData]).select();
                await addAuditLog(userEmail, 'Added Student', 'Students', `Added student: ${name}`);
                alert('Student added successfully!');
            }

            if (result.error) throw result.error;

            await fetchStudents(); // Re-fetch to update the table
            if (studentModal) {
                studentModal.classList.add('hidden');
                studentModal.style.display = 'none';
            }
            if (studentForm) {
                studentForm.reset();
            }
            console.log('Student operation completed successfully.');
        } catch (error) {
            alert('Error saving student: ' + error.message);
            console.error('Supabase error saving student:', error);
            await addAuditLog(userEmail, 'Save Student Failed', 'Students', `Error: ${error.message}`);
        }
    });
}

window.showStudentDetailsModal = function(id) {
    const student = students.find(s => s.id === id);
    if (!student) {
        alert('Student not found.');
        console.error(`Student with ID ${id} not found for details.`);
        return;
    }

    if (studentDetailsContent) {
        studentDetailsContent.innerHTML = `
            <p><strong>Full Name:</strong> ${student.name}</p>
            <p><strong>Father's Name:</strong> ${student.father_name}</p>
            <p><strong>Mother's Name:</strong> ${student.mother_name}</p>
            <p><strong>Class:</strong> ${student.class}</p>
            <p><strong>Roll No.:</strong> ${student.roll_no}</p>
            <p><strong>Aadhar No.:</strong> ${student.aadhar_no}</p>
            <p><strong>Blood Group:</strong> ${student.blood_group || 'N/A'}</p>
            <p><strong>Admission No.:</strong> ${student.admission_no || 'N/A'}</p>
            <p><strong>Admission Date:</strong> ${student.admission_date || 'N/A'}</p>
            <p><strong>Father's Aadhar:</strong> ${student.father_aadhar || 'N/A'}</p>
            <p><strong>Mother's Aadhar:</strong> ${student.mother_aadhar || 'N/A'}</p>
            <p><strong>Email:</strong> ${student.email || 'N/A'}</p>
            <p><strong>Phone:</strong> ${student.phone || 'N/A'}</p>
            <p><strong>Status:</strong> ${student.status}</p>
        `;
    }

    if (studentDetailsModal) {
        studentDetailsModal.classList.remove('hidden');
        studentDetailsModal.style.display = 'flex';
    }
    console.log(`Student details modal opened for ID: ${id}`);
};

if (closeStudentDetailsModal) {
    closeStudentDetailsModal.addEventListener('click', () => {
        if (studentDetailsModal) {
            studentDetailsModal.classList.add('hidden');
            studentDetailsModal.style.display = 'none';
        }
        console.log('Student details modal closed.');
    });
}

if (studentDetailsModal) {
    studentDetailsModal.addEventListener('click', (e) => {
        if (e.target === studentDetailsModal) {
            studentDetailsModal.classList.add('hidden');
            studentDetailsModal.style.display = 'none';
            console.log('Student details modal closed by outside click.');
        }
    });
}

// Teacher Management Functions
window.showAddTeacherForm = function() {
    if (teacherModal) {
        teacherModal.classList.remove('hidden');
        teacherModal.style.display = 'flex';
    }
    if (teacherForm) {
        teacherForm.reset();
        document.getElementById('teacherId').value = ''; // Clear ID for new entry
    }
    if (teacherModalTitle) {
        teacherModalTitle.textContent = 'Add New Teacher';
    }
    if (teacherFormSubmitBtn) {
        teacherFormSubmitBtn.textContent = 'Add Teacher';
    }
    console.log('Add Teacher modal opened.');
};

window.editTeacher = async function(id) {
    console.log(`Editing teacher ID: ${id}`);
    const teacher = teachers.find(t => t.id === id);
    if (teacher) {
        document.getElementById('teacherId').value = teacher.id;
        document.getElementById('teacherFullName').value = teacher.name;
        document.getElementById('teacherSubject').value = teacher.subject;
        document.getElementById('teacherEmail').value = teacher.email || '';
        document.getElementById('teacherClasses').value = teacher.classes || '';

        if (teacherModalTitle) {
            teacherModalTitle.textContent = 'Edit Teacher';
        }
        if (teacherFormSubmitBtn) {
            teacherFormSubmitBtn.textContent = 'Save Changes';
        }
        if (teacherModal) {
            teacherModal.classList.remove('hidden');
            teacherModal.style.display = 'flex';
        }
        console.log(`Teacher ${id} data loaded for editing.`);
    } else {
        alert('Teacher not found.');
        console.error(`Teacher with ID ${id} not found for editing.`);
    }
};

window.deleteTeacher = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userEmail = loggedInUser?.email || 'admin';
    if (confirm('Are you sure you want to delete this teacher?')) {
        console.log(`Deleting teacher ID: ${id}`);
        try {
            const { error } = await supabase.from('teachers').delete().eq('id', id);
            if (error) throw error;

            const deletedTeacher = teachers.find(t => t.id === id);
            await addAuditLog(userEmail, 'Deleted Teacher', 'Teachers', `Deleted teacher: ${deletedTeacher?.name || id}`);
            alert('Teacher deleted successfully!');
            await fetchTeachers(); // Re-fetch to update the table
            console.log(`Teacher ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting teacher: ' + error.message);
            console.error('Supabase error deleting teacher:', error);
            await addAuditLog(userEmail, 'Delete Teacher Failed', 'Teachers', `Error: ${error.message}`);
        }
    }
};

if (closeTeacherModal) {
    closeTeacherModal.addEventListener('click', () => {
        if (teacherModal) {
            teacherModal.classList.add('hidden');
            teacherModal.style.display = 'none';
        }
        if (teacherForm) teacherForm.reset();
        console.log('Teacher modal closed.');
    });
}

if (teacherModal) {
    teacherModal.addEventListener('click', (e) => {
        if (e.target === teacherModal) {
            teacherModal.classList.add('hidden');
            teacherModal.style.display = 'none';
            if (teacherForm) teacherForm.reset();
            console.log('Teacher modal closed by outside click.');
        }
    });
}

if (teacherForm) {
    teacherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';

        const id = document.getElementById('teacherId').value;
        const name = document.getElementById('teacherFullName').value;
        const subject = document.getElementById('teacherSubject').value;
        const email = document.getElementById('teacherEmail').value;
        const classes = document.getElementById('teacherClasses').value;

        if (!name || !subject) {
            alert('Please fill in all required fields.');
            console.warn('Teacher form submission failed: Missing required fields.');
            return;
        }

        const teacherData = {
            name: name,
            subject: subject,
            email: email || null,
            classes: classes || null
        };

        try {
            let result;
            if (id) {
                // Update existing record
                console.log(`Updating teacher record ${id}...`);
                result = await supabase.from('teachers').update(teacherData).eq('id', id).select();
                await addAuditLog(userEmail, 'Updated Teacher', 'Teachers', `Updated teacher: ${name}`);
                alert('Teacher updated successfully!');
            } else {
                // Add new record
                console.log(`Adding new teacher: ${name}...`);
                result = await supabase.from('teachers').insert([teacherData]).select();
                await addAuditLog(userEmail, 'Added Teacher', 'Teachers', `Added teacher: ${name}`);
                alert('Teacher added successfully!');
            }

            if (result.error) throw result.error;

            await fetchTeachers(); // Re-fetch to update the table
            if (teacherModal) {
                teacherModal.classList.add('hidden');
                teacherModal.style.display = 'none';
            }
            if (teacherForm) {
                teacherForm.reset();
            }
            console.log('Teacher operation completed successfully.');
        } catch (error) {
            alert('Error saving teacher: ' + error.message);
            console.error('Supabase error saving teacher:', error);
            await addAuditLog(userEmail, 'Save Teacher Failed', 'Teachers', `Error: ${error.message}`);
        }
    });
}

window.showTeacherDetailsModal = function(id) {
    const teacher = teachers.find(t => t.id === id);
    if (!teacher) {
        alert('Teacher not found.');
        console.error(`Teacher with ID ${id} not found for details.`);
        return;
    }

    if (teacherDetailsContent) {
        teacherDetailsContent.innerHTML = `
            <p><strong>Full Name:</strong> ${teacher.name}</p>
            <p><strong>Subject:</strong> ${teacher.subject}</p>
            <p><strong>Email:</strong> ${teacher.email || 'N/A'}</p>
            <p><strong>Classes:</strong> ${teacher.classes || 'N/A'}</p>
        `;
    }

    if (teacherDetailsModal) {
        teacherDetailsModal.classList.remove('hidden');
        teacherDetailsModal.style.display = 'flex';
    }
    console.log(`Teacher details modal opened for ID: ${id}`);
};

if (closeTeacherDetailsModal) {
    closeTeacherDetailsModal.addEventListener('click', () => {
        if (teacherDetailsModal) {
            teacherDetailsModal.classList.add('hidden');
            teacherDetailsModal.style.display = 'none';
        }
        console.log('Teacher details modal closed.');
    });
}

if (teacherDetailsModal) {
    teacherDetailsModal.addEventListener('click', (e) => {
        if (e.target === teacherDetailsModal) {
            teacherDetailsModal.classList.add('hidden');
            teacherDetailsModal.style.display = 'none';
            console.log('Teacher details modal closed by outside click.');
        }
    });
}

// User Management Functions
window.showAddUserForm = function() {
    if (userModal) {
        userModal.classList.remove('hidden');
        userModal.style.display = 'flex';
    }
    if (userForm) {
        userForm.reset();
        document.getElementById('userId').value = ''; // Clear ID for new entry
    }
    if (userModalTitle) {
        userModalTitle.textContent = 'Add New User';
    }
    if (userFormSubmitBtn) {
        userFormSubmitBtn.textContent = 'Add User';
    }
    console.log('Add User modal opened.');
};

window.editUser = async function(id) {
    console.log(`Editing user ID: ${id}`);
    const profile = profiles.find(p => p.id === id);
    if (profile) {
        document.getElementById('userId').value = profile.id;
        document.getElementById('userFullName').value = profile.full_name;
        document.getElementById('userEmail').value = profile.email;
        document.getElementById('userRole').value = profile.role;
        document.getElementById('userStatus').value = profile.status;

        if (userModalTitle) {
            userModalTitle.textContent = 'Edit User';
        }
        if (userFormSubmitBtn) {
            userFormSubmitBtn.textContent = 'Save Changes';
        }
        if (userModal) {
            userModal.classList.remove('hidden');
            userModal.style.display = 'flex';
        }
        console.log(`User ${id} data loaded for editing.`);
    } else {
        alert('User not found.');
        console.error(`User with ID ${id} not found for editing.`);
    }
};

window.deleteUser = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userEmail = loggedInUser?.email || 'admin';
    if (confirm('Are you sure you want to delete this user? This will also delete their authentication record.')) {
        console.log(`Deleting user ID: ${id}`);
        try {
            // First, delete from profiles table
            const { error: profileError } = await supabase.from('profiles').delete().eq('id', id);
            if (profileError) throw profileError;

            // Then, delete the user from Supabase Auth (requires service role key on backend or admin context)
            // This part might fail if not called from a secure backend function or with admin privileges.
            // For client-side, it's generally not recommended to allow direct user deletion from auth.
            // However, if your RLS allows it for 'admin' role, it might work.
            const { error: authError } = await supabase.auth.admin.deleteUser(id);
            if (authError) {
                console.warn('Could not delete user from Supabase Auth (might require admin context or RLS policy):', authError.message);
                alert('User profile deleted, but could not delete authentication record. Please delete manually if necessary.');
                await addAuditLog(userEmail, 'Deleted User (Partial)', 'User Management', `Deleted profile for user ID ${id}, but auth record deletion failed: ${authError.message}`);
            } else {
                alert('User deleted successfully!');
                await addAuditLog(userEmail, 'Deleted User', 'User Management', `Deleted user ID ${id}`);
            }

            await fetchProfiles(); // Re-fetch to update the table
            console.log(`User ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting user: ' + error.message);
            console.error('Supabase error deleting user:', error);
            await addAuditLog(userEmail, 'Delete User Failed', 'User Management', `Error: ${error.message}`);
        }
    }
};

if (closeUserModal) {
    closeUserModal.addEventListener('click', () => {
        if (userModal) {
            userModal.classList.add('hidden');
            userModal.style.display = 'none';
        }
        if (userForm) userForm.reset();
        console.log('User modal closed.');
    });
}

if (userModal) {
    userModal.addEventListener('click', (e) => {
        if (e.target === userModal) {
            userModal.classList.add('hidden');
            userModal.style.display = 'none';
            if (userForm) userForm.reset();
            console.log('User modal closed by outside click.');
        }
    });
}

if (userForm) {
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';

        const id = document.getElementById('userId').value;
        const fullName = document.getElementById('userFullName').value;
        const email = document.getElementById('userEmail').value;
        const role = document.getElementById('userRole').value;
        const password = document.getElementById('userPassword').value;
        const status = document.getElementById('userStatus').value;

        if (!fullName || !email || !role || !status) {
            alert('Please fill in all required fields.');
            console.warn('User form submission failed: Missing required fields.');
            return;
        }

        try {
            if (id) {
                // Update existing user profile
                console.log(`Updating user profile ${id}...`);
                const updateData = {
                    full_name: fullName,
                    email: email, // Note: Changing email in profile doesn't change auth email directly
                    role: role,
                    status: status
                };
                const { error: profileUpdateError } = await supabase.from('profiles').update(updateData).eq('id', id);
                if (profileUpdateError) throw profileUpdateError;

                // If password is provided, update auth password
                if (password) {
                    const { error: passwordUpdateError } = await supabase.auth.updateUser({ password: password });
                    if (passwordUpdateError) {
                        console.warn('Failed to update user password:', passwordUpdateError.message);
                        alert('User profile updated, but failed to update password. ' + passwordUpdateError.message);
                    }
                }
                alert('User updated successfully!');
                await addAuditLog(userEmail, 'Updated User', 'User Management', `Updated user: ${fullName}`);
            } else {
                // Add new user (sign up)
                console.log(`Adding new user: ${email}...`);
                if (!password) {
                    alert('Password is required for new users.');
                    return;
                }
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            full_name: fullName,
                            role: role
                        }
                    }
                });

                if (authError) throw authError;

                // Insert into profiles table
                const { error: profileInsertError } = await supabase.from('profiles').insert([
                    {
                        id: authData.user.id,
                        full_name: fullName,
                        email: email,
                        role: role,
                        status: status
                    }
                ]);
                if (profileInsertError) throw profileInsertError;

                alert('User added successfully! An email confirmation might be sent to the user.');
                await addAuditLog(userEmail, 'Added New User', 'User Management', `Added new user: ${fullName} (${email}) with role: ${role}`);
            }

            await fetchProfiles(); // Re-fetch to update the table
            if (userModal) {
                userModal.classList.add('hidden');
                userModal.style.display = 'none';
            }
            if (userForm) {
                userForm.reset();
            }
            console.log('User operation completed successfully.');
        } catch (error) {
            alert('Error saving user: ' + error.message);
            console.error('Supabase error saving user:', error);
            await addAuditLog(userEmail, 'Save User Failed', 'User Management', `Error: ${error.message}`);
        }
    });
}

// Announcement Management Functions
window.showAddAnnouncementModal = function() {
    if (announcementModal) {
        announcementModal.classList.remove('hidden');
        announcementModal.style.display = 'flex';
    }
    if (announcementForm) {
        announcementForm.reset();
        document.getElementById('announcementId').value = ''; // Clear ID for new entry
    }
    if (announcementModalTitle) {
        announcementModalTitle.textContent = 'Add New Announcement';
    }
    if (announcementFormSubmitBtn) {
        announcementFormSubmitBtn.textContent = 'Publish Announcement';
    }
    console.log('Add Announcement modal opened.');
};

window.editAnnouncement = async function(id) {
    console.log(`Editing announcement ID: ${id}`);
    const announcement = announcements.find(ann => ann.id === id);
    if (announcement) {
        document.getElementById('announcementId').value = announcement.id;
        document.getElementById('announcementTitle').value = announcement.title;
        document.getElementById('announcementContent').value = announcement.content;
        document.getElementById('announcementStatus').value = announcement.status;

        if (announcementModalTitle) {
            announcementModalTitle.textContent = 'Edit Announcement';
        }
        if (announcementFormSubmitBtn) {
            announcementFormSubmitBtn.textContent = 'Save Changes';
        }
        if (announcementModal) {
            announcementModal.classList.remove('hidden');
            announcementModal.style.display = 'flex';
        }
        console.log(`Announcement ${id} data loaded for editing.`);
    } else {
        alert('Announcement not found.');
        console.error(`Announcement with ID ${id} not found for editing.`);
    }
};

window.deleteAnnouncement = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userEmail = loggedInUser?.email || 'admin';
    if (confirm('Are you sure you want to delete this announcement?')) {
        console.log(`Deleting announcement ID: ${id}`);
        try {
            const { error } = await supabase.from('announcements').delete().eq('id', id);
            if (error) throw error;

            const deletedAnnouncement = announcements.find(ann => ann.id === id);
            await addAuditLog(userEmail, 'Deleted Announcement', 'Announcements', `Deleted announcement: ${deletedAnnouncement?.title || id}`);
            alert('Announcement deleted successfully!');
            await fetchAnnouncements(); // Re-fetch to update the table
            console.log(`Announcement ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting announcement: ' + error.message);
            console.error('Supabase error deleting announcement:', error);
            await addAuditLog(userEmail, 'Delete Announcement Failed', 'Announcements', `Error: ${error.message}`);
        }
    }
};

if (closeAnnouncementModal) {
    closeAnnouncementModal.addEventListener('click', () => {
        if (announcementModal) {
            announcementModal.classList.add('hidden');
            announcementModal.style.display = 'none';
        }
        if (announcementForm) announcementForm.reset();
        console.log('Announcement modal closed.');
    });
}

if (announcementModal) {
    announcementModal.addEventListener('click', (e) => {
        if (e.target === announcementModal) {
            announcementModal.classList.add('hidden');
            announcementModal.style.display = 'none';
            if (announcementForm) announcementForm.reset();
            console.log('Announcement modal closed by outside click.');
        }
    });
}

if (announcementForm) {
    announcementForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';

        const id = document.getElementById('announcementId').value;
        const title = document.getElementById('announcementTitle').value;
        const content = document.getElementById('announcementContent').value;
        const status = document.getElementById('announcementStatus').value;

        if (!title || !content || !status) {
            alert('Please fill in all required fields.');
            console.warn('Announcement form submission failed: Missing required fields.');
            return;
        }

        const announcementData = {
            title: title,
            content: content,
            status: status,
            date_posted: new Date().toISOString().split('T')[0] // Set current date
        };

        try {
            let result;
            if (id) {
                // Update existing record
                console.log(`Updating announcement record ${id}...`);
                result = await supabase.from('announcements').update(announcementData).eq('id', id).select();
                await addAuditLog(userEmail, 'Updated Announcement', 'Announcements', `Updated announcement: ${title}`);
                alert('Announcement updated successfully!');
            } else {
                // Add new record
                console.log(`Adding new announcement: ${title}...`);
                result = await supabase.from('announcements').insert([announcementData]).select();
                await addAuditLog(userEmail, 'Added Announcement', 'Announcements', `Added announcement: ${title}`);
                alert('Announcement published successfully!');
            }

            if (result.error) throw result.error;

            await fetchAnnouncements(); // Re-fetch to update the table
            if (announcementModal) {
                announcementModal.classList.add('hidden');
                announcementModal.style.display = 'none';
            }
            if (announcementForm) {
                announcementForm.reset();
            }
            console.log('Announcement operation completed successfully.');
        } catch (error) {
            alert('Error saving announcement: ' + error.message);
            console.error('Supabase error saving announcement:', error);
            await addAuditLog(userEmail, 'Save Announcement Failed', 'Announcements', `Error: ${error.message}`);
        }
    });
}

// Student Attendance Module Functions
// Populate Student Select for Attendance Modal
async function populateStudentSelect(selectedStudentId = '') {
    if (!attendanceStudentSelect) return;

    if (students.length === 0) {
        await fetchStudents(); // Ensure students data is available
    }

    attendanceStudentSelect.innerHTML = '<option value="">Select Student</option>';
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.name} (Roll No: ${student.roll_no}, Class: ${student.class})`;
        if (student.id === selectedStudentId) {
            option.selected = true;
        }
        attendanceStudentSelect.appendChild(option);
    });
    console.log('Student select populated for attendance.');
}

// Add/Edit Attendance Modal Functions
window.showAddAttendanceModal = function() {
    if (attendanceModal) {
        attendanceModal.classList.remove('hidden');
        attendanceModal.style.display = 'flex';
    }
    if (attendanceForm) {
        attendanceForm.reset();
        document.getElementById('attendanceId').value = ''; // Clear ID for new entry
    }
    if (attendanceModalTitle) {
        attendanceModalTitle.textContent = 'Mark Attendance';
    }
    if (attendanceFormSubmitBtn) {
        attendanceFormSubmitBtn.textContent = 'Mark Attendance';
    }
    populateStudentSelect();
    console.log('Add Attendance modal opened.');
};

window.editAttendance = async function(id) {
    console.log(`Editing attendance ID: ${id}`);
    const record = attendanceRecords.find(rec => rec.id === id);
    if (record) {
        document.getElementById('attendanceId').value = record.id;
        document.getElementById('attendanceDate').value = record.date;
        document.getElementById('attendanceStatus').value = record.status;
        document.getElementById('arrivalTime').value = record.arrival_time || '';
        document.getElementById('departureTime').value = record.departure_time || '';
        document.getElementById('attendanceRemarks').value = record.remarks || '';

        await populateStudentSelect(record.student_id); // Pre-select student

        if (attendanceModalTitle) {
            attendanceModalTitle.textContent = 'Edit Attendance';
        }
        if (attendanceFormSubmitBtn) {
            attendanceFormSubmitBtn.textContent = 'Save Changes';
        }
        if (attendanceModal) {
            attendanceModal.classList.remove('hidden');
            attendanceModal.style.display = 'flex';
        }
        console.log(`Attendance ${id} data loaded for editing.`);
    } else {
        alert('Attendance record not found.');
        console.error(`Attendance record with ID ${id} not found for editing.`);
    }
};

window.deleteAttendance = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userEmail = loggedInUser?.email || 'admin';
    if (confirm('Are you sure you want to delete this attendance record?')) {
        console.log(`Deleting attendance ID: ${id}`);
        try {
            const { error } = await supabase.from('attendance').delete().eq('id', id);
            if (error) throw error;

            const deletedRecord = attendanceRecords.find(rec => rec.id === id);
            await addAuditLog(userEmail, 'Deleted Attendance', 'Attendance', `Deleted attendance for student ID ${deletedRecord?.student_id || id} on ${deletedRecord?.date || 'N/A'}`);
            alert('Attendance record deleted successfully!');
            await fetchAttendanceRecords(); // Re-fetch to update the table
            console.log(`Attendance record ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting attendance record: ' + error.message);
            console.error('Supabase error deleting attendance record:', error);
            await addAuditLog(userEmail, 'Delete Attendance Failed', 'Attendance', `Error: ${error.message}`);
        }
    }
};

if (closeAttendanceModal) {
    closeAttendanceModal.addEventListener('click', () => {
        if (attendanceModal) {
            attendanceModal.classList.add('hidden');
            attendanceModal.style.display = 'none';
        }
        if (attendanceForm) attendanceForm.reset();
        console.log('Attendance modal closed.');
    });
}

if (attendanceModal) {
    attendanceModal.addEventListener('click', (e) => {
        if (e.target === attendanceModal) {
            attendanceModal.classList.add('hidden');
            attendanceModal.style.display = 'none';
            if (attendanceForm) attendanceForm.reset();
            console.log('Attendance modal closed by outside click.');
        }
    });
}

if (attendanceForm) {
    attendanceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';

        const id = document.getElementById('attendanceId').value;
        const studentId = document.getElementById('attendanceStudentSelect').value;
        const date = document.getElementById('attendanceDate').value;
        const status = document.getElementById('attendanceStatus').value;
        const arrivalTime = document.getElementById('arrivalTime').value;
        const departureTime = document.getElementById('departureTime').value;
        const remarks = document.getElementById('attendanceRemarks').value;

        if (!studentId || !date || !status) {
            alert('Please fill in all required fields.');
            console.warn('Attendance form submission failed: Missing required fields.');
            return;
        }

        const attendanceData = {
            student_id: studentId,
            date: date,
            status: status,
            arrival_time: arrivalTime || null,
            departure_time: departureTime || null,
            remarks: remarks || null
        };

        try {
            let result;
            if (id) {
                // Update existing record
                console.log(`Updating attendance record ${id}...`);
                result = await supabase.from('attendance').update(attendanceData).eq('id', id).select();
                await addAuditLog(userEmail, 'Updated Attendance', 'Attendance', `Updated attendance for student ID ${studentId} on ${date}`);
                alert('Attendance record updated successfully!');
            } else {
                // Add new record
                console.log(`Adding new attendance record for student ID ${studentId}...`);
                result = await supabase.from('attendance').insert([attendanceData]).select();
                await addAuditLog(userEmail, 'Added Attendance', 'Attendance', `Added attendance for student ID ${studentId} on ${date}`);
                alert('Attendance record added successfully!');
            }

            if (result.error) throw result.error;

            await fetchAttendanceRecords(); // Re-fetch to update the table
            if (attendanceModal) {
                attendanceModal.classList.add('hidden');
                attendanceModal.style.display = 'none';
            }
            if (attendanceForm) {
                attendanceForm.reset();
            }
            console.log('Attendance operation completed successfully.');
        } catch (error) {
            alert('Error saving attendance record: ' + error.message);
            console.error('Supabase error saving attendance record:', error);
            await addAuditLog(userEmail, 'Save Attendance Failed', 'Attendance', `Error: ${error.message}`);
        }
    });
}
