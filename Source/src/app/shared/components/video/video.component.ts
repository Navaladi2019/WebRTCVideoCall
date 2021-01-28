import { ConfirmModalService } from './../confirm-modal/confirm-modal.service';
import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { Subscription, interval } from 'rxjs';
declare var $: any;

interface FsDocument extends HTMLDocument {
  mozFullScreenElement?: Element;
  msFullscreenElement?: Element;
  fullscreenElement: Element;
  msExitFullscreen?: () => void;
  mozCancelFullScreen?: () => void;
}

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.css', './video-media.component.css'],
})
export class VideoComponent implements OnInit {
  @ViewChild('videoContact') videoContact;
  @ViewChild('remoteVideo') remoteVideo;
  @ViewChild('localVideo') localVideo;

  @Input() currentUserId;
  @Input() roomId;
  @Input() hostId;
  @Input() connectedUserId;
  @Input() connectedUsername;
  @Input() users;
  @Input() currentUserRole: string;


  socketConnection: any;
  iceServerUrl: any;
  roomChannelData: any;
  statusCallActive: boolean = false;
  configuration: any;
  localPeerConnection: any;
  localVideoStream: MediaStream;
  remoteVideoStream: MediaStream;
  statusCallEnd: boolean = false;
  statusOnline: boolean = true;
  isNegotiating: boolean = false;
  signalServerMessage: any;
  iceRestart: boolean = false;
  pageActive: boolean = true;
  socketConnectionState: string;
  statusReconnection: boolean = false;
  reconnectionTimer: number = 0;
  reconnectionCount: number = 0;
  SocketInitialize: Function;
  statusCallLeave: boolean = false;
  screenHeight: number;
  videoStatus: boolean = true;
  audioStatus: boolean = true;
  screenStatus: boolean = true;
  roomListSubscription: Subscription;
  peerConnectionInitialize: Function;
  createJoinRoom: Function;
  endCall: Function;
  mediaInitialize: Function;
  senderTrack;
  localDataPeerConnection;
  isDataNegotiating: boolean = false;
  createDataChannel: Function;
  doctorChannel;
  loaderMessage: string;
  loaderHide: boolean = true;
  contactClickMessage: any;
  contactClickStatus: boolean = false;
  endCallEventStatus: boolean = false;
  logoutStatus: boolean = false;
  isDoctor: boolean;

  mediaConstraints: any = {
    audio: true,
    video: {
      width: { min: 320, ideal: 1280, max: 1280 },
      height: { min: 180, ideal: 720, max: 720 },
    },
  };

  counter: number;
  timerRef;
  running: boolean = false;
  startTimer;
  clearTimer;
  timerMessage;
  senderMediaStream = [];

  constructor(
    private _confirmModalService: ConfirmModalService
  ) {}


  openContact(): void {
    this.videoContact.contactWindow.open();
  }

  contactClick(message) {
    console.log('Parent: ', message);
    this.contactClickMessage = message;
    this.loaderHide = true;
    this.endCallEventStatus = false;

    this.connectCall(message);
  }

  contactClickEvent(selectedUserData) {
    if (
      this.localPeerConnection &&
      this.localPeerConnection.iceConnectionState == 'connected'
    ) {
      this._confirmModalService
        .confirm(
          'Alert!',
          'You are in a call. Please disconnect the call to connect with the next room'
        )
        .then((confirmed) => {})
        .catch(() => {});
    } else {
      this.contactClick(selectedUserData);
    }
  }

  connectCall(message) {
    console.log('testConnectCall');
    this.statusCallLeave = false;
    this.connectedUserId = message.userId.innerHTML.trim();
    this.connectedUsername = message.userName.innerHTML.trim();
    if (this.currentUserRole == 'doctor') {
      this.hostId = this.currentUserId;
      this.roomId = 'room@' + this.connectedUserId;
    } else {
      this.hostId = message.userId.innerHTML.trim();
      this.roomId = 'room@' + this.currentUserId;
    }

    this.peerConnectionInitialize();

    $('.contact').css('background', '#fff');
    $('.contact-connect mat-icon').css('color', '#cccccc');

    $('#' + this.connectedUserId.trim()).css('background', '#eeeeee');
    $('#' + this.connectedUserId.trim() + ' .contact-connect mat-icon').css(
      'color',
      '#cccccc'
    );
    $('#' + this.connectedUserId.trim() + ' .contact-connect').css(
      'pointer-events',
      'none'
    );
  }

