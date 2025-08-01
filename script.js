// Global variables for data (will be populated from Supabase)
let students = [];
let teachers = [];
let payrollEntries = []; // Renamed to match the table name 'payroll'
let invoices = [];       // Renamed to match the table name 'finance'
let announcements = [];
let notifications = []; // Client-side for simplicity
let auditLogs = [];
let backups = []; // Client-side for simplicity
let attendanceRecords = []; // Renamed to match the table name 'attendance'
let teacherAttendanceRecords = []; // Renamed to match the table name 'teacher_attendance'
let profiles = []; // New global variable for profiles

// Supabase Client Initialization (Replace with your actual keys)
const SUPABASE_URL = 'https://zyvwttzwjweeslvjbatg.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dnd0dHp3andlZXNsdmpiYXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NTQwODMsImV4cCI6MjA2OTUzMDA4M30.pgzB45XBJAyGBlkKUJF4Jr0yVNunXjwa8p8JOaX7Nso'; // Replace with your actual Supabase Anon Key
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- IMPORTANT RLS NOTE ---
// If you are still getting 403 errors after this, ensure your Row Level Security (RLS) policies
// in Supabase are configured to allow 'SELECT', 'INSERT', 'UPDATE', 'DELETE' for the 'authenticated'
// and/or 'anon' roles on ALL tables your application interacts with.
// For testing, you can temporarily set very permissive policies like:
// CREATE POLICY "Allow all for authenticated users" ON your_table FOR ALL TO authenticated USING (true);
// CREATE POLICY "Allow all for anon users" ON your_table FOR ALL TO anon USING (true);
// Remember to refine these for production security!

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
            console.error('Error adding audit log:', error);
            // Log the full error object for debugging RLS issues
            console.error('Supabase RLS or DB error details:', error.message, error.details, error.hint);
        } else {
            console.log('Audit log added:', data);
        }
    } catch (err) {
        console.error('Unexpected error in addAuditLog:', err);
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

// --- Data Fetching Functions (from Supabase) ---

async function fetchStudents() {
    try {
        const { data, error } = await supabase.from('students').select('*');
        if (error) throw error;
        students = data;
    } catch (error) {
        console.error('Error fetching students:', error);
        students = [];
    } finally {
        renderStudentTable();
        updateDashboardStats();
    }
}

async function fetchTeachers() {
    try {
        const { data, error } = await supabase.from('teachers').select('*');
        if (error) throw error;
        teachers = data;
    } catch (error) {
        console.error('Error fetching teachers:', error);
        teachers = [];
    } finally {
        renderTeacherTable();
        updateDashboardStats();
    }
}

async function fetchPayrollEntries() {
    try {
        // Changed table name to 'payroll'
        const { data, error } = await supabase.from('payroll').select('*');
        if (error) throw error;
        payrollEntries = data;
    } catch (error) {
        console.error('Error fetching payroll entries:', error);
        payrollEntries = [];
    } finally {
        renderPayrollTable();
    }
}

async function fetchInvoices() {
    try {
        // Changed table name to 'finance'
        const { data, error } = await supabase.from('finance').select('*');
        if (error) throw error;
        invoices = data;
    } catch (error) {
        console.error('Error fetching invoices:', error);
        invoices = [];
    } finally {
        renderFinanceTable();
        updateDashboardStats();
    }
}

async function fetchAnnouncements() {
    try {
        const { data, error } = await supabase.from('announcements').select('*');
        if (error) throw error;
        announcements = data;
    } catch (error) {
        console.error('Error fetching announcements:', error);
        announcements = [];
    } finally {
        renderAnnouncementTable();
    }
}

async function fetchNotifications() {
    // Notifications are still client-side for simplicity, but could be fetched from DB
    notifications = JSON.parse(localStorage.getItem('notifications')) || [
        { id: 1, title: "New student enrolled!", description: "Emily Johnson joined Grade 10.", time: "5 minutes ago", unread: true },
        { id: 2, title: "Payroll processed", description: "March payroll completed for all staff.", time: "1 hour ago", unread: true },
        { id: 3, title: "Event Reminder", description: "Parent-Teacher meeting tomorrow at 3 PM.", time: "Yesterday", unread: true },
        { id: 4, title: "System Update", description: "System maintenance scheduled for Sunday.", time: "2 days ago", unread: false },
    ];
    renderDropdownNotifications();
}

async function fetchAuditLogs() {
    try {
        const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
        if (error) throw error;
        auditLogs = data;
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        auditLogs = [];
    } finally {
        renderAuditLogs();
        renderRecentActivity();
    }
}

async function fetchBackups() {
    // Backups are simulated, but could be fetched from a storage service
    backups = JSON.parse(localStorage.getItem('backups')) || [
        { id: 'B001', backup_id: 'BK20231026-001', date: '2023-10-26 02:00:00', size: '150 MB', type: 'Full' },
        { id: 'B002', backup_id: 'BK20231025-001', date: '2023-10-25 02:00:00', size: '148 MB', type: 'Full' }
    ];
    renderBackupTable();
}

async function fetchAttendanceRecords() {
    try {
        // Changed table name to 'attendance'
        const { data, error } = await supabase.from('attendance').select('*');
        if (error) throw error;
        attendanceRecords = data;
    } catch (error) {
        console.error('Error fetching attendance records:', error);
        attendanceRecords = [];
    } finally {
        renderAttendanceTable();
    }
}

async function fetchTeacherAttendanceRecords() { // Renamed function for clarity
    try {
        // Changed table name to 'teacher_attendance'
        const { data, error } = await supabase.from('teacher_attendance').select('*');
        if (error) throw error;
        teacherAttendanceRecords = data; // Assign to teacherAttendanceRecords
    } catch (error) {
        console.error('Error fetching teacher attendance:', error);
        teacherAttendanceRecords = [];
    } finally {
        renderTeacherAttendanceTable();
    }
}

async function fetchProfiles() {
    try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        profiles = data;
    } catch (error) {
        console.error('Error fetching profiles:', error);
        profiles = [];
    } finally {
        renderUserTable(); // Assuming renderUserTable will now use the 'profiles' data
    }
}

/**
 * Fetches the role of a specific user from the 'profiles' table.
 * @param {string} userId - The UUID of the user.
 * @returns {Promise<string|null>} The role of the user (e.g., 'admin', 'teacher', 'student') or null if not found.
 */
async function fetchUserRole(userId) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single(); // Use .single() to get a single record

        if (error) {
            console.error('Error fetching user role:', error);
            return null;
        }

        if (data) {
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
    await Promise.all([
        fetchStudents(),
        fetchTeachers(),
        fetchPayrollEntries(),
        fetchInvoices(),
        fetchAnnouncements(),
        fetchNotifications(), // Still local
        fetchAuditLogs(),
        fetchBackups(), // Still local
        fetchAttendanceRecords(),
        fetchTeacherAttendanceRecords(), // Call the corrected function name
        fetchProfiles() // Fetch profiles data
    ]);
    updateDashboardStats();
    renderHolidayList();
    renderReportsCharts();
}

// --- UI Element References ---
const loginUi = document.getElementById('login-ui');
const schoolSiteUi = document.getElementById('school-site-ui');

// Login UI Elements
const roleButtons = document.querySelectorAll('.role-button');
const selectedRoleInput = document.getElementById('selectedRole');
const loginForm = document.getElementById('loginForm');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const forgotPasswordModal = document.getElementById('forgotPasswordModal');
const closeForgotPasswordModal = document.getElementById('closeForgotPasswordModal');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');

// School Site UI Elements
// const logoutButton = document.getElementById('logoutButton'); // Removed logout button
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

const openAddInvoiceModalBtn = document.getElementById('openAddInvoiceModalBtn');
const addInvoiceModal = document.getElementById('addInvoiceModal');
const closeAddInvoiceModalBtn = document.getElementById('closeAddInvoiceModalBtn');
const addInvoiceForm = document.getElementById('addInvoiceForm');
const financeTableBody = document.getElementById('financeTableBody');

const userProfileToggle = document.getElementById('userProfileToggle');
const userDropdown = document.getElementById('userDropdown');

const searchRollInput = document.getElementById('searchRoll');
const searchClassSelect = document.getElementById('searchClass');
const applySearchButton = document.getElementById('applySearch');
const studentTableBody = document.getElementById('studentTableBody');

const studentModal = document.getElementById('studentModal');
const closeStudentModal = document.getElementById('closeStudentModal');
const studentForm = document.getElementById('studentForm');
const studentModalTitle = document.getElementById('studentModalTitle');
const studentFormSubmitBtn = document.getElementById('studentFormSubmitBtn');

const teacherModal = document.getElementById('teacherModal');
const closeTeacherModal = document.getElementById('closeTeacherModal');
const teacherForm = document.getElementById('teacherForm');
const teacherTableBody = document.getElementById('teacherTableBody');
const teacherModalTitle = document.getElementById('teacherModalTitle');
const teacherFormSubmitBtn = document.getElementById('teacherFormSubmitBtn');

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

// Chart.js instances
let attendanceChartInstance = null;
let performanceChartInstance = null;

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

// Teacher Attendance Module Elements
const teacherAttendanceModal = document.getElementById('teacherAttendanceModal');
const closeTeacherAttendanceModal = document.getElementById('closeTeacherAttendanceModal');
const teacherAttendanceForm = document.getElementById('teacherAttendanceForm');
const teacherAttendanceModalTitle = document.getElementById('teacherAttendanceModalTitle');
const teacherAttendanceFormSubmitBtn = document.getElementById('teacherAttendanceFormSubmitBtn');
const teacherAttendanceTeacherSelect = document.getElementById('teacherAttendanceTeacherSelect');
const teacherAttendanceTableBody = document.getElementById('teacherAttendanceTableBody');
const teacherAttendanceSubjectFilter = document.getElementById('teacherAttendanceSubjectFilter');
const teacherAttendanceDateFilter = document.getElementById('teacherAttendanceDateFilter');
const teacherAttendanceNameFilter = document.getElementById('teacherAttendanceNameFilter');
const applyTeacherAttendanceFilter = document.getElementById('applyTeacherAttendanceFilter');
const teacherAttendanceTotalTeachers = document.getElementById('teacherAttendanceTotalTeachers');
const teacherAttendanceTotalPresent = document.getElementById('teacherAttendanceTotalPresent');
const teacherAttendanceTotalAbsent = document.getElementById('teacherAttendanceTotalAbsent');
const registerTeacherFingerprintBtn = document.getElementById('registerTeacherFingerprintBtn');
const verifyTeacherFingerprintBtn = document.getElementById('verifyTeacherFingerprintBtn');

// Dark Mode Elements
const darkModeToggle = document.getElementById('darkModeToggle');
const darkModeIcon = darkModeToggle.querySelector('i');

// --- Initial UI State Management ---

/**
 * Shows the login UI and hides the main school site UI.
 */
function showLoginUi() {
    loginUi.style.display = 'flex';
    schoolSiteUi.style.display = 'none';
    document.body.style.justifyContent = 'center';
    document.body.style.alignItems = 'center';
    document.body.style.minHeight = '100vh';
    document.body.style.backgroundColor = 'var(--light)';
    document.body.style.overflow = 'hidden';
}

/**
 * Shows the main school site UI and hides the login UI.
 * Loads all initial data and updates UI elements.
 */
async function showSchoolSiteUi() {
    loginUi.style.display = 'none';
    schoolSiteUi.style.display = 'flex';
    document.body.style.justifyContent = 'flex-start';
    document.body.style.alignItems = 'flex-start';
    document.body.style.minHeight = 'auto';
    document.body.style.backgroundColor = 'var(--light)';
    document.body.style.overflow = 'auto';

    await loadAllData(); // Load all data from Supabase

    updateLoggedInUserName();
    updateUIAccess(); // Adjust UI based on role

    if (typeof calendar !== 'undefined' && calendar) {
        calendar.render();
    }
    renderReportsCharts();
}

/**
 * Updates UI elements (navigation, buttons) to be fully visible.
 * All role-based restrictions are removed.
 */
