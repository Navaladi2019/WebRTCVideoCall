import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-doctor-contact',
  templateUrl: './doctor-contact.component.html',
  styleUrls: ['./doctor-contact.component.css'],
})
export class DoctorContactComponent implements OnInit {
  currentUserId;
  currentUserRole;

  constructor() {}

  ngOnInit(): void {
    this.currentUserId = 'aa0d2254-7ebe-49d4-8124-83454a78ffd9';
    this.currentUserRole = 'patient';
  }
}
