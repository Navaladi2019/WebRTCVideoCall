import { User } from './../../../models/user';

import { Component, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-patient-contact',
  templateUrl: './patient-contact.component.html',
  styleUrls: ['./patient-contact.component.css']
})

//Doctor Page
export class PatientContactComponent implements OnInit {
  @ViewChild("doctorVideo") doctorVideo;
  currentUserId;
  roomId;
  hostId;
  connectedUserId;
  currentUserRole;
  users: User[] = [];
  constructor() { }

  ngOnInit(): void {
    this.currentUserId = '1d3cee0e-d24c-4bf2-bc61-2b89692e346b';
    this.hostId = '1d3cee0e-d24c-4bf2-bc61-2b89692e346b';
    const firstPatient:User = {
      id : 'aa0d2254-7ebe-49d4-8124-83454a78ffd9',
      email: 'room1@xyz.com',
      firstName: 'Room',
      lastName: '1',
      roles: ['patient'],
      isVerified: true,
      password: '',
      userName: ''
    }
    this.users.push(firstPatient);
    this.currentUserRole = 'doctor';
  }

}
