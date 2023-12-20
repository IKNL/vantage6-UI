import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, debounceTime } from 'rxjs';
import { Column, TableData } from 'src/app/models/application/table.model';

export interface SearchRequest {
  columnId: string;
  searchString: string;
}

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html'
})
export class TableComponent implements OnChanges {
  @Input() data?: TableData;
  @Output() rowClick = new EventEmitter<string>();
  @Output() searchChanged = new EventEmitter<SearchRequest[]>();

  columnsToDisplay: string[] = [];
  searchForm: FormGroup = new FormGroup('');
  searchFormDescription?: Subscription;

  constructor(private translate: TranslateService) {}

  ngOnChanges(): void {
    this.columnsToDisplay = this.data?.columns.map((column) => column.id) || [];
    this.initFormGroup();
  }

  initFormGroup(): void {
    this.searchFormDescription?.unsubscribe();

    if (this.data) {
      const searchColumns: Column[] = this.data.columns.filter((column) => column.searchEnabled);
      if (searchColumns.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formControls: any = {};

        searchColumns.forEach((column) => {
          formControls[column.id] = new FormControl(column.initSearchString);
        });
        this.searchForm = new FormGroup(formControls);

        this.searchFormDescription = this.searchForm.statusChanges.pipe(debounceTime(500)).subscribe(() => {
          const test = this.searchForm.getRawValue();
          const searchRequests: SearchRequest[] = Object.entries(test).map(([id, searchString]) => {
            return { columnId: id, searchString: searchString as string };
          });
          this.searchChanged.emit(searchRequests);
        });
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleRowClick(row: any) {
    this.rowClick.emit(row.id);
  }

  getPlaceholder(column: Column): string {
    return `${this.translate.instant('table.search-placeholder')} ${column.label}`;
  }
}
