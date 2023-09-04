import { TaskStatus } from '../models/api/task.models';

export const getChipTypeForStatus = (status: TaskStatus): 'default' | 'active' | 'success' | 'error' => {
  switch (status) {
    case TaskStatus.Initializing:
    case TaskStatus.Active:
      return 'active';
    case TaskStatus.Completed:
      return 'success';
    case TaskStatus.Failed:
    case TaskStatus.StartFailed:
    case TaskStatus.NoDockerImage:
    case TaskStatus.Crashed:
      return 'error';
    default:
      return 'default';
  }
};