angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope) {})

.controller('DiscoverCtrl', function($scope) {})

.controller('CanvasCtrl', function($scope, $firebase, $ionicLoading) {
  // class: Patch
  function Patch(channel, program, minVolume, freq) {
    this.channel = channel;
    this.program = program;
    this.minVolume = minVolume;
    this.volume = 0;
    this.density = 0;
    this.freq = freq;
  }
  Patch.prototype.increaseVolume = function() {
    if (this.volume === 0)
      this.volume = this.minVolume;
    if (this.volume < 127)
      this.volume = this.volume + 0.1;
  };
  Patch.prototype.decreaseVolume = function() {
    if (this.volume > 0)
      this.volume = this.volume - 0.1;
  };
  Patch.prototype.killVolume = function() {
      this.volume = 0;
  };
  Patch.prototype.increaseDensity = function() {
    this.density++;
  };
  Patch.prototype.decreaseDensity = function() {
    if (this.density > 0)
      this.density--;
  };

  // notes to midi object map
  var midiNotes = {
    c0: 0,
    c_0: 1,
    d0: 2,
    d_0: 3,
    e0: 4,
    f0: 5,
    f_0: 6,
    g0: 7,
    g_0: 8,
    a0: 9,
    a_0: 10,
    b0: 11,
    c1: (0 + 12),
    c_1: (1 + 12),
    d1: (2 + 12),
    d_1: (3 + 12),
    e1: (4 + 12),
    f1: (5 + 12),
    f_1: (6 + 12),
    g1: (7 + 12),
    g_1: (8 + 12),
    a1: (9 + 12),
    a_1: (10 + 12),
    b1: (11 + 12),
    c2: (0 + 24),
    c_2: (1 + 24),
    d2: (2 + 24),
    d_2: (3 + 24),
    e2: (4 + 24),
    f2: (5 + 24),
    f_2: (6 + 24),
    g2: (7 + 24),
    g_2: (8 + 24),
    a2: (9 + 24),
    a_2: (10 + 24),
    b2: (11 + 24)
  };

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

  // music globals
  var scale = [
    0, 2, 4, 6, 7, 9, 11
  ];

  var patches = [
    new Patch(0, 95, 0, 1000),
    new Patch(1, 0, 20, 2500),
    new Patch(2, 104, 10, 500),
    new Patch(3, 0, 10, 2000),
    new Patch(4, 0, 0, 500)
  ];

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
  var pixelDataRef = new Firebase('https://amber-torch-7567.firebaseio.com/canvas/1');
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

            pixelDataRef.child(touch.ox + ',' + touch.oy + ':' + touch.x + ',' + touch.y).set(brushColor + ':' + brushRadius);
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

    canvas.fillStyle = canvas.strokeStyle = brushColors[col];

    // console.log("Draw: ", coordsOld[0], coordsOld[1], coords[0], coords[1], canvas.fillStyle);

    canvas.lineWidth = radius;
    canvas.beginPath();
    canvas.moveTo(coordsOld[0], coordsOld[1]);
    canvas.lineTo(coords[0], coords[1]);
    canvas.stroke();

    patches[col].increaseVolume();
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
    var col = brushColors[snapshot.val().split(':')[0]];
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
      "pad_8_sweep",
      "sitar"
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

  function randInt(low, high) {
    return low + Math.floor(Math.random() * high);
  };

  // audio loopers
  var padLooper = setInterval(function () {
    MIDI.programChange(0, patches[0].program);
    var note = 24 + (12 * randInt(0, 1)) + scale[5];
    var velocity = patches[0].volume;
    MIDI.noteOn(0, note, velocity, 0);
    MIDI.noteOn(0, note + 12, velocity, 0);
    MIDI.noteOff(0, note, 2);
    MIDI.noteOff(0, note + 12, 2);
  }, patches[0].freq);

  var pianoLooper = setInterval(function () {
    MIDI.programChange(0, patches[1].program);
    var note = 48 + (12 * randInt(0, 1)) + scale[randInt(0, scale.length)];
    var velocity = patches[1].volume;
    MIDI.noteOn(0, note, velocity, 0);
    MIDI.noteOff(0, note, 2);
  }, patches[1].freq); 

  var chimesLooper = setInterval(function () {
    MIDI.programChange(0, patches[2].program);
    var note = 72 + (12 * randInt(0, 1)) + scale[randInt(0, scale.length)];
    var velocity = patches[2].volume;
    MIDI.noteOn(0, note, velocity, 0);
    MIDI.noteOff(0, note, 2);
  }, patches[2].freq); 

  var chordLooper = setInterval(function () {
    MIDI.programChange(0, patches[3].program);
    var note = 72 + (12 * randInt(0, 1)) + scale[randInt(0, scale.length)];
    var velocity = patches[3].volume;
    MIDI.noteOn(0, note, velocity, 0);
    MIDI.noteOff(0, note, 2);
    MIDI.noteOn(0, note + 12, velocity, 0);
    MIDI.noteOff(0, note + 12, 2);
  }, patches[3].freq); 

  // clear canvas
  $scope.clearCanvas = function() {
    pixelDataRef.remove(function () {
      console.log('Cleared canvas');

      for (var i = 0; i < brushColors.length; i++)
        patches[i].killVolume();
    });
  };
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
