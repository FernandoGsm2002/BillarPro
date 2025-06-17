import { User, CreateUserData, UpdateUserData } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

class UserService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('billarpro_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Error obteniendo usuarios');
      }

      return data.data;
    } catch (error) {
      console.error('Error en getUsers:', error);
      throw error;
    }
  }

  async createUser(userData: CreateUserData): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Error creando usuario');
      }

      return data.data;
    } catch (error) {
      console.error('Error en createUser:', error);
      throw error;
    }
  }

  async updateUser(userId: number, userData: UpdateUserData): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Error actualizando usuario');
      }

      return data.data;
    } catch (error) {
      console.error('Error en updateUser:', error);
      throw error;
    }
  }

  async deleteUser(userId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Error eliminando usuario');
      }
    } catch (error) {
      console.error('Error en deleteUser:', error);
      throw error;
    }
  }

  async changePassword(userId: number, newPassword: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/password`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ password: newPassword })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Error cambiando contraseña');
      }
    } catch (error) {
      console.error('Error en changePassword:', error);
      throw error;
    }
  }


}

export default new UserService(); 