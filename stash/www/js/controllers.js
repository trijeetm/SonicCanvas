angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope) {})

.controller('DiscoverCtrl', function($scope) {})

.controller('CanvasCtrl', function($scope, $firebase) {
  $scope.initMIDI = function () {
    // MIDI 
    console.log('ylo');
    MIDI.loadPlugin({
      soundfontUrl: "./soundfont/",
      instruments: [ "acoustic_grand_piano", "synth_drum" ],
      callback: function() {
        MIDI.noteOn(0, 1, 1, 0);
        console.log('leggo');
        MIDI.programChange(0, 0);
        MIDI.programChange(1, 118);
        console.log('lewp');
        for (var n = 0; n < 100; n ++) {
          var delay = n / 4; // play one note every quarter second
          var note = MIDI.pianoKeyOffset + n; // the MIDI note
          var velocity = 127; // how hard the note hits
          // play the note
          MIDI.noteOn(0, note, velocity, delay);
          // play the some note 3-steps up
          MIDI.noteOn(1, note + 3, velocity, delay);
        }   
      }
    });
  }

  $(function() {
    // sketch.js
    $.each(['#f00', '#ff0', '#0f0', '#0ff', '#00f', '#f0f', '#000', '#fff'], function() {
      $('#colors_demo .tools').append("<a href='#colors_sketch' data-color='" + this + "' style='display: inline-block; height: 20px; width: 20px; background: " + this + ";'></a> ");
    });
    $.each([3, 5, 10, 15], function() {
      $('#colors_demo .tools').append("<a href='#colors_sketch' data-size='" + this + "' style='background: #ccc'>" + this + "</a> ");
    });
    $('#colors_sketch').sketch();
  });

  // $(document).ready(function () {
  //   //Set up some globals
  //   var pixSize = 8, lastPoint = null, currentColor = "000", mouseDown = 0;

  //   //Create a reference to the pixel data for our drawing.
  //   var pixelDataRef = new Firebase('https://amber-torch-7567.firebaseio.com/');

  //   // Set up our canvas
  //   var myCanvas = document.getElementById('drawing-canvas');
  //   var myContext = myCanvas.getContext ? myCanvas.getContext('2d') : null;
  //   if (myContext == null) {
  //     alert("You must use a browser that supports HTML5 Canvas to run this demo.");
  //     return;
  //   }

  //   //Setup each color palette & add it to the screen
  //   var colors = ["fff","000","f00","0f0","00f","88f","f8d","f88","f05","f80","0f8","cf0","08f","408","ff8","8ff"];
  //   for (c in colors) {
  //     var item = $('<div/>').css("background-color", '#' + colors[c]).addClass("colorbox");
  //     item.click((function () {
  //       var col = colors[c];
  //       return function () {
  //         currentColor = col;
  //       };
  //     })());
  //     item.appendTo('#colorholder');
  //     console.log(item);
  //   }

  //   //Keep track of if the mouse is up or down
  //   myCanvas.onmousedown = myCanvas.vmousedown = function () {mouseDown = 1;};
  //   myCanvas.onmouseout = myCanvas.onmouseup = myCanvas.vmouseout = myCanvas.vmouseup = function () {
  //     mouseDown = 0; lastPoint = null;
  //   };

  //   //Draw a line from the mouse's last position to its current position
  //   var drawLineOnMouseMove = function(e) {
  //     if (!mouseDown) return;

  //     e.preventDefault();

  //     // Bresenham's line algorithm. We use this to ensure smooth lines are drawn
  //     var offset = $('canvas').offset();
  //     var x1 = Math.floor((e.pageX - offset.left) / pixSize - 1),
  //       y1 = Math.floor((e.pageY - offset.top) / pixSize - 1);
  //     var x0 = (lastPoint == null) ? x1 : lastPoint[0];
  //     var y0 = (lastPoint == null) ? y1 : lastPoint[1];
  //     var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  //     var sx = (x0 < x1) ? 1 : -1, sy = (y0 < y1) ? 1 : -1, err = dx - dy;
  //     while (true) {
  //       //write the pixel into Firebase, or if we are drawing white, remove the pixel
  //       pixelDataRef.child(x0 + ":" + y0).set(currentColor === "fff" ? null : currentColor);

  //       if (x0 == x1 && y0 == y1) break;
  //       var e2 = 2 * err;
  //       if (e2 > -dy) {
  //         err = err - dy;
  //         x0 = x0 + sx;
  //       }
  //       if (e2 < dx) {
  //         err = err + dx;
  //         y0 = y0 + sy;
  //       }
  //     }
  //     lastPoint = [x1, y1];
  //   };
  //   $(myCanvas).mousemove(drawLineOnMouseMove);
  //   $(myCanvas).mousedown(drawLineOnMouseMove);

  //   // Add callbacks that are fired any time the pixel data changes and adjusts the canvas appropriately.
  //   // Note that child_added events will be fired for initial pixel data as well.
  //   var drawPixel = function(snapshot) {
  //     var coords = snapshot.key().split(":");
  //     myContext.fillStyle = "#" + snapshot.val();
  //     myContext.fillRect(parseInt(coords[0]) * pixSize, parseInt(coords[1]) * pixSize, pixSize, pixSize);
  //   };
  //   var clearPixel = function(snapshot) {
  //     var coords = snapshot.key().split(":");
  //     myContext.clearRect(parseInt(coords[0]) * pixSize, parseInt(coords[1]) * pixSize, pixSize, pixSize);
  //   };
  //   pixelDataRef.on('child_added', drawPixel);
  //   pixelDataRef.on('child_changed', drawPixel);
  //   pixelDataRef.on('child_removed', clearPixel);
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
