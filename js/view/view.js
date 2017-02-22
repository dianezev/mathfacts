FMF = window.FMF || {};

FMF.view = (function() {
    'use strict';   

    /*
     * Do not allow keyboard entry for smaller screens, except
     * in the startup screen.  This helps avoid
     * problems with the soft keyboard popping up which blocks
     * the view of the app when focus is on input fields (in answer region).
     * The min pixel size stated here is used to determine whether <input> tags
     * or <p> tags are used in answer region (see template.getAnswersHTML)
     */
    var MIN_PX_FOR_KEYBOARD = 1400;
    var model = FMF.model;
    var template = FMF.template;
    var helpers = FMF.helpers;

    var buttonsPerRow = 10;
    var buttonRows = 3;
    var countdownTimer = -1;
    var perPage = model.perPage;
    var totalButtons = buttonRows * buttonsPerRow;
    
    var publicAPI = {
        buttonsPerRow: 10,
        rows: 3,
        dateInfo: helpers.dateInfo(),
        errorPause: false,
        useInputTags: true,
        liveIndex: 1,
        maxWidth: $('.frameApp').css('max-width'),
        trapDblClick: false,
        checkMarks: function(turnOn) {

            // Add/remove class that displays checkmarks
            if (turnOn) {
                $('.live + i').addClass('fadeInOutOnce');
            } else {
                $('.answer_region i').removeClass('fadeInOutOnce');
            }
        },
        displayNextSet: function(bumpUp) {
            var length = model.problemSet.length;
            var problemIndex;
            var problemSet;
            var j;
            
            /*
             * If 'bumpUp' is true, adjust problem index to
             * force display of new set of problems
             */
            if (bumpUp) {
                model.bumpUp();
            }

            /*
             * If there aren't enough problems left in the problemSet
             * to display next set, double the array with concat
             */
            if ((model.problemIndex + perPage) > length) {
                model.doubleArray();
            }            

            problemIndex = model.problemIndex;
            problemSet = model.problemSet;
            
            // Remove error class before displaying new problems
            if ($('[id^="answer"]').hasClass('error')) {
                $('[id^="answer"]').removeClass('error');
            }

            this.checkMarks(false);
            
            // Clear all answers
            if (this.useInputTags) {
                $('[id^="answer"]').val('');
            } else {
                $('[id^="answer"]').text('?');
            }

            // Display new problems
            for (var i = 1, l = perPage; i <= l ; i +=1) {
                j = problemIndex + i - 1;
                $('#topVal' + i).text(problemSet[j][0]);
                $('#bottomVal' + i).text(problemSet[j][1]);
            }

            // Hide edit fields (made visible one at a time in setHighlight)
            $('[id^="answer"]').addClass('invisible');
        },
        revertFocus: function() {
            /*
             * Force focus to live problem only if
             * these conditions are met:
             *  1) #chalkboard does not have class 'hide'
             *  2) #topicMathFacts does not have class 'hide'
             *  3) #cover does not have class 'bringToFront'
             *  4) #cover does not have class 'coverAll'
             */
            if ((!($('#chalkboard').hasClass('hide')))&&
                    (!($('#topicMathFacts').hasClass('hide')))&&
                    (!($('#cover').hasClass('bringToFront')))&&
                    (!($('#cover').hasClass('coverAll')))) {
                if (this.useInputTags) {
                    $('#answer' + this.liveIndex).focus();
                } else {
                    $(':focus').blur();
                }
                
            // Otherwise, if start screen is visible, set focus to user name
            } else if ($('#userName').is(':visible')) {
                $('#userName').focus();
            }
        },
        nextProblem: function (answer, correctAns, isTimed) {
            var liveIndex = this.liveIndex;
            var myThis = this;
            
            /*
             * If LAST problem on screen is incorrect & session is PRACTICE,
             * delay the display of the next problem set
             * so that user can see error briefly
             */
            if ((liveIndex === perPage) &&
                    (answer !== correctAns) &&
                    (!isTimed)) {

                // Set flag to true (use to ignore keydown during pause)
                myThis.errorPause = true;
                
                // Bring overlay to front while highlighting error
                $('#cover').addClass('bringToFront');

                // Remove focus
                $('[id^="answer"]').removeClass('live');
                $('#answer5').blur();

                // Clear overlay after two seconds & display next problem set
                window.setTimeout(function () {

                    // Move overlay to back & run proceed
                    $('#cover').removeClass('bringToFront');
                    proceed();
                }, 2000);
            } else {
                proceed();
            }

            // Trap dblclick on numeric buttons to prevent
            this.trapDblClick = true;
            window.setTimeout(function() {
                myThis.trapDblClick = false;
            }, 400);

            function proceed() {

                // If on last displayed problem, display the next problem set
                if (liveIndex === perPage) {
                    myThis.displayNextSet(false);
                }

                myThis.setHighlight(false);
                myThis.errorPause = false;
            }
        },
        setFtrsHdrs: function () {
            var dateInfo = this.dateInfo;
            var user = model.user;

            updateResultsHdrs(dateInfo);

            // Insert year, etc. for copyright
            $("#copyright").html('Copyright &copy; ' + 
                    new Date().getFullYear() +
                    ', Diane Davis Zevenbergen');
            $("#trackName").html(user);
            $("#trackScore").html("+" + model.tScore);
            $('.getStarted').addClass('hide');
            $('#chalkboard').removeClass('hide');

            if (this.useInputTags) {
                $('#answer1').focus();
            } else {
                $(':focus').blur();
            }

            // Adds html for general info in scores output
            function updateResultsHdrs(dateInfo) {
                var userMsg;
                
                if (user === '') {
                    userMsg = 'Timed results';
                } else {
                    userMsg = 'Timed results for ' +user;
                }
                
                $("#scores_date").text(dateInfo);
                $("#scores_numRange").html('Number range: ' +
                        'Level ' + (model.diff + 1) + ', ' +
                        model.nums[0] + ' through ' +
                        model.nums[model.nums.length - 1]);

                if (typeof(user) !== 'undefined') {
                    $('#test_user').empty().append(userMsg);
                    $('#scores_user').text('Name: ' + user);
                }
            }
        },
        setHighlight: function(isFirst) {
            var problemIndex = model.problemIndex;
            var liveAnswer;

            /*
             * This index is used to identify which displayed problem is
             * 'live'. Force index to 'perPage' value when remainder is zero.
             */
            this.liveIndex = (((problemIndex + 1) % perPage) || perPage);
            liveAnswer = '#answer' + this.liveIndex;

            // Add/remove classes to highlight next problem
            $('[id^="answer"]').removeClass('live');
            $(liveAnswer).addClass('live');
            $(liveAnswer).removeClass('invisible');
            
            if (this.useInputTags) {
                $(liveAnswer).focus();
            } else {
                $(':focus').blur();
            }

            /*
             * For all multiplication problems, or for FIRST of new problem
             * set in addition, subtraction or division, check that
             * the number range on the buttons includes answer for 
             * current problem.
             */
            if ((model.opName === 'multiply') || (isFirst)) {
                var start = getStart(problemIndex);
                
                // Adjust #s on buttons if start value needs to be changed
                if (start !== 
                        Number($('.numberButtons button:eq(0)').text())) {

                    // Update values on number buttons
                    for (var i = 0; i < totalButtons; i++) {
                        $('.numberButtons button:eq(' + i + ')').
                                text(start + i);
                    }

                }
            }

            /*
             * Users can click on numeric buttons to answer problems.
             * For addition, subtraction & division the buttons default to 1 - 30
             * or 0 - 29, depending on whether nums[diff] starts with 0 or 1.
             * This range covers all possible answers for the 3 operations, so
             * buttons are just set at the beginning of a new problem set.
             * But for MULTIPLICATION, a wider range of numbers is needed.  This
             * function returns the start number needed for the first button.
             */
            function getStart(index) {

                var lowestVal = model.nums[0];
                var correctAns;
                var start;

                correctAns = model.problemSet[index][2];
                start = lowestVal + Math.floor((correctAns - lowestVal)/totalButtons) * totalButtons;

                return start;
            }
        },
        setTopMargin: function () {
// TBD: Consider calling something similar from handleStart, but revise to key off vmin
// so that portrait<-->landscape rotation doesn't get weird
//            var frameHt = $('#chalkboard').height();
//            var availHt = $('body').height();
//            var topMargin = .5 * (availHt - frameHt);
//            $("#columnTwo").height($("#columnOne").height());
//            
//            $('#chalkboard').css('margin-top', topMargin);
        },
        setupHTML: function(start) {
            
            /*
             * Note that template will create the HTML for answer region in
             * one of two ways, depending on available screen width.
             * If screen width >= MIN_PX_FOR_KEYBOARD, it will use 
             * <input> tags which allow user to either type answers or
             * click numeric buttons. Otherwise, it uses <p> tags
             * and the user can only use the numeric buttons.
             * This is a crude solution that prevents the virtual
             * keyboard from popping up and obscuring app on phones & tablets.
             */
            if (window.screen.width >= MIN_PX_FOR_KEYBOARD) {
                this.useInputTags = true;
            } else {
                this.useInputTags = false;
            }
            
            $('#problems').html(template.getProblemsHTML(perPage));
            $('#solutions').html(template.getAnswersHTML(perPage, this.useInputTags));
            $('#allButtons').html(template.getButtonsHTML(start, buttonRows, buttonsPerRow));
        },
        setTracker: function(makeVisible) {
            if (makeVisible) {
                $("#trackScore").removeClass('invisible');
                $("#trackScore").html("+" + model.tScore);
            } else {
                $("#trackScore").addClass('invisible');
            }
        },
        showScores: function () {
            var all = [0,0];
            var percent;
            var scoreText = '';
            var results = model.results;

            updateScores('Add','#addResults', '+',all, results.add);
            updateScores('Subtract','#subtractResults', '-',all, results.subtract);
            updateScores('Multiply','#multiplyResults', '&times;',all, results.multiply);
            updateScores('Divide','#divideResults', '&divide;',all, results.divide);

            // Get cumulative percentage & update header info
            percent = Math.round((all[0]/all[1]) * 100);
            scoreText = 'Total score: ' + all[0] +
                    '/' + all[1];

            // Tack on percentage as long as it's not NaN
            if (!isNaN(percent)) {
                scoreText += ' (' + percent + '%)';
            }

            $('#scores_overall').text(scoreText);
            
            // If no results, append message
            if (all[1] === 0) {
                $('#addResults').empty().append('<td class="chalk">No problems have been completed yet.</td>');
            }

            /*
             * Loops through practice & timed results for all levels
             * for a given operator 
             * and appends the results to the 'id' selector
             */
            function updateScores(title, id, operator, all, results) {
                var scoresHTML;
                scoresHTML = template.getOverallScoresHTML(title, id, operator, all, results);

                // If any template data returned, append
                if (scoresHTML !== '') {
                    
                    // Update results for given operator (all levels)
                    $(id).empty().append(scoresHTML);
                }
            }
        },
        showStartScreen: function() {
            $('body').show();            
            $('#userName' ).focus();
        },
        showTopic: function(hash) {

            // If topic is hidden, add/remove 'hide' class as needed
            if ($(hash).hasClass('hide')) {
                $('[id^="topic"]').not(hash).addClass('hide');
                $(hash).removeClass('hide');
            }
        },
        highlightSidebar: function(id) {
            var activeItem = '#' + id;
            
            // Change highlight if not already set to current selection
            if (!($(activeItem).hasClass('activeSidebar'))) {
                $('.sidebar li').removeClass('activeSidebar');
                $(activeItem).addClass('activeSidebar');
            }
        },
        switchContent: function(id) {
            var i;
            var myThis = this;

            if (id === 'controlTimer') {
                i = 2;
                $('#answer' + this.liveIndex).blur();
                $('#seconds').empty().text(i+1);
                $('#topicCountdown').removeClass('hide');

                // Bring overlay to front while highlighting error
                $('#cover').addClass('coverAll');

                // Hide user's overall score during timed test
                this.setTracker(false);                
                
                // Display 3 sec countdown before timed test starts
                countdownTimer = window.setInterval( function() {
                    $('#seconds').empty().text(i);

                    i -=1;
                    if (i === -1) {
                        
                        // Hide countdown window
                        $('#topicCountdown').addClass('hide');
                        $('#cover').removeClass('coverAll');
                        
                        // Display next set of problems & start timer
                        myThis.displayNextSet(true);
                        myThis.showTopic('#topicMathFacts');
                        myThis.setHighlight(true);
                        window.clearInterval(countdownTimer);
                        model.startTimer();
                    }
                },1000);

            } else {
                if (id === 'resumePractice') {

                    // Don't reshow checkmarks when returning to practice
                    this.checkMarks(false);
                    this.showTopic('#topicMathFacts');
                    this.setHighlight(true);

                // Display 'About' page
                } else if (id === 'goToAbout') {
                    this.showTopic('#topicInfo');

                // Update Scores
                } else if (id === 'goToScores') {
                    this.showScores();
                    this.showTopic('#topicMyScores');
                }
            }
        },
        toggleAbout: function(id) {

            // Toggle between displaying/hiding <p> element in a <li>
            if ($('#' + id + ' p').hasClass('hide')) {
                
                // First hide <p> for all <li> & set pointer to RIGHT
                $('.about p').addClass('hide');
                $('.about a span.pointDown').addClass('hide');
                $('.about a span.pointRight').removeClass('hide');
                
                // Next disply <p> for selected <li> and set pointer to DOWN
                $('#' + id + ' p').removeClass('hide'); 
                $('#' + id + ' a span.pointRight').addClass('hide');
                $('#' + id + ' a span.pointDown').removeClass('hide');
                
            // Otherwise collapse the <p> element & reset pointer to RIGHT
            } else {
                $('#' + id + ' p').addClass('hide');
                $('span.pointDown').addClass('hide');
                $('#' + id + ' a span.pointRight').removeClass('hide');
            }
        }
    };
    return publicAPI;
})();
