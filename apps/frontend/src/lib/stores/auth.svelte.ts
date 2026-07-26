import { loginApi, type UserProfile } from '../api/auth';

class AuthStore {
  token = $state<string | null>(null);
  user = $state<UserProfile | null>(null);
  redirectUrl = $state<string | null>(null);

  isAuthenticated = $derived(!!this.token && !!this.user);

  restore() {
    try {
      const storedToken = sessionStorage.getItem('token');
      const storedUser = sessionStorage.getItem('user');
      if (storedToken && storedUser) {
        this.token = storedToken;
        this.user = JSON.parse(storedUser);
      } else {
        this.logout();
      }
    } catch {
      this.logout();
    }
  }

  async login(identifier: string, password: string): Promise<UserProfile> {
    const res = await loginApi(identifier, password);
    this.token = res.token;
    this.user = res.user;
    sessionStorage.setItem('token', res.token);
    sessionStorage.setItem('user', JSON.stringify(res.user));
    return res.user;
  }

  logout() {
    this.token = null;
    this.user = null;
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  }

  updateName(newName: string) {
    if (this.user) {
      this.user.name = newName;
      sessionStorage.setItem('user', JSON.stringify(this.user));
    }
  }

  setRedirectUrl(url: string | null) {
    this.redirectUrl = url;
  }

  clearRedirectUrl(): string | null {
    const url = this.redirectUrl;
    this.redirectUrl = null;
    return url;
  }
}

export const authStore = new AuthStore();
