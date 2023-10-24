import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmDialog } from 'src/app/components/dialogs/confirm/confirm-dialog.component';
import { Organization } from 'src/app/models/api/organization.model';
import { OperationType, ResourceType, ScopeType } from 'src/app/models/api/rule.model';
import { BaseUser, User, UserLazyProperties } from 'src/app/models/api/user.model';
import { routePaths } from 'src/app/routes';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-user-read',
  templateUrl: './user-read.component.html',
  styleUrls: ['./user-read.component.scss'],
  host: { '[class.card-container]': 'true' }
})
export class UserReadComponent implements OnInit {
  @Input() id = '';

  routes = routePaths;

  isLoading = true;
  canDelete = false;
  canEdit = false;
  user: User | null = null;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private translateService: TranslateService
  ) { }

  ngOnInit(): void {
    this.initData();
  }

  private async initData(): Promise<void> {
    this.user = await this.userService.getUser(this.id, [UserLazyProperties.Organization, UserLazyProperties.Roles]);
    this.canDelete = this.authService.isAllowedForOrg(
      ResourceType.USER, OperationType.DELETE, (this.user.organization as Organization).id
    );
    this.canDelete = this.authService.isAllowedForOrg(
      ResourceType.USER, OperationType.EDIT, (this.user.organization as Organization).id
    );
    this.isLoading = false;
  }

  async handleDelete(): Promise<void> {
    if (!this.user) return;

    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: this.translateService.instant('user-read.delete-dialog.title', { name: this.user.username }),
        content: this.translateService.instant('user-read.delete-dialog.content'),
        confirmButtonText: this.translateService.instant('general.delete'),
        confirmButtonType: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === true) {
        if (!this.user) return;
        this.isLoading = true;
        await this.userService.deleteUser(this.user.id);
        this.router.navigate([routePaths.users]);
      }
    });
  }
}
