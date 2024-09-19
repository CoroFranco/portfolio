document.querySelectorAll('.videos').forEach(function (video) {

    gsap.registerPlugin(ScrollTrigger);
    
    gsap.to(video, {

        scrollTrigger: {
            trigger: video,
            start: "top 100%",    // La animación empieza cuando el top del video llega al 80% de la ventana de visualización
        },
        duration: 0.2,
        opacity: 1,
    })

    video.addEventListener('mouseenter', function () {
        console.log(video)
        video.play();
        video.classList.remove('scale-[1.5]');
    })
    video.addEventListener('mouseleave', function () {
        console.log(video)
        video.classList.add('scale-[1.5]');
        video.pause();
        video.currentTime = 0;
    })
})




        gsap.fromTo('#mainImage', {
            opacity: 0
        }, {
            duration: 0.6,
            opacity: 1
        })

        // gsap.to("#typewriter", {
        //     scrollTrigger: {
        //         trigger: "body",
        //         start: "150px",
        //         end: "800px",
        //         scrub: true,
        //     },
        //     duration: 2,
        //     letterSpacing: "50px",
        //     opacity: 0,
        //     ease: "power2.inOut",
        //     yoyo: true
        // });

        document.querySelectorAll('.project-info').forEach(function(project){
            gsap.fromTo(project, {
            y: 40, // Inicialmente fuera de vista a la derecha
            opacity: 0
        }, {
            scrollTrigger: {
                trigger: project,
                start: 'top 88%',
                toggleActions: 'restart reset restart reset',
                onLeave: () => gsap.set(project, { y: 40, opacity: 0 }),
                onEnterBack: () => gsap.to(project, { y: 0, opacity: 1 })
            },
            duration: 0.5,
            y: '0%',
            opacity: 1
        });
        })


        gsap.fromTo('.aboutme', {
            y: 40, // Inicialmente fuera de vista a la derecha
            opacity: 0
        }, {
            scrollTrigger: {
                trigger: '.aboutme',
                toggleActions: 'restart reset restart reset',
                onLeave: () => gsap.set(".aboutme", { y: 40, opacity: 0 }),
                onEnterBack: () => gsap.to(".aboutme", { y: 0, opacity: 1 })
            },
            duration: 1,
            y: '0%',
            opacity: 1
        });

        gsap.fromTo("#profesion", {
            y: 50,
            opacity: 0,
        },
            {
                duration: 2,
                y: 0,
                opacity: 0.5
            }
        )


        // const divs = document.querySelectorAll('.skillsPercent');

        // divs.forEach(function (div) {
        //     const width = div.getAttribute('data-width');
        //     gsap.fromTo(div,
        //         {
        //             width: "0%"
        //         },
        //         {
        //             scrollTrigger: {
        //                 trigger: div,
        //                 toggleActions: 'restart none none none'
        //             },
        //             duration: 1,
        //             width: `${width}`,
        //         }
        //     )
        // })

        const skills = document.querySelectorAll('.skills');

        skills.forEach(function (skill) {
            gsap.fromTo(skill, {
                y: 40,
                opacity: 0
            },
                {
                    scrollTrigger: {
                        trigger: skill,
                        toggleActions: 'restart reset restart reset',
                        onLeave: () => gsap.set(skill, { y: 40, opacity: 0 }),
                        onEnterBack: () => gsap.to(skill, { y: 0, opacity: 1 })
                    },
                    duration: 1,
                    y: 0,
                    opacity: 1
                }
            )
        })


        gsap.to('.linkedin', {
            duration: 4,
            opacity: 1
        })