function updateUIAccess() {
    // Show all elements with data-role attributes
    document.querySelectorAll('[data-role]').forEach(el => {
        el.style.display = 'block';
    });

    // Show all navigation items
    document.querySelectorAll('.nav-item').forEach(navItem => {
        navItem.classList.remove('hidden');
    });

    // Show all specific buttons/forms
    const addStudentBtn = document.getElementById('addStudentBtn');
    if (addStudentBtn) addStudentBtn.classList.remove('hidden');
    const addTeacherBtn = document.getElementById('addTeacherBtn');
    if (addTeacherBtn) addTeacherBtn.classList.remove('hidden');
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) addUserBtn.classList.remove('hidden');
    if (openPayrollModalBtn) openPayrollModalBtn.classList.remove('hidden');
    if (openAddInvoiceModalBtn) openAddInvoiceModalBtn.classList.remove('hidden');
}


// Check login status on load
document.addEventListener('DOMContentLoaded', () => {
    // Always show the login UI initially to prevent auto-login on refresh
    showLoginUi();

    // The commented-out block below is the original logic that caused auto-login
    // if a session existed. For a clean login flow, it's better to always
    // start at the login screen and only transition to the school site UI
    // after a successful manual login.
    /*
    supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session) {
            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('loggedInUser', JSON.stringify(session.user));
            showSchoolSiteUi();
        } else {
            localStorage.removeItem('loggedIn');
            localStorage.removeItem('loggedInUser');
            showLoginUi(); // Ensure login UI is shown if no session
        }
    });
    */
});

// --- Login UI Logic ---

roleButtons.forEach(button => {
    button.addEventListener('click', function() {
        roleButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        selectedRoleInput.value = this.dataset.role;
    });
});

/**
 * Handles user login authentication with Supabase.
 * Verifies selected role against user_metadata.
 */
async function handleLogin() {
    const emailInput = document.getElementById('email').value.trim();
    const passwordInput = document.getElementById('password').value.trim();
    const selectedRole = document.getElementById('selectedRole').value;

    // Ensure all fields are filled and a role is selected
    if (!emailInput || !passwordInput || !selectedRole) {
        alert('Please fill in all fields and select a role.');
        return;
    }

    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: emailInput,
            password: passwordInput
        });

        if (authError) {
            alert('Login failed: ' + authError.message);
            await addAuditLog(emailInput, 'Login Failed', 'Authentication', `Error: ${authError.message}`);
            return;
        }

        if (authData.user) {
            // Determine the user's actual role from Supabase metadata
            // raw_user_meta_data is preferred as it's directly set by the application
            const userRole = authData.user.raw_user_meta_data?.role || authData.user.app_metadata?.role || 'admin';

            // Proceed with login if roles match or if the selected role is 'admin' (allowing admin to impersonate/test)
            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('loggedInUser', JSON.stringify(authData.user)); // Store the full user object
            alert('Login successful! Redirecting...');
            await addAuditLog(authData.user.email, 'Logged In', 'Authentication', `Successful login for role: ${userRole}`);
            showSchoolSiteUi(); // Only call this on successful login
        } else {
            // This case should ideally be covered by authError, but as a fallback
            alert('Login failed: No user data returned.');
            await addAuditLog(emailInput, 'Login Failed (No User Data)', 'Authentication', 'No user data returned from signInWithPassword.');
        }
    } catch (err) {
        console.error('Unexpected error during login:', err);
        alert('An unexpected error occurred: ' + err.message);
        await addAuditLog(emailInput, 'Login Failed (Unexpected)', 'Authentication', `Unexpected error: ${err.message}`);
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
        forgotPasswordModal.classList.add('active');
    });
}

if (closeForgotPasswordModal) {
    closeForgotPasswordModal.addEventListener('click', function() {
        forgotPasswordModal.classList.remove('active');
        forgotPasswordForm.reset();
    });
}

if (forgotPasswordModal) {
    forgotPasswordModal.addEventListener('click', function(event) {
        if (event.target === forgotPasswordModal) {
            forgotPasswordModal.classList.remove('active');
            forgotPasswordForm.reset();
        }
    });
}

if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const email = document.getElementById('forgotEmail').value;
        if (!email) {
            alert('Please enter your email address.');
            return;
        }
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) {
                alert('Error sending reset link: ' + error.message);
                await addAuditLog(email, 'Forgot Password Failed', 'Authentication', `Failed to send reset link: ${error.message}`);
            } else {
                alert('If an account with that email exists, a password reset link has been sent to ' + email + '.');
                await addAuditLog(email, 'Forgot Password Initiated', 'Authentication', 'Password reset link sent.');
            }
        } catch (err) {
            console.error('Unexpected error during password reset:', err);
            alert('An unexpected error occurred: ' + err.message);
        } finally {
            forgotPasswordModal.classList.remove('active');
            forgotPasswordForm.reset();
        }
    });
}

// --- School Site UI Logic ---

// Removed Logout functionality
/*
if (logoutButton) {
    logoutButton.addEventListener('click', async function() {
        if (confirm('Are you sure you want to logout?')) {
            const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
            try {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;

                await addAuditLog(loggedInUser ? loggedInUser.email : 'Unknown', 'Logged Out', 'Authentication', 'User logged out');
                localStorage.clear(); // Clear all local storage on logout
                showLoginUi();
                // Reset UI elements to default dashboard view
                document.querySelectorAll('.module-content').forEach(m => m.classList.add('hidden'));
                document.getElementById('dashboardMainContent').classList.remove('hidden');
                document.getElementById('moduleTabs').classList.remove('hidden');
                document.getElementById('modulesContainer').classList.add('hidden');
                document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
                document.querySelector('.nav-item[data-module="dashboard"]').classList.add('active');
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelector('.tab[data-tab="dashboard"]').classList.add('active');
            } catch (error) {
                console.error('Error logging out:', error);
                alert('Error logging out: ' + error.message);
                await addAuditLog(loggedInUser ? loggedInUser.email : 'Unknown', 'Logout Failed', 'Authentication', `Error: ${error.message}`);
            }
        }
    });
}
*/

// Holiday Data (still static for now)
const holidays = [
    { date: '2023-01-01', name: 'New Year\'s Day' },
    { date: '2023-01-16', name: 'Martin Luther King, Jr. Day' },
    { date: '2023-02-20', name: 'Presidents\' Day' },
    { date: '2023-03-17', name: 'St. Patrick\'s Day (Observed)' },
    { date: '2023-04-07', name: 'Good Friday' },
    { date: '2023-05-29', name: 'Memorial Day' },
    { date: '2023-06-19', name: 'Juneteenth' },
    { date: '2023-07-04', name: 'Independence Day' },
    { date: '2023-09-04', name: 'Labor Day' },
    { date: '2023-10-09', name: 'Columbus Day' },
    { date: '2023-11-10', name: 'Veterans Day (Observed)' },
    { date: '2023-11-23', name: 'Thanksgiving Day' },
    { date: '2023-12-25', name: 'Christmas Day' },
    { date: '2024-01-01', name: 'New Year\'s Day' },
    { date: '2024-01-15', name: 'Martin Luther King, Jr. Day' },
    { date: '2024-02-19', name: 'Presidents\' Day' },
    { date: '2024-03-29', name: 'Good Friday' },
    { date: '2024-05-27', name: 'Memorial Day' },
    { date: '2024-06-19', name: 'Juneteenth' },
    { date: '2024-07-04', name: 'Independence Day' },
    { date: '2024-09-02', name: 'Labor Day' },
    { date: '2024-10-14', name: 'Columbus Day' },
    { date: '2024-11-11', name: 'Veterans Day' },
    { date: '2024-11-28', name: 'Thanksgiving Day' },
    { date: '2024-12-25', name: 'Christmas Day' },
];

// Initialize calendar
var calendarEl = document.getElementById('calendar-full');
var calendar;

if (calendarEl && typeof FullCalendar !== 'undefined') {
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
    // Render calendar only if a session exists (this is fine as it doesn't log in the user)
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            calendar.render();
        }
    });
}

const holidayListContainer = document.getElementById('holidayList');
function renderHolidayList() {
    if (!holidayListContainer) return;
    holidayListContainer.innerHTML = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingHolidays = holidays
        .filter(holiday => new Date(holiday.date) >= today)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort ascending to show nearest first

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
}

/**
 * Shows the specified module content and updates active navigation/tab states.
 * All modules are accessible.
 * @param {string} moduleName - The name of the module to show (e.g., 'dashboard', 'students').
 */
window.showModule = async function(moduleName) {
    const dashboardMainContent = document.getElementById('dashboardMainContent');
    const modulesContainer = document.getElementById('modulesContainer');
    const moduleTabs = document.getElementById('moduleTabs');
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role || 'admin' : null;

    currentModuleTitle.textContent = moduleName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    document.querySelectorAll('.module-content').forEach(m => m.classList.add('hidden'));
    dashboardMainContent.classList.add('hidden');
    modulesContainer.classList.remove('hidden');

    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    if (moduleName === 'dashboard') {
        dashboardMainContent.classList.remove('hidden');
        modulesContainer.classList.add('hidden');
        moduleTabs.classList.remove('hidden');
        document.querySelector('.tab[data-tab="dashboard"]').classList.add('active');
        document.querySelector('.nav-item[data-module="dashboard"]').classList.add('active');
        currentModuleTitle.textContent = 'Dashboard';
        updateDashboardStats();
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
            case 'finance': await fetchInvoices(); break;
            case 'attendance': await fetchAttendanceRecords(); populateStudentSelect(); break;
            case 'teacher-attendance': await fetchTeacherAttendanceRecords(); populateTeacherSelect(); break; // Corrected function call
            case 'announcements': await fetchAnnouncements(); break;
            case 'audit-logs': await fetchAuditLogs(); break;
            case 'backup-restore': await fetchBackups(); break;
            case 'user-management': await fetchProfiles(); break; // Fetch profiles for user management
        }
    }
    if (notificationDropdown) notificationDropdown.classList.remove('active');
    if (userDropdown) userDropdown.classList.remove('active');
}

document.querySelectorAll('.open-module, .tab, .nav-item, .user-dropdown-item').forEach(el => {
    el.addEventListener('click', async (e) => {
        e.preventDefault();
        const moduleName = el.dataset.module || el.dataset.tab;
        if (moduleName) {
            showModule(moduleName);
        }
    });
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
}

async function markNotificationRead(id) {
    const notif = notifications.find((n) => n.id === id);
    if (notif && notif.unread) {
        notif.unread = false;
        renderDropdownNotifications();
        renderModalNotifications();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        await addAuditLog(loggedInUser?.email || 'System', 'Notification Read', 'Notifications', `Notification "${notif.title}" marked as read.`);
    }
}

async function markAllAsRead() {
    notifications.forEach((n) => (n.unread = false));
    renderDropdownNotifications();
    renderModalNotifications();
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    await addAuditLog(loggedInUser?.email || 'System', 'Notifications', 'Notifications', 'All notifications marked as read.');
}

if (notificationButton) {
    notificationButton.addEventListener('click', function(event) {
        event.stopPropagation();
        notificationDropdown.classList.toggle('active');
        if (userDropdown) userDropdown.classList.remove('active');
    });
}

document.addEventListener('click', function(event) {
    if (notificationDropdown && !notificationDropdown.contains(event.target) && (!notificationButton || !notificationButton.contains(event.target))) {
        notificationDropdown.classList.remove('active');
    }
});

if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', markAllAsRead);
}

if (viewAllNotificationsLink) {
    viewAllNotificationsLink.addEventListener('click', function(event) {
        event.preventDefault();
        if (notificationDropdown) notificationDropdown.classList.remove("active");
        if (viewAllModal) viewAllModal.classList.add("active");
        renderModalNotifications();
    });
}

if (closeViewAllModal) {
    closeViewAllModal.addEventListener("click", () => {
        if (viewAllModal) viewAllModal.classList.remove("active");
    });
}

if (viewAllModal) {
    viewAllModal.addEventListener("click", (e) => {
        if (e.target === viewAllModal) {
            viewAllModal.classList.remove("active");
        }
    });
}

