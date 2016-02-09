// Change level & active submenu item when clicked
$('#levelMenu').on('click', 'li', function(e) {
    var levels = $('#levelMenu li');

    // Remove/add class on levelMenu item, based on user's selection
    if (!($(this).hasClass('active'))) {
        $('#levelMenu li').removeClass('active');
        $(this).addClass('active');
        FMF.controller.handleChangeLevel(levels.index(this));
    }
    e.preventDefault();
});

// Setup onclicks to switch between operations
$('[id^="math_"]').on('click', function() {
    var newOp = ($(this).context.id).substr(5);
    FMF.controller.handleOpClick(newOp);
});

$('#userName' ).on('click', function() {
    $('#userName' ).focus();
});

$('#closeTestResults').on('click', function() {
    FMF.controller.handleTestResults();
});

$('body' ).on('click', function() {
    FMF.controller.handleBodyClick();
});

// If user clicks printer icon, print results
$('.printResults').on('click', function() {
    FMF.controller.handlePrintResults();
});

// If user clicks a numeric button, enter answer & check
$('.btn').on('click', function() {
    if (!FMF.view.trapDblClick) {
        FMF.controller.handleAnswer($(this).text());
    }
});

$('.getStarted button').on('click', function() {
    FMF.controller.handleStart(parseInt(this.value), $('#userName').val());
});

$('#closeConfirm, #continueTest').on('click', function() {
    FMF.controller.handleConfirm(false);
});
$('#stopTest').on('click', function() {
    FMF.controller.handleConfirm(true);
});

// Footer options: Practice/Timer/Scores/About
$('.footer li').on('click', function() {
    FMF.controller.handleFooterClick(this.id);
});


/*
 * When user hovers over button, display # in answer field.
 * Clear answer field onmouseleave.
 * This makes it simpler for user to run mouse over buttons and
 * view result in the answer field.
 */
$('.btn').hover(function() {
        FMF.controller.handleBtnHover($(this).text());
    },
        FMF.controller.handleClearHover
);

/*
 * If user presses enter, tab or right arrow, handleAnswer.
 * Otherwise, verify that user's entry is numeric.
 * TBD: overriding default use of tab might be a no-no
 * Also not sure if I'm supposed to call a function here &
 * keep this short, but I don't want to pass event (for prevDef)
 */
$('.answer_region').on('keydown', function(e) {
    var key = e.which;

    // Prevent default for Tab
    // DEPRECATED KEYCODE:   if (e.keyCode === 9 || e.which === 9) {
    if (key === 9) {
        e.preventDefault();
    }

    // For Enter, Tab or Right Arrow, check answer
    if (key === 13 || key === 9 || key === 39) {
        FMF.controller.handleAnswer();

    // Otherwise check that user entry is numeric
    } else if (!FMF.helpers.validateNumber(key)) {
        e.preventDefault();
    }    
});
