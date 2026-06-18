/**
 * API Client for School Management System
 * Handles all communication with the backend API
 * Includes JWT token management and error handling
 */

class APIClient {
  // Configuration
  static API_BASE = window.location.origin + '/api';
  static TOKEN_KEY = 'authToken';
  static USER_KEY = 'userData';
  static SCHOOL_KEY = 'schoolId';
  static USER_ID_KEY = 'userId';
  static DEBUG = true; // Set to false in production

  /**
   * Debug log helper
   */
  static log(message, data = null) {
    if (this.DEBUG) {
      console.log(`[APIClient] ${message}`, data || '');
    }
  }

  /**
   * Get stored JWT token from localStorage
   */
  static getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get stored user data from localStorage
   */
  static getUser() {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Set token in localStorage
   */
  static setToken(token) {
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
    } else {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  /**
   * Set user data in localStorage
   */
  static setUser(user) {
    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.USER_KEY);
    }
  }

  /**
   * Build Authorization headers
   */
  static getHeaders(method = 'GET', includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Generic request method with error handling and token refresh
   */
  static async request(method, endpoint, data = null) {
    const url = `${this.API_BASE}${endpoint}`;
    
    this.log(`${method} ${endpoint}`, { url, data });
    
    const options = {
      method: method,
      headers: this.getHeaders(method, true),
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      this.log(`Response ${endpoint}`, { status: response.status, statusText: response.statusText });

      // Parse response body first (needed for all status codes)
      let responseData = {};
      try {
        responseData = await response.json();
        this.log(`Response data ${endpoint}`, responseData);
      } catch (e) {
        // Not JSON response, that's okay
      }

      // Handle 401 Unauthorized
      if (response.status === 401) {
        // Check if this is a login attempt (credentials invalid) vs session expired
        if (endpoint === '/auth/login') {
          // Invalid credentials
          const errorMsg = responseData.detail || 'Invalid email or password';
          this.log('Login failed - invalid credentials', errorMsg);
          throw new Error(errorMsg);
        } else {
          // Session expired - token is no longer valid
          this.log('Session expired - clearing auth');
          this.clearSession();
          window.location.href = '/';
          throw new Error('Your session has expired. Please log in again.');
        }
      }

      // Handle other error responses
      if (!response.ok) {
        const errorMessage = responseData.detail || `Error: ${response.status}`;
        this.log(`API Error ${endpoint}`, { status: response.status, error: errorMessage });
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = responseData;
        throw error;
      }

      return responseData;
    } catch (error) {
      console.error(`API Request Error (${method} ${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Clear session data
   */
  static clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.SCHOOL_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
  }

  // ============================================================
  // AUTHENTICATION ENDPOINTS
  // ============================================================

  /**
   * User login
   */
  static async login(email, password) {
    const response = await this.request('POST', '/auth/login', {
      email: email,
      password: password,
    });

    if (response.access_token) {
      this.setToken(response.access_token);
      if (response.user) {
        this.setUser(response.user);
      }
    }

    return response;
  }

  /**
   * User registration
   */
  static async register(userData) {
    const response = await this.request('POST', '/auth/register', userData);

    // If the register endpoint returns a token, store it.
    if (response.access_token) {
      this.setToken(response.access_token);
      if (response.user) this.setUser(response.user);
      return response;
    }

    // Many backends return only the created user on registration.
    // In that case, attempt to log in automatically using the provided credentials.
    try {
      const loginResp = await this.login(userData.email, userData.password);
      return loginResp;
    } catch (err) {
      // If auto-login fails, but registration succeeded, store the returned user locally.
      if (response && response.id) {
        this.setUser(response);
      }
      throw err;
    }
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser() {
    return this.request('GET', '/auth/me');
  }

  // ============================================================
  // USER ENDPOINTS
  // ============================================================

  /**
   * Get all users (admin only)
   */
  static async getUsers(skip = 0, limit = 50) {
    return this.request('GET', `/users?skip=${skip}&limit=${limit}`);
  }

  /**
   * Get user by ID
   */
  static async getUser(userId) {
    return this.request('GET', `/users/${userId}`);
  }

  /**
   * Update user
   */
  static async updateUser(userId, userData) {
    return this.request('PUT', `/users/${userId}`, userData);
  }

  /**
   * Delete user
   */
  static async deleteUser(userId) {
    return this.request('DELETE', `/users/${userId}`);
  }

  // ============================================================
  // STUDENT ENDPOINTS
  // ============================================================

  /**
   * Get all students
   */
  static async getStudents(skip = 0, limit = 50, schoolId = null) {
    let url = `/students?skip=${skip}&limit=${limit}`;
    if (schoolId) {
      url += `&school_id=${schoolId}`;
    }
    return this.request('GET', url);
  }

  /**
   * Get student by ID
   */
  static async getStudent(studentId) {
    return this.request('GET', `/students/${studentId}`);
  }

  /**
   * Create new student
   */
  static async createStudent(studentData) {
    return this.request('POST', '/students', studentData);
  }

  /**
   * Update student
   */
  static async updateStudent(studentId, studentData) {
    return this.request('PUT', `/students/${studentId}`, studentData);
  }

  /**
   * Delete student
   */
  static async deleteStudent(studentId) {
    return this.request('DELETE', `/students/${studentId}`);
  }

  // ============================================================
  // TEACHER ENDPOINTS
  // ============================================================

  /**
   * Get all teachers
   */
  static async getTeachers(skip = 0, limit = 50, schoolId = null) {
    let url = `/teachers?skip=${skip}&limit=${limit}`;
    if (schoolId) {
      url += `&school_id=${schoolId}`;
    }
    return this.request('GET', url);
  }

  /**
   * Get teacher by ID
   */
  static async getTeacher(teacherId) {
    return this.request('GET', `/teachers/${teacherId}`);
  }

  /**
   * Create new teacher
   */
  static async createTeacher(teacherData) {
    return this.request('POST', '/teachers', teacherData);
  }

  /**
   * Update teacher
   */
  static async updateTeacher(teacherId, teacherData) {
    return this.request('PUT', `/teachers/${teacherId}`, teacherData);
  }

  /**
   * Delete teacher
   */
  static async deleteTeacher(teacherId) {
    return this.request('DELETE', `/teachers/${teacherId}`);
  }

  // ============================================================
  // CLASS ENDPOINTS
  // ============================================================

  /**
   * Get all classes
   */
  static async getClasses(skip = 0, limit = 50, schoolId = null) {
    let url = `/classes?skip=${skip}&limit=${limit}`;
    if (schoolId) {
      url += `&school_id=${schoolId}`;
    }
    return this.request('GET', url);
  }

  /**
   * Get class by ID
   */
  static async getClass(classId) {
    return this.request('GET', `/classes/${classId}`);
  }

  /**
   * Create new class
   */
  static async createClass(classData) {
    return this.request('POST', '/classes', classData);
  }

  /**
   * Update class
   */
  static async updateClass(classId, classData) {
    return this.request('PUT', `/classes/${classId}`, classData);
  }

  /**
   * Delete class
   */
  static async deleteClass(classId) {
    return this.request('DELETE', `/classes/${classId}`);
  }

  // ============================================================
  // GRADE ENDPOINTS
  // ============================================================

  /**
   * Get grades for student
   */
  static async getStudentGrades(studentId) {
    return this.request('GET', `/grades?student_id=${studentId}`);
  }

  /**
   * Get all grades
   */
  static async getGrades(skip = 0, limit = 50, studentId = null) {
    let url = `/grades?skip=${skip}&limit=${limit}`;
    if (studentId) {
      url += `&student_id=${studentId}`;
    }
    return this.request('GET', url);
  }

  /**
   * Get grade by ID
   */
  static async getGrade(gradeId) {
    return this.request('GET', `/grades/${gradeId}`);
  }

  /**
   * Create new grade
   */
  static async createGrade(gradeData) {
    return this.request('POST', '/grades', gradeData);
  }

  /**
   * Update grade
   */
  static async updateGrade(gradeId, gradeData) {
    return this.request('PUT', `/grades/${gradeId}`, gradeData);
  }

  /**
   * Delete grade
   */
  static async deleteGrade(gradeId) {
    return this.request('DELETE', `/grades/${gradeId}`);
  }

  // ============================================================
  // ATTENDANCE ENDPOINTS
  // ============================================================

  /**
   * Get attendance records
   */
  static async getAttendance(skip = 0, limit = 50, studentId = null) {
    let url = `/attendance?skip=${skip}&limit=${limit}`;
    if (studentId) {
      url += `&student_id=${studentId}`;
    }
    return this.request('GET', url);
  }

  /**
   * Get attendance by ID
   */
  static async getAttendanceRecord(attendanceId) {
    return this.request('GET', `/attendance/${attendanceId}`);
  }

  /**
   * Create attendance record
   */
  static async createAttendance(attendanceData) {
    return this.request('POST', '/attendance', attendanceData);
  }

  /**
   * Update attendance record
   */
  static async updateAttendance(attendanceId, attendanceData) {
    return this.request('PUT', `/attendance/${attendanceId}`, attendanceData);
  }

  /**
   * Delete attendance record
   */
  static async deleteAttendance(attendanceId) {
    return this.request('DELETE', `/attendance/${attendanceId}`);
  }

  // ============================================================
  // SCHOOL ENDPOINTS
  // ============================================================

  /**
   * Get all schools
   */
  static async getSchools(skip = 0, limit = 50) {
    return this.request('GET', `/schools?skip=${skip}&limit=${limit}`);
  }

  /**
   * Get school by ID
   */
  static async getSchool(schoolId) {
    return this.request('GET', `/schools/${schoolId}`);
  }

  /**
   * Create new school
   */
  static async createSchool(schoolData) {
    return this.request('POST', '/schools', schoolData);
  }

  /**
   * Update school
   */
  static async updateSchool(schoolId, schoolData) {
    return this.request('PUT', `/schools/${schoolId}`, schoolData);
  }

  /**
   * Delete school
   */
  static async deleteSchool(schoolId) {
    return this.request('DELETE', `/schools/${schoolId}`);
  }

  // ============================================================
  // ANNOUNCEMENT ENDPOINTS
  // ============================================================

  /**
   * Get announcements
   */
  static async getAnnouncements(skip = 0, limit = 50, schoolId = null) {
    let url = `/announcements?skip=${skip}&limit=${limit}`;
    if (schoolId) {
      url += `&school_id=${schoolId}`;
    }
    return this.request('GET', url);
  }

  /**
   * Create announcement
   */
  static async createAnnouncement(announcementData) {
    return this.request('POST', '/announcements', announcementData);
  }

  /**
   * Get announcement by ID
   */
  static async getAnnouncement(announcementId) {
    return this.request('GET', `/announcements/${announcementId}`);
  }

  /**
   * Update announcement
   */
  static async updateAnnouncement(announcementId, announcementData) {
    return this.request('PUT', `/announcements/${announcementId}`, announcementData);
  }

  /**
   * Delete announcement
   */
  static async deleteAnnouncement(announcementId) {
    return this.request('DELETE', `/announcements/${announcementId}`);
  }

  // ============================================================
  // EVENT ENDPOINTS
  // ============================================================

  /**
   * Get events
   */
  static async getEvents(skip = 0, limit = 50, schoolId = null) {
    let url = `/events?skip=${skip}&limit=${limit}`;
    if (schoolId) {
      url += `&school_id=${schoolId}`;
    }
    return this.request('GET', url);
  }

  /**
   * Create event
   */
  static async createEvent(eventData) {
    return this.request('POST', '/events', eventData);
  }

  /**
   * Get event by ID
   */
  static async getEvent(eventId) {
    return this.request('GET', `/events/${eventId}`);
  }

  /**
   * Update event
   */
  static async updateEvent(eventId, eventData) {
    return this.request('PUT', `/events/${eventId}`, eventData);
  }

  /**
   * Delete event
   */
  static async deleteEvent(eventId) {
    return this.request('DELETE', `/events/${eventId}`);
  }

  /**
   * RSVP to event
   */
  static async rsvpEvent(eventId, rsvpData) {
    return this.request('POST', `/events/${eventId}/rsvp`, rsvpData);
  }

  // ============================================================
  // MESSAGE ENDPOINTS
  // ============================================================

  /**
   * Get messages
   */
  static async getMessages(skip = 0, limit = 50) {
    return this.request('GET', `/messages?skip=${skip}&limit=${limit}`);
  }

  /**
   * Send message
   */
  static async sendMessage(messageData) {
    return this.request('POST', '/messages', messageData);
  }

  /**
   * Get conversation with user
   */
  static async getConversation(userId) {
    return this.request('GET', `/messages/conversation/${userId}`);
  }

  // ============================================================
  // LIBRARY ENDPOINTS
  // ============================================================

  /**
   * Get books
   */
  static async getBooks(skip = 0, limit = 50) {
    return this.request('GET', `/books?skip=${skip}&limit=${limit}`);
  }

  /**
   * Get borrowing records
   */
  static async getBorrowings(skip = 0, limit = 50, userId = null) {
    let url = `/borrowings?skip=${skip}&limit=${limit}`;
    if (userId) {
      url += `&user_id=${userId}`;
    }
    return this.request('GET', url);
  }

  /**
   * Borrow book
   */
  static async borrowBook(bookId) {
    return this.request('POST', `/books/${bookId}/borrow`);
  }

  /**
   * Return book
   */
  static async returnBook(borrowingId) {
    return this.request('POST', `/borrowings/${borrowingId}/return`);
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIClient;
}
