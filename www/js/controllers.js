angular.module('starter.controllers', [])

.controller('CanvasCtrl', function($scope, $stateParams, $firebase, $ionicLoading, $ionicHistory) {
  // Date.now() shim
  if (!Date.now) {
      Date.now = function() { 
        return new Date().getTime(); 
      }
  }

  // class: Looper
  var kLooperCounterLimit = 32;
  function Looper (period, type) {
    this.id = -1;
    this.period = period;
    this.type = type;
    this.counter = 0;
  };
  Looper.prototype.advanceCounter = function() {
    this.counter = (this.counter + 1) % kLooperCounterLimit;
  };
  Looper.prototype.isNthBeat = function(beatNo) {
    if (this.counter % beatNo == 0)
      return true;
    else
      return false;
  };

  // class: Patch
  function Patch(channel, program, minVolume, deltaVol, lowestNote, octaveRange, harmony) {
    this.channel = channel;
    this.program = program;
    this.minVolume = minVolume;
    this.deltaVol = deltaVol;
    this.lowestNote = lowestNote;
    this.octaveRange = octaveRange;
    this.harmony = harmony;
    this.volume = 0;
    this.density = 0;
  };
  Patch.prototype.firePatch = function(note, gain) {
    var program = this.program;
    if (this.program == 122)
      program = 122 + randInt(0, 2);
    MIDI.programChange(this.channel, program);
    note = (randInt(0, this.octaveRange) * 12) + this.lowestNote + note;
    MIDI.noteOn(this.channel, note, this.volume * gain, 0);
    MIDI.noteOff(this.channel, note, 2);
    if (this.harmony != 0) {
      MIDI.noteOn(this.channel, note + this.harmony, this.volume * gain, 0);
      MIDI.noteOff(this.channel, note + this.harmony, 2);
    }
  };
  Patch.prototype.increaseVolume = function() {
    if (this.volume == 0)
      this.volume = this.minVolume;
    if (this.volume < 127)
      this.volume = this.volume + this.deltaVol;
  };
  Patch.prototype.decreaseVolume = function() {
    if (this.volume > 0)
      this.volume = this.volume - this.deltaVol;
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
    'slategrey', '#445878', 'slateblue', 'dodgerblue', 'white',
    'teal', 'yellowgreen', 'gold', 'orange', 'crimson'
  ];
  // var eraser = brushColors.length - 1;
  var brushRadius = 10;
  var kEraserCorrectionRadius = 1;

  // music globals
  var scaleTypes = [];
  var pentatonicMajorOffsets = [
    midiNotes['c0'],
    midiNotes['d0'],
    midiNotes['f0'],
    midiNotes['g0'],
    midiNotes['a0']
  ];
  var pentatonicMinorOffsets = [
    midiNotes['c0'],
    midiNotes['d_0'],
    midiNotes['f0'],
    midiNotes['g0'],
    midiNotes['a_0']
  ];
  scaleTypes.push(pentatonicMinorOffsets);
  scaleTypes.push(pentatonicMajorOffsets);
  var root = ($stateParams.canvasId * 69) % 12;
  var scaleType = ($stateParams.canvasId * 69) % 2;
  var scale = [];
  for (var i = 0; i < scaleTypes[scaleType].length; i++) {
    scale.push(root + scaleTypes[scaleType][i]);
  }

  console.log(scaleType, root, scale);

  var padPatches = [
    new Patch(0, 95, 0, 0.01, 24, 2, 12),   // sweep
    new Patch(1, 93, 0, 0.01, 48, 2, 12),   // metal
    new Patch(2, 102, 0, 0.02, 72, 2, 0),   // echodrops
    new Patch(3, 42, 0, 0.01, 36, 2, 7),   // cello
    new Patch(4, 122, 0.5, 0.05, 24, 4, 0)    // sea/bird
  ];
  var percPatches = [
    new Patch(5, 116, 10, 0.05, 24, 1, 12),   // taiko
    new Patch(6, 14, 1, 0.03, 48, 2, 12),   // bells
    new Patch(7, 9, 1, 0.03, 60, 2, 12)   // glock
  ];
  var leadPatches = [
    new Patch(8, 104, 0, 0.02, 48, 3, 12),   // sitar
    new Patch(9, 46, 0, 0.015, 60, 3, 12),   // harp
  ];
  var patches = padPatches.concat(percPatches).concat(leadPatches);
  console.log(patches);
  var loopers = [];

  // canvas controls 
  var controlsUI = $('#brushes');
  var brushSet = document.createElement('div');
  brushSet.className = 'brushset pad';
  controlsUI.append(brushSet);
  for (var i = 0; i < brushColors.length / 2; i++) {
    var brush = document.createElement('div');
    brush.className = 'brush ' + i;
    brush.style.background = brushColors[i];
    brush.style.width = ((controlsUIWidth / (brushColors.length / 2)) - 3) + 'px';
    brush.style.height = '60px';
    $(brushSet).append(brush);
  };
  brushSet = document.createElement('div');
  brushSet.className = 'brushset perc';
  controlsUI.append(brushSet);
  for (var i = brushColors.length / 2; i < brushColors.length; i++) {
    var brush = document.createElement('div');
    brush.className = 'brush ' + i;
    brush.style.background = brushColors[i];
    brush.style.width = ((controlsUIWidth / (brushColors.length / 2)) - 3) + 'px';
    brush.style.height = '60px';
    $(brushSet).append(brush);
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

            pixelDataRef.child(Date.now() + ':' + Math.floor(touch.ox) + ',' + Math.floor(touch.oy) + ':' + Math.floor(touch.x) + ',' + Math.floor(touch.y)).set(brushColor + ':' + brushRadius);
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

    // if (col == eraser) {
    //   console.log('Eraser!');
    // }
    // else {
    patches[col].increaseVolume();
    patches[col].increaseDensity();
    // }
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
      "pad_8_sweep",
      "cello",
      "pad_6_metallic",
      "fx_7_echoes",
      "bird_tweet",
      "seashore",
      "sitar",
      "orchestral_harp",
      "taiko_drum",
      "glockenspiel",
      "tubular_bells",
      "acoustic_grand_piano"
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
  var rootNote = scale[0];
  var padLooper = new Looper(1000, 'pad');
  padLooper.id = setInterval(function () {
    padLooper.advanceCounter();
    
    var maxDensity = padPatches[0].density;
    for (var i = 1; i < padPatches.length; i++) {
      if (padPatches[i].density > maxDensity)
        maxDensity = padPatches[i].density;
    }

    if (maxDensity > 200) 
      if (padLooper.isNthBeat(32))
        rootNote = scale[randInt(0, scale.length)];
    if (maxDensity > 400) 
      if (padLooper.isNthBeat(16))
        rootNote = scale[randInt(0, scale.length)];
    if (maxDensity > 600) 
      if (padLooper.isNthBeat(8))
        rootNote = scale[randInt(0, scale.length)];
    if (maxDensity > 800) 
      if (padLooper.isNthBeat(4))
        rootNote = scale[randInt(0, scale.length)];
    if (maxDensity > 1000) 
      if (padLooper.isNthBeat(2))
        rootNote = scale[randInt(0, scale.length)];

    for (var i = 0; i < padPatches.length; i++) {
      padPatches[i].firePatch(rootNote, 1);
    }
  }, padLooper.period);
  loopers.push(padLooper);

  var percLooper = new Looper(500, 'perc');
  percLooper.id = setInterval(function () {
    percLooper.advanceCounter();

    for (var i = 0; i < percPatches.length; i++) {
      var hitProb = 2, gain = 0.8 + (0.1 * randInt(0, 4));
      if (percPatches[i].density > 400) 
        hitProb = 4;
      if (percPatches[i].density > 800) 
        hitProb = 6;
      if (percPatches[i].density > 1200) 
        hitProb = 8;
      if (percPatches[i].density > 1600) 
        hitProb = 10;
      if (percPatches[i].density > 2000) 
        hitProb = 12;

      if (percLooper.isNthBeat(8)) {
        gain = 1.5 + (0.1 * randInt(0, 6));
        hitProb = 16;
      }

      if (randInt(0, 17) <= hitProb) {
        var note = scale[randInt(0, scale.length)];
        percPatches[i].firePatch(note, gain);
      }
    }
  }, percLooper.period);
  loopers.push(percLooper);

  var leadLooper = new Looper(250, 'lead');
  leadLooper.id = setInterval(function () {
    leadLooper.advanceCounter();

    for (var i = 0; i < leadPatches.length; i++) {
      var hitProb = 2, gain = 0.6 + (0.1 * randInt(0, 8));
      if (leadPatches[i].density > 400) 
        hitProb = 4;
      if (leadPatches[i].density > 800) 
        hitProb = 6;
      if (leadPatches[i].density > 1200) 
        hitProb = 8;
      if (leadPatches[i].density > 1600) 
        hitProb = 10;
      if (leadPatches[i].density > 2000) 
        hitProb = 12;

      if (leadLooper.isNthBeat(4)) {
        gain = 1.5 + (0.1 * randInt(0, 10));
        hitProb = 24;
      }

      if (randInt(0, 24) <= hitProb) {
        var note = scale[randInt(0, scale.length)];
        leadPatches[i].firePatch(note, gain);
      }
      if (randInt(0, 24) <= hitProb) {
        var note = scale[randInt(0, scale.length)];
        leadPatches[i].firePatch(note, gain);
      }
    }
  }, leadLooper.period);
  loopers.push(leadLooper);



  // var taikoLooperCounter = 0;
  // var taiko = patches[4];
  // var taikoLooper = setInterval(function () {
  //   taikoLooperCounter = (taikoLooperCounter + 1) % 16;
  //   var note = 24 + (12 * randInt(0, 3)) + rootNote;

  //   var taikoProb = 2;

  //   MIDI.programChange(taiko.channel, taiko.program);
  //   if (taiko.density > 400) 
  //     taikoProb = 4;
  //   if (taiko.density > 800) 
  //     taikoProb = 6;
  //   if (taiko.density > 1200) 
  //     taikoProb = 8;
  //   if (taiko.density > 1600) 
  //     taikoProb = 10;
  //   if (taiko.density > 2000) 
  //     taikoProb = 12;

  //   var velocity = taiko.volume;
  //   if (taikoLooperCounter % 8 == 0) {
  //     taikoProb = 16;
  //     velocity = velocity * 2;
  //   }

  //   if (randInt(0, 16) <= taikoProb) {
  //     MIDI.noteOn(taiko.channel, note, velocity, 0);
  //     MIDI.noteOn(taiko.channel, note + 12, velocity, 0);
  //     MIDI.noteOff(taiko.channel, note, 2);
  //     MIDI.noteOff(taiko.channel, note + 12, 2);
  //   }
  // }, taiko.freq);
  // loopers.push(taikoLooper);

  // var pianoLooper = setInterval(function () {
  //   MIDI.programChange(0, patches[1].program);
  //   var note = 48 + (12 * randInt(0, 1)) + scale[randInt(0, scale.length)];
  //   var velocity = patches[1].volume;
  //   MIDI.noteOn(0, note, velocity, 0);
  //   MIDI.noteOff(0, note, 2);
  // }, patches[1].freq); 
  // loopers.push(pianoLooper);

  // var chimesLooper = setInterval(function () {
  //   MIDI.programChange(0, patches[2].program);
  //   var note = 72 + (12 * randInt(0, 1)) + scale[randInt(0, scale.length)];
  //   var velocity = patches[2].volume;
  //   MIDI.noteOn(0, note, velocity, 0);
  //   MIDI.noteOff(0, note, 2);
  // }, patches[2].freq); 
  // loopers.push(chimesLooper);

  // var chordLooper = setInterval(function () {
  //   MIDI.programChange(0, patches[3].program);
  //   var note = 72 + (12 * randInt(0, 1)) + scale[randInt(0, scale.length)];
  //   var velocity = patches[3].volume;
  //   MIDI.noteOn(0, note, velocity, 0);
  //   MIDI.noteOff(0, note, 2);
  //   MIDI.noteOn(0, note + 12, velocity, 0);
  //   MIDI.noteOff(0, note + 12, 2);
  // }, patches[3].freq); 
  // loopers.push(chordLooper);

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
      clearInterval(loopers[i].id);
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
