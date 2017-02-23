/*
 * This adds cancelTimer and startTimer methods to FMF.model.
 * Also includes functions to animate the hourglass and animate
 * multi-colored bubbles (at the end of timed tests).
 * Uses underscore's _.extend method
 */

FMF = window.FMF || {};

FMF.model = (function() {
    'use strict'; 

    var COLORS = ["CornflowerBlue", "DarkMagenta", "LimeGreen", "OrangeRed",
                  "SeaGreen", "Yellow","RoyalBlue", "Coral", "Crimson",
                   "Indigo", "MediumPurple", "DarkCyan", "FireBrick",
                   "DodgerBlue", "Gold", "LightSeaGreen", "Aquamarine",
                   "ForestGreen", "HotPink", "DarkViolet"];
    var SIZES = ["3em","3.5em","4em","4.5em","5em","5.5em",
                 "6em","6.5em", "7em","7.5em"];
    var SUGGEST_GOAL = [10,15, 20];
    var TIMER_MS = 60000;
    
    var bubbleTimer = -1;
    var hourglassTimer = -1;
    var model = FMF.model;
    var helpers = FMF.helpers;
    var testTimer = -1;
    var template = FMF.template;

    /*
     * This function displays font-awesome's hourglass in
     * three stages - full, half-full and nearing empty for 'time'
     * specified.
     */
    function changeHourglass($icon) {
        var i = 0;
        var time = TIMER_MS;

        hourglassTimer = window.setInterval(adjustHourglass, time/3);

        // Make hourglass dynamic (full, half full...) while timed test is running
        function adjustHourglass() {
            i++;

            if ($icon.hasClass('fa-hourglass-start')) {
                $icon.removeClass('fa-hourglass-start');
                $icon.addClass('fa-hourglass-half');
            } else if ($icon.hasClass('fa-hourglass-half')) {
                $icon.removeClass('fa-hourglass-half');
                $icon.addClass('fa-hourglass-end');
            }
            if (i === 3) {
                window.clearInterval(hourglassTimer);
            }
        }
    }
    
    /*
     * This function displays bubbles on the screen of various sizes & colors.
     * 'span' indicates MS time that passes from one bubble to next and 'duration'
     * is the # seconds (as string, i.e. '2s') that passes before all bubbles are
     * cleared from screen.  Note that 'duration' should exceed
     * 'span' * 'bubbleNum' otherwise not all bubbles will have time to display.
     */
    function makeBubbles(bubbleNum, span, duration) {
        var animString = 'bubbles ' + duration + ' 1';
        var i = 0;
        var numSizes = SIZES.length;
        var numColors = COLORS.length;
        var bubbleHTML = template.getBubbleHTML();
        var c;
        var s;
        var l;
        var t;

        // Run bubble animation
        bubbleTimer = window.setInterval(bubbleFlash, span);

        // Animates bubble, various sizes/colors
        function bubbleFlash() {

            if (i < bubbleNum) {

                // Add a div for a bubble
                if ($('#bubbleContainer').is(':empty')){
                    $('#bubbleContainer').html(bubbleHTML);
                } else {
                    $('#bubbleContainer div:last').after(bubbleHTML);
                }

                // Use randoms to pick color, size & location for bubble
                c = Math.floor(Math.random()*numColors);
                s = Math.floor(Math.random()*numSizes);
                l = Math.floor(Math.random()*90);
                t = Math.floor(Math.random()*90);

                // Assign properties to bubble & animate
                $( ".blob").last().css({
                    width: SIZES[s],
                    height: SIZES[s],
                    backgroundColor: COLORS[c],
                    left: l + '%',
                    top: t + '%',
                    animation: animString
                });

                i++;
            } else {

                // Fade out & remove all bubbles
                window.clearInterval(bubbleTimer);
                bubbleTimer = window.setTimeout(function() {
                $('.blob').fadeOut('slow', function() {
                    $('#bubbleContainer').empty();
                    window.clearInterval(bubbleTimer);
                });},2000);
            }
        }
    }
    
    var publicAPI = _.extend(FMF.model, {

        isTimed: false,
        cancelTimer: function() {

            // Clear timer & interval that adjusts hourglass display
            window.clearTimeout(testTimer);
            window.clearInterval(hourglassTimer);
            this.isTimed = false;

            $('#testMsg').addClass('hide');
            $('.timerOn').removeClass('fadeInAndOut');
            $('.timerOn i').removeClass();
            $('[id^="testInfo"]').empty();
        },
        startTimer: function() {
            var result = model.results[model.oper].level[model.levelIndex];
            var testCount = result.timed.length - 1;
            var timerText = (TIMER_MS < 60000) ?
                            Math.round(TIMER_MS/1000) + ' second' :
                            Math.round(TIMER_MS/60000) + ' minute';
            var msg = timerText + ' timer is ON...';
            var operator = this.operator;
            var myThis = this;
            var data = {msg: msg, 
                        oper: helpers.leadCap(model.oper),
                        label: result.label};

            $('#testMsg').removeClass('hide');

            //Set hourglass to full
            $('.timerOn i').removeClass();
            $('.timerOn').addClass('fadeInAndOut');
            $('.timerOn i').addClass('fa fa-hourglass-start');

            $('#testInfo').html(template.getTimerStartHTML(data));

            testTimer = window.setTimeout(endTimedTest, TIMER_MS);
            this.isTimed = true;
            changeHourglass($('.timerOn i'));

            /*
             * For a new timed test, push a new element onto timed array.
             * (exception: if the previous timed test had at 0 problems
             * attempted, don't push new element here)
             */
            if ((testCount === -1)||(result.timed[testCount][1])) {
                result.timed.push([0,0]);
            }

            function endTimedTest() {
                var oper = model.oper;
                var result = model.results[oper].level[model.levelIndex];
                var testCount = result.timed.length - 1;
                var correct = result.timed[testCount][0];
                var attempted = result.timed[testCount][1];
                var missed = attempted - correct;
                var percent = Math.round((correct/attempted) * 100);
                var text1 = helpers.leadCap(oper) + ': ' + result.label;
                var htmlErrors = '';
                var errorArray = [];
                var tblHead = '';
                var msg = '';
                var operator = (oper === 'add') ? '+'
                        : ((oper === 'subtract') ? '-' 
                        : ((oper === 'multiply') ? '&times;' 
                        : '&divide;'));
                
                /*
                 * If user had errors, use .slice to get an array of error
                 * info for mistakes made during the just completed timed
                 * test. Note that we're only displaying errors for the
                 * MOST RECENT timed test, so any earlier errors at same
                 * level (from practice or test)
                 * are not included.
                 */
                if (missed) {

                    $('.errorTable').removeClass('hide');

                    errorArray = result.errors.slice(result.errors.length -
                                missed);

                    htmlErrors = template.getTimerDataHTML(errorArray, operator);

                // Hide error table if no errors
                } else {
                    $('.errorTable').addClass('hide');
                }

                // Show results if user attempted at least one problem
                if (attempted > 0) {
                    if (missed === 1) {
                        tblHead = '1 Error';
                    } else if (missed > 1) {
                        tblHead = missed + ' Errors';
                    }
                    $('#test_time').empty().append(timerText + ' test');
                    $('#test_level').html(text1);
                    $('#test_correct').html(template.getTimerScoreHTML(correct, attempted, percent));
                    $('#topicTestResults th').empty().append(tblHead);
                    $('#topicTestResults tbody').empty().append(htmlErrors);
                    $('#topicTestResults').removeClass('hide');
                    document.activeElement.blur();

                    // Bring overlay to front while displaying test results
                    $('#cover').addClass('coverAll');

                    /*
                     * If user gets 100% and at least # equal to
                     * SUGGEST_GOAL,
                     * suggest they try the next level
                     */
                    if ((correct === attempted) &&
                            (correct >= SUGGEST_GOAL[model.diff])) {
                        if (model.user === '') {
                            msg = 'Excellent! You should try the next level.';
                        } else {
                            msg = 'Excellent, ' + model.user +
                                '! You should try the next level.';
                        }
                        $('#test_moveUp').empty().append(msg);
                    } else {
                        $('#test_moveUp').empty();
                    }
                }

                // Change sidebar highlight to 'practice'
                $('.sidebar li').removeClass('activeSidebar');
                $('#resumePractice').addClass('activeSidebar');
                myThis.cancelTimer();
                makeBubbles(correct, 70, '2s');
            }
        }
    });
    return publicAPI;  
})();
