document.addEventListener('DOMContentLoaded', async () => {
    const req = await get('/api/my-profile');
    const data = await req.json();

    $('#myProfile').css('background-image', `url('${data.picture}')`);
    $('.myNickname').text(data.nickname);

    const template = document.getElementById('myProfileTooltipTemplate');
    tippy('#myProfile', {
        content: template.innerHTML,
        allowHTML: true,
        trigger: 'click',
        arrow: false,
        interactive: true,
        theme: 'bloki',
    });
});

const mainMenuFadeOutAnimaton = {
    targets: '#mainMenu div.section',
    scale: [1, 0.8],
    opacity: [1, 0],

    easing: 'easeInOutQuad',
    duration: 500,
    delay: anime.stagger(100, { from: 'center', direction: 'reverse' }),
    complete: () => {
        $('#game').addClass('active');
    }
};
let game;

let gameViewEnabled = false;
function toggleGameView() {
    if (gameViewEnabled) {
        // Stop the game
        game?.destroy();

        $('#game').removeClass('active');
        setTimeout(() => {
            anime({
                ...mainMenuFadeOutAnimaton,
                direction: 'reverse',
                delay: 0,
                complete: null,
            });
        }, 500);
    } else {
        game = new GameController('boardCanvas');

        anime(mainMenuFadeOutAnimaton);
    }

    gameViewEnabled = !gameViewEnabled;
}