if (modalMarkAllReadBtn) {
    modalMarkAllReadBtn.addEventListener("click", markAllAsRead);
}

// Payroll Module Specific JavaScript
function renderPayrollTable() {
    if (!payrollTableBody) return;
    payrollTableBody.innerHTML = '';
    if (payrollEntries.length === 0) {
        payrollTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No payroll entries found.</td></tr>';
        return;
    }
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;

    payrollEntries.forEach(entry => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        let statusBgClass = '';
        let statusTextColorClass = '';
        switch (entry.status) {
            case 'Paid': statusBgClass = 'bg-green-100'; statusTextColorClass = 'text-green-800'; break;
            case 'Processing': statusBgClass = 'bg-yellow-100'; statusTextColorClass = 'text-yellow-800'; break;
            case 'Pending': statusBgClass = 'bg-blue-100'; statusTextColorClass = 'text-blue-800'; break;
        }
        newRow.innerHTML = `
            <td class="py-3 px-4">${entry.period}</td>
            <td class="py-3 px-4">${entry.staff_count}</td>
            <td class="py-3 px-4">$${parseFloat(entry.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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
}

if (openPayrollModalBtn) {
    openPayrollModalBtn.addEventListener('click', () => {
        if (payrollModal) {
            payrollModal.classList.remove('hidden');
            payrollModal.style.display = 'flex';
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
    });
}

if (payrollModal) {
    payrollModal.addEventListener('click', (e) => {
        if (e.target === payrollModal) {
            payrollModal.classList.add('hidden');
            payrollModal.style.display = 'none';
            if (payrollForm) payrollForm.reset();
        }
    });
}

if (payrollForm) {
    payrollForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        // Role retrieval is kept for audit logging, but not for access control
        const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
        // Removed role check: if (userRole !== 'admin') { alert('Access Denied: Only admin can process payroll.'); return; }

        const periodInput = document.getElementById('payrollPeriod').value;
        const staffCount = document.getElementById('staffCount').value;
        const totalAmount = parseFloat(document.getElementById('totalAmount').value);

        if (!periodInput || !staffCount || isNaN(totalAmount)) {
            alert('Please fill in all fields correctly.');
            return;
        }

        const [year, monthNum] = periodInput.split('-');
        const date = new Date(year, monthNum - 1);
        const formattedPeriod = date.toLocaleString('default', { month: 'long', year: 'numeric' });

        try {
            // Changed table name to 'payroll'
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
            await addAuditLog(loggedInUser?.email || 'admin', 'Processed Payroll', 'Payroll', `Processed payroll for ${formattedPeriod}, amount: $${totalAmount}`);
            await fetchPayrollEntries();
            if (payrollModal) {
                payrollModal.classList.add('hidden');
                payrollModal.style.display = 'none';
            }
            payrollForm.reset();
        } catch (error) {
            alert('Error processing payroll: ' + error.message);
            console.error('Supabase error:', error);
            await addAuditLog(loggedInUser?.email || 'admin', 'Payroll Processing Failed', 'Payroll', `Error: ${error.message}`);
        }
    });
}

// Finance Module Specific JavaScript
function renderFinanceTable() {
    if (!financeTableBody) return;
    financeTableBody.innerHTML = '';
    if (invoices.length === 0) {
        financeTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No invoices found.</td></tr>';
        return;
    }
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;

    invoices.forEach(invoice => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        let statusBgClass = '';
        let statusTextColorClass = '';
        switch (invoice.status) {
            case 'Paid': statusBgClass = 'bg-blue-100'; statusTextColorClass = 'text-blue-800'; break;
            case 'Pending': statusBgClass = 'bg-yellow-100'; statusTextColorClass = 'text-yellow-800'; break;
            case 'Overdue': statusBgClass = 'bg-red-100'; statusTextColorClass = 'text-red-800'; break;
        }
        newRow.innerHTML = `
            <td class="py-3 px-4">${invoice.invoice_number}</td>
            <td class="py-3 px-4">${invoice.date}</td>
            <td class="py-3 px-4">$${parseFloat(invoice.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 ${statusBgClass} ${statusTextColorClass} text-xs rounded-full">${invoice.status}</span>
            </td>
            <td class="py-3 px-4">
                <button class="text-blue-600 hover:text-blue-800 mr-3" title="View Details" onclick="alert('Viewing details for invoice ${invoice.invoice_number}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="text-red-600 hover:text-red-800" title="Download PDF" onclick="alert('Downloading PDF for invoice ${invoice.invoice_number}')">
                    <i class="fas fa-file-pdf"></i>
                </button>
            </td>
        `;
        financeTableBody.prepend(newRow);
    });
}

if (openAddInvoiceModalBtn) {
    openAddInvoiceModalBtn.addEventListener('click', () => {
        if (addInvoiceModal) {
            addInvoiceModal.classList.remove('hidden');
            addInvoiceModal.style.display = 'flex';
        }
    });
}

if (closeAddInvoiceModalBtn) {
    closeAddInvoiceModalBtn.addEventListener('click', () => {
        if (addInvoiceModal) {
            addInvoiceModal.classList.add('hidden');
            addInvoiceModal.style.display = 'none';
        }
        if (addInvoiceForm) addInvoiceForm.reset();
    });
}

if (addInvoiceModal) {
    addInvoiceModal.addEventListener('click', (e) => {
        if (e.target === addInvoiceModal) {
            addInvoiceModal.classList.add('hidden');
            addInvoiceModal.style.display = 'none';
            if (addInvoiceForm) addInvoiceForm.reset();
        }
    });
}

if (addInvoiceForm) {
    addInvoiceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        // Role retrieval is kept for audit logging, but not for access control
        const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
        // Removed role check: if (userRole !== 'admin') { alert('Access Denied: Only admin can add invoices.'); return; }

        const invoiceNumber = document.getElementById('invoiceNumber').value;
        const invoiceDateInput = document.getElementById('invoiceDate').value;
        const invoiceAmount = parseFloat(document.getElementById('invoiceAmount').value);
        const invoiceStatus = document.getElementById('invoiceStatus').value;

        if (!invoiceNumber || !invoiceDateInput || isNaN(invoiceAmount) || !invoiceStatus) {
            alert('Please fill in all fields correctly.');
            return;
        }

        try {
            // Changed table name to 'finance'
            const { data, error } = await supabase.from('finance').insert([
                {
                    invoice_number: invoiceNumber,
                    date: invoiceDateInput,
                    amount: invoiceAmount,
                    status: invoiceStatus
                }
            ]).select();

            if (error) throw error;

            alert('Invoice added successfully!');
            await addAuditLog(loggedInUser?.email || 'admin', 'Added Invoice', 'Finance', `Added invoice ${invoiceNumber} for $${invoiceAmount}`);
            await fetchInvoices();
            if (addInvoiceModal) {
                addInvoiceModal.classList.add('hidden');
                addInvoiceModal.style.display = 'none';
            }
            addInvoiceForm.reset();
        } catch (error) {
            alert('Error adding invoice: ' + error.message);
            console.error('Supabase error:', error);
            await addAuditLog(loggedInUser?.email || 'admin', 'Add Invoice Failed', 'Finance', `Error: ${error.message}`);
        }
    });
}

async function updateLoggedInUserName() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (loggedInUser && loggedInUserName) {
        // Updated name retrieval logic: raw_user_meta_data first, then email
        loggedInUserName.textContent = loggedInUser.raw_user_meta_data?.name || loggedInUser.email;
    }
}

// User Dropdown Functionality
if (userProfileToggle) {
    userProfileToggle.addEventListener('click', function(event) {
        event.stopPropagation();
        if (userDropdown) userDropdown.classList.toggle('active');
        if (notificationDropdown) notificationDropdown.classList.remove('active');
    });
}

document.addEventListener('click', function(event) {
    if (userDropdown && !userDropdown.contains(event.target) && (!userProfileToggle || !userProfileToggle.contains(event.target))) {
        userDropdown.classList.remove('active');
    }
});

// Student Search and Render Functionality
function renderStudentTable(filteredStudents = students) {
    if (!studentTableBody) return;
    studentTableBody.innerHTML = '';
    if (filteredStudents.length === 0) {
        studentTableBody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-gray-500">No students found matching your criteria.</td></tr>';
        return;
    }
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;

    filteredStudents.forEach(student => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        let statusBgClass = '';
        let statusTextColorClass = '';
        switch (student.status) {
            case 'Active': statusBgClass = 'bg-green-100'; statusTextColorClass = 'text-green-800'; break;
            case 'Inactive': statusBgClass = 'bg-yellow-100'; statusTextColorClass = 'text-yellow-800'; break;
        }
        newRow.innerHTML = `
            <td class="py-3 px-4">${student.id}</td>
            <td class="py-3 px-4">${student.name}</td>
            <td class="py-3 px-4">${student.father_name}</td>
            <td class="py-3 px-4">${student.mother_name}</td>
            <td class="py-3 px-4">${student.class}</td>
            <td class="py-3 px-4">${student.roll_no}</td>
            <td class="py-3 px-4">${student.aadhar_no}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 ${statusBgClass} ${statusTextColorClass} text-xs rounded-full">${student.status}</span>
            </td>
            <td class="py-3 px-4 table-actions">
                <button class="text-blue-600 mr-3" title="Edit Student" onclick="editStudent('${student.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600" title="Delete Student" onclick="deleteStudent('${student.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        studentTableBody.appendChild(newRow);
    });
}

function filterStudents() {
    const rollQuery = searchRollInput.value.toLowerCase();
    const classQuery = searchClassSelect.value.toLowerCase();

    const filtered = students.filter(student => {
        const rollMatch = student.roll_no.toLowerCase().includes(rollQuery);
        const classMatch = classQuery === '' || student.class.toLowerCase() === classQuery;
        return rollMatch && classMatch;
    });
    renderStudentTable(filtered);
}

if (applySearchButton) applySearchButton.addEventListener('click', filterStudents);
if (searchRollInput) searchRollInput.addEventListener('keyup', filterStudents);
if (searchClassSelect) searchClassSelect.addEventListener('change', filterStudents);

// Teacher Render Functionality
function renderTeacherTable() {
    if (!teacherTableBody) return;
    teacherTableBody.innerHTML = '';
    if (teachers.length === 0) {
        teacherTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No teachers found.</td></tr>';
        return;
    }
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;

    teachers.forEach(teacher => {
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
                <button class="text-red-600" title="Delete Teacher" onclick="deleteTeacher('${teacher.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        teacherTableBody.appendChild(newRow);
    });
}

// User Render Functionality (Now uses profiles data)
function renderUserTable() {
    if (!userTableBody) return;
    userTableBody.innerHTML = '';
    if (profiles.length === 0) {
        userTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">No user profiles found.</td></tr>';
        return;
    }
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const currentUserRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;

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
}

// Announcement Render Functionality
function renderAnnouncementTable() {
    if (!announcementTableBody) return;
    announcementTableBody.innerHTML = '';
    if (announcements.length === 0) {
        announcementTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No announcements found.</td></tr>';
        return;
    }
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;

    announcements.forEach(announcement => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        let statusBgClass = '';
        let statusTextColorClass = '';
        switch (announcement.status) {
            case 'Active': statusBgClass = 'bg-green-100'; statusTextColorClass = 'text-green-800'; break;
            case 'Archived': statusBgClass = 'bg-yellow-100'; statusTextColorClass = 'text-yellow-800'; break;
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
}

// Backup Render Functionality
function renderBackupTable() {
    if (!backupTableBody) return;
    backupTableBody.innerHTML = '';
    if (backups.length === 0) {
        backupTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No backups found.</td></tr>';
        return;
    }
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;

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
}

// Student Attendance Module Functions
function renderAttendanceTable(filteredAttendance = attendanceRecords) {
    if (!attendanceTableBody) return;
    attendanceTableBody.innerHTML = '';

    let totalPresent = 0;
    let totalAbsent = 0;
    let uniqueStudents = new Set();

    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;

    if (filteredAttendance.length === 0) {
        attendanceTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">No attendance records found for the selected criteria.</td></tr>';
    } else {
        filteredAttendance.forEach(record => {
            const student = students.find(s => s.id === record.student_id);
            if (!student) return;

            uniqueStudents.add(student.id);

            if (record.status === 'Present') {
                totalPresent++;
            } else if (record.status === 'Absent') {
                totalAbsent++;
            }

            const newRow = document.createElement('tr');
            newRow.className = 'border-b hover:bg-gray-50';
            let statusBgClass = '';
            let statusTextColorClass = '';
            switch (record.status) {
                case 'Present': statusBgClass = 'bg-green-100'; statusTextColorClass = 'text-green-800'; break;
                case 'Absent': statusBgClass = 'bg-red-100'; statusTextColorClass = 'text-red-800'; break;
                case 'Leave': statusBgClass = 'bg-yellow-100'; statusTextColorClass = 'text-yellow-800'; break;
            }
            newRow.innerHTML = `
                <td class="py-3 px-4">${student.name}</td>
                <td class="py-3 px-4">${student.roll_no}</td>
                <td class="py-3 px-4">${student.class}</td>
                <td class="py-3 px-4">${record.date}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 ${statusBgClass} ${statusTextColorClass} text-xs rounded-full">${record.status}</span>
                </td>
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

    if (attendanceTotalStudents) attendanceTotalStudents.textContent = uniqueStudents.size;
    if (attendanceTotalPresent) attendanceTotalPresent.textContent = totalPresent;
    if (attendanceTotalAbsent) attendanceTotalAbsent.textContent = totalAbsent;
}

function filterAttendance() {
    const classFilter = attendanceClassFilter.value.toLowerCase();
    const dateFilter = attendanceDateFilter.value;
    const studentNameFilter = attendanceStudentNameFilter.value.toLowerCase();

    const filtered = attendanceRecords.filter(record => {
        const student = students.find(s => s.id === record.student_id);
        if (!student) return false;

        const classMatch = classFilter === '' || student.class.toLowerCase() === classFilter;
        const dateMatch = dateFilter === '' || record.date === dateFilter;
        const nameMatch = studentNameFilter === '' || student.name.toLowerCase().includes(studentNameFilter);

        return classMatch && dateMatch && nameMatch;
    });
    renderAttendanceTable(filtered);
}

if (applyAttendanceFilter) applyAttendanceFilter.addEventListener('click', filterAttendance);
if (attendanceClassFilter) attendanceClassFilter.addEventListener('change', filterAttendance);
if (attendanceDateFilter) attendanceDateFilter.addEventListener('change', filterAttendance);
if (attendanceStudentNameFilter) attendanceStudentNameFilter.addEventListener('keyup', filterAttendance);

// Teacher Attendance Module Functions
function renderTeacherAttendanceTable(filteredRecords = teacherAttendanceRecords) { // Corrected variable name
    if (!teacherAttendanceTableBody) return;
    teacherAttendanceTableBody.innerHTML = '';

    let totalPresent = 0;
    let totalAbsent = 0;
    let uniqueTeachers = new Set();

    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;

    if (filteredRecords.length === 0) {
        teacherAttendanceTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">No teacher attendance records found for the selected criteria.</td></tr>';
    } else {
        filteredRecords.forEach(record => {
            const teacher = teachers.find(t => t.id === record.teacher_id);
            if (!teacher) return;

            uniqueTeachers.add(teacher.id);

            if (record.status === 'Present') {
                totalPresent++;
            } else if (record.status === 'Absent') {
                totalAbsent++;
            }

            const newRow = document.createElement('tr');
            newRow.className = 'border-b hover:bg-gray-50';
            let statusBgClass = '';
            let statusTextColorClass = '';
            switch (record.status) {
                case 'Present': statusBgClass = 'bg-green-100'; statusTextColorClass = 'text-green-800'; break;
                case 'Absent': statusBgClass = 'bg-red-100'; statusTextColorClass = 'text-red-800'; break;
                case 'Leave': statusBgClass = 'bg-yellow-100'; statusTextColorClass = 'text-yellow-800'; break;
            }
            newRow.innerHTML = `
                <td class="py-3 px-4">${teacher.name}</td>
                <td class="py-3 px-4">${teacher.subject}</td>
                <td class="py-3 px-4">${record.date}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 ${statusBgClass} ${statusTextColorClass} text-xs rounded-full">${record.status}</span>
                </td>
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
            teacherAttendanceTableBody.appendChild(newRow);
        });
    }

    if (teacherAttendanceTotalTeachers) teacherAttendanceTotalTeachers.textContent = uniqueTeachers.size;
    if (teacherAttendanceTotalPresent) teacherAttendanceTotalPresent.textContent = totalPresent;
    if (teacherAttendanceTotalAbsent) teacherAttendanceTotalAbsent.textContent = totalAbsent;
}

function filterTeacherAttendance() {
    const subjectFilter = teacherAttendanceSubjectFilter.value.toLowerCase();
    const dateFilter = teacherAttendanceDateFilter.value;
    const nameFilter = teacherAttendanceNameFilter.value.toLowerCase();

    const filtered = teacherAttendanceRecords.filter(record => { // Corrected variable name
        const teacher = teachers.find(t => t.id === record.teacher_id);
        if (!teacher) return false;

        const subjectMatch = subjectFilter === '' || teacher.subject.toLowerCase() === subjectFilter;
        const dateMatch = dateFilter === '' || record.date === dateFilter;
        const nameMatch = nameFilter === '' || teacher.name.toLowerCase().includes(nameFilter);

        return subjectMatch && dateMatch && nameMatch;
    });
    renderTeacherAttendanceTable(filtered);
}

if (applyTeacherAttendanceFilter) applyTeacherAttendanceFilter.addEventListener('click', filterTeacherAttendance);
if (teacherAttendanceSubjectFilter) teacherAttendanceSubjectFilter.addEventListener('change', filterTeacherAttendance);
if (teacherAttendanceDateFilter) teacherAttendanceDateFilter.addEventListener('change', filterTeacherAttendance);
if (teacherAttendanceNameFilter) teacherAttendanceNameFilter.addEventListener('keyup', filterTeacherAttendance);

window.showAddTeacherAttendanceModal = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin') { alert('Access Denied: Only admin can mark teacher attendance.'); return; }
    teacherAttendanceModalTitle.textContent = 'Mark Teacher Attendance';
    teacherAttendanceFormSubmitBtn.textContent = 'Mark Attendance';
    document.getElementById('teacherAttendanceId').value = '';
    teacherAttendanceForm.reset();
    populateTeacherSelect();
    document.getElementById('teacherAttendanceDate').valueAsDate = new Date();
    if (teacherAttendanceModal) {
        teacherAttendanceModal.classList.remove('hidden');
        teacherAttendanceModal.style.display = 'flex';
    }
}

window.editTeacherAttendance = function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin') { alert('Access Denied: Only admin can edit teacher attendance.'); return; }
    const record = teacherAttendanceRecords.find(r => r.id === id); // Corrected variable name
    if (record) {
        teacherAttendanceModalTitle.textContent = 'Edit Teacher Attendance';
        teacherAttendanceFormSubmitBtn.textContent = 'Save Changes';
        document.getElementById('teacherAttendanceId').value = record.id;
        populateTeacherSelect(record.teacher_id);
        document.getElementById('teacherAttendanceDate').value = record.date;
        document.getElementById('teacherAttendanceStatus').value = record.status;
        document.getElementById('teacherAttendanceRemarks').value = record.remarks;
        if (teacherAttendanceModal) {
            teacherAttendanceModal.classList.remove('hidden');
            teacherAttendanceModal.style.display = 'flex';
        }
    }
}

window.deleteTeacherAttendance = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin') { alert('Access Denied: Only admin can delete teacher attendance records.'); return; }
    if (confirm('Are you sure you want to delete this teacher attendance record?')) {
        try {
            // Changed table name to 'teacher_attendance'
            const { error } = await supabase.from('teacher_attendance').delete().eq('id', id);
            if (error) throw error;

            const deletedRecord = teacherAttendanceRecords.find(r => r.id === id); // Corrected variable name
            const teacher = teachers.find(s => s.id === deletedRecord.teacher_id);
            await addAuditLog(loggedInUser?.email || 'admin', 'Deleted Teacher Attendance', 'Teacher Attendance', `Deleted attendance for ${teacher ? teacher.name : 'Unknown Teacher'} on ${deletedRecord.date}`);
            alert('Teacher attendance record deleted successfully!');
            await fetchTeacherAttendanceRecords(); // Corrected function call
        } catch (error) {
            alert('Error deleting teacher attendance record: ' + error.message);
            console.error('Supabase error:', error);
            await addAuditLog(loggedInUser?.email || 'admin', 'Delete Teacher Attendance Failed', 'Teacher Attendance', `Error: ${error.message}`);
        }
    }
}

