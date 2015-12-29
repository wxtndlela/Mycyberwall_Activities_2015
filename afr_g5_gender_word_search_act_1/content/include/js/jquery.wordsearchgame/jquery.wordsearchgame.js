
/**
 * The Word Search Game Widget.
 *
 * Adapted from https://code.google.com/u/@VBFTRFJWDxFDXgJ4/
 * Licensed under The MIT License.
 * See license.txt
 */

//==============================================================================
//------------------------------------------------------------------------------
//The Word Search Game Widget
//------------------------------------------------------------------------------
//
//  ------
//  Usage:
//  ------
//  $(document).ready( function () {
//      var rows = 15;
//      var cols = 15;
//      var words = ["ibhola", "ikhilikithi", "ihokhi", "ukubhukuda", "ithenisi", "umdlali", "wina", "shona", "umdlalo"];
//      var cells = [
//          "ANIWHRQNDGUIIOO", "ADSPWIHZTVQSHLG", "ADOIRRWEFFDIOZH", "QDVCMTSEHILNKJG", "PHUMDLALOABEHVO",
//          "SWOKNXPXLYHHILK", "JIVEURADCJHTOYI", "FNABGHMAATLIULV", "CCCNSUBOVAFSMGA", "QFDNLABUAFHCAQD",
//          "GBGIRYQJKOJUNVA", "XWNVCPQTNUVHIXA", "ELHXTNVABCDLCTI", "BIHTIKILIHKIPWY", "JYSVHPRWWDQQROY"
//      ];
//
//      $("#theGrid").wordsearchwidget({
//          "rows"  : rows,
//          "cols"  : cols,
//          "words" : words,
//          "cells" : cells
//      });
//  });
//
//  -------
//  Inputs:
//  -------
//  rows - The amount of rows to generate
//  cols - The amount of cols to generate per row
//  words - Array of words to look for on the grid
//  cells - The values for the cells in the grid
//
//  -------------
//  Instructions:
//  -------------
//  The User is expected to click on a letter and drag to the last letter of the
//  word. If the selected letters form a word that is in the word list the UI
//  will indicate that by crossing it out from the wordlist
//
//==============================================================================

