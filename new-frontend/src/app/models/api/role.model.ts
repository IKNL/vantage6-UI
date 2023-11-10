import { Rule } from './rule.model';
import { BaseUser } from './user.model';

export interface BaseRole {
  id: number;
  name: string;
  rules: string;
  users: string;
}

export interface Role {
  id: number;
  name: string;
  rules: Rule[];
  users: BaseUser[];
}

export enum RoleLazyProperties {
  Rules = 'rules',
  Users = 'users'
}

export enum RoleSortProperties {
  ID = 'id',
  Name = 'name'
}

export interface GetRoleParameters {
  organization_id?: string;
  sort?: RoleSortProperties;
}
