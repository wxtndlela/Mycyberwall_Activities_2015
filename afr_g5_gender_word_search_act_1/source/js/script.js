$(function() {
  'use strict';

  // Drag & Drop activity
  var $src = $('.draggables');
  var $dst = $('.droppables');

  $('.draggable', $src).each(function() {
    $(this).draggable({
      revert: true,
      zIndex: 100
    });
  });

  $('.droppable', $dst).each(function() {
    var match = $(this).data('accept-draggable');
    $(this).droppable({
      accept: '.draggable.' + match,
      tolerance: 'intersect',
      drop: function(event, ui) {
        ui.helper.remove();
        $(this).html(ui.helper.html());
        $(this).droppable("destroy");
        // MC-5: setTimeout() required for Safari on Mac:
        setTimeout(function(){ checkDone($src); }, 100);
      }
    });
  });

  // Word search activity.
  $.getJSON('js/config.json', function (config) {

    // Attach the game.
    $("#word-search").wordsearchwidget({
      "rows"  : config.rows,
      "cols"  : config.cols,
      "words" : config.words,
      "cells" : config.cells
    });

    // React to the user completeing the game.
    $("#word-search").on("wordsearch:complete", function() {
      $(this).addClass('complete');
      // MC-5: setTimeout() required for Safari on Mac:
      setTimeout(function(){ checkDone($('.draggables')); }, 100);
    });

  });

  // Is the activity complete.
  var checkDone = function($src) {
    if ($src.find('.draggable').length === 0 && $("#word-search").hasClass('complete')) {
      window.alert('Well done!');
      $('.button-answers').removeClass('button-off').addClass('button-on');
    }
  };

});
