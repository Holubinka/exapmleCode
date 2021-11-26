export interface UserData {
  username: string;
  email: string;
  bio: string;
}

export interface ProfileData {
  username: string;
  firstName?: string;
  lastName?: string;
  bio: string;
  following?: boolean;
}

export interface User extends UserData {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export enum Role {
  ADMIN = 'admin',
  USER = 'user',
}
