const template = document.getElementById('myProfileTooltipTemplate');
tippy('#myProfile', {
    content: template.innerHTML,
    allowHTML: true,
    trigger: 'click',
    arrow: false,
    interactive: true,
    theme: 'bloki',
});