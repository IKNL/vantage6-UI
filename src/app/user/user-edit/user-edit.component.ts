import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

import { Role } from 'src/app/interfaces/role';
import { Rule } from 'src/app/interfaces/rule';
import { EMPTY_USER, User } from 'src/app/interfaces/user';

import { removeMatchedIdFromArray } from 'src/app/utils';
import { UserService } from 'src/app/services/api/user.service';
import { UserPermissionService } from 'src/app/services/user-permission.service';
import { UserEditService } from '../user-edit.service';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from 'src/app/services/utils.service';
import { ModalService } from 'src/app/modal/modal.service';
import { ModalMessageComponent } from 'src/app/modal/modal-message/modal-message.component';

// TODO add option to assign user to different organization

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['../../globals/buttons.scss', './user-edit.component.scss'],
})
export class UserEditComponent implements OnInit {
  user: User = EMPTY_USER;
  id: number = EMPTY_USER.id;
  roles_assignable: Role[] = [];
  loggedin_user: User = EMPTY_USER;
  added_rules: Rule[] = [];

  constructor(
    private location: Location,
    private activatedRoute: ActivatedRoute,
    public userPermission: UserPermissionService,
    private userService: UserService,
    private userEditService: UserEditService,
    private utilsService: UtilsService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.userPermission.getUser().subscribe((user) => {
      this.loggedin_user = user;
    });
    this.userEditService.getUser().subscribe((user) => {
      this.user = user;
    });
    this.userEditService.getAvailableRoles().subscribe((roles) => {
      this.roles_assignable = roles;
    });
    // subscribe to id parameter in route to change edited organization if
    // required
    this.activatedRoute.paramMap.subscribe((params) => {
      let new_id = this.utilsService.getId(params, 'user');
      if (new_id !== this.id) {
        this.id = new_id;
        this.setUserFromAPI(new_id);
      }
    });
  }

  async setUserFromAPI(id: number): Promise<void> {
    try {
      this.user = await this.userService.getUser(id);
      this.roles_assignable = await this.userPermission.getAssignableRoles(
        this.user.organization_id
      );
    } catch (error: any) {
      this.modalService.openMessageModal(
        ModalMessageComponent,
        [error.error.msg],
        true
      );
    }
  }

  removeRole(role: Role): void {
    this.user.roles = removeMatchedIdFromArray(this.user.roles, role);
  }
  removeRule(rule: Rule): void {
    this.user.rules = removeMatchedIdFromArray(this.user.rules, rule);
  }
  addRole(role: Role): void {
    // NB: new user roles are assigned using a spread operator to activate
    // angular change detection. This does not work with push()
    this.user.roles = [...this.user.roles, role];
  }
  addRule(rule: Rule): void {
    // NB: new user roles are assigned using a spread operator to activate
    // angular change detection. This does not work with push()
    this.user.rules = [...this.user.rules, rule];
  }

  getRulesNotInRoles(): Rule[] {
    let rules_not_in_roles: Rule[] = [];
    for (let rule of this.added_rules) {
      if (!rule.is_part_role) {
        rules_not_in_roles.push(rule);
      }
    }
    return rules_not_in_roles;
  }

  saveEditedUser(): void {
    this.user.rules = this.getRulesNotInRoles();

    let user_request;
    if (this.user.is_being_created) {
      if (this.user.password !== this.user.password_repeated) {
        alert('Passwords do not match! Cannot create this user.');
        return;
      }
      user_request = this.userService.create(this.user);
    } else {
      user_request = this.userService.update(this.user);
    }

    user_request.subscribe(
      (data) => {
        this.goBack();
      },
      (error) => {
        alert(error.error.msg);
      }
    );
  }

  cancelEdit(): void {
    this.goBack();
  }

  updateAddedRules($event: Rule[]) {
    this.added_rules = $event;
    this.user.rules = $event;
  }

  goBack(): void {
    // go back to previous page
    this.location.back();
  }
}