  toggleVideoEvent() {
    let videoTracks = this.localVideoStream.getVideoTracks();
    if (videoTracks.length === 0) {
      return;
    }

    for (var i = 0; i < videoTracks.length; ++i) {
      videoTracks[i].enabled = !videoTracks[i].enabled;
    }
    this.videoStatus = videoTracks[0].enabled;
  }

  toggleAudioEvent() {
    var audioTracks = this.localVideoStream.getAudioTracks();
    if (audioTracks.length === 0) {
      return;
    }

    for (var i = 0; i < audioTracks.length; ++i) {
      audioTracks[i].enabled = !audioTracks[i].enabled;
    }
    this.audioStatus = audioTracks[0].enabled;
  }

  toggleScreenEvent() {
    const elem = <HTMLElement>document.querySelector('.video-content');
    console.log(elem.offsetHeight);
    if (
      elem.requestFullscreen &&
      (!this.screenHeight || this.screenHeight > elem.offsetHeight)
    ) {
      elem.requestFullscreen();
      this.screenStatus = false;
      this.screenHeight = elem.offsetHeight;
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      this.screenStatus = true;
      this.screenHeight = 0;
    }
  }

  EndCallEvent() {
    this.endCallEventStatus = true;
    this.loaderHide = true;
    this.endCall();
  }

  dummyEvent() {}

