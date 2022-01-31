import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, CanActivate } from '@angular/router';
import { ModalMessageComponent } from './modal/modal-message/modal-message.component';
import { ModalService } from './modal/modal.service';

import { TokenStorageService } from './services/token-storage.service';
import { UserPermissionService } from './services/user-permission.service';
import { parseId } from './utils';

@Injectable()
export class AccessGuard implements CanActivate {
  isLoggedIn: boolean;

  constructor(
    private tokenStorage: TokenStorageService,
    private userPermission: UserPermissionService,
    private router: Router
  ) {
    this.isLoggedIn = false;
  }

  ngOnInit(): void {
    this.tokenStorage.isLoggedIn().subscribe((loggedIn: boolean) => {
      this.isLoggedIn = loggedIn;
    });
  }

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiresLogin = route.data.requiresLogin || false;
    if (requiresLogin && !this.tokenStorage.loggedIn) {
      this.router.navigate(['login']);
    }
    const permType = route.data.permissionType || '*';
    const altPermType = route.data.alternativePermissionType || null;
    const permResource = route.data.permissionResource || '*';
    const permScope = route.data.permissionScope || '*';
    if (!this.userPermission.hasPermission(permType, permResource, permScope)) {
      if (
        altPermType &&
        this.userPermission.hasPermission(altPermType, permResource, permScope)
      ) {
        return true;
      }
      return false;
    }
    return true;
  }
}

@Injectable()
export class OrgAccessGuard implements CanActivate {
  isLoggedIn: boolean;

  constructor(
    private tokenStorage: TokenStorageService,
    private userPermission: UserPermissionService,
    private router: Router,
    private modalService: ModalService
  ) {
    this.isLoggedIn = false;
  }

  ngOnInit(): void {
    this.tokenStorage.isLoggedIn().subscribe((loggedIn: boolean) => {
      this.isLoggedIn = loggedIn;
    });
  }

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.tokenStorage.loggedIn) {
      this.router.navigate(['login']);
    }
    const id = parseId(route.params.id) || null;
    const permissionType = route.data.permissionType || '*';

    // if id>0, we are editing an organization, otherwise creating
    // use the organization id to check whether logged in user is allowed to
    // edit/create organization.
    let permission: boolean = false;
    if (id && id > 0) {
      permission = this.userPermission.can(permissionType, 'organization', id);
    }
    // second check if we are allowed to view organizations as part of collab
    // TODO somehow check if the organization we attempt to view is part of the collaboration
    if (!permission && permissionType === 'view') {
      permission = this.userPermission.hasPermission(
        'view',
        'organization',
        'collaboration'
      );
    }
    if (!permission) {
      this.modalService.openMessageModal(ModalMessageComponent, [
        'You are not allowed to do that!',
      ]);
    }
    return permission;
  }
}
