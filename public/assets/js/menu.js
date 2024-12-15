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