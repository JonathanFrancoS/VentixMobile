import { Component, signal } from '@angular/core';
import { IonCard, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, cameraOutline, checkmarkOutline, closeOutline, createOutline, trashOutline } from 'ionicons/icons';

import { ObservationsService, type ObservationEntry, type ObservationPhoto } from './observations.service';

type PendingPhoto = {
  name: string;
  dataUrl: string;
};

@Component({
  selector: 'app-observations',
  templateUrl: './observations.component.html',
  styleUrls: ['./observations.component.scss'],
  imports: [IonCard, IonIcon],
})
export class ObservationsComponent {
  readonly newText = signal('');
  readonly editingObservations = signal<Record<string, boolean>>({});
  readonly observationDrafts = signal<Record<string, string>>({});
  readonly editingPhotos = signal<Record<string, boolean>>({});
  readonly pendingPhotos = signal<Record<string, PendingPhoto>>({});
  readonly photoError = signal('');

  constructor(protected readonly observationsService: ObservationsService) {
    addIcons({ addOutline, cameraOutline, checkmarkOutline, closeOutline, createOutline, trashOutline });
  }

  protected updateNewText(event: Event): void {
    const textarea = event.currentTarget;
    if (!(textarea instanceof HTMLTextAreaElement)) {
      throw new Error('La observación debe escribirse en el campo de texto.');
    }

    this.newText.set(textarea.value);
  }

  protected saveNewObservation(): void {
    const text = this.newText().trim();
    if (!text) {
      return;
    }

    this.observationsService.addObservation(text);
    this.newText.set('');
  }

  protected isEditingObservation(id: string): boolean {
    return this.editingObservations()[id] ?? false;
  }

  protected observationDraft(id: string): string {
    return this.observationDrafts()[id] ?? '';
  }

  protected startEditingObservation(observation: ObservationEntry): void {
    this.observationDrafts.update((drafts) => ({ ...drafts, [observation.id]: observation.text }));
    this.editingObservations.update((editing) => ({ ...editing, [observation.id]: true }));
  }

  protected updateObservationDraft(id: string, event: Event): void {
    const textarea = event.currentTarget;
    if (!(textarea instanceof HTMLTextAreaElement)) {
      throw new Error('La observación debe editarse en el campo de texto.');
    }

    this.observationDrafts.update((drafts) => ({ ...drafts, [id]: textarea.value }));
  }

  protected saveObservation(id: string): void {
    const text = this.observationDraft(id).trim();
    if (!text) {
      return;
    }

    this.observationsService.updateObservation(id, text);
    this.editingObservations.update((editing) => ({ ...editing, [id]: false }));
  }

  protected cancelObservationEdit(id: string): void {
    this.editingObservations.update((editing) => ({ ...editing, [id]: false }));
  }

  protected deleteObservation(id: string): void {
    this.observationsService.deleteObservation(id);
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
  }

  protected photoKey(observationId: string, photoId: string): string {
    return `${observationId}:${photoId}`;
  }

  protected photoSource(photo: ObservationPhoto, key: string): string {
    return this.pendingPhotos()[key]?.dataUrl ?? photo.dataUrl;
  }

  protected isEditingPhoto(key: string): boolean {
    return this.editingPhotos()[key] ?? false;
  }

  protected startPhotoEdit(key: string, input: HTMLInputElement): void {
    this.editingPhotos.update((editing) => ({ ...editing, [key]: true }));
    input.click();
  }

  protected hasPendingPhoto(key: string): boolean {
    return Boolean(this.pendingPhotos()[key]);
  }

  protected openPhotoPicker(input: HTMLInputElement): void {
    input.click();
  }

  protected async addPhoto(observationId: string, event: Event): Promise<void> {
    const input = this.fileInput(event);
    const file = input.files?.item(0);
    if (!file) {
      return;
    }

    this.photoError.set('');
    try {
      const dataUrl = await this.readPhoto(file);
      this.observationsService.addPhoto(observationId, file.name, dataUrl);
    } catch (error) {
      console.error('No se pudo cargar la fotografía de evidencia.', error);
      this.photoError.set('No se pudo cargar la fotografía. Inténtalo nuevamente.');
    } finally {
      input.value = '';
    }
  }

  protected async replacePhoto(observationId: string, photoId: string, event: Event): Promise<void> {
    const input = this.fileInput(event);
    const file = input.files?.item(0);
    if (!file) {
      return;
    }

    const key = this.photoKey(observationId, photoId);
    this.photoError.set('');
    try {
      const dataUrl = await this.readPhoto(file);
      this.pendingPhotos.update((photos) => ({ ...photos, [key]: { name: file.name, dataUrl } }));
    } catch (error) {
      console.error('No se pudo cargar la fotografía de reemplazo.', error);
      this.photoError.set('No se pudo cargar la fotografía. Inténtalo nuevamente.');
    } finally {
      input.value = '';
    }
  }

  protected savePhotoReplacement(observationId: string, photoId: string): void {
    const key = this.photoKey(observationId, photoId);
    const replacement = this.pendingPhotos()[key];
    if (!replacement) {
      return;
    }

    this.observationsService.replacePhoto(observationId, photoId, replacement.name, replacement.dataUrl);
    this.clearPhotoEdit(key);
  }

  protected cancelPhotoEdit(key: string): void {
    this.clearPhotoEdit(key);
  }

  protected deletePhoto(observationId: string, photoId: string): void {
    const key = this.photoKey(observationId, photoId);
    this.observationsService.deletePhoto(observationId, photoId);
    this.clearPhotoEdit(key);
  }

  private fileInput(event: Event): HTMLInputElement {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('La fotografía debe seleccionarse desde un campo de archivo.');
    }
    return input;
  }

  private readPhoto(file: File): Promise<string> {
    if (!file.type.startsWith('image/')) {
      return Promise.reject(new Error('El archivo seleccionado no es una imagen.'));
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          reject(new Error('No se pudo interpretar la fotografía seleccionada.'));
          return;
        }
        resolve(reader.result);
      };
      reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer la fotografía seleccionada.'));
      reader.readAsDataURL(file);
    });
  }

  private clearPhotoEdit(key: string): void {
    this.editingPhotos.update((editing) => ({ ...editing, [key]: false }));
    this.pendingPhotos.update((photos) => {
      const { [key]: removed, ...remaining } = photos;
      return remaining;
    });
  }
}
