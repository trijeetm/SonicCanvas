angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope) {})

.controller('DiscoverCtrl', function($scope) {})

.controller('CanvasCtrl', function($scope, $firebase, $ionicLoading) {
  // block UI till canvas loaded
  $ionicLoading.show({
    template: 'Loading Sonic Canvas...'
  });

  // canvas globals
  var controlsUIHeight = 49 + 24;
  var controlsUIWidth = $(window).width();
  var canvasWidth = $(window).width();
  var canvasHeight = $(window).height() - controlsUIHeight;
  var brushColor = 0;
  var brushColors = [
    '#445878', 'orange', 'crimson', 'dodgerblue', 'teal', 'yellowgreen', 'white'
  ];
  var brushRadius = 10;
  var kMaxBrushRadius = 20;

  // canvas controls 
  var controlsUI = $('#brushes');
  for (var i = 0; i < brushColors.length; i++) {
    var brush = document.createElement('div');
    brush.className = 'brush ' + i;
    brush.style.background = brushColors[i];
    brush.style.width = ((controlsUIWidth / brushColors.length) - 3) + 'px';
    brush.style.height = '45px';
    console.log('creating brush ' + i);
    console.log('added brush ' + i);
    controlsUI.append(brush);
  };

  $('.brush').click(function() {
    brushColor = this.className.split(' ')[1];
    for (var i = 0; i < brushColors.length; i++)
      $('.brush')[i].style.outline = '0px solid #fff';
    this.style.outline = '2px solid #fff';
    console.log('changed color to: ' + brushColor);
  });

  // firebase reference
  var pixelDataRef = new Firebase('https://amber-torch-7567.firebaseio.com/');
  console.log('firebase setup done');

  // canvas creation
  var canvas = Sketch.create({
      container: document.getElementById( 'canvas' ),
      autoclear: false,
      fullscreen: false,
      width: canvasWidth,
      height: canvasHeight,
      setup: function() {
        console.log( 'sketch setup' );
        $('.brush')[0].click();
      },
      update: function() {
        // console.log('update');
        brushRadius = $('.brush-size')[0].value;
      },
      // Event handlers
      keydown: function() {
        if ( this.keys.C ) this.clear();
      },
      // Mouse & touch events are merged, so handling touch events by default
      // and powering sketches using the touches array is recommended for easy
      // scalability. If you only need to handle the mouse / desktop browsers,
      // use the 0th touch element and you get wider device support for free.
      touchmove: function() {
        for ( var i = this.touches.length - 1, touch; i >= 0; i-- ) {
            touch = this.touches[i];

            this.fillStyle = this.strokeStyle = brushColors[brushColor];

            pixelDataRef.child(touch.ox + ',' + touch.oy + ':' + touch.x + ',' + touch.y).set(this.fillStyle + ':' + brushRadius);
        }
      }
  });

  pixelDataRef.on('child_added', function (snapshot) {
    var coordsOld = snapshot.key().split(':')[0].split(',');
    var coords = snapshot.key().split(':')[1].split(',');
    var col = snapshot.val().split(':')[0];
    var radius = snapshot.val().split(':')[1];

    canvas.lineCap = 'round';
    canvas.lineJoin = 'round';

    canvas.fillStyle = canvas.strokeStyle = col;

    // console.log("Draw: ", coordsOld[0], coordsOld[1], coords[0], coords[1], canvas.fillStyle);

    canvas.lineWidth = radius;
    canvas.beginPath();
    canvas.moveTo(coordsOld[0], coordsOld[1]);
    canvas.lineTo(coords[0], coords[1]);
    canvas.stroke();

    // MIDI.programChange(0, 95);
    // var note = Math.floor((coords[0] / 400) * 127);
    // if (note < 24) note = 24;
    // if (note > 127) note = 127;
    // var velocity = Math.floor((coords[1] / 500) * 127);
    // if (velocity > 127) velocity = 127;
    // MIDI.noteOn(0, note, velocity, 0);
    // MIDI.noteOff(0, note, 2);
  });

  pixelDataRef.on('child_changed', function (snapshot) {
    var coordsOld = snapshot.key().split(':')[0].split(',');
    var coords = snapshot.key().split(':')[1].split(',');
    var col = snapshot.val().split(':')[0];
    var radius = snapshot.val().split(':')[1];

    canvas.lineCap = 'round';
    canvas.lineJoin = 'round';

    canvas.fillStyle = canvas.strokeStyle = col;

    // console.log("Draw: ", coordsOld[0], coordsOld[1], coords[0], coords[1], canvas.fillStyle);

    canvas.lineWidth = radius;
    canvas.beginPath();
    canvas.moveTo(coordsOld[0], coordsOld[1]);
    canvas.lineTo(coords[0], coords[1]);
    canvas.stroke();
  });

  pixelDataRef.on('child_removed', function (snapshot) {
    var coordsOld = snapshot.key().split(':')[0].split(',');
    var coords = snapshot.key().split(':')[1].split(',');
    var col = '#FFFFFF';

    canvas.lineCap = 'round';
    canvas.lineJoin = 'round';

    canvas.fillStyle = canvas.strokeStyle = col;

    // console.log("Draw: ", coordsOld[0], coordsOld[1], coords[0], coords[1], canvas.fillStyle);

    canvas.lineWidth = kMaxBrushRadius * 2;
    canvas.beginPath();
    canvas.moveTo(coordsOld[0], coordsOld[1]);
    canvas.lineTo(coords[0], coords[1]);
    canvas.stroke();
  });

  // MIDI 
  MIDI.loadPlugin({
    soundfontUrl: "./soundfont/FluidR3_GM/",
    instruments: [
      "acoustic_grand_piano", 
      "pad_8_sweep" 
    ],
    callback: function() {
      // MIDI.noteOn(0, 1, 1, 0);
      console.log('MIDI loaded');
      $ionicLoading.hide();
      // MIDI.programChange(0, 95);
      // MIDI.noteOn(0, 36, 120, 0);
      // MIDI.noteOff(0, 36, 5);
    }
  });
})

.controller('ChatsCtrl', function($scope, Chats) {
  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  }
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('FriendsCtrl', function($scope, Friends) {
  $scope.friends = Friends.all();
})

.controller('FriendDetailCtrl', function($scope, $stateParams, Friends) {
  $scope.friend = Friends.get($stateParams.friendId);
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
