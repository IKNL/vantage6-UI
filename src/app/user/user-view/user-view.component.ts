import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ExitMode } from 'src/app/globals/enum';

import { EMPTY_USER, User } from 'src/app/interfaces/user';
import { ModalDeleteComponent } from 'src/app/modal/modal-delete/modal-delete.component';

import { ModalService } from 'src/app/modal/modal.service';
import { UserService } from 'src/app/services/api/user.service';
import { UserPermissionService } from 'src/app/services/user-permission.service';

@Component({
  selector: 'app-user-view',
  templateUrl: './user-view.component.html',
  styleUrls: ['./user-view.component.scss'],
})
export class UserViewComponent implements OnInit {
  @Input() user: User = EMPTY_USER;
  @Output() deletingUser = new EventEmitter<User>();
  @Output() editingUser = new EventEmitter<User>();

  constructor(
    public userPermission: UserPermissionService,
    public userService: UserService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.user.is_being_edited = false;
  }

  executeDelete(user: User): void {
    this.userService.delete(user).subscribe(
      (data) => {
        this.deletingUser.emit(user);
      },
      (error) => {
        alert(error.error.msg);
      }
    );
  }

  deleteUser(user: User): void {
    // open modal window to ask for confirmation of irreversible delete action
    this.modalService.openDeleteModal(user).result.then((exit_mode) => {
      if (exit_mode === ExitMode.DELETE) {
        this.executeDelete(user);
      }
    });
  }

  editUser(user: User): void {
    user.is_being_edited = true;
    this.editingUser.emit(user);
  }
}