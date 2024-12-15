const tooltipSettings = {
    allowHTML: true,
    trigger: 'focus',
    theme: 'bloki',
    arrow: false,
    placement: 'right',
};

let template = document.getElementById('displayNameTooltipTemplate');
tippy('#displayNameInput', { ...tooltipSettings, content: template.innerHTML });

template = document.getElementById('usernameTooltipTemplate');
tippy('#usernameInput', { ...tooltipSettings, content: template.innerHTML });

const displayNameField = document.getElementById('displayNameInput');
const usernameField = document.getElementById('usernameInput');
const doneButton = document.getElementById('doneButton');

doneButton.addEventListener('click', async () => {
    const result = await post('/id/api/setup', { displayName: displayNameField.value, username: usernameField.value });
    switch (result.status) {
        case 201:
            window.location.href = '/menu';
            break;

        case 400:
            const data = await result.json();
            console.log(data);
            let errorText = '';
            if (data.errors.username) {
                errorText += window.locale['username-'+data.errors.username];
                usernameField.focus();
            }

            if (data.errors.displayName) {
                errorText += window.locale['displayName-' + data.errors.displayName];
                displayNameField.focus();
            }

            $('#errorText').text(errorText);
            $('#errorText').get(0).style = '';

            break;
    
        default:
            break;
    }
});