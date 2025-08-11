{{ ... }}
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-video-test',
  template: `
    <div class="container mt-5">
      <h2>Test Video Player</h2>
      
      <div class="mb-3">
        <label for="videoUrl" class="form-label">URL Video</label>
        <input type="text" class="form-control" id="videoUrl" [(ngModel)]="videoPath">
        <button class="btn btn-primary mt-2" (click)="generateUrl()">Genera URL</button>
      </div>
      
      <div *ngIf="videoUrl" class="mb-3">
        <p>URL generato: {{videoUrl}}</p>
        <div class="ratio ratio-16x9">
          <video controls class="w-100">
            <source [src]="safeVideoUrl" type="video/mp4">
            Il tuo browser non supporta il tag video.
          </video>
        </div>
      </div>
      
      <div *ngIf="videoUrl" class="mb-3">
        <button class="btn btn-secondary" (click)="openInNewWindow()">Apri in nuova finestra</button>
      </div>
    </div>
  `,
  styles: []
})
export class VideoTestComponent implements OnInit {
  videoPath: string = '';
  videoUrl: string | null = null;
  safeVideoUrl: any = null;

  constructor(
    private apiService: ApiService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
  }

  generateUrl(): void {
    if (this.videoPath) {
      this.videoUrl = this.apiService.getVideoUrl(this.videoPath);
      this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.videoUrl);
      console.log('URL generato:', this.videoUrl);
      console.log('URL sanitizzato:', this.safeVideoUrl);
    }
  }

  openInNewWindow(): void {
    if (this.videoUrl) {
      window.open(this.videoUrl, '_blank');
    }
  }
}
{{ ... }}
