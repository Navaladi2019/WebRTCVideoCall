import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-video-control',
  templateUrl: './video-control.component.html',
  styleUrls: [
    './video-control.component.css',
    './video-control-media.component.css',
  ],
})
export class VideoControlComponent implements OnInit {
  @Input() videoStatus: boolean = true;
  @Input() audioStatus: boolean = true;
  @Input() screenStatus: boolean = true;
  @Input() isDoctor: boolean;

  @Output() toggleVideo = new EventEmitter();
  @Output() toggleAudio = new EventEmitter();
  @Output() toggleScreen = new EventEmitter();
  @Output() endCall = new EventEmitter();

  constructor() {}

  toggleVideoClick() {
    this.toggleVideo.emit();
  }

  toggleAudioClick() {
    this.toggleAudio.emit();
  }

  toggleScreenClick() {
    this.toggleScreen.emit();
  }

  callEndClick() {
    this.endCall.emit();
  }

  ngOnInit(): void {}
}
