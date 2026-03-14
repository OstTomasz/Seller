// src/router/PageTransition.tsx
import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion, type Variants } from "framer-motion";

const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: "easeIn",
    },
  },
};


export const PageTransition = () => {
  const { pathname } = useLocation();
  const currentOutlet = useOutlet();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {currentOutlet}
      </motion.div>
    </AnimatePresence>
  );
};