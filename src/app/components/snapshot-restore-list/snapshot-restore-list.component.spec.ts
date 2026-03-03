import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnapshotRestoreListComponent } from './snapshot-restore-list.component';

describe('SnapshotRestoreListComponent', () => {
  let component: SnapshotRestoreListComponent;
  let fixture: ComponentFixture<SnapshotRestoreListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnapshotRestoreListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SnapshotRestoreListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
