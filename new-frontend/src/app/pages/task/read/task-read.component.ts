import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { getChipTypeForStatus, getStatusInfoTypeForStatus, getTaskStatusTranslation } from 'src/app/helpers/task.helper';
import { Algorithm, Function, Output } from 'src/app/models/api/algorithm.model';
import { Task, TaskLazyProperties, TaskRun, TaskStatus } from 'src/app/models/api/task.models';
import { routePaths } from 'src/app/routes';
import { AlgorithmService } from 'src/app/services/algorithm.service';
import { TaskService } from 'src/app/services/task.service';
import { LogDialog } from '../../../components/dialogs/log/log-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { OperationType, ResourceType } from 'src/app/models/api/rule.model';
import { Router } from '@angular/router';
import { ConfirmDialog } from 'src/app/components/dialogs/confirm/confirm-dialog.component';
import { FormControl } from '@angular/forms';
import { ChosenCollaborationService } from 'src/app/services/chosen-collaboration.service';
import { PermissionService } from 'src/app/services/permission.service';
import { mockTaskCompleted } from 'src/app/mock-data/task';

@Component({
  selector: 'app-task-read',
  templateUrl: './task-read.component.html',
  styleUrls: ['./task-read.component.scss'],
  host: { '[class.card-container]': 'true' }
})
export class TaskReadComponent implements OnInit {
  @Input() id = '';

  routes = routePaths;

  visualization = new FormControl(0);

  task: Task | null = null;
  algorithm: Algorithm | null = null;
  function: Function | null = null;
  selectedOutput: Output | null = null;
  isLoading = true;
  canDelete = false;

  constructor(
    public dialog: MatDialog,
    private router: Router,
    private translateService: TranslateService,
    private taskService: TaskService,
    private algorithmService: AlgorithmService,
    private chosenCollaborationService: ChosenCollaborationService,
    private permissionService: PermissionService
  ) {}

  async ngOnInit(): Promise<void> {
    this.canDelete = this.permissionService.isAllowedForCollab(
      ResourceType.TASK,
      OperationType.DELETE,
      this.chosenCollaborationService.collaboration$.value
    );
    this.visualization.valueChanges.subscribe((value) => {
      this.selectedOutput = this.function?.output?.[value || 0] || null;
    });
    await this.initData();
  }

  async initData(): Promise<void> {
    this.task = mockTaskCompleted;
    console.log(this.task);
    //this.task = await this.taskService.getTask(this.id, [TaskLazyProperties.InitOrg, TaskLazyProperties.InitUser]);
    this.algorithm = await this.algorithmService.getAlgorithmByUrl(this.task.image);
    this.function = this.algorithm?.functions.find((_) => _.name === this.task?.input?.method) || null;
    this.selectedOutput = this.function?.output?.[0] || null;
    this.isLoading = false;
  }

  getChipTypeForStatus(status: TaskStatus) {
    return getChipTypeForStatus(status);
  }

  getTaskStatusTranslation(status: TaskStatus) {
    return getTaskStatusTranslation(this.translateService, status);
  }

  getStatusInfoTypeForStatus(status: TaskStatus) {
    return getStatusInfoTypeForStatus(status);
  }

  shouldShowStatusInfo(): boolean {
    if (!this.task) return false;
    if (this.task.runs.length <= 0) return false;
    if (this.task.runs.every((run) => run.status === TaskStatus.Completed)) return false;
    return true;
  }

  isFailedRun(status: TaskStatus): boolean {
    return (
      status === TaskStatus.Failed ||
      status === TaskStatus.Crashed ||
      status === TaskStatus.NoDockerImage ||
      status === TaskStatus.StartFailed
    );
  }

  isActiveRun(status: TaskStatus): boolean {
    return status === TaskStatus.Pending || status === TaskStatus.Initializing || status === TaskStatus.Active;
  }

  openLog(log: string): void {
    try {
      log = JSON.stringify(JSON.parse(log), null, 2);
    } catch (e) {}

    this.dialog.open(LogDialog, {
      width: '80vw',
      data: {
        log: log
      }
    });
  }

  getRunForResult(id: number): TaskRun | undefined {
    return this.task?.runs.find((_) => _.id === id);
  }

  async handleDelete(): Promise<void> {
    if (!this.task) return;

    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: this.translateService.instant('task-read.delete-dialog.title', { name: this.task.name }),
        content: this.translateService.instant('task-read.delete-dialog.content'),
        confirmButtonText: this.translateService.instant('general.delete'),
        confirmButtonType: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === true) {
        if (!this.task) return;
        this.isLoading = true;
        await this.taskService.deleteTask(this.task.id);
        this.router.navigate([routePaths.tasks]);
      }
    });
  }
}
