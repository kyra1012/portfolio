(function () {
    window.initPortfolioSystem = function () {
        const wrapper = document.getElementById('fullpage-wrapper');
        const sections = [...document.querySelectorAll('.page-section')];
        const dots = [...document.querySelectorAll('.page-dot')];
        const currentLabel = document.getElementById('pfCurrentPage');
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const pageAccents = ['#b79072', '#8aa7b4', '#89a990', '#c7ad69', '#c79aaa', '#89a990', '#aaa0c2'];
        let currentPage = 0;

        if (!wrapper || !sections.length) return;
        document.documentElement.classList.add('pf-continuous');
        sessionStorage.setItem('portfolioPage', '0');

        function clamp(value) {
            return Math.max(0, Math.min(Number(value) || 0, sections.length - 1));
        }

        function setCurrent(index) {
            currentPage = clamp(index);
            sections.forEach((section, sectionIndex) => {
                section.classList.toggle('pf-current', sectionIndex === currentPage);
                section.setAttribute('aria-hidden', 'false');
            });
            dots.forEach(dot => dot.classList.toggle('active', Number(dot.dataset.page) === currentPage));
            if (currentLabel) currentLabel.textContent = String(currentPage + 1).padStart(2, '0');
            document.documentElement.style.setProperty('--pf-page-progress', ((currentPage + 1) / sections.length).toFixed(4));
            document.documentElement.style.setProperty('--pf-accent', pageAccents[currentPage] || pageAccents[0]);
        }

        function goTo(index) {
            const targetIndex = clamp(index);
            sections[targetIndex]?.scrollIntoView({
                behavior: reduceMotion ? 'auto' : 'smooth',
                block: 'start'
            });
        }

        window.portfolioGoTo = goTo;

        document.querySelectorAll('[data-page]').forEach(control => {
            const activate = () => goTo(control.dataset.page);
            control.addEventListener('click', activate);
            if (control.getAttribute('role') === 'button') {
                control.addEventListener('keydown', event => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    activate();
                });
            }
        });

        document.querySelectorAll('.page-prev, .page-next').forEach(button => {
            button.addEventListener('click', () => {
                const section = button.closest('.page-section');
                const sectionIndex = Math.max(sections.indexOf(section), 0);
                if (button.classList.contains('page-prev')) goTo(sectionIndex - 1);
                else goTo(sectionIndex === sections.length - 1 ? 0 : sectionIndex + 1);
            });
        });

        document.addEventListener('keydown', event => {
            if (event.target.matches('input, textarea, select, video')) return;
            if (document.querySelector('[aria-modal="true"].is-open')) return;
            if (event.key === 'PageDown') goTo(currentPage + 1);
            if (event.key === 'PageUp') goTo(currentPage - 1);
        });

        const envelope = document.getElementById('envelope');
        envelope?.classList.add('open');

        const enterButton = document.getElementById('btn-enter');
        enterButton?.addEventListener('click', () => goTo(1));

        const staticReveal = () => {
            document.querySelectorAll('.reveal, .pf-reveal, .me-in, .product-in, .fb-in, .g-reveal, .c-in').forEach(element => {
                element.classList.add('visible', 'is-visible');
                element.style.opacity = '1';
                element.style.visibility = 'visible';
                element.style.transform = 'none';
                element.style.clipPath = 'none';
            });
            document.querySelectorAll('.tree-art-img, .bird-group, .data-card').forEach(element => {
                element.style.opacity = '1';
                element.style.visibility = 'visible';
            });
        };

        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            staticReveal();
            const sectionObserver = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) setCurrent(sections.indexOf(entry.target));
                });
            }, { rootMargin: '-42% 0px -42% 0px' });
            sections.forEach(section => sectionObserver.observe(section));
            setCurrent(0);
            return;
        }

        gsap.registerPlugin(ScrollTrigger);

        sections.slice(1).forEach((section, index) => {
            if (section.querySelector(':scope > .pf-seam-flow')) return;
            const seam = document.createElement('div');
            seam.className = 'pf-seam-flow';
            seam.setAttribute('aria-hidden', 'true');
            seam.dataset.seam = String(index + 1);
            section.prepend(seam);
        });

        document.querySelectorAll('.product-file, .growth-case-stage, .content-work').forEach(surface => {
            surface.addEventListener('pointermove', event => {
                if (window.innerWidth <= 980) return;
                const rect = surface.getBoundingClientRect();
                surface.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
                surface.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
            }, { passive: true });
        });

        sections.forEach((section, index) => {
            ScrollTrigger.create({
                id: 'portfolio-section-' + index,
                trigger: section,
                start: 'top 52%',
                end: 'bottom 48%',
                onToggle: self => {
                    if (self.isActive) setCurrent(index);
                }
            });
        });

        if (reduceMotion) {
            staticReveal();
        } else {
            gsap.utils.toArray('.pf-seam-flow').forEach((seam, index) => {
                gsap.fromTo(seam,
                    {
                        autoAlpha: .34,
                        xPercent: index % 2 ? 4 : -4,
                        scaleX: .92,
                        scaleY: .82
                    },
                    {
                        autoAlpha: .96,
                        xPercent: index % 2 ? -3 : 3,
                        scaleX: 1.05,
                        scaleY: 1,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: seam.closest('.page-section'),
                            start: 'top 106%',
                            end: 'top 30%',
                            scrub: .8
                        }
                    }
                );
            });

            const cardSelector = [
                '.me-info', '.me-core-card', '.me-platform', '.me-tools',
                '.data-archive-head', '.data-case',
                '.product-index', '.product-metric', '.product-file',
                '.fb-video-card', '.fb-highlight-list', '.fb-stat', '.fb-film-legend', '.fb-film-row',
                '.growth-case-stage', '.growth-proof-card',
                '.content-capability-list', '.content-stat', '.content-work', '.content-proof-card'
            ].join(',');

            const nativeRevealSelector = '.me-in, .product-in, .fb-in, .g-reveal, .c-in';
            const nativeRevealObserver = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('is-visible');
                    nativeRevealObserver.unobserve(entry.target);
                });
            }, {
                root: null,
                threshold: .01,
                rootMargin: '0px 0px 8% 0px'
            });
            document.querySelectorAll(
                '.me-in, .product-in, .fb-in, .g-reveal:not(.growth-step-card), .c-in'
            ).forEach(element => nativeRevealObserver.observe(element));

            const revealTargets = gsap.utils.toArray(cardSelector).filter(element =>
                !element.closest('.data-stage') &&
                !element.closest('.data-pipeline') &&
                !element.matches(nativeRevealSelector)
            );

            revealTargets.forEach(element => element.classList.add('pf-card-reveal'));
            gsap.set(revealTargets, {
                autoAlpha: 0,
                y: 30,
                scale: .988,
                transformOrigin: 'center bottom'
            });
            ScrollTrigger.batch(revealTargets, {
                start: 'top 96%',
                once: true,
                interval: .055,
                batchMax: 5,
                onEnter: batch => {
                    batch.forEach(element => { element.dataset.pfRevealed = 'true'; });
                    gsap.to(batch, {
                        autoAlpha: 1,
                        y: 0,
                        scale: 1,
                        duration: .68,
                        stagger: .065,
                        ease: 'power4.out',
                        overwrite: 'auto',
                        clearProps: 'transform'
                    });
                }
            });

            const textSelector = [
                '.page-section h1', '.page-section h2', '.page-section h3',
                '.page-section p', '.page-section li', '.page-section dd',
                '.product-subtitle', '.product-index-row b', '.product-index-row em',
                '.product-metric strong', '.product-metric span',
                '.me-tool-group b', '.me-tag', '.me-platform span',
                '.data-case-no', '.data-case-title span', '.data-case-result > *',
                '.product-file-top > *', '.product-tags span',
                '.fb-kicker', '.fb-tag', '.fb-video-head span',
                '.growth-section-kicker', '.growth-case-company', '.growth-flow-label',
                '.growth-flow-dot', '.growth-step-tag', '.growth-step-signal',
                '.content-eyebrow', '.content-work-meta > *', '.content-proof-row'
            ].join(',');

            const textTargets = gsap.utils.toArray(textSelector).filter(element =>
                !element.closest('.section-1') &&
                !element.closest('.data-stage, .data-pipeline, .fb-viewer, .content-viewer') &&
                !element.matches(nativeRevealSelector) &&
                !element.closest('[hidden]') &&
                !element.matches('.sr-only') &&
                element.textContent.trim().length > 0
            );

            textTargets.forEach(element => element.classList.add('pf-text-reveal'));
            gsap.set(textTargets, {
                autoAlpha: 0,
                y: (index, element) => element.matches('h1,h2,h3') ? 34 : 18,
                clipPath: 'inset(0 0 104% 0)'
            });
            ScrollTrigger.batch(textTargets, {
                start: 'top 94%',
                once: true,
                interval: .045,
                batchMax: 7,
                onEnter: batch => {
                    batch.forEach(element => { element.dataset.pfRevealed = 'true'; });
                    gsap.to(batch, {
                        autoAlpha: 1,
                        y: 0,
                        clipPath: 'inset(0 0 0% 0)',
                        duration: .78,
                        stagger: .055,
                        ease: 'power4.out',
                        overwrite: 'auto',
                        clearProps: 'transform,clipPath'
                    });
                }
            });

            /* ScrollTrigger normally owns these entrances. This viewport safety net
               prevents a fast wheel/trackpad jump or a restored scroll position from
               ever leaving an already-visible chapter blank. */
            let revealFrame = 0;
            const revealVisibleContent = () => {
                revealFrame = 0;
                const viewportGate = window.innerHeight * .97;
                document.querySelectorAll(
                    '.me-in:not(.is-visible), .product-in:not(.is-visible), .fb-in:not(.is-visible), ' +
                    '.g-reveal:not(.growth-step-card):not(.is-visible), .c-in:not(.is-visible)'
                ).forEach(element => {
                    const rect = element.getBoundingClientRect();
                    if (rect.bottom < 0 || rect.top > viewportGate) return;
                    element.classList.add('is-visible');
                });
                document.querySelectorAll('.pf-card-reveal:not([data-pf-revealed]), .pf-text-reveal:not([data-pf-revealed])')
                    .forEach(element => {
                        const rect = element.getBoundingClientRect();
                        if (rect.bottom < 0 || rect.top > viewportGate) return;
                        element.dataset.pfRevealed = 'true';
                        const isText = element.classList.contains('pf-text-reveal');
                        gsap.to(element, {
                            autoAlpha: 1,
                            y: 0,
                            scale: 1,
                            clipPath: isText ? 'inset(0 0 0% 0)' : undefined,
                            duration: isText ? .72 : .62,
                            ease: 'power4.out',
                            overwrite: 'auto',
                            clearProps: isText ? 'transform,clipPath' : 'transform'
                        });
                    });
            };
            const queueVisibleReveal = () => {
                if (!revealFrame) revealFrame = requestAnimationFrame(revealVisibleContent);
            };
            window.portfolioRevealVisible = revealVisibleContent;
            window.addEventListener('scroll', queueVisibleReveal, { passive: true });
            window.addEventListener('resize', queueVisibleReveal, { passive: true });
            requestAnimationFrame(queueVisibleReveal);
            window.setTimeout(queueVisibleReveal, 650);

            /* Keep Growth's native sticky transform in sole control of stacking.
               This entrance only changes visibility, never position or scale. */
            const growthStackCards = gsap.utils.toArray('.growth-step-card');
            if (growthStackCards.length) {
                gsap.set(growthStackCards, { autoAlpha: 0 });
                ScrollTrigger.batch(growthStackCards, {
                    start: 'top 108%',
                    once: true,
                    interval: .05,
                    batchMax: 4,
                    onEnter: batch => gsap.to(batch, {
                        autoAlpha: 1,
                        duration: .30,
                        stagger: .04,
                        ease: 'power2.out',
                        overwrite: 'auto',
                        clearProps: 'visibility'
                    })
                });
            }

            const pipeline = document.querySelector('.data-pipeline');
            const silk = pipeline?.querySelector('.data-pipeline-silk');
            const pipelineCards = pipeline ? [...pipeline.querySelectorAll('.data-pipeline-item')] : [];
            if (pipeline && silk && pipelineCards.length) {
                const pipelineTimeline = gsap.timeline({
                    defaults: { ease: 'power3.out' },
                    scrollTrigger: {
                        id: 'data-pipeline-reveal',
                        trigger: pipeline,
                        start: 'top 86%',
                        once: true
                    }
                });
                pipelineTimeline
                    .fromTo(silk,
                        { autoAlpha: 0, scaleX: 0, transformOrigin: 'left center' },
                        { autoAlpha: .92, scaleX: 1, duration: 1.45, ease: 'power3.inOut' })
                    .fromTo(pipelineCards,
                        {
                            autoAlpha: 0,
                            y: (itemIndex, element) => (parseFloat(getComputedStyle(element).getPropertyValue('--flow-y')) || 0) + 30,
                            scale: .96
                        },
                        {
                            autoAlpha: 1,
                            y: (itemIndex, element) => parseFloat(getComputedStyle(element).getPropertyValue('--flow-y')) || 0,
                            scale: 1,
                            duration: .82,
                            stagger: .16
                        },
                        '<.28');
            }

            const dataStage = document.querySelector('.data-stage');
            if (dataStage && typeof window.playDataTreeAnimation === 'function') {
                ScrollTrigger.create({
                    id: 'data-tree-reveal',
                    trigger: dataStage,
                    start: 'top 76%',
                    once: true,
                    onEnter: () => window.playDataTreeAnimation()
                });
            }

            gsap.utils.toArray('.me-portrait img, .fb-video-card, .content-media.has-image img').forEach((element, index) => {
                gsap.fromTo(element,
                    { yPercent: index % 2 ? -2.5 : 2.5 },
                    {
                        yPercent: index % 2 ? 2.5 : -2.5,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: element,
                            start: 'top bottom',
                            end: 'bottom top',
                            scrub: 1.1
                        }
                    }
                );
            });

            const softCards = document.querySelectorAll('.me-core-card, .data-case, .fb-stat, .content-capability-row, .content-proof-card');
            softCards.forEach(card => {
                const xTo = gsap.quickTo(card, 'rotationY', { duration: .45, ease: 'power3.out' });
                const yTo = gsap.quickTo(card, 'rotationX', { duration: .45, ease: 'power3.out' });
                card.addEventListener('pointermove', event => {
                    if (window.innerWidth <= 980) return;
                    const rect = card.getBoundingClientRect();
                    xTo((((event.clientX - rect.left) / rect.width) - .5) * 3.2);
                    yTo(-(((event.clientY - rect.top) / rect.height) - .5) * 2.4);
                }, { passive: true });
                card.addEventListener('pointerleave', () => gsap.to(card, {
                    rotationX: 0,
                    rotationY: 0,
                    duration: .65,
                    ease: 'power3.out',
                    overwrite: 'auto'
                }));
            });
        }

        setCurrent(0);
        requestAnimationFrame(() => ScrollTrigger.refresh());
        if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    };
})();
