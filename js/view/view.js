FMF = window.FMF || {};

FMF.view = (function() {
    'use strict';   

    var BTN_COUNT = 30;
    var model = FMF.model;
    var helpers = FMF.helpers;
    var countdownTimer = -1;
    var introTimer = -1;
    
    var publicAPI = {
        dateInfo: helpers.dateInfo(),
        liveIndex: 1,
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
            var perPage = model.perPage;
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
            $('[id^="answer"]').val('');

            // Display new problems
            for (var i = 1, l = perPage; i <= l ; i +=1) {
                j = problemIndex + i - 1;
                $('#topVal' + i).text(problemSet[j][0]);
                $('#bottomVal' + i).text(problemSet[j][1]);
            }

            // Hide edit fields (made visible one at a time in setHighlight)
            $('[id^="answer"]').addClass('invisible');
        },
        nextProblem: function (answer, correctAns, isTimed) {
            var perPage = model.perPage;
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
            $('#answer1').focus();

            // Adds html for general info in scores output
            function updateResultsHdrs(dateInfo) {
                $("#scores_date").text(dateInfo);
                $("#scores_numRange").html('Number range: ' +
                        'Level ' + (model.diff + 1) + ', ' +
                        model.numRange[0] + ' through ' +
                        model.numRange[model.numRange.length - 1]);

                if (typeof(user) !== 'undefined') {
                    $('#test_user').empty().append('Timed results for ' +
                            user);
                    $('#scores_user').text('Name: ' + user);
                }
            }
        },
        setHighlight: function(isFirst) {
            var problemIndex = model.problemIndex;
            var perPage = model.perPage;
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
            $(liveAnswer).focus();

            /*
             * For all multiplication problems, or for FIRST of new problem
             * set in addition, subtraction or division: call setNumbers to 
             * adjust #s on buttons if needed
             */
            if ((model.opName === 'multiply') || (isFirst)) {
                setNumbers(problemIndex);
            }
            
            /*
             * setNumbers fcn adjusts the numbers on the buttons that
             * users can click on to answer problems.
             * For addition, subtraction & division the buttons default to
             * 1 - 30 or 0 - 29, depending on whether numRange[diff] starts
             * with 0 or 1. This range covers all possible
             * answers for the 3 operations, so buttons are just set at the
             * beginning of a new problem set. But for MULTIPLICATION,
             * a wider range of numbers is needed.  This
             * function checks the answer value for each mult. problem and
             * adjusts the values on the buttons when needed.
             */
            function setNumbers(index) {

                var lowestVal = model.numRange[0];
                var correctAns;
                var start;

                correctAns = model.problemSet[index][2];
                start = lowestVal + Math.floor((correctAns -
                        lowestVal)/BTN_COUNT) * BTN_COUNT;

                // Adjust #s on buttons if needed
                if (start !==
                        Number($('.numberButtons button:eq(0)').text())) {

                    for (var i = 0; i < 30; i+=1) {
                        $('.numberButtons button:eq(' + i + ')').
                                text(start + i);
                    }
                }
            }
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

            updateScores('add','#addResults', '+',all);
            updateScores('subtract','#subtractResults', '-',all);
            updateScores('multiply','#multiplyResults', '&times;',all);
            updateScores('divide','#divideResults', '&divide;',all);

            // Get cumulative percentage & update header info
            percent = Math.round((all[0]/all[1]) * 100);
            scoreText = 'Total score: ' + all[0] +
                    '/' + all[1];

            // Tack on percentage as long as it's not NaN
            if (!isNaN(percent)) {
                scoreText += ' (' + percent + '%)';
            }

            $('#scores_overall').text(scoreText);

            /*
             * Loops through practice & timed results for all levels
             * for a given operator 'opName'
             * and appends the results to the 'id' selector
             */
            function updateScores(opName, id, operator, all) {
                var title = helpers.leadCap(opName);
                var correct = 0;
                var attempted = 0;
                var percent = 0;
                var htmlLevel = '';
                var htmlPractice = '';
                var htmlTimed = '';
                var htmlErrors = '';
                var htmlOverall = '';
                var incorrect = '';
                var correction= '';
                var results = model.results;

                // Loop through all levels & display results for each
                $.each(results[opName].level, function(i,level) {
                    htmlLevel = '<tr class="newLevel"><td>' + title +
                                ':&nbsp&nbsp&nbsp' + level.label + '</td>';
                    htmlTimed = '';

                    if (level.practice[1] !== 0) {
                        correct = level.practice[0];
                        attempted = level.practice[1];
                        all[0] += correct;
                        all[1] += attempted;
                        percent = Math.round((correct/attempted)*100);
                        htmlPractice = htmlLevel +
                                       '<td>Practice:</td><td>+' +
                                        correct + '/' + attempted +
                                        '</td><td>' + percent +
                                        '%</td></tr>';
                        htmlOverall += htmlPractice;
                    }

                    // Get results for each timed test within level
                    $.each(level.timed, function(j, test) {
                        correct = test[0];
                        attempted = test[1];
                        all[0] += correct;
                        all[1] += attempted;

                        // Don't show results if 0 problems attempted
                        if (attempted > 0) {
                            percent = Math.round((correct/attempted)*100);

                            /*
                             * If there are no practice results, begin Test
                             * section with level info (i.e. 'Add +1...12')
                             */
                            if ((level.practice[1] === 0)&&(j===0)) {
                                htmlTimed = htmlTimed + htmlLevel +
                                            '<td>Timed test ' + (j+1) +
                                            ':</td><td>+' + correct + '/' +
                                            attempted + '</td><td>' +
                                            percent + '%</td></tr>';
                            } else {
                                htmlTimed = htmlTimed +
                                            '<tr><td></td><td>Timed test ' +
                                            (j+1) + ':</td><td>+' + correct +
                                            '/' + attempted + '</td><td>' +
                                            percent + '%</td></tr>';
                            }
                        }
                    });

                    htmlOverall += htmlTimed;

                    if (level.errors.length > 0) {
                        htmlErrors = '<tr><td></td><td>Errors: </td>';
                        $.each(level.errors, function(j,error) {
                            if (j > 0) htmlErrors = htmlErrors +
                                                    '<tr><td></td><td></td>';
                            incorrect = error[0] + ' ' + operator + ' ' +
                                        error[1] + ' = ' + error[2];
                            correction = '<span>Correct answer: ' +
                                         error[3] + '</span>';
                            htmlErrors = htmlErrors + '<td>' + incorrect +
                                         '</td><td>' + correction +
                                         '</td></tr>';
                        });

                        htmlOverall += htmlErrors;
                    }
                });

                // Update results for given operator (all levels)
                $(id).empty().append(htmlOverall);

                return all;
            }
        },
        showStartScreen: function() {
            var i = 1;

            // Run animation for start screens
            introTimer = window.setInterval(function(){ 
                showNextOp(++i); 
            }, 400);

            $('body').show();            

            // Function shows next operator symbol/text in start screen
            function showNextOp(num) {

                // Display operators briefly in first start screen
                if (num <= 4) {
                    $('.start1:nth-child(' + num + ')').removeClass('hide');
                    $('.start1:nth-child(' + num + ') p:nth-child(1)').addClass('rotateThisFadeOut');
                    $('.start1:nth-child(' + num + ') p:nth-child(2)').addClass('slideFromRightFadeOut');

                /*
                 * Next, hide 1st start screen & display 2nd,
                 * prompting user for name/level
                 */
                } else if (num === 11) {
                    $('.start1').addClass('hide');
                    $('.start2').removeClass('hide');
                    $('.start2:first').addClass('startOptions');
                    $('.start2:last').addClass('startOptions');
                    $('#userName' ).focus();
                    window.clearInterval(introTimer);
                }
            }        
        },
        showTopic: function(hash) {

            // If topic is hidden, add/remove 'hide' class as needed
            if ($(hash).hasClass('hide')) {
                $('[id^="topic"]').not(hash).addClass('hide');
                $(hash).removeClass('hide');
            }
        },
        switchContent: function(id) {
            var i;
            var myThis = this;

            $('.footer li').removeClass('activeFooter');
            $('#' + id).addClass('activeFooter');

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
        }
    };
    return publicAPI;
})();
