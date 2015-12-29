$(function() {
  'use strict';

  var $src = $('.draggables');
  var $dst = $('.droppables');

  var checkDone = function($src) {
    if ($src.find('.draggable').length === 0) {
      window.alert('Well done!');
      $('.button-answers').removeClass('button-off').addClass('button-on');
    }
  };

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

});
