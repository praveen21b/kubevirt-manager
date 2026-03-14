import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DataTablesModule } from 'angular-datatables';
import { SnapshotListComponent } from './snapshot-list.component';

describe('SnapshotListComponent', () => {
  let component: SnapshotListComponent;
  let fixture: ComponentFixture<SnapshotListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SnapshotListComponent ],
      imports: [ RouterTestingModule, DataTablesModule ],
      providers: [ provideHttpClient(), provideHttpClientTesting() ]
    }).compileComponents();

    fixture = TestBed.createComponent(SnapshotListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });
  it('should contain component title', () => {
    expect(fixture.nativeElement.querySelector('h3.card-title')?.textContent).toContain('VM Snapshots');
  });
  it('should contain Refresh item', () => {
    expect(fixture.nativeElement.querySelector('button[title="Refresh..."]')).toBeTruthy();
  });
  it('should contain New Snapshot item', () => {
    expect(fixture.nativeElement.querySelector('button[title="New Snapshot..."]')).toBeTruthy();
  });
  it('should contain Main Datatable', () => {
    expect(fixture.nativeElement.querySelector('#snapshotList_datatable')).toBeTruthy();
  });
  it('should contain Window: Snapshot Info', () => {
    expect(fixture.nativeElement.querySelector('#modal-info')).toBeTruthy();
  });
  it('should contain Window: New Snapshot', () => {
    expect(fixture.nativeElement.querySelector('#modal-new')).toBeTruthy();
  });
  it('should contain Window: Delete Snapshot', () => {
    expect(fixture.nativeElement.querySelector('#modal-delete')).toBeTruthy();
  });
});