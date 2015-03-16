angular.module('starter.controllers', [])

.controller('CanvasCtrl', function($scope, $stateParams, $firebase, $ionicLoading, $ionicHistory) {
  // Date.now() shim
  if (!Date.now) {
      Date.now = function() { 
        return new Date().getTime(); 
      }
  }

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
      this.volume = this.volume + 0.025;
  };
  Patch.prototype.decreaseVolume = function() {
    if (this.volume > 0)
      this.volume = this.volume - 0.025;
    if (Math.floor(this.volume) === this.minVolume)
      this.volume = 0;
  };
  Patch.prototype.killVolume = function() {
      this.volume = 0;
  };
  Patch.prototype.resetVolume = function() {
      this.volume = this.minVolume;
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
  var eraser = brushColors.length - 1;
  var brushRadius = 10;
  var kEraserCorrectionRadius = 1;

  // music globals
  var scale = [
    midiNotes['c0'],
    midiNotes['d_0'],
    midiNotes['f0'],
    midiNotes['g0'],
    midiNotes['a_0']
  ];

  var patches = [
    new Patch(0, 95, 0, 1000),
    new Patch(1, 0, 2, 3000),
    new Patch(2, 104, 1, 1000),
    new Patch(3, 0, 1, 2000),
    new Patch(4, 0, 0, 1000)
  ];

  var loopers = [];

  // canvas controls 
  var controlsUI = $('#brushes');
  for (var i = 0; i < brushColors.length; i++) {
    var brush = document.createElement('div');
    brush.className = 'brush ' + i;
    brush.style.background = brushColors[i];
    brush.style.width = ((controlsUIWidth / brushColors.length) - 3) + 'px';
    brush.style.height = '45px';
    controlsUI.append(brush);
  };

  $('.brush').click(function() {
    brushColor = this.className.split(' ')[1];
    for (var i = 0; i < brushColors.length; i++)
      $('.brush')[i].style.outline = '0px solid #fff';
    this.style.outline = '2px solid #fff';
  });

  // var FBref = new Firebase("https://amber-torch-7567.firebaseio.com/");
  // $scope.canvases = $firebase(FBref.child('canvases')).$asArray();
  // console.log($scope.canvases);

  // firebase reference
  var canvasId = $stateParams.canvasId;
  var pixelDataRef = new Firebase('https://amber-torch-7567.firebaseio.com/canvas/' + canvasId);
  // console.log('Canvas: ');
  // console.log(pixelDataRef);
  // pixelDataRef.orderByKey().on("child_added", function(snapshot) {
  //   console.log(snapshot.key());
  // });

  // var FBref = new Firebase("https://amber-torch-7567.firebaseio.com/");
  // var canvases = $firebase(FBref.child('canvases')).$asArray();
  // console.log(canvases);
  // console.log(canvases.$getRecord(canvasId));
  // console.log(canvases.$keyAt(canvasId));
  // console.log(canvases.$getRecord(canvasId));
  $scope.canvasTitle = 'Canvas ' + canvasId;

  console.log('firebase setup done');

  // canvas creation
  var canvas = Sketch.create({
      container: document.getElementById( 'canvas' ),
      autoclear: false,
      fullscreen: false,
      width: canvasWidth,
      height: canvasHeight,
      setup: function() {
        console.log('sketch setup');
        $('.brush')[0].click();
      },
      update: function() {
        // console.log('update');
        if ($('.brush-size')[0])
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

            pixelDataRef.child(Date.now() + ':' + touch.ox + ',' + touch.oy + ':' + touch.x + ',' + touch.y).set(brushColor + ':' + brushRadius);
        }
      }
  });

  pixelDataRef.on('child_added', function (snapshot) {
    var coordsOld = snapshot.key().split(':')[1].split(',');
    var coords = snapshot.key().split(':')[2].split(',');
    var col = snapshot.val().split(':')[0];
    var radius = snapshot.val().split(':')[1];

    canvas.lineCap = 'round';
    canvas.lineJoin = 'round';

    canvas.fillStyle = canvas.strokeStyle = brushColors[col];

    canvas.lineWidth = radius;
    canvas.beginPath();
    canvas.moveTo(coordsOld[0], coordsOld[1]);
    canvas.lineTo(coords[0], coords[1]);
    canvas.stroke();

    if (col == eraser) {
      console.log('Eraser!');
    }
    else {
      patches[col].increaseVolume();
      patches[col].increaseDensity();
    }
  });


  pixelDataRef.on('child_changed', function (snapshot) {
    var coordsOld = snapshot.key().split(':')[1].split(',');
    var coords = snapshot.key().split(':')[2].split(',');
    var col = brushColors[snapshot.val().split(':')[0]];
    var radius = snapshot.val().split(':')[1];

    canvas.lineCap = 'round';
    canvas.lineJoin = 'round';

    canvas.fillStyle = canvas.strokeStyle = col;

    canvas.lineWidth = radius;
    canvas.beginPath();
    canvas.moveTo(coordsOld[0], coordsOld[1]);
    canvas.lineTo(coords[0], coords[1]);
    canvas.stroke();
  });

  pixelDataRef.on('child_removed', function (snapshot) {
    var colorId = snapshot.val().split(':')[0];
    patches[colorId].decreaseVolume();
    patches[colorId].decreaseDensity();

    var coordsOld = snapshot.key().split(':')[1].split(',');
    var coords = snapshot.key().split(':')[2].split(',');
    var color = '#FFFFFF';
    canvas.fillStyle = canvas.strokeStyle = color;
    var radius = snapshot.val().split(':')[1];
    
    canvas.lineCap = 'round';
    canvas.lineJoin = 'round';

    canvas.lineWidth = radius + kEraserCorrectionRadius;
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
      console.log('MIDI loaded');
      $ionicLoading.hide();
    }
  });

  function randInt(low, high) {
    return low + Math.floor(Math.random() * high);
  };

  // audio loopers
  var padLooperCounter = 0;
  var rootNote = scale[0];
  var padLooper = setInterval(function () {
    MIDI.programChange(0, patches[0].program);
    if (patches[0].density > 200) 
      if (padLooperCounter % 32 == 0)
        rootNote = scale[randInt(0, scale.length - 1)];
    if (patches[0].density > 400) 
      if (padLooperCounter % 16 == 0)
        rootNote = scale[randInt(0, scale.length - 1)];
    if (patches[0].density > 600) 
      if (padLooperCounter % 8 == 0)
        rootNote = scale[randInt(0, scale.length - 1)];
    if (patches[0].density > 800) 
      if (padLooperCounter % 4 == 0)
        rootNote = scale[randInt(0, scale.length - 1)];
    if (patches[0].density > 1000) 
      if (padLooperCounter % 2 == 0)
        rootNote = scale[randInt(0, scale.length - 1)];

    padLooperCounter = (padLooperCounter + 1) % 32;
    var note = 36 + (12 * randInt(0, 1)) + rootNote;

    var velocity = patches[0].volume;
    MIDI.noteOn(0, note, velocity, 0);
    MIDI.noteOn(0, note + 12, velocity, 0);
    MIDI.noteOff(0, note, 2);
    MIDI.noteOff(0, note + 12, 2);
  }, patches[0].freq);
  loopers.push(padLooper);

  var pianoLooper = setInterval(function () {
    MIDI.programChange(0, patches[1].program);
    var note = 48 + (12 * randInt(0, 1)) + scale[randInt(0, scale.length)];
    var velocity = patches[1].volume;
    MIDI.noteOn(0, note, velocity, 0);
    MIDI.noteOff(0, note, 2);
  }, patches[1].freq); 
  loopers.push(pianoLooper);

  var chimesLooper = setInterval(function () {
    console.log(patches[2].volume);
    MIDI.programChange(0, patches[2].program);
    var note = 72 + (12 * randInt(0, 1)) + scale[randInt(0, scale.length)];
    var velocity = patches[2].volume;
    MIDI.noteOn(0, note, velocity, 0);
    MIDI.noteOff(0, note, 2);
  }, patches[2].freq); 
  loopers.push(chimesLooper);

  var chordLooper = setInterval(function () {
    MIDI.programChange(0, patches[3].program);
    var note = 72 + (12 * randInt(0, 1)) + scale[randInt(0, scale.length)];
    var velocity = patches[3].volume;
    MIDI.noteOn(0, note, velocity, 0);
    MIDI.noteOff(0, note, 2);
    MIDI.noteOn(0, note + 12, velocity, 0);
    MIDI.noteOff(0, note + 12, 2);
  }, patches[3].freq); 
  loopers.push(chordLooper);

  // clear canvas
  $scope.clearCanvas = function() {
    pixelDataRef.remove(function () {
      console.log('Cleared canvas');
    });
  };

  // custom back button
  $scope.backToCanvases = function () {
    // clear existing audio
    for (var i = 0; i < loopers.length; i++) {
      clearInterval(loopers[i]);
    }
    $ionicHistory.goBack();
  }
})

.controller('CanvasesCtrl', function($scope, $firebase, $ionicModal, $timeout) {
  var FBref = new Firebase("https://amber-torch-7567.firebaseio.com/");
  $scope.canvases = $firebase(FBref.child('canvases')).$asArray();

  // Form data for the createCanvasModal
  $scope.canvasData = {};

  $ionicModal.fromTemplateUrl('templates/createNewCanvas.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.canvasModal = modal;
  });

  // Triggered in the modal to close it
  $scope.closeCanvasModal = function() {
    $scope.canvasModal.hide();
  };

  // Open the modal
  $scope.openCanvasModal = function() {
    $scope.canvasModal.show();
    $scope.canvasData.title = 'New Canvas';
  };

  // Perform the login action when the user submits the login form
  $scope.createNewCanvas = function() {
    if ($scope.canvases.length != 0)
      $scope.canvasData.id = $scope.canvases[$scope.canvases.length - 1].id + 1;
    else 
      $scope.canvasData.id = 1;
    $scope.canvasData.painters = 0;
    console.log('Creating new canvas', $scope.canvasData);
    $scope.canvases.$add($scope.canvasData); 
    $scope.canvasData = {};
    $timeout(function() {
      $scope.closeCanvasModal();
    }, 50);
  };
});
