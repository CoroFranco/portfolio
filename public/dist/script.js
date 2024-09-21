const listItem = document.querySelectorAll(".nav li");
const menuBackDrop = document.querySelector("#menu-backdrop");
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                smoothScroll(targetElement, 1000);
            }
        });
    });
});

function smoothScroll(target, duration) {
    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    requestAnimationFrame(animation);
}

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





