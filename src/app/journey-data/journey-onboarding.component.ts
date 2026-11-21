import { Component, computed, inject, signal } from '@angular/core';
import { IonButton } from '@ionic/angular';

import { JourneyDataService, type JourneyDataField, type JourneyDataValues } from './journey-data.service';

type JourneySetupStep = {
  field: JourneyDataField;
  heading: string;
  label: string;
  description: string;
  placeholder: string;
  autocomplete: string;
  required: boolean;
};

const journeySetupSteps: JourneySetupStep[] = [
  {
    field: 'advisorName',
    heading: '¿Cómo te llamas?',
    label: 'Nombre del asesor',
    description: 'Este nombre aparecerá en el saludo de Inicio.',
    placeholder: 'Ej. Brian Tracy',
    autocomplete: 'name',
    required: true,
  },
  {
    field: 'advisorCode',
    heading: '¿Cuál es tu código de asesor?',
    label: 'Código del asesor',
    description: 'Ingresa el código asignado a tu perfil.',
    placeholder: 'Escribe tu código',
    autocomplete: 'off',
    required: true,
  },
  {
    field: 'salesPointName',
    heading: '¿En qué punto de venta estás?',
    label: 'Nombre del punto de venta',
    description: 'Registra el establecimiento donde realizarás la jornada.',
    placeholder: 'Ej. Tienda Central',
    autocomplete: 'organization',
    required: true,
  },
  {
    field: 'salesPointCode',
    heading: '¿Cuál es el código del punto de venta?',
    label: 'Código del punto de venta',
    description: 'Es opcional; puedes continuar sin ingresar un código.',
    placeholder: 'Escribe el código',
    autocomplete: 'off',
    required: false,
  },
  {
    field: 'city',
    heading: '¿En qué ciudad estás?',
    label: 'Ciudad',
    description: 'Este dato es opcional; puedes continuar sin completarlo.',
    placeholder: 'Ej. Medellín',
    autocomplete: 'address-level2',
    required: false,
  },
];

@Component({
  selector: 'app-journey-onboarding',
  templateUrl: './journey-onboarding.component.html',
  styleUrls: ['./journey-onboarding.component.scss'],
  imports: [IonButton],
})
export class JourneyOnboardingComponent {
  protected readonly stepIndex = signal(0);
  protected readonly step = computed(() => journeySetupSteps[this.stepIndex()]);
  protected readonly progress = computed(() => ((this.stepIndex() + 1) / journeySetupSteps.length) * 100);
  protected readonly errorMessage = signal('');
  protected readonly isSaving = signal(false);

  private readonly journeyData = inject(JourneyDataService);
  private readonly draft = signal<JourneyDataValues>({
    advisorName: '',
    advisorCode: '',
    salesPointName: '',
    salesPointCode: '',
    city: '',
  });

  protected currentValue(): string {
    return this.draft()[this.step().field];
  }

  protected updateValue(event: Event): void {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Los datos de la jornada deben ingresarse desde un campo de texto.');
    }

    const field = this.step().field;
    this.draft.update((values) => ({ ...values, [field]: input.value }));
    this.errorMessage.set('');
  }

  protected previousStep(): void {
    if (this.stepIndex() === 0) {
      return;
    }

    this.stepIndex.update((index) => index - 1);
    this.errorMessage.set('');
  }

  protected async nextStep(event: Event): Promise<void> {
    event.preventDefault();
    const currentStep = this.step();
    const value = this.draft()[currentStep.field].trim();

    if (currentStep.required && !value) {
      this.errorMessage.set('Este dato es obligatorio para iniciar la jornada.');
      return;
    }

    if (this.stepIndex() < journeySetupSteps.length - 1) {
      this.stepIndex.update((index) => index + 1);
      this.errorMessage.set('');
      return;
    }

    this.isSaving.set(true);
    try {
      const values = this.draft();
      await this.journeyData.startJourney(values);
    } catch {
      this.errorMessage.set('No se pudo guardar la jornada. Revisa el almacenamiento e inténtalo nuevamente.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