  ngOnInit(): void {
    let remoteStreamId: string;
    if (this.currentUserRole == 'doctor') {
      this.isDoctor = true;
    } else {
      this.isDoctor = false;
    }

    this.mediaInitialize = () => {
      return new Promise((resolve, reject) => {
        navigator.mediaDevices
          .getUserMedia(this.mediaConstraints)
          .then((localStream) => {
            const track = localStream.getVideoTracks()[0];
            const constraints = track.getConstraints();
            const settings = track.getSettings();

            if (this.localVideoStream) {
              closeLocalVideoStream().then(() => {
                this.localVideoStream = localStream;
                this.localVideo.nativeElement.srcObject = localStream;
                this.localVideo.nativeElement.muted = true;
              });
            } else {
              this.localVideoStream = localStream;
              this.localVideo.nativeElement.srcObject = localStream;
              this.localVideo.nativeElement.muted = true;
            }
          })
          .catch(function (e) {
            switch (e.name) {
              case 'NotFoundError':
                alert(
                  'Unable to open your call because no camera and/or microphone' +
                    'were found.'
                );
                break;
              case 'SecurityError':
              case 'PermissionDeniedError':
                break;
              default:
                alert(
                  'Error opening your camera and/or microphone: ' + e.message
                );
                break;
            }
            reject();
          });
        resolve();
      });
    };

    this.mediaInitialize().then(() => {
      this.SocketInitialize().then(() => {
        if (this.currentUserRole == 'patient') {
          this.peerConnectionInitialize();
        }
      });
    });

    this.SocketInitialize = () => {
      return new Promise((resolve, reject) => {
        try {
          this.socketConnection = new WebSocket(
            'wss://latlontech.com/cloudall'
          );
          this.socketConnection.onopen = OnSocketOpen;
          this.socketConnection.onmessage = OnSocketMessage;
          this.socketConnection.onclose = OnSocketClose;
          this.socketConnection.onerror = OnSocketError;
          resolve();
        } catch (err) {
          reject();
        }
      });
    };

    this.peerConnectionInitialize = () => {
      return new Promise((resolve, reject) => {
        this.statusCallEnd = false;
        this.senderMediaStream = [];

        this.localPeerConnection = new RTCPeerConnection(this.configuration);

        this.localPeerConnection.ontrack = onTrackPeerConnection;

        this.localPeerConnection.onicecandidate = onCandidatePeerConnection;

        if (this.currentUserRole == 'doctor') {
          this.localPeerConnection.onnegotiationneeded = onPeerConnectionNegotiation;
        }

        this.localPeerConnection.oniceconnectionstatechange = peerIceConnectionStateChange;

        this.localPeerConnection.onsignalingstatechange = peerConnectionSignalStateChange;

        this.localPeerConnection.onconnectionstatechange = peerConnectionStateChange;

        if (this.connectedUserId && this.connectedUserId != '') {
          this.mediaInitialize();
          this.createJoinRoom();
        }
        resolve();
      });
    };

    let exitHandler = () => {
      const fsDoc = <FsDocument>document;
      if (!fsDoc.fullscreenElement) {
        this.screenStatus = true;
        this.screenHeight = 0;
        console.log('ScreenStatus: ', this.screenStatus);
      }
    };

    document.addEventListener('fullscreenchange', exitHandler);
    document.addEventListener('webkitfullscreenchange', exitHandler);
    document.addEventListener('mozfullscreenchange', exitHandler);
    document.addEventListener('MSFullscreenChange', exitHandler);

    const SendSignalMessage = (signalMessage) => {
      return new Promise((resolve, reject) => {
        if (navigator.onLine) {
          if (this.socketConnection && this.socketConnection.readyState === 1) {
            this.socketConnection.send(JSON.stringify(signalMessage));
          } else if (this.statusCallEnd === false && !this.statusReconnection) {
            this.signalServerMessage = signalMessage;
            connectionError();
          }
          resolve();
        } else {
          reject();
        }
      });
    };

    const OnSocketOpen = () => {
      console.log('Client has been connected to the signalling server');
      SendSignalMessage({
        type: 'iceServer',
      });
    };

    const OnSocketMessage = (message) => {
      const receivedData = JSON.parse(message.data);
      if (receivedData.type != 'roomList') {
        console.log('Socket Message: ', message);
      }
      switch (receivedData.type) {
        case 'iceserverURL':
          handleIceServer(receivedData);
          break;
        case 'room':
          handleRoom(receivedData);
          break;
        case 'offer':
          if (receivedData.section == 'General') {
            handleOffer(receivedData);
          }
          break;
        case 'answer':
          if (receivedData.section == 'General') {
            handleAnswer(receivedData);
          }
          break;
        case 'candidate':
          if (receivedData.section == 'General') {
            handleCandidate(receivedData);
          }
          break;
        case 'leave':
          handleLeave(receivedData);
          break;
        case 'endRoom':
          handleEndRoom(receivedData);
          break;
        case 'roomList':
          handleRoomList(receivedData);
          break;
        case 'callTime':
          handleCallTime(receivedData);
          break;
        default:
          break;
      }
    };

    const OnSocketClose = (event) => {};

    const OnSocketError = (event) => {
      console.log('error in websocket');
      if (this.statusOnline) {
        this.SocketInitialize();
      }
    };

    let getRoomList = () => {
      if (this.statusOnline && this.socketConnection.readyState == 1) {
        SendSignalMessage({
          type: 'roomList',
          name: this.currentUserId,
        });
      }
    };

    let handleRoomList = (roomListData) => {
      $('.contact-connect mat-icon').css('color', '#cccccc');
      $('.contact-connect').css('pointer-events', 'none');
      if (this.connectedUserId && this.connectedUserId != '') {
        // console.log('check: ', this.connectedUserId);
        $('#' + this.connectedUserId.trim() + ' .contact-connect mat-icon').css(
          'color',
          '#cccccc'
        );
        $('#' + this.connectedUserId.trim() + ' .contact-connect').css(
          'pointer-events',
          'none'
        );
      }

      if (roomListData) {
        for (let key in roomListData.activeRooms) {
          if (
            roomListData.activeRooms[key].users &&
            roomListData.activeRooms[key].users.length == 1
          ) {
            let userId = roomListData.activeRooms[key].users[0];

            $('#' + userId + ' .contact-connect mat-icon').css(
              'color',
              '#00c2a7'
            );
            $('#' + userId + ' .contact-connect').css('pointer-events', '');
          }
        }
      }
    };

    this.createJoinRoom = () => {
      let roomUsername: string;
      // if (this.authenticationService && this.authenticationService.userValue) {
      //   roomUsername = this.authenticationService.userValue.firstName;
      // }
      SendSignalMessage({
        type: 'room',
        currentUserId: this.currentUserId,
        roomId: this.roomId,
        hostId: this.hostId,
        name: this.currentUserRole,
      });
    };

    let handleIceServer = (iceServerData) => {
      this.iceServerUrl = iceServerData.iceurl;

      if (this.currentUserRole == 'patient') {
        this.roomId = 'room@' + this.currentUserId;
        if (this.connectedUserId && this.connectedUserId != '') {
          SendSignalMessage({
            type: 'room',
            currentUserId: this.currentUserId,
            roomId: this.roomId,
            hostId: this.connectedUserId,
            name: this.currentUserRole,
          });
        } else {
          SendSignalMessage({
            type: 'room',
            currentUserId: this.currentUserId,
            roomId: this.roomId,
            name: this.currentUserRole,
          });
        }
      } else {
        const source = interval(1000);
        this.roomListSubscription = source.subscribe((val) => getRoomList());
        this.videoContact.contactWindow.open();
      }
    };

    const checkRoomStatus = () => {
      if (this.roomChannelData && this.roomChannelData.roomUsers) {
        let currentRoomUsers: any[] = this.roomChannelData.roomUsers.users;
        if (currentRoomUsers) {
          if (
            currentRoomUsers.length == 1 &&
            currentRoomUsers[0] != this.currentUserId
          ) {
            this.createJoinRoom();
          }
          if (
            currentRoomUsers.length == 0 ||
            (currentRoomUsers.length == 1 &&
              currentRoomUsers[0] == this.currentUserId &&
              !this.statusCallActive)
          ) {
            this.loaderHide = false;
            this.loaderMessage = 'Waiting for doctor to join the room';
          }
        }
      }
    };

    const onTrackPeerConnection = (event) => {
      console.log('On Track Event: ', event);
      remoteStreamId = event.streams[0].id;
      this.remoteVideoStream = event.streams[0];
      this.remoteVideo.nativeElement.srcObject = event.streams[0];
    };

    const onCandidatePeerConnection = (event) => {
      console.log('On Candidate Event: ', event);
      if (event.candidate) {
        SendSignalMessage({
          type: 'candidate',
          candidate: event.candidate,
          section: 'General',
          name: this.connectedUserId,
        });
      }
    };

    const onPeerConnectionNegotiation = (event) => {
      if (this.isNegotiating) {
        return;
      }

      if (this.localPeerConnection) {
        if (this.roomChannelData && this.roomChannelData.roomUsers) {
          const roomUsers = this.roomChannelData.roomUsers.users;
          if (roomUsers) {
            if (roomUsers.indexOf(this.currentUserId) != -1) {
              for (const userId of roomUsers) {
                if (userId == this.connectedUserId) {
                  this.isNegotiating = true;
                  this.connectedUserId = userId;
                  let peerOffer: any;

                  this.localPeerConnection
                    .createOffer()
                    .then((offer) => {
                      peerOffer = offer;
                      return this.localPeerConnection.setLocalDescription(
                        offer
                      );
                    })
                    .then(() => {
                      SendSignalMessage({
                        type: 'offer',
                        offer: peerOffer,
                        section: 'General',
                        name: userId,
                      });
                    });
                }
              }
            } else {
              this.createJoinRoom();
            }
          }
        }
      } else {
        console.log('Offer cannot be created ', this.localPeerConnection);
      }
    };

    const peerIceConnectionStateChange = (event) => {
      let startTime = sessionStorage.getItem('callStartTime');

      if (this.localPeerConnection) {
        switch (this.localPeerConnection.iceConnectionState) {
          case 'closed':
            this.statusCallEnd = true;
            break;
          case 'failed':
            console.log('ICE state: Failed');
            break;
          case 'disconnected':
            console.log('ICE state: Disconnected');

            if (this.statusCallEnd === false) {
              if (this.statusOnline) {
                this.loaderHide = false;
                this.loaderMessage = 'Reconnecting...';
              }
            } else if (this.signalServerMessage) {
              let failedMessage = this.signalServerMessage;
              SendSignalMessage(failedMessage);
              this.signalServerMessage = null;
            }
            break;
          case 'new':
            console.log('ICE state New');
            break;
          case 'checking':
            console.log('ICE state checking');
            break;
          case 'connected':
            this.contactClickStatus = false;
            this.statusCallActive = true;
            this.loaderHide = true;
            this.isNegotiating = false;
            this.reconnectionCount = 0;

            if (this.statusCallEnd) {
              SendSignalMessage({
                type: 'endRoom',
                name: this.currentUserId,
                connectedname: this.connectedUserId,
                roomId: this.roomId,
                state: 'end',
              });
            } else if (!startTime) {
              this.startTimer();
              sessionStorage.setItem('callStartTime', Date.now().toString());
            }
            break;
          case 'completed':
            console.log('ICE state completed');
            break;
        }
      }
    };

    const peerConnectionSignalStateChange = (event) => {
      if (this.localPeerConnection) {
        this.isNegotiating =
          this.localPeerConnection.signalingState != 'stable';
      }
    };

    const peerConnectionStateChange = (event) => {
      if (this.localPeerConnection) {
        if (this.localPeerConnection.connectionState == 'disconnected') {
          this.iceRestart = false;
          // if (this.pageActive) {
          //   // this.SocketInitialize();
          // }
        } else if (this.localPeerConnection.connectionState == 'new') {
          this.loaderHide = true;
          this.loaderMessage = '';
        }
      }
    };

    const addMediaTrack = () => {
      if (this.localVideoStream) {
        console.log('localVideoStream');
        let streamLength: number = this.senderMediaStream.length;

        const streamTrackPromise = new Promise((resolve, reject) => {
          this.localVideoStream.getTracks().forEach((track) => {
            console.log(
              'localPeerConnection add Track: ',
              this.senderMediaStream
            );
            if (this.localPeerConnection) {
              if (this.senderMediaStream.length < 2) {
                console.log('add Track: ', track.kind);

                this.senderMediaStream.push(
                  this.localPeerConnection.addTrack(
                    track,
                    this.localVideoStream
                  )
                );
              } else {
                console.log('replace Track: ', track.kind);
                let streamIndex: number;
                if (track.kind === 'video') {
                  streamIndex = this.senderMediaStream.indexOf(
                    (videoTrack) => videoTrack.track?.kind === 'video'
                  );
                  console.log('VideoStreamIndex: ', streamIndex);

                  this.localPeerConnection.removeTrack(
                    this.senderMediaStream.find(
                      (sender) => sender.track?.kind === 'video'
                    )
                  );
                } else if (track.kind === 'audio') {
                  streamIndex = this.senderMediaStream.indexOf(
                    (audioTrack) => audioTrack.track.kind === 'audio'
                  );
                  console.log('AudioStreamIndex: ', streamIndex);

                  this.localPeerConnection.removeTrack(
                    this.senderMediaStream.find(
                      (sender) => sender.track.kind === 'audio'
                    )
                  );
                }
                console.log('streamIndex: ', streamIndex);

                if (streamIndex > -1) {
                  this.senderMediaStream.splice(streamIndex, 1);
                }
                this.senderMediaStream.push(
                  this.localPeerConnection.addTrack(
                    track,
                    this.localVideoStream
                  )
                );
              }
            }
          });
          console.log(
            'localPeerConnection add Track End: ',
            this.senderMediaStream
          );
          resolve();
        });
        streamTrackPromise.then(() => {
          if (streamLength > 1 && this.currentUserRole == 'doctor') {
            restartIce();
          }
        });
      } else {
        console.log('addMediaTrack');

        this.mediaInitialize();
      }
    };

    let handleRoom = (roomData) => {
      this.roomChannelData = roomData;
      this.isNegotiating = false;

      checkRoomStatus();

      this.configuration = {
        iceServers: [this.iceServerUrl],
      };

      console.log('ICE Config: ', this.configuration);

      if (this.currentUserRole == 'doctor') {
        if (this.roomChannelData && this.roomChannelData.roomUsers) {
          let currentRoomUsers: any[] = this.roomChannelData.roomUsers.users;
          addMediaTrack();
        }
      }
    };

    let handleOffer = (offerData) => {
      let peerAnswer: any;
      this.localPeerConnection
        .setRemoteDescription(new RTCSessionDescription(offerData.offer))
        .then(() => {
          return navigator.mediaDevices.getUserMedia(this.mediaConstraints);
        })
        .then((stream) => {
          const track = stream.getVideoTracks()[0];
          const constraints = track.getConstraints();
          const settings = track.getSettings();

          if (this.localVideoStream) {
            closeLocalVideoStream().then(() => {
              this.localVideoStream = stream;
              this.localVideo.nativeElement.srcObject = stream;
              this.localVideo.nativeElement.muted = true;

              if (this.localPeerConnection) {
                stream.getTracks().forEach((track) => {
                  this.senderTrack = this.localPeerConnection.addTrack(
                    track,
                    stream
                  );
                });
              }
            });
          } else {
            this.localVideoStream = stream;
            this.localVideo.nativeElement.srcObject = stream;
            this.localVideo.nativeElement.muted = true;

            if (this.localPeerConnection) {
              stream.getTracks().forEach((track) => {
                this.senderTrack = this.localPeerConnection.addTrack(
                  track,
                  stream
                );
              });
            }
          }
        })
        .then(() => {
          return this.localPeerConnection.createAnswer();
        })
        .then((answer) => {
          this.connectedUserId = offerData.name;
          peerAnswer = answer;
          return this.localPeerConnection.setLocalDescription(answer);
        })
        .then(() => {
          SendSignalMessage({
            type: 'answer',
            answer: peerAnswer,
            section: 'General',
            name: offerData.name,
          });
        });
    };

    let handleAnswer = (answerData) => {
      this.localPeerConnection.setRemoteDescription(
        new RTCSessionDescription(answerData.answer)
      );
    };

    let handleCandidate = (candidateData) => {
      this.localPeerConnection.addIceCandidate(
        new RTCIceCandidate(candidateData.candidate)
      );
    };

    window.onpopstate = (event) => {
      logOutClose();
    };

    this.endCall = () => {
      return new Promise((resolve, reject) => {
        this.statusCallActive = false;

        if (this.timerRef) {
          clearInterval(this.timerRef);
        }
        this.timerRef = null;
        sessionStorage.removeItem('callStartTime');

        if (
          this.socketConnection &&
          this.socketConnection.readyState === 1 &&
          this.localPeerConnection &&
          this.localPeerConnection.connectionState == 'connected' &&
          this.statusOnline
        ) {
          SendSignalMessage({
            type: 'endRoom',
            name: this.currentUserId,
            connectedname: this.connectedUserId,
            roomId: this.roomId,
            state: 'end',
            // appointmentId: this.currentAppointmentId,
          });
        } else if (
          this.socketConnection &&
          this.socketConnection.readyState === 1 &&
          this.statusOnline
        ) {
          SendSignalMessage({
            type: 'endRoom',
            name: this.currentUserId,
            connectedname: null,
            roomId: this.roomId,
            state: 'end',
            // appointmentId: this.currentAppointmentId,
          });
        } else {
          let endRoomData: any = {
            type: 'endRoom',
            endby: this.currentUserId,
            roomId: this.roomId,
            state: 'end',
            // appointmentId: this.currentAppointmentId,
          };

          handleEndRoom(endRoomData);
        }
        resolve();
      });
    };

    let handleEndRoom = (endRoomData) => {
      this.statusCallEnd = true;
      this.pageActive = false;
      this.clearTimer();
      $('.contact').css('background', '#fff');

      if (endRoomData.endby != this.currentUserId) {
        this.loaderHide = false;
        if (this.currentUserRole == 'patient') {
          this.loaderMessage = 'Doctor has left the room';
        } else {
          this.loaderMessage = 'Patient has left the room';
        }
        setTimeout(() => {
          if (this.currentUserRole == 'patient') {
            this.loaderMessage = 'Waiting for doctor to join the room';
          } else {
            this.loaderHide = true;
            this.loaderMessage = '';
          }
        }, 10000);
      } else if (
        endRoomData.endby == this.currentUserId &&
        !this.contactClickStatus &&
        !this.statusCallLeave
      ) {
        this.loaderHide = false;
        this.loaderMessage = 'You have left the room';
        setTimeout(() => {
          this.loaderHide = true;
          this.loaderMessage = '';
        }, 10000);
      }

      if (endRoomData.state == 'pop') {
        closeSocketConnection().then(() => {
          this.connectedUserId = '';
          this.connectedUsername = '';
        });
      } else {
        if (this.currentUserRole == 'doctor') {
          closePeerConnection();
          if (endRoomData.endby != this.currentUserId) {
            SendSignalMessage({
              type: 'endRoom',
              name: this.currentUserId,
              // connectedname: this.connectedUserId,
              roomId: this.roomId,
              state: 'end',
              // appointmentId: this.currentAppointmentId,
            });
          }
        } else {
          closeRemoteVideoStream().then(() => {
            this.peerConnectionInitialize().then(() => {
              this.roomId = 'room@' + this.currentUserId;
              SendSignalMessage({
                type: 'room',
                currentUserId: this.currentUserId,
                roomId: this.roomId,
                name: this.currentUserRole,
              });
            });
          });
        }
      }

      this.connectedUserId = '';
      this.connectedUsername = '';
      this.roomId = '';
    };

    let handleLeave = (leaveData) => {
      this.statusCallLeave = true;
      if (this.currentUserRole == 'doctor' && this.roomId && !this.loaderHide) {
        console.log('leaveData: ', leaveData);
        this.loaderHide = false;
        this.loaderMessage = 'Patient has left the room';
        setTimeout(() => {
          this.loaderHide = true;
          this.loaderMessage = '';
        }, 10000);
        // closePeerConnection();
        // SendSignalMessage({
        //   type: 'endRoom',
        //   name: this.currentUserId,
        //   // connectedname: this.connectedUserId,
        //   roomId: this.roomId,
        //   state: 'end',
        //   // appointmentId: this.currentAppointmentId,
        // });
      } else if (
        this.currentUserRole == 'patient' &&
        this.roomId &&
        !this.loaderHide
      ) {
        this.clearTimer();
        this.loaderHide = false;
        this.loaderMessage = 'Doctor has left the room';
        setTimeout(() => {
          // this.loaderHide = true;
          this.loaderMessage = 'Waiting for doctor to join the room';
        }, 10000);
        this.connectedUserId = '';
        closeRemoteVideoStream().then(() => {
          this.peerConnectionInitialize();
        });
      }
    };

    let closeLocalVideoStream = () => {
      return new Promise((resolve, reject) => {
        if (this.localVideo.nativeElement.srcObject) {
          (<MediaStream>this.localVideo.nativeElement.srcObject)
            .getTracks()
            .forEach((track) => {
              track.stop();
            });
        }
        resolve();
      });
    };

    let closeRemoteVideoStream = () => {
      return new Promise((resolve, reject) => {
        if (this.remoteVideo.nativeElement.srcObject) {
          (<MediaStream>this.remoteVideo.nativeElement.srcObject)
            .getTracks()
            .forEach((track) => {
              track.stop();
            });
        }
        resolve();
      });
    };

    let closeSocketConnection = () => {
      return new Promise((resolve, reject) => {
        closePeerConnection().then(() => {
          if (this.socketConnection && this.socketConnection.readyState == 1) {
            console.log('connection state: ', this.socketConnection.readyState);
            this.socketConnection.close();
          }
        });
        resolve();
      });
    };

    let closePeerConnection = () => {
      return new Promise((resolve, reject) => {
        if (this.localPeerConnection) {
          this.localPeerConnection.ontrack = null;
          this.localPeerConnection.onremovetrack = null;
          this.localPeerConnection.onremovestream = null;
          this.localPeerConnection.onicecandidate = null;
          this.localPeerConnection.oniceconnectionstatechange = null;
          this.localPeerConnection.onsignalingstatechange = null;
          this.localPeerConnection.onicegatheringstatechange = null;
          this.localPeerConnection.onnegotiationneeded = null;
          this.localPeerConnection.close();
          this.localPeerConnection = null;
        }
        resolve();
      });
    };

    $('.account-detail mat-icon').on('click', function () {
      logOutClose();
    });

    let logOutClose = () => {
      this.logoutStatus = true;
      const promise1 = new Promise((resolve, reject) => {
        if (this.localVideoStream) {
          this.localVideoStream.getTracks().forEach((track) => {
            track.stop();
          });
        }
        resolve();
      });
      promise1.then(() => {
        this.loaderHide = true;
        this.videoContact.contactWindow.destroy();
        this.endCall();
        closeSocketConnection();
      });
    };

    let restartIce = () => {
      if (this.currentUserId == this.hostId) {
        let peerOffer: any;
        if (this.localPeerConnection) {
          this.localPeerConnection
            .createOffer({ iceRestart: true })
            .then((offer) => {
              peerOffer = offer;
              return this.localPeerConnection.setLocalDescription(offer);
            })
            .then(() => {
              SendSignalMessage({
                type: 'offer',
                offer: peerOffer,
                section: 'General',
                name: this.connectedUserId,
              });
            });
        }
      }
    };

    let updateOnlineStatus = (event) => {
      this.statusOnline = navigator.onLine;
      console.log('Online Status: ', this.statusOnline);
      if (this.statusOnline) {
        console.log('111111');
        this.loaderHide = true;
        this.loaderMessage = '';
        if (
          this.pageActive &&
          (!this.socketConnection ||
            (this.socketConnection && this.socketConnection.readyState != 1))
        ) {
          console.log('222222');

          if (this.currentUserRole == 'doctor') {
            this.hostId = this.currentUserId;
            this.roomId = 'room@' + this.connectedUserId;

            // this.peerConnectionInitialize();
            this.createJoinRoom();

            $('.contact').css('background', '#fff');
            $('.contact-connect mat-icon').css('color', '#cccccc');

            $('#' + this.connectedUserId.trim()).css('background', '#eeeeee');
            $(
              '#' + this.connectedUserId.trim() + ' .contact-connect mat-icon'
            ).css('color', '#cccccc');
            $('#' + this.connectedUserId.trim() + ' .contact-connect').css(
              'pointer-events',
              'none'
            );
          } else {
            console.log('44444');
            this.hostId = this.connectedUserId;
            this.roomId = 'room@' + this.currentUserId;

            console.log('connectedUserId: ', this.connectedUserId);
            // closeRemoteVideoStream().then(() => {
            // this.peerConnectionInitialize();
            // });

            // if (this.connectedUserId && this.connectedUserId != '') {
            //   SendSignalMessage({
            //     type: 'room',
            //     currentUserId: this.currentUserId,
            //     roomId: this.roomId,
            //     hostId: this.connectedUserId,
            //     name: this.authenticationService.userValue.firstName,
            //   });
            // } else {
            //   SendSignalMessage({
            //     type: 'room',
            //     currentUserId: this.currentUserId,
            //     roomId: this.roomId,
            //     name: this.authenticationService.userValue.firstName,
            //   });
            // }
            this.SocketInitialize();
          }
        }
        this.loaderHide = true;
      } else {
        this.loaderHide = false;
        this.loaderMessage = 'Slow or poor internet connection. Reconnecting';
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    let connectionError = () => {
      console.log('Connection Error');
      if (navigator.onLine) {
        socketConnectionStatus().then(() => {
          if (this.socketConnectionState === 'open') {
            this.statusReconnection = false;
            this.reconnectionTimer = 0;
            SendSignalMessage({
              type: 'room',
              currentUserId: this.currentUserId,
              roomId: this.roomId,
              hostId: this.hostId,
              name: this.currentUserRole,
            });
          } else {
            this.statusReconnection = true;
            this.reconnectionCount = this.reconnectionCount + 1;
            if (this.pageActive && this.reconnectionCount < 6) {
              this.SocketInitialize();
            } else {
              console.log(
                'Failed to reconnect. Exceeded number of attempts to reconnect'
              );
            }
          }
          return this.socketConnectionState;
        });
      }
    };

    let socketConnectionStatus = () => {
      return new Promise((resolve, reject) => {
        switch (this.socketConnection.readyState) {
          case 0:
            this.socketConnectionState = 'connecting';
            break;
          case 1:
            this.socketConnectionState = 'open';
            break;
          case 2:
            this.socketConnectionState = 'closing';
            break;
          case 3:
            this.socketConnectionState = 'closed';
            break;
        }
        resolve();
      });
    };

    this.startTimer = () => {
      console.log('start timer');
      let secondOptions = {
        second: 'numeric',
        hour12: false,
        timezone: 'UTC',
      };
      let minuteOptions = {
        minute: 'numeric',
        hour12: false,
      };
      let hourOptions = {
        hour: 'numeric',
        hour12: false,
      };
      this.running = !this.running;
      if (this.running) {
        const startTime = Date.now() - (this.counter || 0);

        this.timerRef = setInterval(() => {
          this.counter = Date.now() - startTime;

          let stringSeconds = new Intl.DateTimeFormat(
            'en-GB',
            secondOptions
          ).format(this.counter);
          let seconds: number = +stringSeconds;

          let timerSeconds = seconds < 10 ? '0' + seconds : seconds;
          let stringMinute = new Intl.DateTimeFormat(
            'en-GB',
            minuteOptions
          ).format(this.counter);
          var minute: number = +stringMinute - 30;
          let timerMinute = minute < 10 ? '0' + minute : minute;

          var stringHour = new Intl.DateTimeFormat('en-GB', hourOptions).format(
            this.counter
          );
          var hour: number = +stringHour - 5;
          let timerHour = hour < 10 ? '0' + hour : hour;
          this.timerMessage =
            timerHour + ':' + timerMinute + ':' + timerSeconds;
          $('#dummyBtn').trigger('click');
        }, 1000);
      } else {
        clearInterval(this.timerRef);
      }
    };

    this.clearTimer = () => {
      this.running = false;
      this.counter = undefined;
      clearInterval(this.timerRef);
      this.timerMessage = '';
    };

    let handleCallTime = (callTimeData) => {
      const startTime = sessionStorage.getItem('callStartTime');
    };
  }

  ngOnDestroy() {
    if (this.roomListSubscription) {
      this.roomListSubscription.unsubscribe();
    }
    clearInterval(this.timerRef);
  }
}