(function( $, undefined ) {

$.widget("btx.wordsearchwidget", $.ui.mouse, {
    options : {
        rows  : 8,
        cols  : 8,
        words : null,
        cells : null
    },

    _mapEventToCell: function(event) {
        var currentColumn = Math.ceil((event.pageX - this._cellX) / this._cellWidth);
        var currentRow = Math.ceil((event.pageY - this._cellY) / this._cellHeight);
        var el = $('#ws-tablegrid tr:nth-child(' + currentRow + ') td:nth-child(' + currentColumn + ')');
        return el;
    },

    _create : function () {
        this.model     = GameWidgetHelper.prepGrid(this.options.rows, this.options.cols, this.options.words, this.options.cells);
        this.startedAt = new Root();
        this.hotzone   = new Hotzone();
        this.arms      = new Arms();

        GameWidgetHelper.renderGame(this.element[0], this.model);

        this.options.distance = 0; // set mouse option property
        this._mouseInit();

        var cell = $('#ws-tablegrid tr:first td:first');
        this._cellWidth  = cell.outerWidth();
        this._cellHeight = cell.outerHeight();
        this._cellX      = cell.offset().left;
        this._cellY      = cell.offset().top;
    },//_create

    destroy : function () {
        this.hotzone.clean();
        this.arms.clean();
        this.startedAt.clean();

        this._mouseDestroy();
        return this;
    },

    //mouse callbacks
    _mouseStart: function(event) {
        var panel = $(event.target).parents("div").attr("id");
        if (panel == 'ws-searchgamecontainer') {
            this.startedAt.setRoot( event.target );
            this.hotzone.createZone( event.target )
        }
    },

    _mouseDrag : function(event) {
        event.target = this._mapEventToCell(event);
        //if this.root - clear out everything and return to orignal clicked state
        if (this.startedAt.isSameCell(event.target)) {
            this.arms.returnToNormal();
            this.hotzone.setChosen(-1);
            return;
        }

        //if event is on an armed cell
        if ($(event.target).hasClass("ws-armed") || $(event.target).hasClass("ws-glowing") ) { //CHANGE!

            //if in hotzone
            var chosenOne = this.hotzone.index(event.target);
            if (chosenOne != -1) {
                //set target to glowing; set rest of hotzone to armed
                this.hotzone.setChosen(chosenOne);

                //calculate arms and set to armed
                this.arms.deduceArm(this.startedAt.root, chosenOne);
            }
            else { //in arms
                //set glowing from target to root
                this.arms.glowTo(event.target)
            }
        }
    },

    _mouseStop : function (event) {
        //get word
        var selectedword = '';
        $('.ws-glowing', this.element[0]).each(function() {
            var u = $.data(this, "cell");
            selectedword += u.value;
        });

        var wordIndex = this.model.wordList.isWordPresent(selectedword);
        if (wordIndex != -1) {
            $('.ws-glowing', this.element[0]).each(function() {
                Visualizer.select(this);
                $.data(this, "selected", "true");
            });
            GameWidgetHelper.signalWordFound(wordIndex);
            GameWidgetHelper.checkDone(this.element[0], this.model.wordList);
        }

        this.hotzone.returnToNormal();
        this.startedAt.returnToNormal();
        this.arms.returnToNormal();
    }

}); // widget

$.extend($.btx.wordsearchwidget, {
    version: "0.0.1"
});

//------------------------------------------------------------------------------
// VIEW OBJECTS
//------------------------------------------------------------------------------
/*
 * The Arms represent the cells that are selectable once the hotzone has been
 * exited/passed
 */
function Arms() {
    this.arms = null;

    // Deduces the arm based on the cell from which it exited the hotzone.
    this.deduceArm = function (root, idx) {
        this.returnToNormal(); //clear old arm
        var ix = $(root).parent().children().index(root);

        // Create the new nominees.
        this.arms = new Array();

        // Create surrounding nominees.
        switch (idx) {
            case 0: //horizontal left
                this.arms = $(root).prevAll();
                break;

            case 1: //horizontal right
                this.arms = $(root).nextAll();
                break;

            case 2: //vertical top
                var $n = this.arms;
                $(root).parent().prevAll().each( function() {
                    $n.push($(this).children().get(ix));
                });

                break;

            case 3: //vertical bottom
                var $o = this.arms;
                $(root).parent().nextAll().each( function() {
                    $o.push($(this).children().get(ix));
                });
                break;

            case 4: //right diagonal up

                var $p = this.arms;

                //for all prevAll rows
                var currix = ix;
                $(root).parent().prevAll().each( function () {
                    $p.push($(this).children().get(++currix));
                });
                break;

            case 5: //left diagonal up
                var $q = this.arms;

                //for all prevAll rows
                var currixq = ix;
                $(root).parent().prevAll().each( function () {
                    $q.push($(this).children().get(--currixq));
                });
                break;

            case 6 : //left diagonal down
                var $r = this.arms;
                //for all nextAll rows
                var currixr = ix;
                $(root).parent().nextAll().each( function () {
                    $r.push($(this).children().get(++currixr));
                });
                break;

            case 7: //right diagonal down
                var $s = this.arms;
                //for all nextAll rows
                var currixs = ix;
                $(root).parent().nextAll().each( function () {
                    $s.push($(this).children().get(--currixs));
                });
                break;


        }
        for (var x = 1; x < this.arms.length; x++) {
            Visualizer.arm(this.arms[x]);
        }
    }

    // Lights up the cells from the root cell to the current one.
    this.glowTo = function (upto) {
        var to = $(this.arms).index(upto);

        for (var x = 1; x < this.arms.length; x++) {
            if (x <= to) {
                Visualizer.glow(this.arms[x]);
            }
            else {
                Visualizer.arm(this.arms[x]);
            }
        }
    }

    // Clear out the arms.
    this.returnToNormal = function () {
        if (!this.arms) return;

        for (var t = 1; t < this.arms.length; t++) { //don't clear the hotzone
            Visualizer.restore(this.arms[t]);
        }
    }


    this.clean = function() {
        $(this.arms).each(function () {
           Visualizer.clean(this);
        });
    }

} // Arms

/*
 * Object that represents the cells that are selectable around the root cell
 */
function Hotzone() {
    this.elems = null;

    //define the hotzone
    //select all neighboring cells as nominees
    this.createZone = function (root) {
        this.elems = new Array();

        var $tgt = $(root);
        var ix = $tgt.parent().children().index($tgt);

        var above = $tgt.parent().prev().children().get(ix); // above
        var below = $tgt.parent().next().children().get(ix); // below

        //nominatedCells.push(event.target); // self
        this.elems.push($tgt.prev()[0],$tgt.next()[0]); //horizontal
        this.elems.push(
            above,
            below,
            $(above).next()[0],$(above).prev()[0], //diagonal
            $(below).next()[0],$(below).prev()[0] //diagonal
        );

        $(this.elems).each(function () {
            if ($(this) != null) {
                Visualizer.arm(this);
            }
        });
    }

    //give the hotzone some intelligence
    this.index = function (elm) {
        return $(this.elems).index(elm);
    }

    this.setChosen = function (chosenOne) {
        for (var x = 0; x < this.elems.length; x++) {
            Visualizer.arm(this.elems[x]);
        }
        if (chosenOne != -1) {
            Visualizer.glow(this.elems[chosenOne]);
        }
    }

    this.returnToNormal = function () {
        if (this.elems) {
            for (var t = 0; t < this.elems.length; t++) {
                Visualizer.restore(this.elems[t]);
            }
        }
    }

    this.clean = function() {
        $(this.elems).each(function () {
           Visualizer.clean(this);
        });
    }

} // Hotzone

/*
 * Object that represents the first cell clicked
 */
function Root() {
    this.root = null;

    this.setRoot = function (root) {
        this.root = root;
        Visualizer.glow(this.root);
    }

    this.returnToNormal = function () {
        Visualizer.restore(this.root);
    }

    this.isSameCell = function (t) {
        return $(this.root).is($(t));
    }

    this.clean = function () {
        Visualizer.clean(this.root);
    }

} // Root

/*
 * A utility object that manipulates the cell display based on the methods called.
 */
var Visualizer = {
    glow : function (c) {
        $(c).removeClass("ws-armed").removeClass("ws-selected").addClass("ws-glowing");
    },

    arm : function (c) {
        $(c).removeClass("ws-glowing").addClass("ws-armed");
    },

    restore : function (c) {
        $(c).removeClass("ws-armed").removeClass("ws-glowing");

        if (c != null && $.data(c, "selected") == "true") {
            $(c).addClass("ws-selected");
        }
    },

    select : function (c) {
        $(c).removeClass("ws-armed").removeClass("ws-glowing").animate(
            {'opacity' : '20'},
            250,
            "linear",
            function () {
                $(c).addClass("ws-selected").animate({'opacity' : 'show'}, 250, "linear");
            }
        );
    },

    signalWordFound : function (w) {
        $(w).fadeOut('fast', function() {
            $(w).addClass('ws-foundword').fadeIn(400);
        });
    },

    clean : function (c) {
        $(c).removeClass("ws-armed").removeClass("ws-glowing").removeClass("ws-selected");
        $.removeData($(c), "selected");
    }

} // Visualizer

//--------------------------------------------------------
// OBJECTS RELATED TO THE MODEL
//------------------------------------------------------------------------------

/*
 * Represents the individual cell on the grid
 */
function Cell() {
    this.DEFAULT = "-";
    this.value = this.DEFAULT;
    this.parentGrid = null;
    this.isUnwritten = function () {
        return (this.value == this.DEFAULT);
    };
    this.isSelected = false;
    this.isSelecting = true;
    this.td = null; // reference to UI component
} // Cell

/*
 * Represents the Grid
 */
function Grid() {
    this.cells = null;

    this.initializeGrid = function(rows, cols) {
        this.cells = new Array(rows);
        for (var i = 0; i < rows; i++) {
            this.cells[i] = new Array(cols);
            for (var j = 0; j < cols; j++) {
                var c = new Cell();
                c.parentgrid = this;
                this.cells[i][j] = c;
            }
        }
    }

    this.getCell = function(row, col) {
        return this.cells[row][col];
    }

    this.createHotZone = function(uic) {
        var $tgt = uic;

        var hzCells = new Array();
        var ix = $tgt.parent().children().index($tgt);
    }

    this.rowsize = function() {
        return this.cells.length;
    }

    this.colsize = function() {
        return this.cells[0].length;
    }

    this.fillGrid = function(cells) {
        var cols;
        for (var i = 0; i < this.rowsize(); i++) {
            cols = cells[i].split("");
            for (var j = 0; j < this.colsize(); j++) {
                if (this.cells[i][j].isUnwritten()) {
                    this.cells[i][j].value = (cols.length > j) ? cols[j] : String.fromCharCode(Math.floor(65 + Math.random() * 26));
                }
            }
        }
    }

} // Grid

/*
 * Container for the Entire Model
 */
function Model() {
    this.grid = null;
    this.wordList = null;

    this.init = function(grid, list) {
        this.grid = grid;
        this.wordList = list;
    }

} // Model

/*
 * Represents a word on the grid
 */
function Word(val) {
	//alert(val);
    this.value = val.toUpperCase();
    this.reverse = val.split("").reverse().join("").toUpperCase();
    this.isFound = false;
    this.size = -1;
    this.chars = null;

    this.init = function () {
        this.chars = this.value.split("");
        this.size = this.chars.length;
    }
    this.init();

    this.checkIfSimilar = function (w) {
		//alert(w);
        if (this.value == w || this.reverse == w) {
            this.isFound = true;
            return true;
        }
        return false;
    }

} // Word

/*
 * Represents the list of words to display
 */
function WordList() {
    this.words = new Array();

    this.loadWords = function (words) {
        //words = ["1", "va", "3", "4", "5","6"];
		var $n = this.words;
        $(words).each(function () {
			//alert(words[1]);
            $n.push(new Word(this));
        });
    }

    this.size = function() {
        return this.words.length;
    }

    this.get = function(index) {
	     return this.words[index];
		
    }

    this.isWordPresent = function(word2check) {
        for (var x = 0; x < this.words.length; x++) {
            if (this.words[x].checkIfSimilar(word2check)) return x;
        }
        return -1;
    }

    this.allFound = function() {
        for (var x = 0; x < this.words.length; x++) {
            if (!this.words[x].isFound) return false;
        }
        return true;
    }

} // WordList

/*
 * Utility class
 */
var Util = {
    random : function(max) {
        return Math.floor(Math.random() * max);
    },

    log : function (msg) {
        $("#logger").append(msg);
    }

} // Util


//------------------------------------------------------------------------------
// OBJECTS RELATED TO THE CONTROLLER
//------------------------------------------------------------------------------
/*
 * Main controller that interacts with the Models and View Helpers to render and
 * control the game
 */
var GameWidgetHelper = {
    prepGrid : function (rows, cols, words, cells) {
        var grid = new Grid();
        grid.initializeGrid(rows, cols);

        var wordList = new WordList();
        wordList.loadWords(words);

        var model = new Model();
        model.init(grid, wordList);
        grid.fillGrid(cells);
        return model;
    },

    renderGame : function(container, model) {
        var grid = model.grid;
        var cells = grid.cells;

        // Add the word list.
        var words = "<div id='ws-wordcontainer'><ul>";
		
		var genderwords = ["bul", "hings", "varkbeer", "haan", "ram","reun"]; //The list that shows on game
		var $n = genderwords;
		var i = 0;
		
        //$(model.wordList.words).each(function () {
		$(genderwords).each(function () {
		    words += '<li>' + genderwords[i].toLowerCase() + '</li>';
			i++;
        });
        words += "</ul></div>";

        $(container).append(words);

        // Add the grid.
        var puzzleGrid = "<div id='ws-searchgamecontainer'><table id='ws-tablegrid' cellspacing=0 cellpadding=0 class='ws-tablestyle'>";
        for (var i = 0; i < grid.rowsize(); i++) {
            puzzleGrid += "<tr>";
            for (var j = 0; j < grid.colsize(); j++) {
                puzzleGrid += "<td  class='ws-tgrid'>" + cells[i][j].value + "</td>";
            }
            puzzleGrid += "</tr>";
        }
        puzzleGrid += "</table></div>";
        $(container).append(puzzleGrid);

        var x = 0;
        var y = 0;
        $("tr","#ws-tablegrid").each(function () {
            $("td", this).each(function (col){
                var c = cells[x][y++];
                $.data(this, "cell", c);
                c.td = this;
            });
            y = 0;
            x++;
        });
    },

    signalWordFound : function(idx) {
        var w = $("li", '#ws-wordcontainer').get(idx);
        Visualizer.signalWordFound(w);
    },

    checkDone : function(container, wordList) {
        if (wordList.allFound()) {
            setTimeout(function() {
                $(container).trigger("wordsearch:complete");
            }, 500);
        }
    }

} // GameWidgetHelper

})(jQuery);
