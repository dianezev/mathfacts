FMF = window.FMF || {};

FMF.controller = (function() {
    'use strict';   
    
    var hoverInput = false;
    var lastOption = '';
    var model = FMF.model;
    var view = FMF.view;

    var publicAPI = {

        handleAboutClick: function(id) {
            view.toggleAbout(id);
        },
        handleAnswer: function(numPick) {
            var problemIndex = model.problemIndex;
            var problemSet = model.problemSet;
            var topVal = problemSet[problemIndex][0];
            var bottomVal = problemSet[problemIndex][1];
            var correctAns = problemSet[problemIndex][2];
            var isTimed = model.isTimed;
            var liveAnswer = '#answer' + view.liveIndex;
            var answer;
            var isCorrect;

            /*
             * The answer region is set up in one of two ways
             * depending on screen width (see MIN_PX_FOR_KEYBOARD in view):
             * 1) With <input> tags so that users can use keyboard OR
             * onscreen numeric buttons to  enter answers
             *      OR
             * 2) With <p> tags so that users CANNOT use keyboard -
             * they can only use onscreen numeric buttons to enter answers
             * 
             * (This is a workaround to prevent virtual keyboard popup
             * on med & smaller screens)
             */
            
            // If <input> tag in use with keyboard, handle this way
            if (view.useInputTags) {
            
                // If argument passed, assign value to current problem
                if (typeof(numPick) !== 'undefined') {
                    $('.live').val(numPick);
                }
                answer = parseFloat($(liveAnswer).val());

            // Otherwise, handle with <p> tag (no keyboard)
            } else {

                // If argument passed, assign value to current problem
                if (typeof(numPick) !== 'undefined') {
                    $('.live').text(numPick);
                }
                answer = parseFloat($('.live').text());
            }
            
            // If no answer, don't proceed with check
            if (isNaN(answer)) {
                $(liveAnswer).focus();
                return;
            } else {
                isCorrect = (correctAns === answer);
                model.checkAns(topVal, bottomVal, answer,
                        correctAns, isTimed);
                view.notify(isCorrect, isTimed);
                view.nextProblem(isCorrect, isTimed);
            }
        },
        handleBodyClick: function() {
            view.revertFocus();
        },
        handleBtnHover: function(numPick) {

            if (view.useInputTags) {
                $('.live').val(numPick);
            } else {
                $('.live').text(numPick);
            }
            $('.live').select();
            hoverInput = true;
        },
        handleChangeLevel: function(levelIndex, level)  {
                        
            // Adjust problem set if user CHANGED the level
            if (!($(level).hasClass('active'))) {
                $('#levelMenu li').removeClass('active');
                $(level).addClass('active');
                model.getProblemArray(levelIndex);
                view.displayNextSet();
                view.setHighlight(false);
            }
            
            // Adjust display to math problems, if needed
            if ($('#topicMathFacts').hasClass('hide')) {
                view.switchContent('resumePractice');
            }
            
            // Highlight sidebar selection (to Practice if needed)
            view.highlightSidebar('resumePractice');
        },
        handleClearHover: function() {
            if (view.useInputTags) {
                $('.live').val('');
            } else {
                $('.live').text('?');
            }
            
            hoverInput = false;
        },
        handleConfirm: function(isOKtoCancel) {
            var isTimed = model.isTimed;

            $('#topicConfirm').addClass('hide');

            /*
             * Note that if timer finished before user confirmed
             * whether they wanted to cancel test, the results will
             * be displayed (behind the confirm dialog).
             * Force it closed if user chose 'Yes, stop test'.
             */
            if (isOKtoCancel) {

                // If timer has run out, hide results
                if (!isTimed) {
                    $('#topicTestResults').addClass('hide');
                }

                // Remove the overlay
                $('#cover').removeClass('coverAll');

                // Cancel timer & proceed to user's selection
                model.cancelTimer();
                model.getMore(true);
                view.displayNextSet();
                view.setHighlight(false);
                view.setTracker(true);
                view.highlightSidebar(lastOption);
                view.switchContent(lastOption);
            } else {

                /*
                 * If timer hasn't run out, remove the overlay
                 * so user can continue timed test
                 * (If it's NOT OK to cancel test & timer has run out,
                 * Leave BOTH the results AND overlay visible.)
                 */
                if (isTimed) {
                    $('#cover').removeClass('coverAll');
                }
            }
        },
        handleSidebarClick: function(id) {
            var isTimed = model.isTimed;
            lastOption = id;

            /*
             * If in middle of timed test,
             * confirm that user wants to cancel before proceeding
             */
            if (isTimed) {
                $('#topicConfirm').removeClass('hide');

                // Bring overlay to front (but behind confirm dialog)
                $('#cover').addClass('coverAll');

                $('#continueTest').focus();

            // Otherwise go to topic selected by user
            } else {
                view.highlightSidebar(id);
                view.switchContent(id);
            }
        },
        handleOpClick: function(newOp) {

            // Reset 'oper' (only if changed from current setting)
            if ((model.oper !== newOp)) {
                model.changeOperator(newOp);
                model.getProblemArray(0);
                view.setOperator(model.oper);
                view.displayNextSet();
                view.setHighlight(true);
                
            // Prevent re-display of checkmarks if returning to practice
            } else {
                view.checkMarks(false);
            }

            /*
             * Unhide math facts portion of page 
             * (needed if user is leaving 'About' or 'Scores')
             */
            view.showTopic('#topicMathFacts');
            
            // Set active sidebar option to 'Practice'
            $('.sidebar li').removeClass('activeSidebar');
            $('.sidebar li:first').addClass('activeSidebar');            
        },
        handlePrintResults: function() {
            window.print();
        },
        handleStart: function(difficulty, userName) {
            model.setProblemRanges(difficulty);
            model.setName(userName);
            view.setFtrsHdrs();
            model.changeOperator('add');
            model.getProblemArray(0);
            view.setOperator(model.oper);
            view.displayNextSet();
            view.setHighlight(true);
            view.showTopic('#topicMathFacts');
            view.setTopMargin();
        },
        handleTestResults: function() {
            
            // Display next set of practice problems
            model.getMore(true);
            view.displayNextSet();
            view.setHighlight(false);
            view.setTracker(true);

            $('#topicTestResults').addClass('hide');

            // Send overlay to back
            $('#cover').removeClass('coverAll');
        }
    };

    return publicAPI;
})();
