angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope) {})

.controller('DiscoverCtrl', function($scope) {})

.controller('CanvasCtrl', function($scope, $firebase) {

  var pixelDataRef = new Firebase('https://amber-torch-7567.firebaseio.com/');
  console.log( 'firebase setup done' );

  // MIDI 
  MIDI.loadPlugin({
    soundfontUrl: "./soundfont/",
    instruments: [ "acoustic_grand_piano", "synth_drum" ],
    callback: function() {
      MIDI.noteOn(0, 1, 1, 0);

      pixelDataRef.on('child_added', function (snapshot) {
        var coordsOld = snapshot.key().split(':')[0].split(',');
        var coords = snapshot.key().split(':')[1].split(',');
        var col = snapshot.val();

        canvas.lineCap = 'round';
        canvas.lineJoin = 'round';

        canvas.fillStyle = canvas.strokeStyle = col;

        // console.log("Draw: ", coordsOld[0], coordsOld[1], coords[0], coords[1], canvas.fillStyle);

        canvas.lineWidth = radius;
        canvas.beginPath();
        canvas.moveTo(coordsOld[0], coordsOld[1]);
        canvas.lineTo(coords[0], coords[1]);
        canvas.stroke();

        MIDI.programChange(0, 0);
        var note = Math.floor((coords[0] / 400) * 127);
        var velocity = Math.floor((coords[1] / 500) * 127);
        if (velocity > 127) velocity = 127;
        MIDI.noteOn(0, note, velocity, 0);
      });


      // MIDI.programChange(0, 0);
      // MIDI.programChange(1, 118);
      // for (var n = 0; n < 5; n ++) {
      //   var delay = 0;
      //   var note = 24 + 12 * n;
      //   var velocity = 127; // how hard the note hits
      //   // play the note
      //   MIDI.noteOn(0, note, velocity, delay);
      // }   
    }
  });

  var COLOURS = [ 'tomato', '#A7EBCA', '#FFFFFF', '#D8EBA7', '#868E80' ];
  var radius = 0;

  var canvas = Sketch.create({
      container: document.getElementById( 'container' ),
      autoclear: false,
      setup: function() {
        console.log( 'sketch setup' );
      },
      update: function() {
        // console.log('update');
        // radius = 2 + abs( sin( this.millis * 0.003 ) * 50 );
        radius = 10;
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

            this.fillStyle = this.strokeStyle = COLOURS[ i % COLOURS.length ];

            pixelDataRef.child(touch.ox + ',' + touch.oy + ':' + touch.x + ',' + touch.y).set(this.fillStyle);
        }
      }
  });


  pixelDataRef.on('child_changed', function (snapshot) {
    var coordsOld = snapshot.key().split(':')[0].split(',');
    var coords = snapshot.key().split(':')[1].split(',');
    var col = snapshot.val();

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

    canvas.lineWidth = radius + 1;
    canvas.beginPath();
    canvas.moveTo(coordsOld[0], coordsOld[1]);
    canvas.lineTo(coords[0], coords[1]);
    canvas.stroke();
  });

  // $(function() {
  //   // MIDI 
  //   console.log('ylo');
  //   MIDI.loadPlugin({
  //     soundfontUrl: "./soundfont/",
  //     instruments: [ "acoustic_grand_piano", "synth_drum" ],
  //     callback: function() {
  //       MIDI.noteOn(0, 1, 1, 0);
  //       console.log('leggo');
  //       MIDI.programChange(0, 0);
  //       MIDI.programChange(1, 118);
  //       console.log('lewp');
  //       for (var n = 0; n < 5; n ++) {
  //         var delay = 0;
  //         var note = 24 + 12 * n;
  //         var velocity = 127; // how hard the note hits
  //         // play the note
  //         MIDI.noteOn(0, note, velocity, delay);
  //       }   
  //     }
  //   });

  //   // // sketch.js
  //   // $.each(['#f00', '#ff0', '#0f0', '#0ff', '#00f', '#f0f', '#000', '#fff'], function() {
  //   //   $('#colors_demo .tools').append("<a href='#colors_sketch' data-color='" + this + "' style='display: inline-block; height: 20px; width: 20px; background: " + this + ";'></a> ");
  //   // });
  //   // $.each([3, 5, 10, 15], function() {
  //   //   $('#colors_demo .tools').append("<a href='#colors_sketch' data-size='" + this + "' style='background: #ccc'>" + this + "</a> ");
  //   // });
  //   // $('#colors_sketch').sketch();
  // });
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
