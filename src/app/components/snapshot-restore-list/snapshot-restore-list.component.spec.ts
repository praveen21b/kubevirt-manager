import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DataTablesModule } from 'angular-datatables';
import { SnapshotRestoreListComponent } from './snapshot-restore-list.component';

describe('SnapshotRestoreListComponent', () => {
  let component: SnapshotRestoreListComponent;
  let fixture: ComponentFixture<SnapshotRestoreListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SnapshotRestoreListComponent ],
      imports: [ RouterTestingModule, DataTablesModule ],
      providers: [ provideHttpClient(), provideHttpClientTesting() ]
    }).compileComponents();

    fixture = TestBed.createComponent(SnapshotRestoreListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });
  it('should contain component title', () => {
    expect(fixture.nativeElement.querySelector('h3.card-title')?.textContent).toContain('VM Restores');
  });
  it('should contain Refresh item', () => {
    expect(fixture.nativeElement.querySelector('button[title="Refresh..."]')).toBeTruthy();
  });
  it('should contain New Restore item', () => {
    expect(fixture.nativeElement.querySelector('button[title="New Restore..."]')).toBeTruthy();
  });
  it('should contain Main Datatable', () => {
    expect(fixture.nativeElement.querySelector('#restoreList_datatable')).toBeTruthy();
  });
  it('should contain Window: Restore Info', () => {
    expect(fixture.nativeElement.querySelector('#modal-info')).toBeTruthy();
  });
  it('should contain Window: New Restore', () => {
    expect(fixture.nativeElement.querySelector('#modal-new')).toBeTruthy();
  });
  it('should contain Window: Delete Restore', () => {
    expect(fixture.nativeElement.querySelector('#modal-delete')).toBeTruthy();
  });
});