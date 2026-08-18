const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken = () =>
  localStorage.getItem("libro_token") || sessionStorage.getItem("libro_token");

const request = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    ...(options.body instanceof FormData
      ? {}
      : {
          "Content-Type": "application/json",
        }),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message || `Request failed with status ${response.status}.`,
    );
  }

  return data;
};

export const libroApi = {
  /*
   * ============================================================
   * AUTH
   * ============================================================
   */

  async login(email, password) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    });
  },

  async register(userData) {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  /*
   * ============================================================
   * BOOKS
   * ============================================================
   */

  async getBooks() {
    const data = await request("/books");

    return data.books || [];
  },

  async getBookById(id) {
    const data = await request(`/books/${id}`);

    return data.book || null;
  },

  async createBook(formData) {
    const data = await request("/books", {
      method: "POST",
      body: formData,
    });

    return data.book;
  },

  async updateBook(id, formData) {
    const data = await request(`/books/${id}`, {
      method: "PUT",
      body: formData,
    });

    return data.book;
  },

  async deleteBook(id) {
    return request(`/books/${id}`, {
      method: "DELETE",
    });
  },

  /*
   * ============================================================
   * PHYSICAL COPIES
   * ============================================================
   */

  async getPhysicalCopies(params = {}) {
    const searchParams = new URLSearchParams();

    if (params.bookId) {
      searchParams.set("bookId", params.bookId);
    }

    if (params.status) {
      searchParams.set("status", params.status);
    }

    const query = searchParams.toString();

    const data = await request(`/physical-copies${query ? `?${query}` : ""}`);

    return data.copies || [];
  },

  async getPhysicalCopyByCode(code) {
    const data = await request(
      `/physical-copies/code/${encodeURIComponent(code)}`,
    );

    return data.copy || null;
  },

  async syncPhysicalCopyCounts() {
    return request("/physical-copies/sync", {
      method: "POST",
    });
  },

  /*
   * ============================================================
   * CIRCULATION
   * ============================================================
   */

  async getCirculation() {
    const data = await request("/circulation");

    return data.circulation || [];
  },

  async getStudentsForCirculation() {
    const data = await request("/circulation/students");

    return data.students || [];
  },

  async getBooksForCirculation() {
    const data = await request("/circulation/books");

    return data.books || [];
  },

  async issueBook(payload) {
    return request("/circulation/issue", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async returnBook(payload) {
    return request("/circulation/return", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async renewBook(payload) {
    return request("/circulation/renew", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getLibrarianDashboard() {
    const data = await request("/circulation/dashboard");

    return data;
  },

  async getMyLoans() {
    const data = await request("/circulation/my-loans");

    return data.loans || [];
  },

  async returnMyBook(payload) {
    return request("/circulation/my-return", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /*
   * ============================================================
   * RESERVATIONS
   * ============================================================
   */

  async createReservation(bookId) {
    return request("/reservations", {
      method: "POST",
      body: JSON.stringify({
        bookId,
      }),
    });
  },

  async getMyReservations() {
    const data = await request("/reservations/my");

    return data.reservations || [];
  },

  async getBookReservation(bookId) {
    const data = await request(`/reservations/book/${bookId}`);

    return data.reservation || null;
  },

  async cancelReservation(id) {
    return request(`/reservations/${id}/cancel`, {
      method: "PATCH",
    });
  },

  async getLibrarianReservations() {
    const data = await request("/reservations/librarian");

    return data.reservations || [];
  },

  async updateReservationStatus(id, status) {
    return request(`/reservations/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
      }),
    });
  },

  /*
   * ============================================================
   * RESERVATION CLAIMS
   * ============================================================
   */

  async createClaimBatch(payload) {
    return request("/reservation-claims/create-batch", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async claimReservation(payload) {
    return request("/reservation-claims/claim", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /*
   * ============================================================
   * FINES
   * ============================================================
   */

  async getFines() {
    const data = await request("/fines");

    return data.fines || [];
  },

  async getMyFines() {
    const data = await request("/fines/my");

    return data.fines || [];
  },

  async syncFines() {
    return request("/fines/sync", {
      method: "POST",
    });
  },

  async payFine(id) {
    const data = await request(`/fines/${id}/pay`, {
      method: "PATCH",
    });

    return data.fine;
  },

  /*
   * ============================================================
   * NOTIFICATIONS
   * ============================================================
   */

  async getMyNotifications() {
    const data = await request("/notifications/my");

    return data.notifications || [];
  },

  async markNotificationAsRead(id) {
    return request(`/notifications/${id}/read`, {
      method: "PATCH",
    });
  },

  async markAllNotificationsAsRead() {
    return request("/notifications/read-all", {
      method: "PATCH",
    });
  },

  async clearMyNotifications() {
    return request("/notifications/my", {
      method: "DELETE",
    });
  },

  /*
   * ============================================================
   * ANALYTICS
   * ============================================================
   */

  async getAnalytics() {
    const data = await request("/analytics");

    return data.analytics || {};
  },
};

export { API_BASE_URL };
