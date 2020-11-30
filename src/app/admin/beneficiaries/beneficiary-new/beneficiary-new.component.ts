import { Component, ElementRef } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest } from 'rxjs';
import { filter, first } from 'rxjs/operators';

import { KIV_ZONES, SPECIAL_CONDITIONS } from '@shared/constants';
import { BeneficiariesFacade } from '../beneficiaries.facade';
import { EsriMapComponent } from '@app/shared/esri-map/esri-map.component';

export const COMMON_FIELDS = {
  first_name: [null, Validators.required],
  last_name: [null, Validators.required],
  age: [null],
  zone: [null, Validators.required],
  latitude: [null, Validators.required],
  longitude: [null, Validators.required],
  address: [null, Validators.required],
  apartment: [null],
  entrance: [null],
  floor: [null],
  phone: [
    null,
    [Validators.required, Validators.minLength(8), Validators.maxLength(8)],
  ],
  landline: [
    null,
    // because we add prefix 22 at form submit.
    [Validators.required, Validators.minLength(6), Validators.maxLength(6)],
  ],
  special_condition: [null],
};

@Component({
  templateUrl: './beneficiary-new.component.html',
  styleUrls: ['./beneficiary-new.component.scss'],
})
export class BeneficiaryNewComponent {
  zones = KIV_ZONES;
  specialConditions = SPECIAL_CONDITIONS;
  form = this.fb.group(COMMON_FIELDS);

  constructor(
    private fb: FormBuilder,
    private matDialog: MatDialog,
    private serviceFacade: BeneficiariesFacade,
    private snackBar: MatSnackBar,
    private elementRef: ElementRef,
    public dialogRef: MatDialogRef<BeneficiaryNewComponent>
  ) {}

  closeDialog() {
    this.dialogRef.close();
  }

  onSubmit() {
    if (this.form.valid) {
      const payload = this.form.getRawValue();
      payload.landline = `22${payload.landline}`;

      this.serviceFacade.saveBeneficiary(payload);
      combineLatest([this.serviceFacade.isLoading$, this.serviceFacade.error$])
        .pipe(
          filter(([status, error]) => !status && !error),
          first()
        )
        .subscribe(() => {
          this.snackBar.open('Beneficiarul a fost salvat cu success.', '', {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
          });
          this.closeDialog();
        });
    } else {
      this.snackBar.open('Introduceți cîmpurile obligatorii', '', {
        duration: 5000,
        panelClass: 'info',
        horizontalPosition: 'right',
        verticalPosition: 'top',
      });

      const element = this.elementRef.nativeElement.querySelector(
        '.ng-invalid:not(form)'
      );

      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  showMapDialog() {
    this.matDialog
      .open<
        EsriMapComponent,
        { coors: number[]; address: string },
        { latitude: number; longitude: number; address: string }
      >(EsriMapComponent, {
        data: {
          coors: [
            this.form.get('latitude').value,
            this.form.get('longitude').value,
          ],
          address: this.form.get('address').value,
        },
        panelClass: 'esri-map',
        width: '80%',
        height: '80%',
        maxWidth: '100%',
        maxHeight: '100%',
      })
      .afterClosed()
      .pipe(first())
      .subscribe((coors) => {
        if (coors) {
          this.form.get('latitude').patchValue(coors.latitude);
          this.form.get('longitude').patchValue(coors.longitude);
          this.form.get('address').patchValue(coors.address);
        }
      });
  }
}
