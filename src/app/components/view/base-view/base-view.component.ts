import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { BaseApiService } from 'src/app/services/api/base-api.service';
import { ModalService } from 'src/app/services/common/modal.service';
import { BaseDataService } from 'src/app/services/data/base-data.service';
import { ExitMode, ResType } from 'src/app/shared/enum';
import { Resource } from 'src/app/shared/types';
import { ModalMessageComponent } from '../../modal/modal-message/modal-message.component';

@Component({
  selector: 'app-base-view',
  templateUrl: './base-view.component.html',
  styleUrls: ['./base-view.component.scss'],
})
export class BaseViewComponent implements OnInit {
  @Output() deletingResource = new EventEmitter<Resource>();

  constructor(
    protected apiService: BaseApiService,
    protected dataService: BaseDataService,
    protected modalService: ModalService
  ) {}

  ngOnInit(): void {}

  public edit(resource: Resource): void {
    this.dataService.save(resource);
  }

  async delete(resource: Resource): Promise<void> {
    // delete collaboration
    let data = this.apiService
      .delete(resource)
      .toPromise()
      .catch((error) => {
        this.modalService.openMessageModal(ModalMessageComponent, [
          error.error.msg,
        ]);
      });
    this.deletingResource.emit(resource);
    this.dataService.remove(resource);
  }

  askConfirmDelete(
    resource: Resource,
    type: ResType,
    extra_modal_message: string = ''
  ): void {
    // open modal window to ask for confirmation of irreversible delete action
    this.modalService
      .openDeleteModal(resource, type, extra_modal_message)
      .result.then((exit_mode) => {
        if (exit_mode === ExitMode.DELETE) {
          this.delete(resource);
        }
      });
  }
}