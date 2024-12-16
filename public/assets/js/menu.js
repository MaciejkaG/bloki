document.addEventListener('DOMContentLoaded', async () => {
    const req = await get('/id/api/my-profile');
    const data = await req.json();

    $('#myProfile').css('background-image', `url('${data.picture}')`);
    $('.myNickname').text(data.display_name);

    const template = document.getElementById('myProfileTooltipTemplate');
    tippy('#myProfile', {
        content: template.innerHTML,
        allowHTML: true,
        trigger: 'click',
        arrow: false,
        interactive: true,
        theme: 'bloki',
    });

    await refreshFriendList();
});

async function refreshFriendList() {
    const req = await get('/id/api/my-friends');
    const data = await req.json();

    let requestsList = '';
    const outgoingRequestTemplate = document.getElementById('outgoingFriendRequestTemplate');
    const incomingRequestTemplate = document.getElementById('incomingFriendRequestTemplate');
    const renderTemplate = (incoming, displayName, userName) => {
        if (incoming) {
            return incomingRequestTemplate.innerHTML
                .replaceAll('[[ displayname ]]', escapeHTML(displayName))
                .replaceAll('[[ username ]]', escapeHTML(userName));
        } else {
            return outgoingRequestTemplate.innerHTML
                .replaceAll('[[ displayname ]]', escapeHTML(displayName))
                .replaceAll('[[ username ]]', escapeHTML(userName));
        }
    };
    data.requests.forEach(request => {
        requestsList += renderTemplate(request.incoming, request.display_name, request.user_name);
    });
    document.getElementById('friendRequests').innerHTML = requestsList;
}

// Pick random profile picture gradients
const gradientClasses = [
    'bg-gradient-to-r from-purple-500 to-pink-500',
    'bg-gradient-to-r from-green-500 to-yellow-500',
    'bg-gradient-to-r from-cyan-500 to-red-500',
];

function randomGradient() {
    return gradientClasses[Math.floor(Math.random() * gradientClasses.length)];
}

document.querySelectorAll('.bg-gradient-profile').forEach(el => {
    el.classList += ' ' + randomGradient();
});

// Adding friends
$('#addFriendsButton').on('click', function () {
    $('#addFriendsDialogueContainer').toggleClass('active');
});

const dialogueContainer = document.getElementById('addFriendsDialogueContainer');
dialogueContainer.addEventListener('click', (e) => {
    if (e.target === dialogueContainer)
        $('#addFriendsDialogueContainer').toggleClass('active');
});

let typingTimer; // Timer identifier
const typingDelay = 500; // Time in ms (500ms delay)

const addFriendInput = document.getElementById('addFriendUsernameInput');
const sendButton = document.getElementById('sendFriendInviteButton');

const incorrectValue = () => {
    const shakeOffset = 300;
    const shakeDuration = 65;
    anime({
        targets: addFriendInput,
        translateX: [
            { value: -shakeOffset, duration: shakeDuration },
            { value: shakeOffset, duration: shakeDuration },
            { value: -shakeOffset, duration: shakeDuration },
            { value: shakeOffset, duration: shakeDuration },
            { value: 0, duration: shakeDuration }
        ],
        easing: 'easeInOutQuad'
    });
};

const sentAnimation = () => {
    anime({
        targets: sendButton,
        translateX: [0, -50],
        opacity: [1, 0],
        easing: 'easeInExpo',
        duration: 100,
        complete: () => {
            sendButton.textContent = window.locale.friendInviteSent;
            sendButton.classList.add('sent');
            anime({
                targets: sendButton,
                translateX: [50, 0],
                opacity: [0, 1],
                easing: 'easeOutExpo',
                duration: 100,
            });
        }
    });
};

const resetSentStatus = () => {
    sendButton.textContent = window.locale.sendInvite;
    sendButton.classList.remove('sent');
};

sendButton.addEventListener('click', async () => {
    const res = await post('/id/api/send-friend-invite', { friendUsername: addFriendInput.value });
    if (res.status === 200) {
        sentAnimation();
    } else {
        alert(`An error occured: ${res.status}\nCheck console for more info`);
    }
});

addFriendInput.addEventListener('input', () => {
    $('#addFriendsProfilePreview').removeClass('active');
    clearTimeout(typingTimer); // Clear the previous timer
    typingTimer = setTimeout(async () => {
        resetSentStatus();
        if (addFriendInput.value.length < 2) {
            incorrectValue();
            return;
        };

        const res = await get(`/id/api/get-user?username=${encodeURIComponent(addFriendInput.value)}`);
        if (res.status !== 200) {
            incorrectValue();
            return;
        }
        const data = await res.json();
        $('#addFriendsProfilePreviewDisplayName').text(data.display_name);
        $('#addFriendsProfilePreviewUsername').text(data.user_name);
        $('#addFriendsProfilePreview').addClass('active');
    }, typingDelay);
});

// Game view management
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