import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoveLiquidityComponent } from './remove-liquidity.component';

describe('RemoveLiquidityComponent', () => {
  let component: RemoveLiquidityComponent;
  let fixture: ComponentFixture<RemoveLiquidityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RemoveLiquidityComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoveLiquidityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
