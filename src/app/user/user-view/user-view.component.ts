import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ExitMode } from 'src/app/shared/enum';

import { getEmptyUser, User } from 'src/app/user/interfaces/user';
import { ModalMessageComponent } from 'src/app/modal/modal-message/modal-message.component';

import { ModalService } from 'src/app/modal/modal.service';
import { ApiUserService } from 'src/app/user/services/api-user.service';
import { UserPermissionService } from 'src/app/auth/services/user-permission.service';

@Component({
  selector: 'app-user-view',
  templateUrl: './user-view.component.html',
  styleUrls: ['../../shared/scss/buttons.scss', './user-view.component.scss'],
})
export class UserViewComponent implements OnInit {
  @Input() user: User = getEmptyUser();
  @Output() deletingUser = new EventEmitter<User>();
  @Output() editingUser = new EventEmitter<User>();

  constructor(
    public userPermission: UserPermissionService,
    public userService: ApiUserService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.user.is_being_edited = false;
  }

  executeDelete(): void {
    this.userService.delete(this.user).subscribe(
      (data) => {
        this.deletingUser.emit(this.user);
      },
      (error) => {
        this.modalService.openMessageModal(ModalMessageComponent, [
          error.error.msg,
        ]);
      }
    );
  }

  deleteUser(): void {
    // open modal window to ask for confirmation of irreversible delete action
    this.modalService.openDeleteModal(this.user).result.then((exit_mode) => {
      if (exit_mode === ExitMode.DELETE) {
        this.executeDelete();
      }
    });
  }

  editUser(): void {
    this.user.is_being_edited = true;
    this.editingUser.emit(this.user);
  }
}