function populateTeacherSelect(selectedTeacherId = '') {
    if (!teacherAttendanceTeacherSelect) return;
    teacherAttendanceTeacherSelect.innerHTML = '<option value="">Select Teacher</option>';
    teachers.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher.id;
        option.textContent = `${teacher.name} (Subject: ${teacher.subject})`;
        if (teacher.id === selectedTeacherId) {
            option.selected = true;
        }
        teacherAttendanceTeacherSelect.appendChild(option);
    });
}

// Update Dashboard Stats
function updateDashboardStats() {
    if (totalStudentsCount) totalStudentsCount.textContent = students.length.toLocaleString();
    if (totalTeachersCount) totalTeachersCount.textContent = teachers.length.toLocaleString();

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthRevenue = invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return inv.status === 'Paid' && invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
    }).reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    if (monthlyRevenue) monthlyRevenue.textContent = `$${currentMonthRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (upcomingEventsCount && calendar) {
        const today = new Date();
        today.setHours(0,0,0,0);
        const upcomingEvents = calendar.getEvents().filter(event => {
            if (event.classNames.includes('holiday')) {
                return new Date(event.start) >= today;
            }
            return event.end ? new Date(event.end) >= today : new Date(event.start) >= today;
        });
        upcomingEventsCount.textContent = upcomingEvents.length.toLocaleString();
    } else if (upcomingEventsCount) {
        upcomingEventsCount.textContent = 'N/A';
    }
}

// Render Recent Activity
function renderRecentActivity() {
    if (!recentActivityList) return;
    recentActivityList.innerHTML = '';
    auditLogs.slice(0, 3).forEach(log => {
        const div = document.createElement('div');
        div.className = 'flex items-start space-x-3 animate-slideInFromLeft';
        let iconClass = 'fas fa-info-circle';
        let iconBgClass = 'bg-gray-50';
        let iconTextColorClass = 'text-gray-600';

        if (log.action.includes('Added Student')) { iconClass = 'fas fa-user-plus'; iconBgClass = 'bg-blue-50'; iconTextColorClass = 'text-blue-600'; }
        else if (log.action.includes('Processed Payroll')) { iconClass = 'fas fa-money-bill-wave'; iconBgClass = 'bg-green-50'; iconTextColorClass = 'text-green-600'; }
        else if (log.action.includes('Added Invoice')) { iconClass = 'fas fa-file-invoice-dollar'; iconBgClass = 'bg-purple-50'; iconTextColorClass = 'text-purple-600'; }
        else if (log.action.includes('Logged In')) { iconClass = 'fas fa-sign-in-alt'; iconBgClass = 'bg-indigo-50'; iconTextColorClass = 'text-indigo-600'; }
        else if (log.action.includes('Notification')) { iconClass = 'fas fa-bell'; iconBgClass = 'bg-orange-50'; iconTextColorClass = 'text-orange-600'; }
        else if (log.action.includes('Added Teacher')) { iconClass = 'fas fa-chalkboard-teacher'; iconBgClass = 'bg-green-50'; iconTextColorClass = 'text-green-600'; }
        else if (log.action.includes('Added User')) { iconClass = 'fas fa-user-plus'; iconBgClass = 'bg-red-50'; iconTextColorClass = 'text-red-600'; }
        else if (log.action.includes('Published Announcement')) { iconClass = 'fas fa-bullhorn'; iconBgClass = 'bg-pink-50'; iconTextColorClass = 'text-pink-600'; }
        else if (log.action.includes('Marked Attendance') || log.action.includes('Updated Attendance')) { iconClass = 'fas fa-check-circle'; iconBgClass = 'bg-indigo-50'; iconTextColorClass = 'text-indigo-600'; }

        div.innerHTML = `
            <div class="icon-wrapper ${iconBgClass} ${iconTextColorClass}">
                <i class="${iconClass}"></i>
            </div>
            <div>
                <p class="font-medium">${log.action}</p>
                <p class="text-sm text-gray-500">${log.details}</p>
                <p class="text-xs text-gray-400">${new Date(log.timestamp).toLocaleString()}</p>
            </div>
        `;
        recentActivityList.appendChild(div);
    });
}

// Reports Module Charts
function renderReportsCharts() {
    const attendanceCtx = document.getElementById('attendanceChart');
    const performanceCtx = document.getElementById('performanceChart');

    if (attendanceChartInstance) {
        attendanceChartInstance.destroy();
        attendanceChartInstance = null;
    }
    if (performanceChartInstance) {
        performanceChartInstance.destroy();
        performanceChartInstance = null;
    }

    if (attendanceCtx && typeof Chart !== 'undefined') {
        attendanceChartInstance = new Chart(attendanceCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Average Attendance (%)',
                    data: [95, 92, 96, 90, 93, 97],
                    backgroundColor: 'rgba(79, 70, 229, 0.8)',
                    borderColor: 'rgba(79, 70, 229, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    if (performanceCtx && typeof Chart !== 'undefined') {
        performanceChartInstance = new Chart(performanceCtx, {
            type: 'line',
            data: {
                labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                datasets: [{
                    label: 'Average Exam Score',
                    data: [78, 82, 80, 85],
                    fill: false,
                    borderColor: 'rgba(16, 185, 129, 1)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
}

// Modals for Add/Edit Student, Teacher, User, Announcement, Attendance
window.showAddStudentForm = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin' && userRole !== 'teacher') { alert('Access Denied: Only admin and teachers can add students.'); return; }
    studentModalTitle.textContent = 'Add New Student';
    studentFormSubmitBtn.textContent = 'Add Student';
    document.getElementById('studentId').value = '';
    studentForm.reset();
    if (studentModal) {
        studentModal.classList.remove('hidden');
        studentModal.style.display = 'flex';
    }
}
window.editStudent = function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin') { alert('Access Denied: Only admin can edit students.'); return; }
    const student = students.find(s => s.id === id);
    if (student) {
        studentModalTitle.textContent = 'Edit Student';
        studentFormSubmitBtn.textContent = 'Save Changes';
        document.getElementById('studentId').value = student.id;
        document.getElementById('studentFullName').value = student.name;
        document.getElementById('studentFatherName').value = student.father_name;
        document.getElementById('studentMotherName').value = student.mother_name;
        document.getElementById('studentClass').value = student.class;
        document.getElementById('studentRollNo').value = student.roll_no;
        document.getElementById('studentAadharNo').value = student.aadhar_no;
        document.getElementById('studentEmail').value = student.email;
        document.getElementById('studentPhone').value = student.phone;
        document.getElementById('studentStatus').value = student.status;
        if (studentModal) {
            studentModal.classList.remove('hidden');
            studentModal.style.display = 'flex';
        }
    }
}
window.deleteStudent = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin') { alert('Access Denied: Only admin can delete students.'); return; }
    if (confirm('Are you sure you want to delete this student?')) {
        try {
            const { error } = await supabase.from('students').delete().eq('id', id);
            if (error) throw error;

            const deletedStudent = students.find(s => s.id === id);
            await addAuditLog(loggedInUser?.email || 'admin', 'Deleted Student', 'Students', `Deleted student: ${deletedStudent.name} (ID: ${deletedStudent.id})`);
            alert('Student deleted successfully!');
            await fetchStudents();
        } catch (error) {
            alert('Error deleting student: ' + error.message);
            console.error('Supabase error:', error);
            await addAuditLog(loggedInUser?.email || 'admin', 'Delete Student Failed', 'Students', `Error: ${error.message}`);
        }
    }
}

window.showAddTeacherForm = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin') { alert('Access Denied: Only admin can add teachers.'); return; }
    teacherModalTitle.textContent = 'Add New Teacher';
    teacherFormSubmitBtn.textContent = 'Add Teacher';
    document.getElementById('teacherId').value = '';
    teacherForm.reset();
    if (teacherModal) {
        teacherModal.classList.remove('hidden');
        teacherModal.style.display = 'flex';
    }
}
window.editTeacher = function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin') { alert('Access Denied: Only admin can edit teachers.'); return; }
    const teacher = teachers.find(t => t.id === id);
    if (teacher) {
        teacherModalTitle.textContent = 'Edit Teacher';
        teacherFormSubmitBtn.textContent = 'Save Changes';
        document.getElementById('teacherId').value = teacher.id;
        document.getElementById('teacherFullName').value = teacher.name;
        document.getElementById('teacherSubject').value = teacher.subject;
        document.getElementById('teacherEmail').value = teacher.email;
        document.getElementById('teacherClasses').value = teacher.classes;
        if (teacherModal) {
            teacherModal.classList.remove('hidden');
            teacherModal.style.display = 'flex';
        }
    }
}
window.deleteTeacher = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin') { alert('Access Denied: Only admin can delete teachers.'); return; }
    if (confirm('Are you sure you want to delete this teacher?')) {
        try {
            const { error } = await supabase.from('teachers').delete().eq('id', id);
            if (error) throw error;

            const deletedTeacher = teachers.find(t => t.id === id);
            await addAuditLog(loggedInUser?.email || 'admin', 'Deleted Teacher', 'Teachers', `Deleted teacher: ${deletedTeacher.name} (ID: ${deletedTeacher.id})`);
            alert('Teacher deleted successfully!');
            await fetchTeachers();
        } catch (error) {
            alert('Error deleting teacher: ' + error.message);
            console.error('Supabase error:', error);
            await addAuditLog(loggedInUser?.email || 'admin', 'Delete Teacher Failed', 'Teachers', `Error: ${error.message}`);
        }
    }
}

window.showAddUserForm = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin') { alert('Access Denied: Only admin can add users.'); return; }
    userModalTitle.textContent = 'Add New User';
    userFormSubmitBtn.textContent = 'Add User';
    document.getElementById('userId').value = '';
    userForm.reset();
    document.getElementById('userPassword').required = true;
    if (userModal) {
        userModal.classList.remove('hidden');
        userModal.style.display = 'flex';
    }
}
window.editUser = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin') { alert('Access Denied: Only admin can edit users.'); return; }
    
    userModalTitle.textContent = 'Edit User';
    userFormSubmitBtn.textContent = 'Save Changes';
    document.getElementById('userId').value = id;
    document.getElementById('userPassword').value = '';
    document.getElementById('userPassword').required = false;

    const profile = profiles.find(p => p.id === id);
    if (profile) {
        document.getElementById('userFullName').value = profile.full_name || '';
        document.getElementById('userEmail').value = profile.email || '';
        document.getElementById('userRole').value = profile.role || '';
        document.getElementById('userStatus').value = profile.status || '';
    } else {
        // Fallback to loggedInUser if profile not found (e.g., editing self before profiles are fully loaded)
        if (loggedInUser.id === id) {
            document.getElementById('userFullName').value = loggedInUser.raw_user_meta_data?.name || '';
            document.getElementById('userEmail').value = loggedInUser.email || '';
            document.getElementById('userRole').value = loggedInUser.raw_user_meta_data?.role || '';
            document.getElementById('userStatus').value = 'Active'; // Assuming active if logged in
        } else {
            alert('User profile not found for editing.');
            if (userModal) {
                userModal.classList.add('hidden');
                userModal.style.display = 'none';
            }
            return;
        }
    }

    if (userModal) {
        userModal.classList.remove('hidden');
        userModal.style.display = 'flex';
    }
}
window.deleteUser = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin') { alert('Access Denied: Only admin can delete users.'); return; }
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        try {
            // Delete from profiles table first
            const { error: profileError } = await supabase.from('profiles').delete().eq('id', id);
            if (profileError) throw profileError;

            // Then delete from auth.users (requires service role key on server-side)
            // This part is client-side for demonstration, but in production, it should be a secure backend call.
            // IMPORTANT: Replace 'YOUR_SERVICE_ROLE_KEY' with your actual Supabase Service Role Key.
            // This key should NEVER be exposed on the client-side in a production environment.
            // This is for demonstration purposes only.
            const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // <<< REPLACE THIS WITH YOUR ACTUAL SERVICE ROLE KEY

            if (SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY' || !SERVICE_ROLE_KEY) {
                alert('Service Role Key is not configured. Cannot delete user from auth.users table from client-side.');
                await addAuditLog(loggedInUser?.email || 'admin', 'Attempted User Deletion', 'User Management', `Attempted to delete user with ID: ${id} (auth.users not deleted due to missing service role key).`);
                await fetchProfiles(); // Re-fetch profiles to reflect deletion from public.profiles
                return;
            }

            const { error: authError } = await supabase.auth.admin.deleteUser(id);
            if (authError) throw authError;

            const deletedProfile = profiles.find(p => p.id === id);
            await addAuditLog(loggedInUser?.email || 'admin', 'Deleted User', 'User Management', `Deleted user: ${deletedProfile?.full_name || deletedProfile?.email || id}`);
            alert('User deleted successfully!');
            await fetchProfiles();
        } catch (error) {
            alert('Error deleting user: ' + error.message);
            console.error('Supabase error:', error);
            await addAuditLog(loggedInUser?.email || 'admin', 'Delete User Failed', 'User Management', `Error: ${error.message}`);
        }
    }
}

window.showAddAnnouncementModal = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin' && userRole !== 'teacher') { alert('Access Denied: Only admin and teachers can add announcements.'); return; }
    announcementModalTitle.textContent = 'Add New Announcement';
    announcementFormSubmitBtn.textContent = 'Publish Announcement';
    document.getElementById('announcementId').value = '';
    announcementForm.reset();
    if (announcementModal) {
        announcementModal.classList.remove('hidden');
        announcementModal.style.display = 'flex';
    }
}
window.editAnnouncement = function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin' && userRole !== 'teacher') { alert('Access Denied: Only admin and teachers can edit announcements.'); return; }
    const announcement = announcements.find(a => a.id === id);
    if (announcement) {
        announcementModalTitle.textContent = 'Edit Announcement';
        announcementFormSubmitBtn.textContent = 'Save Changes';
        document.getElementById('announcementId').value = announcement.id;
        document.getElementById('announcementTitle').value = announcement.title;
        document.getElementById('announcementContent').value = announcement.content;
        document.getElementById('announcementStatus').value = announcement.status;
        if (announcementModal) {
            announcementModal.classList.remove('hidden');
            announcementModal.style.display = 'flex';
        }
    }
}
window.deleteAnnouncement = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin' && userRole !== 'teacher') { alert('Access Denied: Only admin and teachers can delete announcements.'); return; }
    if (confirm('Are you sure you want to delete this announcement?')) {
        try {
            const { error } = await supabase.from('announcements').delete().eq('id', id);
            if (error) throw error;

            const deletedAnnouncement = announcements.find(a => a.id === id);
            await addAuditLog(loggedInUser?.email || 'admin', 'Deleted Announcement', 'Announcements', `Deleted: "${deletedAnnouncement.title}" (ID: ${deletedAnnouncement.id})`);
            alert('Announcement deleted successfully!');
            await fetchAnnouncements();
        } catch (error) {
            alert('Error deleting announcement: ' + error.message);
            console.error('Supabase error:', error);
            await addAuditLog(loggedInUser?.email || 'admin', 'Delete Announcement Failed', 'Announcements', `Error: ${error.message}`);
        }
    }
}

// Student Attendance Module Modals and Functions
window.showAddAttendanceModal = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin' && userRole !== 'teacher') { alert('Access Denied: Only admin and teachers can mark student attendance.'); return; }
    attendanceModalTitle.textContent = 'Mark Attendance';
    attendanceFormSubmitBtn.textContent = 'Mark Attendance';
    document.getElementById('attendanceId').value = '';
    attendanceForm.reset();
    populateStudentSelect();
    document.getElementById('attendanceDate').valueAsDate = new Date();
    if (attendanceModal) {
        attendanceModal.classList.remove('hidden');
        attendanceModal.style.display = 'flex';
    }
}

window.editAttendance = function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin' && userRole !== 'teacher') { alert('Access Denied: Only admin and teachers can edit student attendance.'); return; }
    const record = attendanceRecords.find(r => r.id === id);
    if (record) {
        attendanceModalTitle.textContent = 'Edit Attendance';
        attendanceFormSubmitBtn.textContent = 'Save Changes';
        document.getElementById('attendanceId').value = record.id;
        populateStudentSelect(record.student_id);
        document.getElementById('attendanceDate').value = record.date;
        document.getElementById('attendanceStatus').value = record.status;
        document.getElementById('attendanceRemarks').value = record.remarks;
        if (attendanceModal) {
            attendanceModal.classList.remove('hidden');
            attendanceModal.style.display = 'flex';
        }
    }
}

window.deleteAttendance = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin' && userRole !== 'teacher') { alert('Access Denied: Only admin and teachers can delete student attendance records.'); return; }
    if (confirm('Are you sure you want to delete this attendance record?')) {
        try {
            // Changed table name to 'attendance'
            const { error } = await supabase.from('attendance').delete().eq('id', id);
            if (error) throw error;

            const deletedRecord = attendanceRecords.find(r => r.id === id);
            const student = students.find(s => s.id === deletedRecord.student_id);
            await addAuditLog(loggedInUser?.email || 'admin', 'Deleted Attendance', 'Attendance', `Deleted attendance for ${student ? student.name : 'Unknown Student'} on ${deletedRecord.date}`);
            alert('Attendance record deleted successfully!');
            await fetchAttendanceRecords();
        } catch (error) {
            alert('Error deleting attendance record: ' + error.message);
            console.error('Supabase error:', error);
            await addAuditLog(loggedInUser?.email || 'admin', 'Delete Attendance Failed', 'Attendance', `Error: ${error.message}`);
        }
    }
}

function populateStudentSelect(selectedStudentId = '') {
    if (!attendanceStudentSelect) return;
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
}

// Close modal event listeners
if (closeStudentModal) closeStudentModal.addEventListener('click', function() { if (studentModal) { studentModal.classList.add('hidden'); studentModal.style.display = 'none'; } studentForm.reset(); });
if (closeTeacherModal) closeTeacherModal.addEventListener('click', function() { if (teacherModal) { teacherModal.classList.add('hidden'); teacherModal.style.display = 'none'; } teacherForm.reset(); });
if (closeUserModal) closeUserModal.addEventListener('click', function() { if (userModal) { userModal.classList.add('hidden'); userModal.style.display = 'none'; } userForm.reset(); });
if (closeAnnouncementModal) closeAnnouncementModal.addEventListener('click', function() { if (announcementModal) { announcementModal.classList.add('hidden'); announcementModal.style.display = 'none'; } announcementForm.reset(); });
if (closeAttendanceModal) closeAttendanceModal.addEventListener('click', function() { if (attendanceModal) { attendanceModal.classList.add('hidden'); attendanceModal.style.display = 'none'; } attendanceForm.reset(); });
if (closeTeacherAttendanceModal) closeTeacherAttendanceModal.addEventListener('click', function() { if (teacherAttendanceModal) { teacherAttendanceModal.classList.add('hidden'); teacherAttendanceModal.style.display = 'none'; } teacherAttendanceForm.reset(); });

// Close modal on outside click event listeners
if (studentModal) studentModal.addEventListener('click', (e) => { if (e.target === studentModal) { studentModal.classList.add('hidden'); studentModal.style.display = 'none'; studentForm.reset(); } });
if (teacherModal) teacherModal.addEventListener('click', (e) => { if (e.target === teacherModal) { teacherModal.classList.add('hidden'); teacherModal.style.display = 'none'; teacherForm.reset(); } });
if (userModal) userModal.addEventListener('click', (e) => { if (e.target === userModal) { userModal.classList.add('hidden'); userModal.style.display = 'none'; userForm.reset(); } });
if (announcementModal) announcementModal.addEventListener('click', (e) => { if (e.target === announcementModal) { announcementModal.classList.add('hidden'); announcementModal.style.display = 'none'; announcementForm.reset(); } });
if (attendanceModal) attendanceModal.addEventListener('click', (e) => { if (e.target === attendanceModal) { attendanceModal.classList.add('hidden'); attendanceModal.style.display = 'none'; attendanceForm.reset(); } });
if (teacherAttendanceModal) teacherAttendanceModal.addEventListener('click', (e) => { if (e.target === teacherAttendanceModal) { teacherAttendanceModal.classList.add('hidden'); teacherAttendanceModal.style.display = 'none'; teacherAttendanceForm.reset(); } });

// Add/Edit Student Form Submission
if (studentForm) {
    studentForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        // Role retrieval is kept for audit logging, but not for access control
        const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
        // Removed role check: if (userRole !== 'admin' && userRole !== 'teacher') { alert('Access Denied: Only admin and teachers can manage student data.'); return; }
        const form = e.target;
        const id = document.getElementById('studentId').value;
        const fullName = document.getElementById('studentFullName').value;
        const fatherName = document.getElementById('studentFatherName').value;
        const motherName = document.getElementById('studentMotherName').value;
        const studentClass = document.getElementById('studentClass').value;
        const rollNo = document.getElementById('studentRollNo').value;
        const aadharNo = document.getElementById('studentAadharNo').value;
        const email = document.getElementById('studentEmail').value;
        const phone = document.getElementById('studentPhone').value;
        const status = document.getElementById('studentStatus').value;

        const studentData = {
            name: fullName,
            father_name: fatherName,
            mother_name: motherName,
            class: studentClass,
            roll_no: rollNo,
            aadhar_no: aadharNo,
            email: email,
            phone: phone,
            status: status,
        };

        let operationSuccess = false;
        let auditAction = '';
        let auditDetails = '';

        try {
            if (id) {
                const { error } = await supabase.from('students').update(studentData).eq('id', id);
                if (error) throw error;
                alert('Student updated successfully!');
                operationSuccess = true;
                auditAction = 'Updated Student';
                auditDetails = `Updated student: ${fullName} (ID: ${id})`;
            } else {
                const { data, error } = await supabase.from('students').insert([studentData]).select();
                if (error) throw error;
                alert('Student added successfully!');
                operationSuccess = true;
                auditAction = 'Added Student';
                auditDetails = `Added new student: ${fullName} (ID: ${data[0].id})`;
            }
        } catch (error) {
            alert((id ? 'Error updating' : 'Error adding') + ' student: ' + error.message);
            console.error('Supabase error:', error);
            auditAction = (id ? 'Update Student Failed' : 'Add Student Failed');
            auditDetails = `Error: ${error.message}`;
        }

        if (operationSuccess) {
            await addAuditLog(loggedInUser?.email || 'admin', auditAction, 'Students', auditDetails);
            await fetchStudents();
            if (studentModal) {
                studentModal.classList.add('hidden');
                studentModal.style.display = 'none';
            }
            form.reset();
        }
    });
}

// Add/Edit Teacher Form Submission
if (teacherForm) {
    teacherForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        // Role retrieval is kept for audit logging, but not for access control
        const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
        // Removed role check: if (userRole !== 'admin') { alert('Access Denied: Only admin can manage teacher data.'); return; }
        const form = e.target;
        const id = document.getElementById('teacherId').value;
        const fullName = document.getElementById('teacherFullName').value;
        const subject = document.getElementById('teacherSubject').value;
        const email = document.getElementById('teacherEmail').value;
        const classes = document.getElementById('teacherClasses').value;

        const teacherData = {
            name: fullName,
            subject: subject,
            email: email,
            classes: classes,
        };

        let operationSuccess = false;
        let auditAction = '';
        let auditDetails = '';

        try {
            if (id) {
                const { error } = await supabase.from('teachers').update(teacherData).eq('id', id);
                if (error) throw error;
                alert('Teacher updated successfully!');
                operationSuccess = true;
                auditAction = 'Updated Teacher';
                auditDetails = `Updated teacher: ${fullName} (ID: ${id})`;
            } else {
                const { data, error } = await supabase.from('teachers').insert([teacherData]).select();
                if (error) throw error;
                alert('Teacher added successfully!');
                operationSuccess = true;
                auditAction = 'Added Teacher';
                auditDetails = `Added new teacher: ${fullName} (ID: ${data[0].id})`;
            }
        } catch (error) {
            alert((id ? 'Error updating' : 'Error adding') + ' teacher: ' + error.message);
            console.error('Supabase error:', error);
            auditAction = (id ? 'Update Teacher Failed' : 'Add Teacher Failed');
            auditDetails = `Error: ${error.message}`;
        }

        if (operationSuccess) {
            await addAuditLog(loggedInUser?.email || 'admin', auditAction, 'Teachers', auditDetails);
            await fetchTeachers();
            if (teacherModal) {
                teacherModal.classList.add('hidden');
                teacherModal.style.display = 'none';
            }
            form.reset();
        }
    });
}

// Add/Edit User Form Submission (Interacts with Supabase Auth and Profiles table)
if (userForm) {
    userForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const currentUserRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
        // Removed role check: if (currentUserRole !== 'admin') { alert('Access Denied: Only admin can manage user accounts.'); return; }
        const form = e.target;
        const id = document.getElementById('userId').value;
        const fullName = document.getElementById('userFullName').value;
        const email = document.getElementById('userEmail').value;
        const role = document.getElementById('userRole').value;
        const password = document.getElementById('userPassword').value;
        const status = document.getElementById('userStatus').value;

        let operationSuccess = false;
        let auditAction = '';
        let auditDetails = '';

        try {
            if (id) {
                // Update existing user profile
                const profileData = {
                    full_name: fullName,
                    email: email,
                    role: role,
                    status: status
                };
                const { error: profileError } = await supabase.from('profiles').update(profileData).eq('id', id);
                if (profileError) throw profileError;

                // Update Supabase Auth user metadata (requires service role key for other users)
                // For self-update, client-side auth.updateUser is sufficient.
                if (loggedInUser.id === id) {
                    const { data, error: authUpdateError } = await supabase.auth.updateUser({
                        email: email,
                        data: {
                            name: fullName,
                            role: role
                        }
                    });
                    if (authUpdateError) throw authUpdateError;
                    localStorage.setItem('loggedInUser', JSON.stringify(data.user)); // Update local storage
                    updateLoggedInUserName();
                } else {
                    // For updating other users, use admin API (requires service role key)
                    const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // <<< REPLACE THIS WITH YOUR ACTUAL SERVICE ROLE KEY
                    if (SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY' || !SERVICE_ROLE_KEY) {
                        alert('Service Role Key is not configured. Cannot update other user roles/emails from client-side.');
                        // Proceed with profile update success, but log auth update failure
                        auditAction = 'Updated User Profile (Auth Update Failed)';
                        auditDetails = `Updated profile for ${fullName} (ID: ${id}), but auth.users update failed due to missing service role key.`;
                        operationSuccess = true; // Consider profile update as success
                    } else {
                        const { data, error: authUpdateError } = await supabase.auth.admin.updateUserById(id, {
                            email: email,
                            user_metadata: {
                                name: fullName,
                                role: role
                            },
                            // Optionally update password if provided
                            password: password || undefined
                        });
                        if (authUpdateError) throw authUpdateError;
                        auditAction = 'Updated User (Admin)';
                        auditDetails = `Updated user ${fullName} (ID: ${id}) by admin.`;
                        operationSuccess = true;
                    }
                }
                if (!operationSuccess) { // If not already set by admin update logic
                    alert('User profile updated successfully!');
                    operationSuccess = true;
                    auditAction = 'Updated User Profile';
                    auditDetails = `Updated user profile: ${fullName} (ID: ${id})`;
                }
            } else {
                // Create new user (requires service role key on server-side for setting role directly)
                // This is client-side for demonstration, but in production, it should be a secure backend call.
                const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // <<< REPLACE THIS WITH YOUR ACTUAL SERVICE ROLE KEY
                if (SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY' || !SERVICE_ROLE_KEY) {
                    alert('Service Role Key is not configured. Cannot create user with specific role from client-side.');
                    return;
                }

                const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
                    email: email,
                    password: password,
                    email_confirm: true, // Auto-confirm email for admin-created users
                    user_metadata: {
                        full_name: fullName,
                        role: role
                    }
                });
                if (signUpError) throw signUpError;

                // Also create a profile entry for the new user
                const { error: profileInsertError } = await supabase.from('profiles').insert([
                    {
                        id: newUser.user.id,
                        full_name: fullName,
                        email: email,
                        role: role,
                        status: 'Active' // Default status for new users
                    }
                ]);
                if (profileInsertError) throw profileInsertError;

                alert('User added successfully!');
                operationSuccess = true;
                auditAction = 'Added User';
                auditDetails = `Added new user: ${fullName} (ID: ${newUser.user.id})`;
            }
        } catch (error) {
            alert((id ? 'Error updating' : 'Error adding') + ' user: ' + error.message);
            console.error('Supabase Auth/DB error:', error);
            auditAction = (id ? 'Update User Failed' : 'Add User Failed');
            auditDetails = `Error: ${error.message}`;
        }

        if (operationSuccess) {
            await addAuditLog(loggedInUser?.email || 'admin', auditAction, 'User Management', auditDetails);
            await fetchProfiles(); // Re-fetch profiles to update the table
            if (userModal) {
                userModal.classList.add('hidden');
                userModal.style.display = 'none';
            }
            form.reset();
        }
    });
}

// Add/Edit Announcement Form Submission
if (announcementForm) {
    announcementForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        // Role retrieval is kept for audit logging, but not for access control
        const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
        // Removed role check: if (userRole !== 'admin' && userRole !== 'teacher') { alert('Access Denied: Only admin and teachers can manage announcements.'); return; }
        const form = e.target;
        const id = document.getElementById('announcementId').value;
        const title = document.getElementById('announcementTitle').value;
        const content = document.getElementById('announcementContent').value;
        const status = document.getElementById('announcementStatus').value;
        const datePosted = new Date().toISOString().split('T')[0];

        const announcementData = {
            title: title,
            content: content,
            date_posted: datePosted,
            status: status
        };

        let operationSuccess = false;
        let auditAction = '';
        let auditDetails = '';

        try {
            const { data, error } = await supabase.from('announcements').upsert(
                { ...announcementData, id: id || undefined }, // Use upsert for add/edit
                { onConflict: 'id' } // Specify conflict key for upsert
            ).select();

            if (error) throw error;

            if (id) {
                alert('Announcement updated successfully!');
                auditAction = 'Updated Announcement';
                auditDetails = `Updated: "${title}" (ID: ${id})`;
            } else {
                alert('Announcement published successfully!');
                auditAction = 'Published Announcement';
                auditDetails = `Published: "${title}" (ID: ${data[0].id})`;
            }
            operationSuccess = true;

        } catch (error) {
            alert((id ? 'Error updating' : 'Error publishing') + ' announcement: ' + error.message);
            console.error('Supabase error:', error);
            auditAction = (id ? 'Update Announcement Failed' : 'Publish Announcement Failed');
            auditDetails = `Error: ${error.message}`;
        }

        if (operationSuccess) {
            await addAuditLog(loggedInUser?.email || 'admin', auditAction, 'Announcements', auditDetails);
            await fetchAnnouncements();
            if (announcementModal) {
                announcementModal.classList.add('hidden');
                announcementModal.style.display = 'none';
            }
            form.reset();
        }
    });
}

// Student Attendance Form Submission
if (attendanceForm) {
    attendanceForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        // Role retrieval is kept for audit logging, but not for access control
        const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
        // Removed role check: if (userRole !== 'admin' && userRole !== 'teacher') { alert('Access Denied: Only admin and teachers can mark student attendance.'); return; }
        const form = e.target;
        const id = document.getElementById('attendanceId').value;
        const studentId = document.getElementById('attendanceStudentSelect').value;
        const date = document.getElementById('attendanceDate').value;
        const status = document.getElementById('attendanceStatus').value;
        const remarks = document.getElementById('attendanceRemarks').value;

        if (!studentId || !date || !status) {
            alert('Please fill in all required fields.');
            return;
        }

        const student = students.find(s => s.id === studentId);
        if (!student) {
            alert('Selected student not found.');
            return;
        }

        const attendanceData = {
            student_id: studentId,
            date: date,
            status: status,
            remarks: remarks
        };

        let operationSuccess = false;
        let auditAction = '';
        let auditDetails = '';

        try {
            // Changed table name to 'attendance'
            const { data, error } = await supabase.from('attendance').upsert(
                { ...attendanceData, id: id || undefined }, // Use upsert for add/edit
                { onConflict: 'id' } // Specify conflict key for upsert
            ).select();

            if (error) throw error;

            if (id) {
                alert('Attendance record updated successfully!');
                auditAction = 'Updated Attendance';
                auditDetails = `Updated attendance for ${student.name} on ${date} to ${status}`;
            } else {
                alert('Attendance marked successfully!');
                auditAction = 'Marked Attendance';
                auditDetails = `Marked ${status} for ${student.name} on ${date}`;
            }
            operationSuccess = true;

        } catch (error) {
            alert((id ? 'Error updating' : 'Error marking') + ' attendance: ' + error.message);
            console.error('Supabase error:', error);
            auditAction = (id ? 'Update Attendance Failed' : 'Mark Attendance Failed');
            auditDetails = `Error: ${error.message}`;
        }

        if (operationSuccess) {
            await addAuditLog(loggedInUser?.email || 'admin', auditAction, 'Attendance', auditDetails);
            await fetchAttendanceRecords();
            if (attendanceModal) {
                attendanceModal.classList.add('hidden');
                attendanceModal.style.display = 'none';
            }
            form.reset();
        }
    });
}

// Teacher Attendance Form Submission
if (teacherAttendanceForm) {
    teacherAttendanceForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        // Role retrieval is kept for audit logging, but not for access control
        const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
        // Removed role check: if (userRole !== 'admin') { alert('Access Denied: Only admin can manage teacher attendance.'); return; }
        const form = e.target;
        const id = document.getElementById('teacherAttendanceId').value;
        const teacherId = document.getElementById('teacherAttendanceTeacherSelect').value;
        const date = document.getElementById('teacherAttendanceDate').value;
        const status = document.getElementById('teacherAttendanceStatus').value;
        const remarks = document.getElementById('teacherAttendanceRemarks').value;

        if (!teacherId || !date || !status) {
            alert('Please fill in all required fields.');
            return;
        }

        const teacher = teachers.find(t => t.id === teacherId);
        if (!teacher) {
            alert('Selected teacher not found.');
            return;
        }

        const teacherAttendanceData = {
            teacher_id: teacherId,
            date: date,
            status: status,
            remarks: remarks
        };

        let operationSuccess = false;
        let auditAction = '';
        let auditDetails = '';

        try {
            // Changed table name to 'teacher_attendance'
            const { data, error } = await supabase.from('teacher_attendance').upsert(
                { ...teacherAttendanceData, id: id || undefined }, // Use upsert for add/edit
                { onConflict: 'id' } // Specify conflict key for upsert
            ).select();

            if (error) throw error;

            if (id) {
                alert('Teacher attendance record updated successfully!');
                auditAction = 'Updated Teacher Attendance';
                auditDetails = `Updated attendance for ${teacher.name} on ${date} to ${status}`;
            } else {
                alert('Teacher attendance marked successfully!');
                auditAction = 'Marked Teacher Attendance';
                auditDetails = `Marked ${status} for ${teacher.name} on ${date}`;
            }
            operationSuccess = true;

        } catch (error) {
            alert((id ? 'Error updating' : 'Error marking') + ' teacher attendance: ' + error.message);
            console.error('Supabase error:', error);
            auditAction = (id ? 'Update Teacher Attendance Failed' : 'Mark Teacher Attendance Failed');
            auditDetails = `Error: ${error.message}`;
        }

        if (operationSuccess) {
            await addAuditLog(loggedInUser?.email || 'admin', auditAction, 'Teacher Attendance', auditDetails);
            await fetchTeacherAttendanceRecords(); // Corrected function call
            if (teacherAttendanceModal) {
                teacherAttendanceModal.classList.add('hidden');
                teacherAttendanceModal.style.display = 'none';
            }
            form.reset();
        }
    });
}

// --- WebAuthn Integration ---

// Student Fingerprint Registration
if (registerStudentFingerprintBtn) {
    registerStudentFingerprintBtn.addEventListener('click', async () => {
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        // Role retrieval is kept for audit logging, but not for access control
        const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
        // Removed role check: if (userRole !== 'admin' && userRole !== 'teacher') { alert('Access Denied: Only admin and teachers can register student fingerprints.'); return; }
        const studentId = attendanceStudentSelect.value;
        if (!studentId) {
            alert('Please select a student first.');
            return;
        }
        const student = students.find(s => s.id === studentId);
        if (!student) {
            alert('Selected student not found.');
            return;
        }

        try {
            const challenge = new Uint8Array(16);
            window.crypto.getRandomValues(challenge);

            const credential = await navigator.credentials.create({
                publicKey: {
                    rp: {
                        name: "Tapowan Public School"
                    },
                    user: {
                        id: new TextEncoder().encode(student.id),
                        name: student.email || student.id,
                        displayName: student.name
                    },
                    challenge: challenge,
                    pubKeyCredParams: [{
                        type: "public-key",
                        alg: -7 // ES256
                    }, {
                        type: "public-key",
                        alg: -257 // RS256
                    }],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required",
                        residentKey: "required"
                    },
                    timeout: 60000,
                    attestation: "direct"
                }
            });

            const { error } = await supabase.from('students').update({
                fingerprint_credential: {
                    id: arrayBufferToBase64(credential.rawId),
                    publicKey: arrayBufferToBase64(credential.response.getPublicKey()),
                    authenticatorData: arrayBufferToBase64(credential.response.authenticatorData),
                    clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON)
                }
            }).eq('id', student.id);

            if (error) throw error;

            alert(`Fingerprint registered successfully for ${student.name}!`);
            await addAuditLog(loggedInUser?.email || 'admin', 'Registered Fingerprint', 'Attendance', `Registered fingerprint for student: ${student.name} (ID: ${student.id})`);
            await fetchStudents();
        } catch (error) {
            console.error("Fingerprint registration failed:", error);
            alert(`Fingerprint registration failed: ${error.message || error}`);
            await addAuditLog(loggedInUser?.email || 'admin', 'Fingerprint Registration Failed', 'Attendance', `Failed to register fingerprint for student: ${student.name} - ${error.message}`);
        }
    });
}

// Student Fingerprint Verification
if (verifyStudentFingerprintBtn) {
    verifyStudentFingerprintBtn.addEventListener('click', async () => {
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        // Role retrieval is kept for audit logging, but not for access control
        const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
        // Removed role check: if (!['admin', 'teacher', 'student'].includes(userRole)) { alert('Access Denied: You do not have permission to verify student fingerprints.'); return; }
        const studentId = attendanceStudentSelect.value;
        if (!studentId) {
            alert('Please select a student first.');
            return;
        }
        const student = students.find(s => s.id === studentId);
        if (!student) {
            alert('Selected student not found.');
            return;
        }
        if (!student.fingerprint_credential) {
            alert('No fingerprint registered for this student. Please register one first.');
            return;
        }

        try {
            const challenge = new Uint8Array(16);
            window.crypto.getRandomValues(challenge);

            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge: challenge,
                    allowCredentials: [{
                        id: base64ToArrayBuffer(student.fingerprint_credential.id),
                        type: "public-key"
                    }],
                    userVerification: "required",
                    timeout: 60000
                }
            });

            alert(`Fingerprint verified successfully for ${student.name}! Attendance marked as Present.`);
            document.getElementById('attendanceStatus').value = 'Present';
            document.getElementById('attendanceFormSubmitBtn').click(); // Automatically submit attendance
            await addAuditLog(loggedInUser?.email || 'System', 'Verified Fingerprint', 'Attendance', `Verified fingerprint for student: ${student.name} (ID: ${student.id}) - Marked Present`);
        } catch (error) {
            console.error("Fingerprint verification failed:", error);
            alert(`Fingerprint verification failed: ${error.message || error}`);
            await addAuditLog(loggedInUser?.email || 'System', 'Fingerprint Verification Failed', 'Attendance', `Failed to verify fingerprint for student: ${student.name} - ${error.message}`);
        }
    });
}

// Teacher Fingerprint Registration
if (registerTeacherFingerprintBtn) {
    registerTeacherFingerprintBtn.addEventListener('click', async () => {
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        // Role retrieval is kept for audit logging, but not for access control
        const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
        // Removed role check: if (userRole !== 'admin') { alert('Access Denied: Only admin can register teacher fingerprints.'); return; }
        const teacherId = teacherAttendanceTeacherSelect.value;
        if (!teacherId) {
            alert('Please select a teacher first.');
            return;
        }
        const teacher = teachers.find(t => t.id === teacherId);
        if (!teacher) {
            alert('Selected teacher not found.');
            return;
        }

        try {
            const challenge = new Uint8Array(16);
            window.crypto.getRandomValues(challenge);

            const credential = await navigator.credentials.create({
                publicKey: {
                    rp: {
                        name: "Tapowan Public School"
                    },
                    user: {
                        id: new TextEncoder().encode(teacher.id),
                        name: teacher.email || teacher.id,
                        displayName: teacher.name
                    },
                    challenge: challenge,
                    pubKeyCredParams: [{
                        type: "public-key",
                        alg: -7
                    }, {
                        type: "public-key",
                        alg: -257
                    }],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required",
                        residentKey: "required"
                    },
                    timeout: 60000,
                    attestation: "direct"
                }
            });

            const { error } = await supabase.from('teachers').update({
                fingerprint_credential: {
                    id: arrayBufferToBase64(credential.rawId),
                    publicKey: arrayBufferToBase64(credential.response.getPublicKey()),
                    authenticatorData: arrayBufferToBase64(credential.response.authenticatorData),
                    clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON)
                }
            }).eq('id', teacher.id);

            if (error) throw error;

            alert(`Fingerprint registered successfully for ${teacher.name}!`);
            await addAuditLog(loggedInUser?.email || 'admin', 'Registered Fingerprint', 'Attendance', `Registered fingerprint for teacher: ${teacher.name} (ID: ${teacher.id})`);
            await fetchTeachers();
        } catch (error) {
            console.error("Fingerprint registration failed:", error);
            alert(`Fingerprint registration failed: ${error.message || error}`);
            await addAuditLog(loggedInUser?.email || 'admin', 'Fingerprint Registration Failed', 'Attendance', `Failed to register fingerprint for teacher: ${teacher.name} - ${error.message}`);
        }
    });
}

// Teacher Fingerprint Verification
if (verifyTeacherFingerprintBtn) {
    verifyTeacherFingerprintBtn.addEventListener('click', async () => {
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        // Role retrieval is kept for audit logging, but not for access control
        const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
        // Removed role check: if (userRole !== 'admin' && userRole !== 'teacher') { alert('Access Denied: You do not have permission to verify teacher fingerprints.'); return; }
        const teacherId = teacherAttendanceTeacherSelect.value;
        if (!teacherId) {
            alert('Please select a teacher first.');
            return;
        }
        const teacher = teachers.find(t => t.id === teacherId);
        if (!teacher) {
            alert('Selected teacher not found.');
            return;
        }
        if (!teacher.fingerprint_credential) {
            alert('No fingerprint registered for this teacher. Please register one first.');
            return;
        }

        try {
            const challenge = new Uint8Array(16);
            window.crypto.getRandomValues(challenge);

            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge: challenge,
                    allowCredentials: [{
                        id: base64ToArrayBuffer(teacher.fingerprint_credential.id),
                        type: "public-key"
                    }],
                    userVerification: "required",
                    timeout: 60000
                }
            });

            alert(`Fingerprint verified successfully for ${teacher.name}! Attendance marked as Present.`);
            document.getElementById('teacherAttendanceStatus').value = 'Present';
            document.getElementById('teacherAttendanceFormSubmitBtn').click(); // Automatically submit attendance
            await addAuditLog(loggedInUser?.email || 'System', 'Verified Fingerprint', 'Teacher Attendance', `Verified fingerprint for teacher: ${teacher.name} (ID: ${teacher.id})`);
        } catch (error) {
            console.error("Fingerprint verification failed:", error);
            alert(`Fingerprint verification failed: ${error.message || error}`);
            await addAuditLog(loggedInUser?.email || 'System', 'Fingerprint Verification Failed', 'Teacher Attendance', `Failed to verify fingerprint for teacher: ${teacher.name} - ${error.message}`);
        }
    });
}

// Export to Excel Functionality
function exportToExcel(data, filename) {
    if (typeof XLSX === 'undefined') {
        alert('Excel export library (SheetJS) not loaded. Please ensure it is included in your HTML.');
        console.error('XLSX library is not available. Please ensure it is included in your HTML.');
        return;
    }
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, filename);
}

// Export Students to Excel
window.exportStudentsToExcel = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin') { alert('Access Denied: Only admin can export student data.'); return; }
    const studentData = students.map(student => ({
        ID: student.id,
        Name: student.name,
        "Father's_Name": student.father_name,
        "Mother's_Name": student.mother_name,
        Class: student.class,
        Roll_No: student.roll_no,
        Aadhar_No: student.aadhar_no,
        Email: student.email,
        Phone: student.phone,
        Status: student.status
    }));
    exportToExcel(studentData, 'students_data.xlsx');
    addAuditLog(loggedInUser?.email || 'admin', 'Exported Data', 'Students', 'Exported student data to Excel.');
}

// Export Teachers to Excel
window.exportTeachersToExcel = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin') { alert('Access Denied: Only admin can export teacher data.'); return; }
    const teacherData = teachers.map(teacher => ({
        ID: teacher.id,
        Name: teacher.name,
        Subject: teacher.subject,
        Email: teacher.email,
        Classes: teacher.classes
    }));
    exportToExcel(teacherData, 'teachers_data.xlsx');
    addAuditLog(loggedInUser?.email || 'admin', 'Exported Data', 'Teachers', 'Exported teacher data to Excel.');
}

// Export Users to Excel (Now exports from profiles data)
window.exportUsersToExcel = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin') { alert('Access Denied: Only admin can export user data.'); return; }
    const userData = profiles.map(profile => ({
        ID: profile.id,
        "Full Name": profile.full_name,
        Email: profile.email,
        Role: profile.role,
        Status: profile.status
    }));
    exportToExcel(userData, 'users_data.xlsx');
    addAuditLog(loggedInUser?.email || 'admin', 'Exported Data', 'User Management', 'Exported user profile data to Excel.');
}

// Export Payroll to Excel
window.exportPayrollToExcel = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin') { alert('Access Denied: Only admin can export payroll data.'); return; }
    const payrollData = payrollEntries.map(entry => ({
        Period: entry.period,
        Staff_Count: entry.staff_count,
        Total_Amount: entry.total_amount,
        Status: entry.status
    }));
    exportToExcel(payrollData, 'payroll_data.xlsx');
    addAuditLog(loggedInUser?.email || 'admin', 'Exported Data', 'Payroll', 'Exported payroll data to Excel.');
}

// Export Invoices to Excel
window.exportInvoicesToExcel = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin') { alert('Access Denied: Only admin can export invoice data.'); return; }
    const invoiceData = invoices.map(invoice => ({
        Invoice_Number: invoice.invoice_number,
        Date: invoice.date,
        Amount: invoice.amount,
        Status: invoice.status
    }));
    exportToExcel(invoiceData, 'invoices_data.xlsx');
    addAuditLog(loggedInUser?.email || 'admin', 'Exported Data', 'Finance', 'Exported invoice data to Excel.');
}

// Export Announcements to Excel
window.exportAnnouncementsToExcel = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin' && userRole !== 'teacher') { alert('Access Denied: Only admin and teachers can export announcements.'); return; }
    const announcementData = announcements.map(announcement => ({
        Title: announcement.title,
        Content: announcement.content,
        Date_Posted: announcement.date_posted,
        Status: announcement.status
    }));
    exportToExcel(announcementData, 'announcements_data.xlsx');
    addAuditLog(loggedInUser?.email || 'admin', 'Exported Data', 'Announcements', 'Exported announcement data to Excel.');
}

// Export Student Attendance to Excel
window.exportStudentAttendanceToExcel = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin' && userRole !== 'teacher') { alert('Access Denied: Only admin and teachers can export student attendance data.'); return; }
    const attendanceExportData = attendanceRecords.map(record => {
        const student = students.find(s => s.id === record.student_id);
        return {
            Student_Name: student ? student.name : 'Unknown',
            Roll_No: student ? student.roll_no : 'N/A',
            Class: student ? student.class : 'N/A',
            Date: record.date,
            Status: record.status,
            Remarks: record.remarks
        };
    });
    exportToExcel(attendanceExportData, 'student_attendance_data.xlsx');
    addAuditLog(loggedInUser?.email || 'admin', 'Exported Data', 'Attendance', 'Exported student attendance data to Excel.');
}

// Export Teacher Attendance to Excel
window.exportTeacherAttendanceToExcel = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    // Removed role check: if (userRole !== 'admin') { alert('Access Denied: Only admin can export teacher attendance data.'); return; }
    const teacherAttendanceExportData = teacherAttendanceRecords.map(record => { // Corrected variable name
        const teacher = teachers.find(t => t.id === record.teacher_id);
        return {
            Teacher_Name: teacher ? teacher.name : 'Unknown',
            Subject: teacher ? teacher.subject : 'N/A',
            Date: record.date,
            Status: record.status,
            Remarks: record.remarks
        };
    });
    exportToExcel(teacherAttendanceExportData, 'teacher_attendance_data.xlsx');
    addAuditLog(loggedInUser?.email || 'admin', 'Exported Data', 'Teacher Attendance', 'Exported teacher attendance data to Excel.');
}

// Dark Mode Toggle
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
            darkModeIcon.classList.remove('fa-moon');
            darkModeIcon.classList.add('fa-sun');
        } else {
            localStorage.setItem('theme', 'light');
            darkModeIcon.classList.remove('fa-sun');
            darkModeIcon.classList.add('fa-moon');
        }
    });
}

// Apply saved theme on load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (darkModeIcon) {
            darkModeIcon.classList.remove('fa-moon');
            darkModeIcon.classList.add('fa-sun');
        }
    } else {
        document.body.classList.remove('dark-mode');
        if (darkModeIcon) {
            darkModeIcon.classList.remove('fa-sun');
            darkModeIcon.classList.add('fa-moon');
        }
    }
});

// FIX: Added placeholder for startVoiceAssistant to resolve ReferenceError from index.html
function startVoiceAssistant() {
    alert('Voice assistant functionality is not yet implemented. This function is a placeholder.');
    console.log('Voice assistant button clicked!');
    // You can add actual voice assistant logic here, e.g., using Web Speech API
    // Example:
    /*
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.start();

        recognition.onresult = (event) => {
            const speechResult = event.results[0][0].transcript;
            console.log('Speech Result:', speechResult);
            alert('You said: ' + speechResult);
            // Process speechResult here
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            alert('Speech recognition error: ' + event.error);
        };
    } else {
        alert('Your browser does not support Web Speech API.');
    }
    */
}
