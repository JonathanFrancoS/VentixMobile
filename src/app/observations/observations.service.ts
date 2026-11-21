import { Injectable, signal } from '@angular/core';

export type ObservationPhoto = {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: string;
};

export type ObservationEntry = {
  id: string;
  text: string;
  createdAt: string;
  photos: ObservationPhoto[];
};

@Injectable({ providedIn: 'root' })
export class ObservationsService {
  readonly observations = signal<ObservationEntry[]>([]);
  private nextId = 0;

  addObservation(text: string): void {
    this.observations.update((observations) => [
      {
        id: this.createId(),
        text,
        createdAt: new Date().toISOString(),
        photos: [],
      },
      ...observations,
    ]);
  }

  updateObservation(id: string, text: string): void {
    this.observations.update((observations) =>
      observations.map((observation) => (observation.id === id ? { ...observation, text } : observation)),
    );
  }

  deleteObservation(id: string): void {
    this.observations.update((observations) => observations.filter((observation) => observation.id !== id));
  }

  addPhoto(observationId: string, name: string, dataUrl: string): void {
    this.observations.update((observations) =>
      observations.map((observation) =>
        observation.id === observationId
          ? {
              ...observation,
              photos: [
                ...observation.photos,
                { id: this.createId(), name, dataUrl, createdAt: new Date().toISOString() },
              ],
            }
          : observation,
      ),
    );
  }

  replacePhoto(observationId: string, photoId: string, name: string, dataUrl: string): void {
    this.observations.update((observations) =>
      observations.map((observation) =>
        observation.id === observationId
          ? {
              ...observation,
              photos: observation.photos.map((photo) => (photo.id === photoId ? { ...photo, name, dataUrl } : photo)),
            }
          : observation,
      ),
    );
  }

  deletePhoto(observationId: string, photoId: string): void {
    this.observations.update((observations) =>
      observations.map((observation) =>
        observation.id === observationId
          ? { ...observation, photos: observation.photos.filter((photo) => photo.id !== photoId) }
          : observation,
      ),
    );
  }

  reset(): void {
    this.observations.set([]);
    this.nextId = 0;
  }

  private createId(): string {
    this.nextId += 1;
    return `observation-${Date.now()}-${this.nextId}`;
  }
}
