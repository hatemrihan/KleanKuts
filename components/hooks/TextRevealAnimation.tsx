import { useEffect } from 'react';
import { stagger, useAnimate } from "framer-motion";
import SplitType from "split-type";

const useTextRevealAnimation = () => {
    const [scope, animate] = useAnimate();

    useEffect(() => {
        if (scope.current) {
            new SplitType(scope.current, {
                types: "lines,words",
                tagName: "span"
            });
        }
    }, [scope]);

    const entranceAnimation = () => {
        if (scope.current) {
            return animate(
                scope.current.querySelectorAll(".word"),
                { transform: "translateY(0)" },
                { duration: 0.5, delay: stagger(0.1) }
            );
        }
    };

    const exitAnimation = () => {
        if (scope.current) {
            return animate(
                scope.current.querySelectorAll('.word'),
                { transform: 'translateY(100%)' },
                { 
                    duration: 0.1,
                    delay: stagger(-0.3)
                }
            );
        }
    };

    return {
        scope,
        entranceAnimation,
        exitAnimation
    };
};

export default useTextRevealAnimation;