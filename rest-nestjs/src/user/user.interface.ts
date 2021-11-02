export interface UserData {
  username: string;
  email: string;
  bio: string;
}

export interface UserRO {
  user: UserData;
}

export interface ProfileData {
  username: string;
  firstName?: string;
  lastName?: string;
  bio: string;
  following?: boolean;
}

export interface ProfileRO {
  profile: ProfileData;
}
