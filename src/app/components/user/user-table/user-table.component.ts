import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserPermissionService } from 'src/app/auth/services/user-permission.service';
import { Organization } from 'src/app/interfaces/organization';
import { Role } from 'src/app/interfaces/role';
import { Rule } from 'src/app/interfaces/rule';
import { EMPTY_USER, User } from 'src/app/interfaces/user';
import { OrgDataService } from 'src/app/services/data/org-data.service';
import { RoleDataService } from 'src/app/services/data/role-data.service';
import { RuleDataService } from 'src/app/services/data/rule-data.service';
import { UserDataService } from 'src/app/services/data/user-data.service';
import { parseId } from 'src/app/shared/utils';
import { TableComponent } from '../../table/table.component';

@Component({
  selector: 'app-user-table',
  templateUrl: './user-table.component.html',
  styleUrls: [
    '../../../shared/scss/buttons.scss',
    '../../table/table.component.scss',
    './user-table.component.scss',
  ],
})
export class UserTableComponent extends TableComponent implements OnInit {
  rules: Rule[] = [];
  roles: Role[] = [];

  displayedColumns: string[] = [
    'username',
    'email',
    'firstname',
    'lastname',
    'organization',
  ];

  constructor(
    protected activatedRoute: ActivatedRoute,
    public userPermission: UserPermissionService,
    private roleDataService: RoleDataService,
    private ruleDataService: RuleDataService,
    private userDataService: UserDataService,
    private orgDataService: OrgDataService
  ) {
    super(activatedRoute, userPermission);
  }

  async init(): Promise<void> {
    // get rules and roles
    (await this.ruleDataService.list()).subscribe((rules: Rule[]) => {
      this.rules = rules;
    });

    (await this.roleDataService.list(this.rules)).subscribe((roles: Role[]) => {
      this.roles = roles;
    });

    // get organizations
    (await this.orgDataService.list()).subscribe((orgs) => {
      this.organizations = orgs;
    });

    this.readRoute();
  }

  protected async setResources() {
    if (this.isShowingSingleOrg()) {
      this.resources = await this.userDataService.org_list(
        this.route_org_id as number,
        this.roles,
        this.rules
      );
    } else {
      (await this.userDataService.list(this.roles, this.rules)).subscribe(
        (users: User[]) => {
          this.resources = users;
        }
      );
    }
  }

  editUser(user: User): void {
    this.userDataService.save(user);
  }
}