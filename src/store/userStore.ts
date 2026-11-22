import type { UserState } from './userState';

export interface UserStore {
  load(): Promise<UserState>;
  save(state: UserState): Promise<void>;
}
