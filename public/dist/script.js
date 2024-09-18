const listItem = document.querySelectorAll(".nav li");
const menuBackDrop = document.querySelector("#menu-backdrop");


listItem.forEach((item) => {
    item.addEventListener("mouseenter", () => {
        const { left, top, width, height } = item.getBoundingClientRect();

        menuBackDrop.style.setProperty("--left", `${left}px`);
        menuBackDrop.style.setProperty("--top", `${top}px`);
        menuBackDrop.style.setProperty("--width", `${width}px`);
        menuBackDrop.style.setProperty("--height", `${height}px`);

        menuBackDrop.style.opacity = "1";
        menuBackDrop.style.visibility = "visible";

    })

    item.addEventListener('mouseleave', () => {
        menuBackDrop.style.opacity = "0";
        menuBackDrop.style.visibility = "hidden";
    })
})

function typeWriter(element, text, speed) {
    let i = 0;
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i)
            i++
            setTimeout(type, speed)
        }
    }
    type();
}

const text = "Jhoan Alzate";
const speed = 100;
const typewriterElement = document.getElementById('typewriter');

typeWriter(typewriterElement, text, speed);



document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});