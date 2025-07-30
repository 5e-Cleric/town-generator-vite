const mode = document.getElementById('mode');
mode.value = localStorage.getItem('mode') || 'pattern';
mode.addEventListener('change', () => {
    localStorage.setItem('mode', mode.value);
    draw();
});

const pattern = document.getElementById('pattern');
pattern.value = localStorage.getItem('pattern') || 'noise';
pattern.addEventListener('change', () => {
    localStorage.setItem('pattern', pattern.value);
});

const inputs = document.querySelectorAll('.sidebar input');

inputs.forEach((element) => {
    element.addEventListener('input', () => {
        localStorage.setItem(element.id, element.value);
    });
});
inputs.forEach((element) => {
    const stored = localStorage.getItem(element.id);
    if (!stored) localStorage.setItem(element.id, element.value);
    if (!!stored) element.value = stored;
});

const triggers = document.querySelectorAll('.trigger');
triggers.forEach((element)=>{
    element.addEventListener('click',()=>{
        element.parentElement.classList.toggle('active');
    });
});
