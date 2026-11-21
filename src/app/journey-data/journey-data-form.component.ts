import { Component, inject, signal } from '@angular/core';
import { IonCard, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkOutline, createOutline, swapHorizontalOutline, trashOutline } from 'ionicons/icons';

import { JourneyDataService } from './journey-data.service';
import type { JourneyDataField, JourneyDateTimeFormat } from './journey-data.service';

type JourneyFieldConfig = {
  id: JourneyDataField;
  label: string;
  placeholder: string;
  type: 'text' | 'date';
};

@Component({
  selector: 'app-journey-data-form',
  templateUrl: './journey-data-form.component.html',
  styleUrls: ['./journey-data-form.component.scss'],
  imports: [IonCard, IonIcon],
})
export class JourneyDataFormComponent {
  readonly fields: JourneyFieldConfig[] = [
    {
      id: 'advisorName',
      label: 'Nombre del Asesor',
      placeholder: 'Escribe el nombre del asesor',
      type: 'text',
    },
    {
      id: 'advisorCode',
      label: 'Código del Asesor',
      placeholder: 'Escribe el código del asesor',
      type: 'text',
    },
    {
      id: 'salesPointName',
      label: 'Nombre del Punto de Venta',
      placeholder: 'Escribe el nombre del punto de venta',
      type: 'text',
    },
    {
      id: 'salesPointCode',
      label: 'Código Punto de Venta (opcional)',
      placeholder: 'Escribe el código del punto de venta',
      type: 'text',
    },
    {
      id: 'city',
      label: 'Ciudad',
      placeholder: 'Escribe la ciudad',
      type: 'text',
    },
  ];
  readonly editing = signal<Partial<Record<JourneyDataField, boolean>>>({});
  protected readonly journeyData = inject(JourneyDataService);

  constructor() {
    addIcons({ checkmarkOutline, createOutline, trashOutline, swapHorizontalOutline });
  }

  protected value(field: JourneyDataField): string {
    return this.journeyData.values()[field];
  }

  protected isEditing(field: JourneyDataField): boolean {
    return this.editing()[field] ?? false;
  }

  protected toggleEdit(field: JourneyDataField): void {
    this.editing.update((editing) => ({ ...editing, [field]: !editing[field] }));
  }

  protected updateField(field: JourneyDataField, event: Event): void {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('El dato de la jornada debe editarse desde un campo de formulario.');
    }

    void this.journeyData.setField(field, input.value);
  }

  protected clearField(field: JourneyDataField): void {
    void this.journeyData.clearField(field);
    this.editing.update((editing) => ({ ...editing, [field]: false }));
  }

  protected toggleDateTimeFormat(): void {
    const format: JourneyDateTimeFormat = this.journeyData.dateTimeFormat() === 'long' ? 'military' : 'long';
    this.journeyData.setDateTimeFormat(format);
  }
}
