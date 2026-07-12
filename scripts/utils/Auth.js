const DEFAULT_STORAGE_KEY = 'avtoTestAuth';

class AuthError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
    this.payload = payload;
  }
}

export class AuthManager {
  constructor(apiConfig = {}, options = {}) {
    this.baseUrl = this.normalizeBaseUrl(apiConfig.baseUrl);
    this.storageKey = apiConfig.storageKey || DEFAULT_STORAGE_KEY;
    this.debug = options.debug || false;
    this.sessionDurationMs = typeof options.sessionDurationMs === 'number'
      ? options.sessionDurationMs
      : 7 * 24 * 60 * 60 * 1000; // default: 7 days

    this.token = null;
    this.expiresAt = null;
    this.user = null;
    this.isAuthenticated = false;
    this.initialized = false;
  }

  normalizeUser(rawUser) {
    if (!rawUser || typeof rawUser !== 'object') {
      return null;
    }

    const normalized = { ...rawUser };

    if (rawUser && Object.prototype.hasOwnProperty.call(rawUser, 'is_admin')) {
      normalized.isAdmin = Boolean(rawUser.is_admin);
    } else if (Object.prototype.hasOwnProperty.call(rawUser, 'isAdmin')) {
      normalized.isAdmin = Boolean(rawUser.isAdmin);
    }

    if (Object.prototype.hasOwnProperty.call(rawUser, 'created_at') && !normalized.createdAt) {
      normalized.createdAt = rawUser.created_at;
    }

    return normalized;
  }

  normalizeExpiry(expiresAt) {
    if (expiresAt) {
      const parsed = new Date(expiresAt);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }

    if (this.sessionDurationMs > 0) {
      const fallback = new Date(Date.now() + this.sessionDurationMs);
      return fallback.toISOString();
    }

    return null;
  }

  normalizeBaseUrl(baseUrl) {
    if (!baseUrl) {
      throw new Error('AuthManager requires a valid API base URL');
    }
    return baseUrl.replace(/\/+$/, '');
  }

  logDebug(message, ...args) {
    if (this.debug) {
      console.log(`[Auth Debug] ${message}`, ...args);
    }
  }

  loadSessionFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);
      this.token = parsed.token || null;
      this.expiresAt = parsed.expiresAt || null;
      this.user = parsed.user || null;

      if (!this.token) {
        this.clearSession();
        return;
      }

      if (this.isSessionExpired()) {
        this.logDebug('Stored session has expired, clearing');
        this.clearSession();
      } else {
        this.isAuthenticated = true;
      }
    } catch (error) {
      this.logDebug('Failed to parse stored session, clearing', error);
      this.clearSession();
    }
  }

  storeSession() {
    if (!this.token) {
      this.clearSession();
      return;
    }

    const payload = {
      token: this.token,
      expiresAt: this.expiresAt,
      user: this.user
    };

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
    } catch (error) {
      this.logDebug('Failed to persist auth session', error);
    }
  }

  clearSession() {
    this.token = null;
    this.expiresAt = null;
    this.user = null;
    this.isAuthenticated = false;

    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      this.logDebug('Failed to clear auth session from storage', error);
    }
  }

  isSessionExpired() {
    if (!this.expiresAt) {
      return false;
    }

    const expiry = new Date(this.expiresAt).getTime();
    if (Number.isNaN(expiry)) {
      return false;
    }

    return expiry <= Date.now();
  }

  getAuthHeaders() {
    if (!this.token) {
      return {};
    }

    return {
      Authorization: `Bearer ${this.token}`
    };
  }

  async init() {
    this.loadSessionFromStorage();

    if (this.token && !this.isSessionExpired()) {
      try {
        await this.refreshUser();
      } catch (error) {
        this.logDebug('Failed to restore session during init', error);
        this.clearSession();
        this.dispatchErrorEvent(error);
      }
    }

    this.initialized = true;
    this.onAuthStateChange();
    return this.isAuthenticated;
  }

  async signIn(credentials = {}) {
    const username = credentials.username ? credentials.username.trim() : '';
    const password = credentials.password || '';

    if (!username || !password) {
      const error = new AuthError('Username and password are required', 400);
      this.dispatchErrorEvent(error);
      throw error;
    }

    const response = await this.request('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const { token, user, expiresAt, expires_at: expiresAtSnake } = response || {};

    if (!token) {
      throw new AuthError('Authentication token missing in response', 500, response);
    }

    const normalizedUser = this.normalizeUser(user);
    if (!normalizedUser) {
      throw new AuthError('User information missing in response', 500, response);
    }

    this.token = token;
    this.expiresAt = this.normalizeExpiry(expiresAt || expiresAtSnake);
    this.user = normalizedUser;
    this.isAuthenticated = true;

    this.storeSession();
    this.onAuthSuccess();

    return this.user;
  }

  async signOut() {
    if (this.token) {
      try {
        await this.request('/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          auth: true
        });
      } catch (error) {
        this.logDebug('Logout request failed (proceeding to clear local session)', error);
      }
    }

    this.clearSession();
    this.onAuthStateChange();
  }

  async refreshUser() {
    if (!this.token) {
      throw new AuthError('Missing authentication token');
    }

    if (this.isSessionExpired()) {
      throw new AuthError('Session has expired', 401);
    }

    const data = await this.request('/auth/me', {
      method: 'GET',
      auth: true
    });

    const rawUser = (data && data.user) ? data.user : data;
    const normalizedUser = this.normalizeUser(rawUser);

    if (!normalizedUser) {
      throw new AuthError('User information missing from response', 500, data);
    }

    this.user = normalizedUser;
    this.isAuthenticated = true;
    this.storeSession();
    return this.user;
  }

  async checkAuthStatus({ forceRefresh = false } = {}) {
    if (!this.token) {
      return false;
    }

    if (this.isSessionExpired()) {
      this.logDebug('Auth status check detected expired session');
      this.clearSession();
      this.onAuthStateChange();
      return false;
    }

    if (!this.isAuthenticated || forceRefresh) {
      try {
        await this.refreshUser();
      } catch (error) {
        this.logDebug('Auth status refresh failed, clearing session', error);
        this.clearSession();
        this.onAuthStateChange();
        this.dispatchErrorEvent(error);
        return false;
      }
    }

    return this.isAuthenticated;
  }

  async getUserInfo({ forceRefresh = false } = {}) {
    if (this.user && !forceRefresh && !this.isSessionExpired()) {
      return this.user;
    }

    if (!this.token) {
      return null;
    }

    try {
      const user = await this.refreshUser();
      return user;
    } catch (error) {
      this.logDebug('Failed to fetch user info', error);
      this.dispatchErrorEvent(error);
      return null;
    }
  }

  async requireAuth() {
    const authenticated = await this.checkAuthStatus({ forceRefresh: true });
    return authenticated;
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const fetchOptions = {
      method: options.method || 'GET',
      headers: {
        ...(options.headers || {})
      },
      body: options.body
    };

    if (!('Accept' in fetchOptions.headers)) {
      fetchOptions.headers.Accept = 'application/json';
    }

    if (options.auth) {
      Object.assign(fetchOptions.headers, this.getAuthHeaders());
    }

    try {
      const response = await fetch(url, fetchOptions);
      const hasContent = response.status !== 204;
      let data = null;

      if (hasContent) {
        try {
          data = await response.json();
        } catch (error) {
          this.logDebug('Failed to parse JSON response', error);
        }
      }

      if (!response.ok) {
        const message = (data && (data.message || data.error)) || response.statusText || 'Authentication request failed';
        throw new AuthError(message, response.status, data);
      }

      return data || {};
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }

      this.logDebug('Network error while contacting auth API', error);
      throw new AuthError('Unable to reach authentication server', 0, { error });
    }
  }

  onAuthSuccess() {
    this.onAuthStateChange();

    window.dispatchEvent(new CustomEvent('authSuccess', {
      detail: { user: this.user }
    }));
  }

  onAuthStateChange() {
    window.dispatchEvent(new CustomEvent('authStateChange', {
      detail: {
        isAuthenticated: this.isAuthenticated,
        user: this.user
      }
    }));
  }

  dispatchErrorEvent(error) {
    window.dispatchEvent(new CustomEvent('authError', {
      detail: {
        error,
        message: error.message,
        status: error.status || 0,
        payload: error.payload || null
      }
    }));
  }

  getIsAuthenticated() {
    return this.isAuthenticated;
  }

  getUser() {
    return this.user;
  }
}
